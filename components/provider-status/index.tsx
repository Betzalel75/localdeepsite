"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useModelConfiguration } from "@/hooks/useApiManager";

interface ProviderStatus {
  id: string;
  name: string;
  type: "local" | "cloud";
  status: "online" | "offline" | "checking";
  modelCount: number;
  error?: string;
  lastChecked?: Date;
}

export interface ConnectivityStatus {
  provider: string;
  name: string;
  url: string;
  reachable: boolean;
  status?: number;
  statusText?: string;
  error?: string;
}

export function ProviderStatus() {
  const { localProviders, cloudProviders, loading, refreshProviders } =
    useModelConfiguration();

  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>(
    [],
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  
  // Utiliser des refs pour comparer les changements réels
  const prevProvidersRef = useRef<{
    local: string;
    cloud: string;
    loading: boolean;
  }>({
    local: '',
    cloud: '',
    loading: true
  });

  // Créer une signature des providers pour détecter les vrais changements
  const providersSignature = useMemo(() => {
    const localSig = localProviders
      .map(p => `${p.id}-${p.name}-${p.isAvailable}-${p.supportedModels?.length || 0}`)
      .join('|');
    const cloudSig = cloudProviders
      .map(p => `${p.id}-${p.name}-${p.isAvailable}-${p.supportedModels?.length || 0}`)
      .join('|');
    
    return {
      local: localSig,
      cloud: cloudSig,
      loading
    };
  }, [localProviders, cloudProviders, loading]);

  useEffect(() => {
    const prev = prevProvidersRef.current;
    const current = providersSignature;

    // Ne mettre à jour que si quelque chose a vraiment changé
    if (
      prev.local !== current.local ||
      prev.cloud !== current.cloud ||
      (prev.loading && !current.loading)
    ) {
      prevProvidersRef.current = current;

      if (!loading) {
        const statuses: ProviderStatus[] = [];

        // Add local providers
        localProviders.forEach((provider) => {
          statuses.push({
            id: provider.id,
            name: provider.name,
            type: "local",
            status: provider.isAvailable ? "online" : "offline",
            modelCount: provider.supportedModels?.length || 0,
            lastChecked: new Date(),
          });
        });

        // Add cloud providers
        cloudProviders.forEach((provider) => {
          statuses.push({
            id: provider.id,
            name: provider.name,
            type: "cloud",
            status: provider.isAvailable ? "online" : "offline",
            modelCount: provider.supportedModels?.length || 0,
            lastChecked: new Date(),
          });
        });

        setProviderStatuses(statuses);
      }
    }
  }, [providersSignature, localProviders, cloudProviders, loading]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshProviders();
    } finally {
      setIsRefreshing(false);
    }
  };

  const onlineProviders = useMemo(
    () => providerStatuses.filter((p) => p.status === "online"),
    [providerStatuses]
  );
  
  const offlineProviders = useMemo(
    () => providerStatuses.filter((p) => p.status === "offline"),
    [providerStatuses]
  );
  
  const totalModels = useMemo(
    () => providerStatuses.reduce((sum, p) => sum + p.modelCount, 0),
    [providerStatuses]
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "offline":
        return <XCircle className="h-3 w-3 text-red-500" />;
      case "checking":
        return <Clock className="h-3 w-3 text-yellow-500 animate-pulse" />;
      default:
        return <XCircle className="h-3 w-3 text-gray-400" />;
    }
  };

  // Mémoriser les listes filtrées
  const localProviderStatuses = useMemo(
    () => providerStatuses.filter((p) => p.type === "local"),
    [providerStatuses]
  );

  const cloudProviderStatuses = useMemo(
    () => providerStatuses.filter((p) => p.type === "cloud"),
    [providerStatuses]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 px-2"
          disabled={loading}
        >
          {onlineProviders.length > 0 ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="text-xs">
            {onlineProviders.length}/{providerStatuses.length} Providers
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 bg-neutral-900 border-neutral-800"
        align="end"
      >
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-200">
              Provider Status
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-6 w-6 p-0"
            >
              <RefreshCw
                className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
          <div className="flex gap-4 mt-2 text-xs text-neutral-400">
            <span>{onlineProviders.length} Online</span>
            <span>{offlineProviders.length} Offline</span>
            <span>{totalModels} Models</span>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {/* Local Providers */}
          {localProviderStatuses.length > 0 && (
            <div className="p-3 border-b border-neutral-800/50">
              <h4 className="text-xs font-medium text-neutral-300 mb-2 flex items-center gap-2">
                <Wifi className="h-3 w-3 text-blue-500" />
                Local Providers
              </h4>
              <div className="space-y-2">
                {localProviderStatuses.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(provider.status)}
                      <span className="text-xs text-neutral-300">
                        {provider.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-xs px-1 py-0"
                      >
                        {provider.modelCount} models
                      </Badge>
                      <Badge
                        variant={
                          provider.status === "online"
                            ? "default"
                            : "destructive"
                        }
                        className="text-xs px-1 py-0"
                      >
                        {provider.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cloud Providers */}
          {cloudProviderStatuses.length > 0 && (
            <div className="p-3">
              <h4 className="text-xs font-medium text-neutral-300 mb-2 flex items-center gap-2">
                <WifiOff className="h-3 w-3 text-purple-500" />
                Cloud Providers
              </h4>
              <div className="space-y-2">
                {cloudProviderStatuses.map((provider) => (
                  <div
                    key={provider.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      {getStatusIcon(provider.status)}
                      <span className="text-xs text-neutral-300">
                        {provider.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="text-xs px-1 py-0"
                      >
                        {provider.modelCount} models
                      </Badge>
                      <Badge
                        variant={
                          provider.status === "online"
                            ? "default"
                            : "destructive"
                        }
                        className="text-xs px-1 py-0"
                      >
                        {provider.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Providers */}
          {providerStatuses.length === 0 && (
            <div className="p-4 text-center">
              <XCircle className="h-8 w-8 text-neutral-500 mx-auto mb-2" />
              <p className="text-xs text-neutral-400">No providers available</p>
              <p className="text-xs text-neutral-500 mt-1">
                Configure API keys or start Ollama
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 text-center">
          <p className="text-xs text-neutral-500">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}