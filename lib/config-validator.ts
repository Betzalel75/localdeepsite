// Configuration validator and test utility for LocalSite

export interface ConfigStatus {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface ProviderConfig {
  name: string;
  type: "local" | "cloud";
  required: string[];
  optional: string[];
  testEndpoint?: string;
}

export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  ollama: {
    name: "Ollama",
    type: "local",
    required: ["OLLAMA_BASE_URL"],
    optional: ["OLLAMA_MODEL"],
    testEndpoint: "/api/tags",
  },
  "lm-studio": {
    name: "LM Studio",
    type: "local",
    required: ["LM_STUDIO_BASE_URL"],
    optional: [],
    testEndpoint: "/v1/models",
  },
  deepseek: {
    name: "DeepSeek",
    type: "cloud",
    required: ["DEEPSEEK_API_KEY"],
    optional: ["DEEPSEEK_BASE_URL"],
  },
  google: {
    name: "Google Gemini",
    type: "cloud",
    required: ["GOOGLE_API_KEY"],
    optional: [],
  },
  openai: {
    name: "OpenAI",
    type: "cloud",
    required: ["OPENAI_API_KEY"],
    optional: [],
  },
  anthropic: {
    name: "Anthropic Claude",
    type: "cloud",
    required: ["ANTHROPIC_API_KEY"],
    optional: [],
  },
  groq: {
    name: "Groq",
    type: "cloud",
    required: ["GROQ_API_KEY"],
    optional: [],
  },
  together: {
    name: "Together AI",
    type: "cloud",
    required: ["TOGETHER_API_KEY"],
    optional: [],
  },
  fireworks: {
    name: "Fireworks AI",
    type: "cloud",
    required: ["FIREWORKS_API_KEY"],
    optional: [],
  },
};

export class ConfigValidator {
  private env: Record<string, string | undefined>;

  constructor(env: Record<string, string | undefined> = process.env) {
    this.env = env;
  }

  validateConfiguration(): ConfigStatus {
    const status: ConfigStatus = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: [],
    };

    // Check basic mode configuration
    this.validateModeConfiguration(status);

    // Check local providers
    this.validateLocalProviders(status);

    // Check cloud providers
    this.validateCloudProviders(status);

    // Check database configuration
    this.validateDatabaseConfiguration(status);

    // Check OAuth configuration
    this.validateOAuthConfiguration(status);

    // Provide recommendations
    this.addRecommendations(status);

    // Determine overall validity
    status.isValid = status.errors.length === 0;

