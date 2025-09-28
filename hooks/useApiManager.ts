"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  apiManager,
  initializeApiManager,
  ApiProvider,
  ModelInfo,
} from "@/lib/api-manager";

export interface UseApiManagerReturn {
  providers: ApiProvider[];
  models: ModelInfo[];
  localProviders: ApiProvider[];
  cloudProviders: ApiProvider[];
  localModels: ModelInfo[];
  cloudModels: ModelInfo[];
  loading: boolean;
  error: string | null;
  isLocalMode: boolean;
  isMixedMode: boolean;
  recommendedModel: ModelInfo | null;
  refreshProviders: () => Promise<void>;
  getModelsByProvider: (providerId: string) => ModelInfo[];
  callApi: (
    providerId: string,
    modelId: string,
    messages: Array<{ role: string; content: string }>,
    options?: Record<string, unknown>,
  ) => Promise<Response>;
}

export const useApiManager = (): UseApiManagerReturn => {
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  // Fonction de chargement des providers sans useCallback
  const loadProviders = async () => {
    try {
      setLoading(true);
      setError(null);

      await initializeApiManager();

      setProviders(apiManager.getAvailableProviders());
      setModels(apiManager.getAvailableModels());
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load providers";
      setError(errorMessage);
      console.error("Error loading API providers:", err);
    } finally {
      setLoading(false);
    }
  };

  // Chargement initial - une seule fois
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      loadProviders();
    }
  }, []);

  // Fonction de refresh avec useCallback mais pas dans les dépendances d'un useEffect
  const refreshProviders = useCallback(async () => {
    await loadProviders();
  }, []);

  const getModelsByProvider = useCallback((providerId: string): ModelInfo[] => {
    return apiManager.getModelsByProvider(providerId);
  }, []);

  const callApi = useCallback(
    async (
      providerId: string,
      modelId: string,
      messages: Array<{ role: string; content: string }>,
      options: Record<string, unknown> = {},
    ): Promise<Response> => {
      return apiManager.callApi(providerId, modelId, messages, options);
    },
    [],
  );

  const localProviders = providers.filter((p) => p.type === "local");
  const cloudProviders = providers.filter((p) => p.type === "cloud");
  const localModels = models.filter((m) => m.type === "local");
  const cloudModels = models.filter((m) => m.type === "cloud");

  return {
    providers,
    models,
    localProviders,
    cloudProviders,
    localModels,
    cloudModels,
    loading,
    error,
    isLocalMode: apiManager.isLocalModeEnabled(),
    isMixedMode: apiManager.isMixedModeEnabled(),
    recommendedModel: apiManager.getRecommendedModel(),
    refreshProviders,
    getModelsByProvider,
    callApi,
  };
};

// Hook spécialisé pour les modèles locaux (compatible avec l'existant)
export const useOllamaModels = () => {
  const { localModels, loading, error, refreshProviders } = useApiManager();

  // Convertir au format attendu par le composant existant
  const models = localModels.map((model) => ({
    value: model.id,
    label: model.name,
    providers: [model.provider],
    autoProvider: model.provider,
    isLocal: true,
  }));

  return {
    models,
    loading,
    error: error ? `Failed to fetch models: ${error}` : null,
    isLocalMode: true,
    refetch: refreshProviders,
  };
};

// Hook pour la configuration mixte
export const useModelConfiguration = () => {
  const apiManagerData = useApiManager();
  const [selectedProvider, setSelectedProvider] = useState<string>("auto");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const modelInitializedRef = useRef(false);

  useEffect(() => {
    if (
      apiManagerData.recommendedModel && 
      !selectedModel && 
      !modelInitializedRef.current
    ) {
      modelInitializedRef.current = true;
      setSelectedModel(apiManagerData.recommendedModel.id);
      setSelectedProvider(apiManagerData.recommendedModel.provider);
    }
  }, [apiManagerData.recommendedModel, selectedModel]);

  const availableModels =
    selectedProvider === "auto"
      ? apiManagerData.models
      : apiManagerData.getModelsByProvider(selectedProvider);

  const currentProvider = apiManagerData.providers.find(
    (p) => p.id === selectedProvider,
  );

  return {
    ...apiManagerData,
    selectedProvider,
    selectedModel,
    setSelectedProvider,
    setSelectedModel,
    availableModels,
    currentProvider,
    canUseCloudModels: apiManagerData.cloudProviders.length > 0,
    canUseLocalModels: apiManagerData.localProviders.length > 0,
  };
};