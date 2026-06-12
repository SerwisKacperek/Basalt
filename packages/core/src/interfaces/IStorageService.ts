export interface IStorageService <T = any >{
  saveData(key: string, data: T): Promise<void>;
  getData(key: string): Promise<T | null>;
}