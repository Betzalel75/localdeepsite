/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFileSync } from "fs";
import { NextResponse } from "next/server";
import { getSecret } from "../ask-ai-cloud/route";

export async function GET() {
  try {
    // Check which API keys are available in environment variables
    const production = process.env.PRODUCTION === "true";
    const getSecrets = (name: string): string | null => {
      try {
        if (!production) {
          // console.log(
          //   "LOCAL DEVELOPMENT : reading directly from .env.local file",
          // );
          return process.env[name.toLocaleUpperCase()] || null;
        } else {
          // console.log("PRODUCTION ENVIRONEMENT : Reading from secret.");
          return readFileSync(`/run/secrets/${name}`, "utf-8").trim();
        }
      } catch (error: any) {
        console.warn(`Could not read secret ${name}: ${error.message}`);
        return null;
      }
    };

    // Check which API keys are available in environment variables
    const apiKeys: Record<string, string | null> = {
      deepseek: getSecrets("deepseek_api_key"),
      google: getSecrets("gemini_api_key"),
      openai: getSecrets("openai_api_key"),
      anthropic: getSecrets("anthropic_api_key"),
      groq: getSecrets("groq_api_key"),
      together: getSecrets("together_api_key"),
      fireworks: getSecrets("fireworks_api_key"),
      huggingface: process.env.HF_TOKEN || null,
    };

    // Return only the keys that are available (mask the actual values for security)
    const availableKeys: Record<string, boolean> = {};
    Object.entries(apiKeys).forEach(([key, value]) => {
      availableKeys[key] = Boolean(value && value.trim() !== "");
    });

    // Additional configuration info
    const config = {
      localMode: process.env.LOCAL_MODE === "true",
      mixedMode: process.env.ENABLE_MIXED_MODE === "true",
      ollamaUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
      // lmStudioUrl: process.env.LM_STUDIO_BASE_URL || "http://localhost:1234",
    };

    return NextResponse.json({
      availableKeys,
      config,
      hasLocalProviders: Boolean(config.ollamaUrl),
      hasCloudProviders: Object.values(availableKeys).some(Boolean),
    });
  } catch (error) {
    console.error("Error checking API keys:", error);
    return NextResponse.json(
      { error: "Failed to check API keys" },
      { status: 500 },
    );
  }
}

// Helper function to validate API keys (can be extended for actual validation)
export async function POST() {
  try {
    const validationResults: Record<
      string,
      { valid: boolean; error?: string }
    > = {};

    // DeepSeek validation
    const env = process.env.PRODUCTION;
    const apiKey = env ? getSecret("deepseek_api_key") : process.env.DEEPSEEK_API_KEY;
    if (apiKey) {
      try {
        const response = await fetch("https://api.deepseek.com/v1/models", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });
        validationResults.deepseek = { valid: response.ok };
        if (!response.ok) {
          validationResults.deepseek.error = `HTTP ${response.status}`;
        }
      } catch (error) {
        validationResults.deepseek = {
          valid: false,
          error: error instanceof Error ? error.message : "Network error",
        };
      }
    }

    // Google Gemini validation
    const gapiKey = env ? getSecret("gemini_api_key") : process.env.GEMINI_API_KEY;
    if (gapiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${gapiKey}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        validationResults.google = { valid: response.ok };
        if (!response.ok) {
          validationResults.google.error = `HTTP ${response.status}`;
        }
      } catch (error) {
        validationResults.google = {
          valid: false,
          error: error instanceof Error ? error.message : "Network error",
        };
      }
    }

    // OpenAI validation
    const oapiKey = env ? getSecret("openai_api_key") : process.env.OPENAI_API_KEY;
    if (oapiKey) {
      try {
        const response = await fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${oapiKey}`,
            "Content-Type": "application/json",
          },
        });
        validationResults.openai = { valid: response.ok };
        if (!response.ok) {
          validationResults.openai.error = `HTTP ${response.status}`;
        }
      } catch (error) {
        validationResults.openai = {
          valid: false,
          error: error instanceof Error ? error.message : "Network error",
        };
      }
    }

    // Anthropic validation
    const clapiKey = env ? getSecret("anthropic_api_key") : process.env.ANTHROPIC_API_KEY;
    if (clapiKey) {
      try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": clapiKey,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1,
            messages: [{ role: "user", content: "test" }],
          }),
        });
        // Even if the request fails due to content, a 400 means the key is valid
        validationResults.anthropic = {
          valid: response.status !== 401 && response.status !== 403,
        };
        if (response.status === 401 || response.status === 403) {
          validationResults.anthropic.error = "Invalid API key";
        }
      } catch (error) {
        validationResults.anthropic = {
          valid: false,
          error: error instanceof Error ? error.message : "Network error",
        };
      }
    }

    // Groq validation
    const grkapiKey = env ? getSecret("groq_api_key") : process.env.GROQ_API_KEY;
    if (grkapiKey) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/models", {
          headers: {
            Authorization: `Bearer ${grkapiKey}`,
            "Content-Type": "application/json",
          },
        });
        validationResults.groq = { valid: response.ok };
        if (!response.ok) {
          validationResults.groq.error = `HTTP ${response.status}`;
        }
      } catch (error) {
        validationResults.groq = {
          valid: false,
          error: error instanceof Error ? error.message : "Network error",
        };
      }
    }

    return NextResponse.json({
      validationResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error validating API keys:", error);
    return NextResponse.json(
      { error: "Failed to validate API keys" },
      { status: 500 },
    );
  }
}
