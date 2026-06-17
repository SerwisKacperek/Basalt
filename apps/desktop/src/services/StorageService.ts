import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { IStorageService } from "@basalt/core/interfaces/IStorageService";
export class StorageService<T> implements IStorageService<T> {
  private filePath: string;

  constructor(vaultRoot: string) {
    this.filePath = path.join(vaultRoot, "preferences.json");
  }


  async saveData(key: string, data: T) {
    let currentData: Record<string, any> = {};
    
    if (existsSync(this.filePath)) {
      try {
        const content = await fs.readFile(this.filePath, "utf-8");
        const parsed = JSON.parse(content);
        currentData = (typeof parsed === 'object' && parsed !== null) ? parsed : {};
      } catch (e) { currentData = {}; }
    }

    const finalData = (typeof data === 'string') ? { theme: data } : data;
    currentData[key] = finalData; 
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(currentData, null, 2), "utf-8");
  }


    async getData(key: string): Promise<T | null> {
    if (!existsSync(this.filePath)) return null;
    
    const content = await fs.readFile(this.filePath, "utf-8");
    
    try {
      const allData = JSON.parse(content);
      if (typeof allData !== 'object' || allData === null) return null;
      
      return allData[key] || null;
    } catch {
      return null; 
    }
  }
}