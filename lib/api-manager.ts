// API Manager for handling different AI providers (local and cloud)
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { getApiEndpoint, isLocalMode } from "./client-config";

export interface ApiProvider {
  id: string;
  name: string;
  type: "local" | "cloud";
  baseUrl?: string;
  apiKey?: string;
  isAvailable: boolean;
  maxTokens: number;
  supportedModels: string[];
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  type: "local" | "cloud";
  parameters?: number;
  contextLength?: number;
  isAvailable: boolean;
  isLocal?: boolean;
  isThinker?: boolean;
  isNew?: boolean;
}

class ApiManager {
  private providers: Map<string, ApiProvider> = new Map();
  private models: Map<string, ModelInfo> = new Map();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    // Initialize local providers
    await this.initializeLocalProviders();

    // Initialize cloud providers
    await this.initializeCloudProviders();

    this.initialized = true;
  }

  private async initializeLocalProviders() {
    // Ollama provider
    try {
      const ollamaResponse = await fetch("/api/ollama-models");
      if (ollamaResponse.ok) {
        const data = await ollamaResponse.json();

        this.providers.set("ollama", {
          id: "ollama",
          name: "Ollama (Local)",
          type: "local",
          baseUrl:
            process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || "http://localhost:11434",
          isAvailable: true,
          maxTokens: 131000,
          supportedModels:
            data.models.map((m: { value: string }) => m.value) || [],
        });

        // Add Ollama models
        data.models.forEach((model: { value: string; label: string }) => {
          this.models.set(model.value, {
            id: model.value,
            name: model.label,
            provider: "ollama",
            type: "local",
            isAvailable: true,
            contextLength: 131000,
            isLocal: true,
          });
        });
      }
    } catch (error) {
      console.warn("Ollama not available:", error);
    }

    // LM Studio provider
    // try {
    //   const lmStudioUrl =
    //     process.env.NEXT_PUBLIC_LM_STUDIO_BASE_URL || "http://localhost:1234";
    //   const response = await fetch(`${lmStudioUrl}/v1/models`, {
    //     headers: { "Content-Type": "application/json" },
    //   });

    //   if (response.ok) {
    //     const data = await response.json();

    //     this.providers.set("lm-studio", {
    //       id: "lm-studio",
    //       name: "LM Studio (Local)",
    //       type: "local",
    //       baseUrl: lmStudioUrl,
    //       isAvailable: true,
    //       maxTokens: 131000,
    //       supportedModels: data.data?.map((m: { id: string }) => m.id) || [],
    //     });

    //     // Add LM Studio models
    //     data.data?.forEach((model: { id: string }) => {
    //       this.models.set(model.id, {
    //         id: model.id,
    //         name: model.id.split("/").pop() || model.id,
    //         provider: "lm-studio",
    //         type: "local",
    //         isAvailable: true,
    //         isLocal: true,
    //       });
    //     });
    //   }
    // } catch (error) {
    //   console.warn("LM Studio not available:", error);
    // }
  }

  private async initializeCloudProviders() {
    // En mode local strict, on ne charge pas les providers cloud
    if (this.isLocalModeEnabled() && !this.isMixedModeEnabled()) {
      return;
    }
    // Check which API keys are available
    const apiKeysResponse = await this.getAvailableApiKeys();
    // LA LIGNE MAGIQUE : on accède à la sous-propriété 'availableKeys'
    const apiKeys = (apiKeysResponse as any)?.availableKeys || {};

    // DeepSeek provider
    if (apiKeys.deepseek) {
      this.providers.set("deepseek", {
        id: "deepseek",
        name: "DeepSeek API",
        type: "cloud",
        baseUrl: "https://api.deepseek.com",
        apiKey: apiKeys.deepseek,
        isAvailable: true,
        maxTokens: 131000,
        supportedModels: [
          "deepseek-chat",
          "deepseek-coder",
          "deepseek-reasoner",
        ],
      });

      // Add DeepSeek models
      const deepSeekModels = [
        { id: "deepseek-chat", name: "DeepSeek Chat" },
        { id: "deepseek-coder", name: "DeepSeek Coder" },
        { id: "deepseek-reasoner", name: "DeepSeek Reasoner" },
      ];

      deepSeekModels.forEach((model) => {
        this.models.set(`deepseek-${model.id}`, {
          id: `deepseek-${model.id}`,
          name: model.name,
          provider: "deepseek",
          type: "cloud",
          isAvailable: true,
          contextLength: 131000,
          isThinker: model.id.includes("reasoner"),
        });
      });
    }

    // Google Gemini provider
    if (apiKeys.google) {
      this.providers.set("google", {
        id: "google",
        name: "Google Gemini",
        type: "cloud",
        baseUrl: "https://generativelanguage.googleapis.com",
        apiKey: apiKeys.google,
        isAvailable: true,
        maxTokens: 1048576,
        supportedModels: [
          "gemini-2.5-flash",
          "gemini-2.0-flash",
          "gemini-2.0-flash-lite",
        ],
      });

      // Add Gemini models - CORRECTION ICI
      const geminiModels = [
        { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" }, // Corrigé
        { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite" },
        { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
      ];

      geminiModels.forEach((model) => {
        this.models.set(`google-${model.id}`, {
          // Le préfixe "google-" est ajouté ici
          id: `google-${model.id}`,
          name: model.name,
          provider: "google",
          type: "cloud",
          isAvailable: true,
          contextLength: 1048576,
          isNew: model.id.includes("2.0"),
        });
      });
    }

    // OpenAI provider
    if (apiKeys.openai) {
      this.providers.set("openai", {
        id: "openai",
        name: "OpenAI",
        type: "cloud",
        baseUrl: "https://api.openai.com",
        apiKey: apiKeys.openai,
        isAvailable: true,
        maxTokens: 128000,
        supportedModels: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
      });

      // Add OpenAI models
      const openaiModels = [
        { id: "gpt-4o", name: "GPT-4o" },
        { id: "gpt-4o-mini", name: "GPT-4o Mini" },
        { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
      ];

      openaiModels.forEach((model) => {
        this.models.set(`openai-${model.id}`, {
          id: `openai-${model.id}`,
          name: model.name,
          provider: "openai",
          type: "cloud",
          isAvailable: true,
          contextLength: 128000,
        });
      });
    }

    // Anthropic Claude provider
    if (apiKeys.anthropic) {
      this.providers.set("anthropic", {
        id: "anthropic",
        name: "Anthropic Claude",
        type: "cloud",
        baseUrl: "api.anthropic.com/v1/messages",
        apiKey: apiKeys.anthropic,
        isAvailable: true,
        maxTokens: 200000,
        supportedModels: [
          "claude-opus-4-1",
          "claude-sonnet-4-0",
          "claude-3-7-sonnet-latest",
        ],
      });

      // Add Claude models
      const claudeModels = [
        { id: "claude-opus-4-1-20250805", name: "Claude 4.1 Sonnet" },
        { id: "claude-sonnet-4-20250514", name: "Claude 4.0 Sonnet" },
        { id: "claude-3-opus-20240229", name: "Claude 3.7 Sonnet" },
      ];

      claudeModels.forEach((model) => {
        this.models.set(`anthropic-${model.id}`, {
          id: `anthropic-${model.id}`,
          name: model.name,
          provider: "anthropic",
          type: "cloud",
          isAvailable: true,
          contextLength: 200000,
        });
      });
    }

    // Groq provider
    if (apiKeys.groq) {
      this.providers.set("groq", {
        id: "groq",
        name: "Groq",
        type: "cloud",
        baseUrl: "https://api.groq.com",
        apiKey: apiKeys.groq,
        isAvailable: true,
        maxTokens: 131000,
        supportedModels: [
          "llama-3.3-70b-versatile",
          "llama3-groq-70b-8192-tool-use-preview",
        ],
      });

      // Add Groq models
      const groqModels = [
        { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" },
        {
          id: "llama3-groq-70b-8192-tool-use-preview",
          name: "Llama 3 70B Tool Use",
        },
      ];

      groqModels.forEach((model) => {
        this.models.set(`groq-${model.id}`, {
          id: `groq-${model.id}`,
          name: model.name,
          provider: "groq",
          type: "cloud",
          isAvailable: true,
          contextLength: 131000,
        });
      });
    }
  }

  private async getAvailableApiKeys(): Promise<Record<string, string | null>> {
    try {
      const response = await fetch("/api/check-api-keys");
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn("Could not fetch API keys status:", error);
    }

    return {};
  }

  getAvailableProviders(): ApiProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isAvailable);
  }

  getLocalProviders(): ApiProvider[] {
    return this.getAvailableProviders().filter((p) => p.type === "local");
  }

  getCloudProviders(): ApiProvider[] {
    return this.getAvailableProviders().filter((p) => p.type === "cloud");
  }

  getAvailableModels(): ModelInfo[] {
    return Array.from(this.models.values()).filter((m) => m.isAvailable);
  }

  getLocalModels(): ModelInfo[] {
    return this.getAvailableModels().filter((m) => m.type === "local");
  }

  getCloudModels(): ModelInfo[] {
    return this.getAvailableModels().filter((m) => m.type === "cloud");
  }

  getModelsByProvider(providerId: string): ModelInfo[] {
    return this.getAvailableModels().filter((m) => m.provider === providerId);
  }

  getProvider(providerId: string): ApiProvider | undefined {
    return this.providers.get(providerId);
  }

  getModel(modelId: string): ModelInfo | undefined {
    return this.models.get(modelId);
  }

  async callApi(
    providerId: string,
    modelId: string,
    messages: Array<{ role: string; content: string }>,
    options: Record<string, unknown> = {},
  ) {
    const provider = this.getProvider(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    switch (provider.type) {
      case "local":
        return this.callLocalApi(provider, modelId, messages, options);
      case "cloud":
        return this.callCloudApi(provider, modelId, messages, options);
      default:
        throw new Error(`Unknown provider type: ${provider.type}`);
    }
  }

  private async callLocalApi(
    provider: ApiProvider,
    modelId: string,
    messages: Array<{ role: string; content: string }>,
    options: Record<string, unknown>,
  ) {
    if (provider.id === "ollama") {
      return fetch("/api/ask-ai-local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "ollama",
          model: modelId,
          messages,
          ...options,
        }),
      });
    }

    if (provider.id === "lm-studio") {
      return fetch(`${provider.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey || "lm-studio"}`,
        },
        body: JSON.stringify({
          model: modelId,
          messages,
          stream: options.stream || false,
          max_tokens: options.max_tokens || provider.maxTokens,
        }),
      });
    }

    throw new Error(`Local provider ${provider.id} not implemented`);
  }

  private async callCloudApi(
    provider: ApiProvider,
    modelId: string,
    messages: Array<{ role: string; content: string }>,
    options: Record<string, unknown>,
  ) {
    const endpoint = `/api/ask-ai-cloud`;

    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: provider.id,
        model: modelId,
        messages,
        ...options,
      }),
    });
  }

  isLocalModeEnabled(): boolean {
    return process.env.NEXT_PUBLIC_LOCAL_MODE === "true";
  }

  isMixedModeEnabled(): boolean {
    return process.env.NEXT_PUBLIC_ENABLE_MIXED_MODE === "true";
  }

  getRecommendedModel(): ModelInfo | null {
    // Priorité : modèle local si disponible, sinon cloud
    const localModels = this.getLocalModels();
    if (localModels.length > 0) {
      // Préférer DeepSeek R1 s'il est disponible
      const deepSeekR1 = localModels.find((m) => m.id.includes("deepseek-r1"));
      if (deepSeekR1) return deepSeekR1;

      return localModels[0];
    }

    const cloudModels = this.getCloudModels();
    if (cloudModels.length > 0) {
      // Préférer DeepSeek ou Gemini s'ils sont disponibles
      const preferredModels = ["deepseek-chat", "google-gemini-1.5-pro"];
      for (const preferred of preferredModels) {
        const model = cloudModels.find((m) => m.id.includes(preferred));
        if (model) return model;
      }

      return cloudModels[0];
    }

    return null;
  }
}

export function getApiEndpointForModel(
  model: any,
  canUseCloudModels: boolean,
): string {
  if (!model && !canUseCloudModels) {
    console.warn(`Not model ${model}`);
    return getApiEndpoint("/api/ask-ai");  // API HuggingFace par défaut si aucun modèle n'est sélectionné
  }
  console.log(model)
  if (model.type === "local" || isLocalMode()) {
    return "/api/ask-ai-local";
  }

  return "/api/ask-ai-cloud";
}

// Export singleton instance
export const apiManager = new ApiManager();

// Helper functions
export const initializeApiManager = async () => {
  await apiManager.initialize();
};

export const getAvailableProviders = () => apiManager.getAvailableProviders();
export const getAvailableModels = () => apiManager.getAvailableModels();
export const getLocalModels = () => apiManager.getLocalModels();
export const getCloudModels = () => apiManager.getCloudModels();
export const getRecommendedModel = () => apiManager.getRecommendedModel();
