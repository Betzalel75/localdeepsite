/* eslint-disable @typescript-eslint/no-explicit-any */
import { PiGearSixFill } from "react-icons/pi";
import { RiCheckboxCircleFill } from "react-icons/ri";
import { useState, useMemo, useEffect } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PROVIDERS, MODELS } from "@/lib/providers";
import { useModelConfiguration } from "@/hooks/useApiManager";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useUpdateEffect } from "react-use";
import Image from "next/image";

interface UnifiedModel {
  value: string;
  label: string;
  providers: string[];
  autoProvider: string;
  isLocal?: boolean;
  type?: "local" | "cloud";
  isThinker?: boolean;
  isNew?: boolean;
}

export function Settings({
  open,
  onClose,
  provider,
  model,
  error = "",
  isFollowUp = false,
  onChange,
  onModelChange,
}: {
  open: boolean;
  provider: string;
  model: string;
  error?: string;
  isFollowUp?: boolean;
  onClose: React.Dispatch<React.SetStateAction<boolean>>;
  onChange: (provider: string) => void;
  onModelChange: (model: string) => void;
}) {
  const {
    localModels,
    cloudModels,
    localProviders,
    cloudProviders,
    loading: modelsLoading,
    error: modelsError,
    isLocalMode,
    canUseCloudModels,
    canUseLocalModels,
  } = useModelConfiguration();

  const [] = useState(!isLocalMode && canUseCloudModels);
  const [modelType, setModelType] = useState<"local" | "cloud" | "all">("all");

  // Determine available models based on current settings
  const displayModels = useMemo((): UnifiedModel[] => {
    if (isLocalMode) {
      // En mode local strict, n'afficher que les modèles locaux
      return localModels.length > 0
        ? localModels.map((m) => ({
            value: m.id,
            label: m.name,
            providers: [m.provider],
            autoProvider: m.provider,
            isLocal: true,
            type: "local" as const,
            isThinker: m.isThinker,
            isNew: m.isNew,
          }))
        : MODELS.filter((m) => m.isLocal).map((m) => ({
            ...m,
            type: "local" as const,
          }));
    }

    // En mode mixte, filtrer selon la préférence utilisateur
    const availableModels: UnifiedModel[] = [];

    if (modelType === "local" || modelType === "all") {
      availableModels.push(
        ...localModels.map((m) => ({
          value: m.id,
          label: `${m.name} (Local)`,
          providers: [m.provider],
          autoProvider: m.provider,
          isLocal: true,
          type: "local" as const,
          isThinker: m.isThinker,
          isNew: m.isNew,
        })),
      );
    }

    if (modelType === "cloud" || modelType === "all") {
      availableModels.push(
        ...cloudModels.map((m) => ({
          value: m.id,
          label: `${m.name} (Cloud)`,
          providers: [m.provider],
          autoProvider: m.provider,
          isLocal: false,
          type: "cloud" as const,
          isThinker: m.isThinker,
          isNew: m.isNew,
        })),
      );

      // Ajouter aussi les modèles HuggingFace existants si pas déjà présents
      const existingCloudModels = MODELS.filter((m) => !m.isLocal);
      existingCloudModels.forEach((m) => {
        if (!availableModels.some((am) => am.value === m.value)) {
          availableModels.push({
            ...m,
            label: `${m.label} (HF)`,
            type: "cloud" as const,
          });
        }
      });
    }

    return availableModels;
  }, [localModels, cloudModels, modelType, isLocalMode]);

  // Update model type based on current model selection
  useEffect(() => {
    const currentModel = displayModels.find((m) => m.value === model);
    if (currentModel && currentModel.type) {
      if (currentModel.type !== modelType && modelType === "all") {
        // Ne pas changer automatiquement si l'utilisateur a choisi "all"
        return;
      }
    }
  }, [model, displayModels, modelType]);

  const modelAvailableProviders = useMemo(() => {
    const currentModel = displayModels.find(
      (m: UnifiedModel) => m.value === model,
    );

    if (!currentModel) return [];

    const availableProviders = currentModel.providers || [];

    // Déterminer les providers disponibles selon le type de modèle
    if (currentModel.type === "local" || currentModel.isLocal) {
      const localProviderIds = localProviders.map((p) => p.id);
      return availableProviders.filter((id: string) =>
        localProviderIds.includes(id),
      );
    } else {
      const cloudProviderIds = cloudProviders.map((p) => p.id);
      return availableProviders.filter(
        (id: string) =>
          cloudProviderIds.includes(id) || Object.keys(PROVIDERS).includes(id),
      );
    }
  }, [model, displayModels, localProviders, cloudProviders]);

  useUpdateEffect(() => {
    if (provider !== "auto" && !modelAvailableProviders.includes(provider)) {
      onChange("auto");
    }
  }, [model, provider]);

  return (
    <div className="">
      <Popover open={open} onOpenChange={onClose}>
        <PopoverTrigger asChild>
          <Button variant="black" size="sm" onClick={() => onClose(!open)}>
            <PiGearSixFill className="size-4" />
            Settings
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="!rounded-2xl p-0 !w-96 overflow-hidden !bg-neutral-900"
          align="center"
        >
          <header className="flex items-center justify-center text-sm px-4 py-3 border-b gap-2 bg-neutral-950 border-neutral-800 font-semibold text-neutral-200">
            Customize Settings
          </header>
          <main className="px-4 pt-5 pb-6 space-y-5">
            {error !== "" && (
              <p className="text-red-500 text-sm font-medium mb-2 flex items-center justify-between bg-red-500/10 p-2 rounded-md">
                {error}
              </p>
            )}

            {/* Model Type Selection (only in mixed mode) */}
            {!isLocalMode && canUseLocalModels && canUseCloudModels && (
              <div className="mb-4">
                <p className="text-neutral-300 text-sm mb-2">Model Type</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={modelType === "local" ? "default" : "secondary"}
                    onClick={() => setModelType("local")}
                  >
                    Local Only
                  </Button>
                  <Button
                    size="sm"
                    variant={modelType === "cloud" ? "default" : "secondary"}
                    onClick={() => setModelType("cloud")}
                  >
                    Cloud Only
                  </Button>
                  <Button
                    size="sm"
                    variant={modelType === "all" ? "default" : "secondary"}
                    onClick={() => setModelType("all")}
                  >
                    All Models
                  </Button>
                </div>
              </div>
            )}

            <label className="block">
              <p className="text-neutral-300 text-sm mb-2.5">
                Choose a model
                {isLocalMode && " (Local Only)"}
                {!isLocalMode &&
                  modelType !== "all" &&
                  ` (${modelType === "local" ? "Local" : "Cloud"} Only)`}
              </p>
              {modelsError && (
                <p className="text-amber-500 text-xs mb-2">{modelsError}</p>
              )}
              <Select defaultValue={model} onValueChange={onModelChange}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      modelsLoading ? "Loading models..." : "Select a model"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {/* Local Models */}
                  {displayModels.filter(
                    (m: UnifiedModel) => m.type === "local" || m.isLocal,
                  ).length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Local Models</SelectLabel>
                      {displayModels
                        .filter(
                          (m: UnifiedModel) => m.type === "local" || m.isLocal,
                        )
                        .map((model: UnifiedModel) => (
                          <SelectItem
                            key={model.value}
                            value={model.value}
                            disabled={model.isThinker && isFollowUp}
                          >
                            {model.label}
                            {model.isNew && (
                              <span className="text-xs bg-gradient-to-br from-green-400 to-green-600 text-white rounded-full px-1.5 py-0.5 ml-2">
                                New
                              </span>
                            )}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  )}

                  {/* Cloud Models */}
                  {displayModels.filter(
                    (m: UnifiedModel) =>
                      m.type === "cloud" || (!m.isLocal && !m.type),
                  ).length > 0 && (
                    <SelectGroup>
                      <SelectLabel>Cloud Models</SelectLabel>
                      {displayModels
                        .filter(
                          (m: UnifiedModel) =>
                            m.type === "cloud" || (!m.isLocal && !m.type),
                        )
                        .map((model: UnifiedModel) => (
                          <SelectItem
                            key={model.value}
                            value={model.value}
                            disabled={model.isThinker && isFollowUp}
                          >
                            {model.label}
                            {model.isNew && (
                              <span className="text-xs bg-gradient-to-br from-sky-400 to-sky-600 text-white rounded-full px-1.5 py-0.5 ml-2">
                                New
                              </span>
                            )}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </label>
            {isFollowUp && !isLocalMode && (
              <div className="bg-amber-500/10 border-amber-500/10 p-3 text-xs text-amber-500 border rounded-lg">
                Note: You can&apos;t use a Thinker model for follow-up requests.
                We automatically switch to the default model for you.
              </div>
            )}
            {/* Provider Selection */}
            <label className="block">
              <p className="text-neutral-300 text-sm mb-2">
                {displayModels.find((m: any) => m.value === model)?.type ===
                  "local" ||
                displayModels.find((m: any) => m.value === model)?.isLocal
                  ? "Local Inference Provider"
                  : "Inference Provider"}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {modelAvailableProviders.map((id: string) => {
                  const providerInfo =
                    PROVIDERS[id as keyof typeof PROVIDERS] ||
                    localProviders.find((p) => p.id === id) ||
                    cloudProviders.find((p) => p.id === id);

                  if (!providerInfo) return null;

                  return (
                    <Button
                      key={id}
                      variant={id === provider ? "default" : "secondary"}
                      size="sm"
                      onClick={() => {
                        onChange(id);
                      }}
                    >
                      <Image
                        src={`/providers/${id}.svg`}
                        alt={providerInfo.name}
                        className="size-5 mr-2"
                        width={20}
                        height={20}
                        onError={(e) => {
                          // Fallback for missing provider icons
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                      {providerInfo.name}
                      {id === provider && (
                        <RiCheckboxCircleFill className="ml-2 size-4 text-blue-500" />
                      )}
                    </Button>
                  );
                })}
              </div>
            </label>

            {/* Auto Provider Toggle (only for cloud models or mixed mode) */}
            {!isLocalMode && modelAvailableProviders.length > 1 && (
              <div className="flex items-center justify-between mt-4 p-3 bg-neutral-800/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-neutral-300 text-sm mb-1">
                    Use auto-provider
                  </p>
                  <p className="text-xs text-neutral-400/70">
                    Automatically select the best available provider
                  </p>
                </div>
                <Switch
                  checked={provider === "auto"}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange("auto");
                    } else {
                      const foundModel = displayModels.find(
                        (m: any) => m.value === model,
                      );
                      if (foundModel?.autoProvider) {
                        onChange(foundModel.autoProvider);
                      } else if (modelAvailableProviders.length > 0) {
                        onChange(modelAvailableProviders[0]);
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* Status Information */}
            <div className="mt-4 p-3 bg-neutral-800/30 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Available Providers:</span>
                <span className="text-neutral-300">
                  {canUseLocalModels && "Local"}{" "}
                  {canUseLocalModels && canUseCloudModels && "+"}{" "}
                  {canUseCloudModels && "Cloud"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-neutral-400">Total Models:</span>
                <span className="text-neutral-300">{displayModels.length}</span>
              </div>
            </div>
          </main>
        </PopoverContent>
      </Popover>
    </div>
  );
}
