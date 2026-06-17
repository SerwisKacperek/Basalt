import type { IStorageService } from "@basalt/core/interfaces/IStorageService";

export class StorageService<T> implements IStorageService<T> {
  async saveData(key: string, data: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(data));
  }

  async getData(key: string): Promise<T | null> {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  
}