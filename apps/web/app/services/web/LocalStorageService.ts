import type { IStorageService } from "@basalt/core/interfaces/IStorageService";

export class LocalStorageService implements IStorageService {
  async saveData(key: string, data: any): Promise<void> {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async getData(key: string): Promise<any> {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
}