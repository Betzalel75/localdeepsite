export interface ModelInterface {
  value: string;
  label: string;
  providers: string[];
  autoProvider: string;
  isThinker?: boolean;
  isNew?: boolean;
  isLocal?: boolean;
}

export const PROVIDERS = {
  "fireworks-ai": {
    name: "Fireworks AI",
    max_tokens: 131_000,
    id: "fireworks-ai",
  },
  nebius: {
    name: "Nebius AI Studio",
    max_tokens: 131_000,
    id: "nebius",
  },
  sambanova: {
    name: "SambaNova",
    max_tokens: 32_000,
    id: "sambanova",
  },
  novita: {
    name: "NovitaAI",
    max_tokens: 16_000,
    id: "novita",
  },
  hyperbolic: {
    name: "Hyperbolic",
    max_tokens: 131_000,
    id: "hyperbolic",
  },
  together: {
    name: "Together AI",
    max_tokens: 128_000,
    id: "together",
  },
  groq: {
    name: "Groq",
    max_tokens: 16_384,
    id: "groq",
  },
  // Providers locaux
  ollama: {
    name: "Ollama (Local)",
    max_tokens: 131_000,
    id: "ollama",
    isLocal: true,
  },
  "lm-studio": {
    name: "LM Studio (Local)",
    max_tokens: 131_000,
    id: "lm-studio",
    isLocal: true,
  },
};

export const MODELS: ModelInterface[] = [
  // // Modèles locaux pour Ollama
  // {
  //   value: "deepseek-r1:7b",
  //   label: "DeepSeek R1 7B (Local)",
  //   providers: ["ollama"],
  //   autoProvider: "ollama",
  //   isLocal: true,
  // },
  // {
  //   value: "deepseek-r1:14b",
  //   label: "DeepSeek R1 14B (Local)",
  //   providers: ["ollama"],
  //   autoProvider: "ollama",
  //   isLocal: true,
  // },
  // {
  //   value: "deepseek-r1:32b",
  //   label: "DeepSeek R1 32B (Local)",
  //   providers: ["ollama"],
  //   autoProvider: "ollama",
  //   isLocal: true,
  // },
  // {
  //   value: "llama3.3:70b",
  //   label: "Llama 3.3 70B (Local)",
  //   providers: ["ollama", "lm-studio"],
  //   autoProvider: "ollama",
  //   isLocal: true,
  // },
  // {
  //   value: "qwen2.5-coder:32b",
  //   label: "Qwen2.5 Coder 32B (Local)",
  //   providers: ["ollama", "lm-studio"],
  //   autoProvider: "ollama",
  //   isLocal: true,
  // },
];
