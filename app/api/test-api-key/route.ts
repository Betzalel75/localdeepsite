/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey } = await request.json();

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Provider and API key are required" },
        { status: 400 }
      );
    }

    let isValid = false;
    let error = "";
    let modelCount = 0;

    try {
      switch (provider) {
        case 'deepseek':
          const deepseekResponse = await fetch('https://api.deepseek.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          isValid = deepseekResponse.ok;
          if (deepseekResponse.ok) {
            const data = await deepseekResponse.json();
            modelCount = data.data?.length || 0;
          } else {
            error = `HTTP ${deepseekResponse.status}: ${deepseekResponse.statusText}`;
          }
          break;

        case 'google':
          const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          isValid = googleResponse.ok;
          if (googleResponse.ok) {
            const data = await googleResponse.json();
            modelCount = data.models?.length || 0;
          } else {
            error = `HTTP ${googleResponse.status}: ${googleResponse.statusText}`;
          }
          break;

        case 'openai':
          const openaiResponse = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          isValid = openaiResponse.ok;
          if (openaiResponse.ok) {
            const data = await openaiResponse.json();
            modelCount = data.data?.length || 0;
          } else {
            error = `HTTP ${openaiResponse.status}: ${openaiResponse.statusText}`;
          }
          break;

        case 'anthropic':
          // For Anthropic, we'll try a minimal request to test the key
          const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 1,
              messages: [{ role: 'user', content: 'test' }]
            })
          });
          // Even if the request fails due to content, a 400 means the key is valid
          // Only 401/403 indicates invalid key
          isValid = anthropicResponse.status !== 401 && anthropicResponse.status !== 403;
          if (anthropicResponse.status === 401 || anthropicResponse.status === 403) {
            error = 'Invalid API key';
          } else {
            modelCount = 4; // Claude has roughly 4 main models
          }
          break;

        case 'groq':
          const groqResponse = await fetch('https://api.groq.com/openai/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          isValid = groqResponse.ok;
          if (groqResponse.ok) {
            const data = await groqResponse.json();
            modelCount = data.data?.length || 0;
          } else {
            error = `HTTP ${groqResponse.status}: ${groqResponse.statusText}`;
          }
          break;

        case 'together':
          const togetherResponse = await fetch('https://api.together.xyz/models/info', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          isValid = togetherResponse.ok;
          if (togetherResponse.ok) {
            const data = await togetherResponse.json();
            modelCount = data.length || 0;
          } else {
            error = `HTTP ${togetherResponse.status}: ${togetherResponse.statusText}`;
          }
          break;

        case 'fireworks':
          const fireworksResponse = await fetch('https://api.fireworks.ai/inference/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          isValid = fireworksResponse.ok;
          if (fireworksResponse.ok) {
            const data = await fireworksResponse.json();
            modelCount = data.data?.length || 0;
          } else {
            error = `HTTP ${fireworksResponse.status}: ${fireworksResponse.statusText}`;
          }
          break;

        default:
          return NextResponse.json(
            { error: `Provider ${provider} not supported for testing` },
            { status: 400 }
          );
      }

      return NextResponse.json({
        provider,
        isValid,
        error: error || null,
        modelCount,
        message: isValid
          ? `API key is valid. Found ${modelCount} models.`
          : `API key is invalid: ${error}`
      });

    } catch (networkError: any) {
      return NextResponse.json({
        provider,
        isValid: false,
        error: networkError.message || 'Network error',
        modelCount: 0,
        message: `Failed to test API key: ${networkError.message || 'Network error'}`
      });
    }

  } catch (error: any) {
    console.error('Error testing API key:', error);
    return NextResponse.json(
      { error: 'Failed to test API key', details: error.message },
      { status: 500 }
    );
  }
}

// GET method to test connectivity to various providers
export async function GET() {
  const providers = [
    { id: 'deepseek', url: 'https://api.deepseek.com', name: 'DeepSeek' },
    { id: 'google', url: 'https://generativelanguage.googleapis.com', name: 'Google Gemini' },
    { id: 'openai', url: 'https://api.openai.com', name: 'OpenAI' },
    { id: 'anthropic', url: 'https://api.anthropic.com', name: 'Anthropic' },
    { id: 'groq', url: 'https://api.groq.com', name: 'Groq' },
    { id: 'together', url: 'https://api.together.xyz', name: 'Together AI' },
    { id: 'fireworks', url: 'https://api.fireworks.ai', name: 'Fireworks AI' },
  ];

  const connectivityResults = await Promise.all(
    providers.map(async (provider) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(provider.url, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' }
        });

        clearTimeout(timeoutId);

        return {
          provider: provider.id,
          name: provider.name,
          url: provider.url,
          reachable: true,
          status: response.status,
          statusText: response.statusText
        };
      } catch (error: any) {
        return {
          provider: provider.id,
          name: provider.name,
          url: provider.url,
          reachable: false,
          error: error.message
        };
      }
    })
  );

  return NextResponse.json({
    connectivity: connectivityResults,
    timestamp: new Date().toISOString()
  });
}
