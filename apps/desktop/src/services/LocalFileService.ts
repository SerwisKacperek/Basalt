import { app } from "electron";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import type { IFileService } from "@basalt/core/interfaces/IFileService";

const EXT_FROM_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/avif": "avif",
};

function resolveExt(filename: string, mimeType: string): string {
  const dot = filename.lastIndexOf(".");
  const fromName = dot !== -1 ? filename.slice(dot + 1).toLowerCase() : "";
  if (fromName && Object.values(EXT_FROM_MIME).includes(fromName)) return fromName;
  return EXT_FROM_MIME[mimeType] ?? "bin";
}

export function getFilesDir(): string {
  return path.join(app.getPath("userData"), "basalt-files");
}

export class LocalFileService implements IFileService {
  private readonly dir = getFilesDir();

  async storeFile(data: ArrayBuffer, mimeType: string, filename: string): Promise<string> {
    await mkdir(this.dir, { recursive: true });
    const ext = resolveExt(filename, mimeType);
    const id = `${crypto.randomUUID()}.${ext}`;
    const dest = path.join(this.dir, id);
    await writeFile(dest, Buffer.from(data));
    return `basalt-file://local/${id}`;
  }

  async resolveUrl(url: string): Promise<string> {
    return url;
  }
}
