import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export interface IPreferencesService {
  save(data: Record<string, any>): Promise<{ success: boolean }>;
  get(): Promise<Record<string, any>>;
}

export class PreferencesService implements IPreferencesService {
  private filePath: string;

  constructor(vaultRoot: string) {
    
    this.filePath = path.join(vaultRoot, "preferences.json");
  }

  async save(data: Record<string, any>) {
    try {
     
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });

     
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), "utf-8");
      return { success: true };
    } catch (error) {
      console.error("Failed to save preferences:", error);
      throw new Error("Unable to save preferences locally.");
    }
  }

  async get() {
    try {
      if (!existsSync(this.filePath)) {
        return {}; 
      }
      const content = await fs.readFile(this.filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.error("Failed to read preferences:", error);
      return {};
    }
  }
}