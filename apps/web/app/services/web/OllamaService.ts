import type { IStorageService } from "@basalt/core/interfaces/IStorageService";

export const DEFAULT_OLLAMA_ENDPOINT =
  "http://localhost:11434/v1/chat/completions";
export const DEFAULT_OLLAMA_MODEL = "llama3.2:latest";
export const APP_SETTINGS_KEY = "app-settings";

export interface AppSettings {
  theme?: "light" | "dark" | "system";
  ollamaEndpoint?: string;
}

export interface OllamaChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaChatCompletionRequest {
  model: string;
  messages: OllamaChatMessage[];
  temperature: number;
}

export interface OllamaChatCompletionResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
  }>;
}

export interface IOllamaService {
  getEndpoint(): Promise<string>;
  setEndpoint(endpoint: string): Promise<void>;
  testConnection(): Promise<void>;
  formatNote(content: string): Promise<string>;
}

export class OllamaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OllamaError";
  }
}

export class OllamaService implements IOllamaService {
  constructor(private readonly storage: IStorageService) {}

  async getEndpoint(): Promise<string> {
    const settings = (await this.storage.getData(
      APP_SETTINGS_KEY,
    )) as AppSettings | null;
    const endpoint =
      settings?.ollamaEndpoint === undefined
        ? DEFAULT_OLLAMA_ENDPOINT
        : settings.ollamaEndpoint.trim();

    if (!endpoint) {
      throw new OllamaError("The Ollama endpoint can't be empty.");
    }

    try {
      const url = new URL(endpoint);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Unsupported protocol");
      }
      return url.toString();
    } catch {
      throw new OllamaError(
        "The Ollama endpoint must be a valid HTTP or HTTPS address.",
      );
    }
  }

  async setEndpoint(endpoint: string): Promise<void> {
    const normalizedEndpoint = endpoint.trim();
    const currentSettings = (await this.storage.getData(
      APP_SETTINGS_KEY,
    )) as AppSettings | null;

    await this.storage.saveData(APP_SETTINGS_KEY, {
      ...(currentSettings ?? {}),
      ollamaEndpoint: normalizedEndpoint,
    });
  }

  async testConnection(): Promise<void> {
    await this.complete([
      {
        role: "system",
        content: "Reply with exactly OK.",
      },
      {
        role: "user",
        content: "Connection test.",
      },
    ]);
  }

  async formatNote(content: string): Promise<string> {
    if (!content.trim()) {
      throw new OllamaError("The note is empty.");
    }

    const formatted = await this.complete([
      {
        role: "system",
        content: [
          "You are an expert note editor.",
          "Correct spelling, grammar, punctuation, typos, style, and layout.",
          "Preserve the original meaning, language, facts, links, and code.",
          "Improve readability with short paragraphs, headings, and lists where useful.",
          "Return only clean HTML suitable for a rich text editor.",
          "Use only common semantic tags such as p, h1, h2, h3, ul, ol, li, strong, em, blockquote, pre, code, a, and br.",
          "Do not include markdown fences, explanations, or commentary.",
        ].join(" "),
      },
      {
        role: "user",
        content,
      },
    ]);

    const cleaned = formatted
      .replace(/^```(?:html)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    if (!cleaned.startsWith("<")) {
      throw new OllamaError(
        "Ollama didn't return content in a format the editor supports.",
      );
    }

    return cleaned;
  }

  private async complete(messages: OllamaChatMessage[]): Promise<string> {
    const endpoint = await this.getEndpoint();
    const body: OllamaChatCompletionRequest = {
      model: DEFAULT_OLLAMA_MODEL,
      messages,
      temperature: 0.7,
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer ollama",
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new OllamaError(
        "Couldn't connect to Ollama. Check that it's running and allows connections from this app.",
      );
    }

    if (!response.ok) {
      throw new OllamaError(
        `Ollama returned HTTP error ${response.status}. Check the endpoint and that the ${DEFAULT_OLLAMA_MODEL} model is available.`,
      );
    }

    let data: OllamaChatCompletionResponse;
    try {
      data = (await response.json()) as OllamaChatCompletionResponse;
    } catch {
      throw new OllamaError(
        "Ollama returned a response in an invalid format.",
      );
    }

    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new OllamaError("Ollama's response is missing the expected content.");
    }

    return content;
  }

}
