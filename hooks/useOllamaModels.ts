import { useModelConfiguration } from "./useApiManager";

interface OllamaModel {
  value: string;
  label: string;
  providers: string[];
  autoProvider: string;
  isLocal: boolean;
}

interface UseOllamaModelsReturn {
  models: OllamaModel[];
  loading: boolean;
  error: string | null;
  isLocalMode: boolean;
  refetch: () => Promise<void>;
}

export function useOllamaModels(): UseOllamaModelsReturn {
  const { localModels, loading, error, refreshProviders } =
    useModelConfiguration();

  // Convert to expected format for backward compatibility
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
}
