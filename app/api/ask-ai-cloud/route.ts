/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import {
  MAX_REQUESTS_PER_IP,
} from "@/lib/prompts";

const ipAddresses = new Map();

interface CloudMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface CloudApiRequest {
  provider: string;
  model: string;
  messages: CloudMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
}

// Rate limiting
const resetInterval = 60000;
setInterval(() => {
  ipAddresses.clear();
}, resetInterval);

export async function POST(request: NextRequest) {
  const authHeaders = await headers();
  const body = await request.json() as CloudApiRequest;
  const { provider, model, messages, stream = true, max_tokens, temperature = 0.7 } = body;

  if (!provider || !model || !messages) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Rate limiting (can be disabled in development)
  const isLocalMode = process.env.LOCAL_MODE === 'true' || process.env.NODE_ENV === 'development';

  if (!isLocalMode) {
    const rawFwd = authHeaders.get("x-forwarded-for");
    const ip = rawFwd?.includes(",")
      ? rawFwd.split(",")[1].trim()
      : rawFwd || 'unknown';

    ipAddresses.set(ip, (ipAddresses.get(ip) || 0) + 1);
    if (ipAddresses.get(ip) > MAX_REQUESTS_PER_IP) {
      return NextResponse.json(
        {
          ok: false,
          message: "Too many requests. Please wait a moment.",
        },
        { status: 429 }
      );
    }
  }

  try {
    // Create a stream response
    const encoder = new TextEncoder();
    const streamTransform = new TransformStream();
    const writer = streamTransform.writable.getWriter();

    // Start the response
    const response = new NextResponse(streamTransform.readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

    (async () => {
      let completeResponse = "";
      try {
        let apiResponse: Response;

        switch (provider) {
          case 'deepseek':
            apiResponse = await callDeepSeekApi(model, messages, { stream, max_tokens, temperature });
            break;
          case 'google':
            apiResponse = await callGoogleApi(model, messages, { stream, max_tokens, temperature });
            break;
          case 'openai':
            apiResponse = await callOpenAIApi(model, messages, { stream, max_tokens, temperature });
            break;
          case 'anthropic':
            apiResponse = await callAnthropicApi(model, messages, { stream, max_tokens, temperature });
            break;
          case 'groq':
            apiResponse = await callGroqApi(model, messages, { stream, max_tokens, temperature });
            break;
          default:
            throw new Error(`Provider ${provider} not supported`);
        }

        if (!apiResponse.ok) {
          throw new Error(`API Error: ${apiResponse.status} ${apiResponse.statusText}`);
        }

        if (stream && apiResponse.body) {
          const reader = apiResponse.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value);
            const lines = text.split('\n');

            for (const line of lines) {
              if (line.trim()) {
                try {
                  let content = '';

                  if (provider === 'openai' || provider === 'groq' || provider === 'deepseek') {
                    if (line.startsWith('data: ')) {
                      const jsonStr = line.slice(6);
                      if (jsonStr === '[DONE]') continue;

                      const json = JSON.parse(jsonStr);
                      content = json.choices?.[0]?.delta?.content || '';
                    }
                  } else if (provider === 'google') {
                    // Handle Gemini streaming format
                    const json = JSON.parse(line);
                    content = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  } else if (provider === 'anthropic') {
                    // Handle Claude streaming format
                    if (line.startsWith('data: ')) {
                      const jsonStr = line.slice(6);
                      const json = JSON.parse(jsonStr);
                      if (json.type === 'content_block_delta') {
                        content = json.delta?.text || '';
                      }
                    }
                  }

                  if (content) {
                    await writer.write(encoder.encode(content));
                    completeResponse += content;

                    if (completeResponse.includes("</html>")) {
                      break;
                    }
                  }
                } catch (e) {
                  console.error("Error parsing streaming response:", e);
                }
              }
            }

            if (completeResponse.includes("</html>")) {
              break;
            }
          }
        } else {
          // Non-streaming response
          const responseData = await apiResponse.json();
          let content = '';

          if (provider === 'openai' || provider === 'groq' || provider === 'deepseek') {
            content = responseData.choices?.[0]?.message?.content || '';
          } else if (provider === 'google') {
            content = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
          } else if (provider === 'anthropic') {
            content = responseData.content?.[0]?.text || '';
          }

          await writer.write(encoder.encode(content));
          completeResponse = content;
        }

      } catch (error: any) {
        console.error(`Error with ${provider} API:`, error);
        await writer.write(
          encoder.encode(
            JSON.stringify({
              ok: false,
              message: error.message || "An error occurred while processing your request.",
            })
          )
        );
      } finally {
        await writer?.close();
      }
    })();

    return response;
  } catch (error: any) {
    console.error(`Error with ${provider} API:`, error);
    return NextResponse.json(
      {
        ok: false,
        message: error?.message || "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}

async function callDeepSeekApi(model: string, messages: CloudMessage[], options: any): Promise<Response> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DeepSeek API key not configured");
  }

  return fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model.replace('deepseek-', ''),
      messages,
      stream: options.stream,
      max_tokens: options.max_tokens || 4096,
      temperature: options.temperature || 0.7,
    }),
  });
}