    return status;
  }

  private validateModeConfiguration(status: ConfigStatus): void {
    const localMode = this.env.LOCAL_MODE === "true";
    const publicLocalMode = this.env.NEXT_PUBLIC_LOCAL_MODE === "true";
    const mixedMode = this.env.ENABLE_MIXED_MODE === "true";

    if (localMode !== publicLocalMode) {
      status.errors.push(
        "LOCAL_MODE and NEXT_PUBLIC_LOCAL_MODE must have the same value",
      );
    }

    if (localMode && mixedMode) {
      status.warnings.push(
        "LOCAL_MODE=true with ENABLE_MIXED_MODE=true - mixed mode will be ignored",
      );
    }

    if (!localMode && !this.hasAnyCloudProviders()) {
      status.errors.push(
        "No local or cloud providers configured. Set LOCAL_MODE=true or add cloud API keys",
      );
    }
  }

  private validateLocalProviders(status: ConfigStatus): void {
    const localMode = this.env.LOCAL_MODE === "true";

    // Check Ollama configuration
    if (localMode || this.env.OLLAMA_BASE_URL) {
      const ollamaUrl = this.env.OLLAMA_BASE_URL || "http://localhost:11434";

      if (!this.isValidUrl(ollamaUrl)) {
        status.errors.push(`Invalid Ollama URL: ${ollamaUrl}`);
      }

      if (!localMode) {
        status.recommendations.push(
          "Consider setting LOCAL_MODE=true if you primarily use Ollama",
        );
      }
    }

    // Check LM Studio configuration
    if (this.env.LM_STUDIO_BASE_URL) {
      if (!this.isValidUrl(this.env.LM_STUDIO_BASE_URL)) {
        status.errors.push(
          `Invalid LM Studio URL: ${this.env.LM_STUDIO_BASE_URL}`,
        );
      }
    }
  }

  private validateCloudProviders(status: ConfigStatus): void {
    const cloudProviders = Object.entries(PROVIDER_CONFIGS).filter(
      ([, config]) => config.type === "cloud",
    );

    let hasValidCloudProvider = false;

    for (const [providerId, config] of cloudProviders) {
      const hasRequiredKeys = config.required.every(
        (key: string) => this.env[key] && this.env[key]!.trim().length > 0,
      );

      if (hasRequiredKeys) {
        hasValidCloudProvider = true;

        // Validate API key format
        this.validateApiKeyFormat(providerId, status);
      }
    }

    if (!this.env.LOCAL_MODE && !hasValidCloudProvider) {
      status.errors.push(
        "No valid cloud providers configured. Add at least one API key or enable LOCAL_MODE",
      );
    }
  }

  private validateApiKeyFormat(providerId: string, status: ConfigStatus): void {
    const config = PROVIDER_CONFIGS[providerId];

    for (const keyName of config.required) {
      const keyValue = this.env[keyName];
      if (!keyValue) continue;

      // Basic validation patterns
      const patterns: Record<string, RegExp> = {
        DEEPSEEK_API_KEY: /^sk-[a-zA-Z0-9]{32,}$/,
        OPENAI_API_KEY: /^sk-[a-zA-Z0-9]{32,}$/,
        ANTHROPIC_API_KEY: /^sk-ant-[a-zA-Z0-9]{32,}$/,
        GOOGLE_API_KEY: /^AIza[a-zA-Z0-9_-]{35,}$/,
        GROQ_API_KEY: /^gsk_[a-zA-Z0-9]{32,}$/,
      };

      const pattern = patterns[keyName];
      if (pattern && !pattern.test(keyValue)) {
        status.warnings.push(
          `${keyName} format may be incorrect for ${config.name}`,
        );
      }

      // Check for common mistakes
      if (keyValue.includes("your_") || keyValue.includes("xxx")) {
        status.errors.push(`${keyName} appears to be a placeholder value`);
      }

      if (keyValue.length < 10) {
        status.warnings.push(`${keyName} seems too short for ${config.name}`);
      }
    }
  }

  private validateDatabaseConfiguration(status: ConfigStatus): void {
    const mongoUri = this.env.MONGODB_URI;

    if (mongoUri) {
      if (
        !mongoUri.startsWith("mongodb://") &&
        !mongoUri.startsWith("mongodb+srv://")
      ) {
        status.errors.push(
          "MONGODB_URI must start with mongodb:// or mongodb+srv://",
        );
      }
    } else {
      status.recommendations.push(
        "Consider adding MONGODB_URI for project persistence",
      );
    }
  }

  private validateOAuthConfiguration(status: ConfigStatus): void {
    const clientId = this.env.OAUTH_CLIENT_ID;
    const clientSecret = this.env.OAUTH_CLIENT_SECRET;

    if (clientId && !clientSecret) {
      status.errors.push(
        "OAUTH_CLIENT_SECRET is required when OAUTH_CLIENT_ID is set",
      );
    }

    if (clientSecret && !clientId) {
      status.errors.push(
        "OAUTH_CLIENT_ID is required when OAUTH_CLIENT_SECRET is set",
      );
    }

    if (!clientId && !clientSecret && !this.env.LOCAL_MODE) {
      status.warnings.push(
        "OAuth not configured - users won't be able to save projects",
      );
    }
  }

  private addRecommendations(status: ConfigStatus): void {
    const localMode = this.env.LOCAL_MODE === "true";
    const hasCloudProviders = this.hasAnyCloudProviders();

    // Mode recommendations
    if (!localMode && !hasCloudProviders) {
      status.recommendations.push(
        "Start with LOCAL_MODE=true and Ollama for privacy, then add cloud APIs for performance",
      );
    }

    // Provider recommendations
    if (hasCloudProviders && !this.hasProvider("deepseek")) {
      status.recommendations.push(
        "Consider adding DeepSeek API key - it offers excellent value for money",
      );
    }

    if (hasCloudProviders && !this.hasProvider("google")) {
      status.recommendations.push(
        "Consider adding Google API key - Gemini offers generous free quotas",
      );
    }

    // Performance recommendations
    if (localMode && !this.env.OLLAMA_BASE_URL) {
      status.recommendations.push(
        "Set OLLAMA_BASE_URL if Ollama runs on a different port or host",
      );
    }

    // Security recommendations
    if (hasCloudProviders) {
      status.recommendations.push(
        "Regularly rotate your API keys for security",
      );

      status.recommendations.push(
        "Monitor your API usage to avoid unexpected charges",
      );
    }
  }

  private hasAnyCloudProviders(): boolean {
    return Object.entries(PROVIDER_CONFIGS)
      .filter(([, config]) => config.type === "cloud")
      .some(([, config]) =>
        config.required.every(
          (key) => this.env[key] && this.env[key]!.trim().length > 0,
        ),
      );
  }

  private hasProvider(providerId: string): boolean {
    const config = PROVIDER_CONFIGS[providerId];
    if (!config) return false;

    return config.required.every(
      (key) => this.env[key] && this.env[key]!.trim().length > 0,
    );
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Public methods for testing specific configurations
  getProviderStatus(): Record<
    string,
    { configured: boolean; valid: boolean; issues: string[] }
  > {
    const result: Record<
      string,
      { configured: boolean; valid: boolean; issues: string[] }
    > = {};

    for (const [providerId, providerConfig] of Object.entries(
      PROVIDER_CONFIGS,
    )) {
      const issues: string[] = [];
      const configured = providerConfig.required.every(
        (key) => this.env[key] && this.env[key]!.trim().length > 0,
      );

      let valid = configured;

      if (configured) {
        // Additional validation for each provider
        for (const keyName of providerConfig.required) {
          const keyValue = this.env[keyName];
          if (keyValue?.includes("your_") || keyValue?.includes("xxx")) {
            issues.push("Appears to be placeholder value");
            valid = false;
          }
        }
      }

      result[providerId] = { configured, valid, issues };
    }

    return result;
  }

  generateConfigSummary(): string {
    const status = this.validateConfiguration();
    const providerStatus = this.getProviderStatus();

    let summary = "# LocalSite Configuration Summary\n\n";

    // Overall status
    summary += `**Status**: ${status.isValid ? "✅ Valid" : "❌ Invalid"}\n\n`;

    // Mode configuration
    const localMode = this.env.LOCAL_MODE === "true";
    const mixedMode = this.env.ENABLE_MIXED_MODE === "true";

    summary += "## Mode Configuration\n";
    summary += `- **Local Mode**: ${localMode ? "✅ Enabled" : "❌ Disabled"}\n`;
    summary += `- **Mixed Mode**: ${mixedMode ? "✅ Enabled" : "❌ Disabled"}\n\n`;

    // Providers
    summary += "## Providers Status\n";

    const localProviders = Object.entries(providerStatus).filter(
      ([providerId]) => PROVIDER_CONFIGS[providerId].type === "local",
    );
    const cloudProviders = Object.entries(providerStatus).filter(
      ([providerId]) => PROVIDER_CONFIGS[providerId].type === "cloud",
    );

    if (localProviders.length > 0) {
      summary += "### Local Providers\n";
      for (const [providerId, status] of localProviders) {
        const icon = status.configured ? (status.valid ? "✅" : "⚠️") : "❌";
        summary += `- **${PROVIDER_CONFIGS[providerId].name}**: ${icon} ${status.configured ? "Configured" : "Not configured"}\n`;
        if (status.issues.length > 0) {
          summary += `  - Issues: ${status.issues.join(", ")}\n`;
        }
      }
      summary += "\n";
    }

    if (cloudProviders.length > 0) {
      summary += "### Cloud Providers\n";
      for (const [providerId, status] of cloudProviders) {
        const icon = status.configured ? (status.valid ? "✅" : "⚠️") : "❌";
        summary += `- **${PROVIDER_CONFIGS[providerId].name}**: ${icon} ${status.configured ? "Configured" : "Not configured"}\n`;
        if (status.issues.length > 0) {
          summary += `  - Issues: ${status.issues.join(", ")}\n`;
        }
      }
      summary += "\n";
    }

    // Issues
    if (status.errors.length > 0) {
      summary += "## ❌ Errors\n";
      for (const error of status.errors) {
        summary += `- ${error}\n`;
      }
      summary += "\n";
    }

    if (status.warnings.length > 0) {
      summary += "## ⚠️ Warnings\n";
      for (const warning of status.warnings) {
        summary += `- ${warning}\n`;
      }
      summary += "\n";
    }

    if (status.recommendations.length > 0) {
      summary += "## 💡 Recommendations\n";
      for (const recommendation of status.recommendations) {
        summary += `- ${recommendation}\n`;
      }
      summary += "\n";
    }

    return summary;
  }
}

// Utility functions
export const validateConfig = (env?: Record<string, string | undefined>) => {
  const validator = new ConfigValidator(env);
  return validator.validateConfiguration();
};

export const getConfigSummary = (env?: Record<string, string | undefined>) => {
  const validator = new ConfigValidator(env);
  return validator.generateConfigSummary();
};

export const checkProvider = (
  providerId: string,
  env?: Record<string, string | undefined>,
) => {
  const validator = new ConfigValidator(env);
  const status = validator.getProviderStatus();
  return (
    status[providerId] || {
      configured: false,
      valid: false,
      issues: ["Provider not found"],
    }
  );
};

// Default export
export default ConfigValidator;
