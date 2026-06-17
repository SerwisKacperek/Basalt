export interface IFileService {
  storeFile(data: ArrayBuffer, mimeType: string, filename: string): Promise<string>;
  resolveUrl(url: string): Promise<string>;
}
