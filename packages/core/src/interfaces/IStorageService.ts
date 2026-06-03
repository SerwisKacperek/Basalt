export interface IStorageService {
  saveData(key: string, data: any): Promise<void>;
  getData(key: string): Promise<any>;
}