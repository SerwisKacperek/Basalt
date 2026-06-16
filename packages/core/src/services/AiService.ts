import type { IStorageService } from "../interfaces/IStorageService";
import type { AiConfig, IAiService } from "../interfaces/IAiService";

export const DEFAULT_AI_ENDPOINT =
  "https://api.openai.com/v1/chat/completions";
export const DEFAULT_AI_MODEL = "gpt-4o-mini";
export const APP_SETTINGS_KEY = "app-settings";

export interface AppSettings {
  theme?: "light" | "dark" | "system";
  aiEndpoint?: string;
  aiModel?: string;
  aiApiKey?: string;
}

export interface AiChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiChatCompletionRequest {
  model: string;
  messages: AiChatMessage[];
  temperature: number;
}

export interface AiChatCompletionResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
  }>;
}

export interface AiModelsResponse {
  data?: Array<{ id?: string }>;
}

export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiError";
  }
}

export class AiService implements IAiService {
  constructor(private readonly storage: IStorageService) {}

  async getConfig(): Promise<AiConfig> {
    const settings = (await this.storage.getData(
      APP_SETTINGS_KEY,
    )) as AppSettings | null;

    const endpoint =
      settings?.aiEndpoint === undefined
        ? DEFAULT_AI_ENDPOINT
        : settings.aiEndpoint.trim();
    const model =
      settings?.aiModel === undefined
        ? DEFAULT_AI_MODEL
        : settings.aiModel.trim();
    const apiKey = settings?.aiApiKey?.trim() ?? "";

    return {
      endpoint: this.normalizeEndpoint(endpoint),
      model: model || DEFAULT_AI_MODEL,
      apiKey,
    };
  }

  async setConfig(config: Partial<AiConfig>): Promise<void> {
    const currentSettings = (await this.storage.getData(
      APP_SETTINGS_KEY,
    )) as AppSettings | null;

    const next: AppSettings = { ...(currentSettings ?? {}) };
    if (config.endpoint !== undefined) next.aiEndpoint = config.endpoint.trim();
    if (config.model !== undefined) next.aiModel = config.model.trim();
    if (config.apiKey !== undefined) next.aiApiKey = config.apiKey.trim();

    await this.storage.saveData(APP_SETTINGS_KEY, next);
  }

  async listModels(): Promise<string[]> {
    const { endpoint, apiKey } = await this.getConfig();
    const modelsUrl = this.deriveModelsEndpoint(endpoint);

    const headers: Record<string, string> = {};
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    let response: Response;
    try {
      response = await fetch(modelsUrl, { method: "GET", headers });
    } catch {
      throw new AiError(
        "Couldn't reach the AI endpoint. Check that the URL is correct and that the server allows requests from this app.",
      );
    }

    if (!response.ok) {
      throw new AiError(
        `The AI endpoint returned HTTP error ${response.status} while listing models. Check the endpoint and API key.`,
      );
    }

    let data: AiModelsResponse;
    try {
      data = (await response.json()) as AiModelsResponse;
    } catch {
      throw new AiError(
        "The AI endpoint returned a model list in an invalid format.",
      );
    }

    const models = (data.data ?? [])
      .map((model) => model.id)
      .filter((id): id is string => typeof id === "string" && id.length > 0);

    if (models.length === 0) {
      throw new AiError("The AI endpoint didn't report any available models.");
    }

    return models.sort((a, b) => a.localeCompare(b));
  }

  async formatNote(content: string): Promise<string> {
    if (!content.trim()) {
      throw new AiError("The note is empty.");
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

    return this.cleanEditorHtml(formatted);
  }

  async summarizeNote(content: string): Promise<string> {
    if (!content.trim()) {
      throw new AiError("The note is empty.");
    }

    const summary = await this.complete([
      {
        role: "system",
        content: [
          "You are an expert at summarizing notes.",
          "Create a concise summary in the same language as the source.",
          "Preserve the key ideas, facts, decisions, dates, names, and action items.",
          "Do not add information that is not present in the source.",
          "Use a short heading and bullet points where useful.",
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

    return this.cleanEditorHtml(summary);
  }

  private async complete(messages: AiChatMessage[]): Promise<string> {
    const { endpoint, model, apiKey } = await this.getConfig();
    const body: AiChatCompletionRequest = {
      model,
      messages,
      temperature: 0.7,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
    } catch {
      throw new AiError(
        "Couldn't reach the AI endpoint. Check that the URL is correct and that the server allows requests from this app.",
      );
    }

    if (!response.ok) {
      throw new AiError(
        `The AI endpoint returned HTTP error ${response.status}. Check the endpoint, API key, and that the "${model}" model is available.`,
      );
    }

    let data: AiChatCompletionResponse;
    try {
      data = (await response.json()) as AiChatCompletionResponse;
    } catch {
      throw new AiError("The AI endpoint returned a response in an invalid format.");
    }

    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new AiError("The AI response is missing the expected content.");
    }

    return content;
  }

  private deriveModelsEndpoint(endpoint: string): string {
    const url = new URL(endpoint);
    const suffix = "/chat/completions";

    if (url.pathname.endsWith(suffix)) {
      url.pathname = `${url.pathname.slice(0, -suffix.length)}/models`;
    } else {
      // Best effort: swap the last path segment for "models"
      // (e.g. ".../v1/completions" -> ".../v1/models").
      url.pathname = url.pathname.replace(/\/[^/]*\/?$/, "/models");
    }

    return url.toString();
  }

  private normalizeEndpoint(endpoint: string): string {
    if (!endpoint) {
      throw new AiError("The AI endpoint can't be empty.");
    }

    try {
      const url = new URL(endpoint);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Unsupported protocol");
      }
      return url.toString();
    } catch {
      throw new AiError(
        "The AI endpoint must be a valid HTTP or HTTPS address.",
      );
    }
  }

  private cleanEditorHtml(content: string): string {
    const cleaned = content
      .replace(/^```(?:html)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    if (!cleaned.startsWith("<")) {
      throw new AiError(
        "The AI didn't return content in a format the editor supports.",
      );
    }

    return cleaned;
  }
}