async function callGoogleApi(model: string, messages: CloudMessage[], options: any): Promise<Response> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Google API key not configured");
  }

  // Convert OpenAI format to Gemini format
  const contents = messages
    .filter(msg => msg.role !== 'system')
    .map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

  const systemInstruction = messages.find(msg => msg.role === 'system')?.content;

  const requestBody: any = {
    contents,
    generationConfig: {
      maxOutputTokens: options.max_tokens || 4096,
      temperature: options.temperature || 0.7,
    }
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const modelName = model.replace('google-', '');
  const url = options.stream
    ? `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?key=${apiKey}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });
}

async function callOpenAIApi(model: string, messages: CloudMessage[], options: any): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model.replace('openai-', ''),
      messages,
      stream: options.stream,
      max_tokens: options.max_tokens || 4096,
      temperature: options.temperature || 0.7,
    }),
  });
}

async function callAnthropicApi(model: string, messages: CloudMessage[], options: any): Promise<Response> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Anthropic API key not configured");
  }

  // Convert OpenAI format to Claude format
  const systemMessage = messages.find(msg => msg.role === 'system')?.content || '';
  const userMessages = messages.filter(msg => msg.role !== 'system');

  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model.replace('anthropic-', ''),
      system: systemMessage,
      messages: userMessages,
      stream: options.stream,
      max_tokens: options.max_tokens || 4096,
      temperature: options.temperature || 0.7,
    }),
  });
}

async function callGroqApi(model: string, messages: CloudMessage[], options: any): Promise<Response> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Groq API key not configured");
  }

  return fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model.replace('groq-', ''),
      messages,
      stream: options.stream,
      max_tokens: options.max_tokens || 4096,
      temperature: options.temperature || 0.7,
    }),
  });
}

// PUT method for follow-up requests
export async function PUT(request: NextRequest) {
  const authHeaders = await headers();
  const body = await request.json();
  const { provider, model, messages, max_tokens, temperature = 0.7 } = body;

  if (!provider || !model || !messages) {
    return NextResponse.json(
      { ok: false, error: "Missing required fields" },
      { status: 400 }
    );
  }

  // Rate limiting
  const isLocalMode = process.env.LOCAL_MODE === 'true' || process.env.NODE_ENV === 'development';

  if (!isLocalMode) {
    const rawFwd = authHeaders.get("x-forwarded-for");
    const ip = rawFwd?.includes(",")
      ? rawFwd.split(",")[1].trim()
      : rawFwd || 'unknown';

    ipAddresses.set(ip, (ipAddresses.get(ip) || 0) + 1);
    if (ipAddresses.get(ip) > MAX_REQUESTS_PER_IP) {
      return NextResponse.json(
        {
          ok: false,
          message: "Too many requests. Please wait a moment.",
        },
        { status: 429 }
      );
    }
  }

  try {
    let apiResponse: Response;

    switch (provider) {
      case 'deepseek':
        apiResponse = await callDeepSeekApi(model, messages, { stream: false, max_tokens, temperature });
        break;
      case 'google':
        apiResponse = await callGoogleApi(model, messages, { stream: false, max_tokens, temperature });
        break;
      case 'openai':
        apiResponse = await callOpenAIApi(model, messages, { stream: false, max_tokens, temperature });
        break;
      case 'anthropic':
        apiResponse = await callAnthropicApi(model, messages, { stream: false, max_tokens, temperature });
        break;
      case 'groq':
        apiResponse = await callGroqApi(model, messages, { stream: false, max_tokens, temperature });
        break;
      default:
        throw new Error(`Provider ${provider} not supported`);
    }

    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      throw new Error(`API Error: ${apiResponse.status} ${apiResponse.statusText} - ${errorData}`);
    }

    const responseData = await apiResponse.json();
    let content = '';

    if (provider === 'openai' || provider === 'groq' || provider === 'deepseek') {
      content = responseData.choices?.[0]?.message?.content || '';
    } else if (provider === 'google') {
      content = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (provider === 'anthropic') {
      content = responseData.content?.[0]?.text || '';
    }

    if (!content) {
      return NextResponse.json(
        { ok: false, message: "No content returned from the model" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      content,
      provider,
      model
    });

  } catch (error: any) {
    console.error(`Error with ${provider} API:`, error);
    return NextResponse.json(
      {
        ok: false,
        message: error.message || "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}
