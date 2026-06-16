export interface AiConfig {
  endpoint: string;
  model: string;
  apiKey: string;
}

export interface IAiService {
  getConfig(): Promise<AiConfig>;
  setConfig(config: Partial<AiConfig>): Promise<void>;
  listModels(): Promise<string[]>;
  formatNote(content: string): Promise<string>;
  summarizeNote(content: string): Promise<string>;
}
