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

function extFromMime(mimeType: string): string {
  return EXT_FROM_MIME[mimeType] ?? "bin";
}

function extFromFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot !== -1 ? name.slice(dot + 1).toLowerCase() : "";
}

function resolveExt(filename: string, mimeType: string): string {
  const fromName = extFromFilename(filename);
  if (fromName && Object.values(EXT_FROM_MIME).includes(fromName)) return fromName;
  return extFromMime(mimeType);
}

async function getFilesDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle("basalt-files", { create: true });
}

export class LocalWebFileService implements IFileService {
  async storeFile(data: ArrayBuffer, mimeType: string, filename: string): Promise<string> {
    const ext = resolveExt(filename, mimeType);
    const id = `${crypto.randomUUID()}.${ext}`;
    const dir = await getFilesDir();
    const handle = await dir.getFileHandle(id, { create: true });
    const writable = await handle.createWritable();
    await writable.write(new Blob([data], { type: mimeType }));
    await writable.close();
    return `basalt-local:${id}`;
  }

  async resolveUrl(url: string): Promise<string> {
    if (!url.startsWith("basalt-local:")) return url;
    const id = url.slice("basalt-local:".length);
    const dir = await getFilesDir();
    const handle = await dir.getFileHandle(id);
    const file = await handle.getFile();
    return URL.createObjectURL(file);
  }
}

export class RemoteFileService implements IFileService {
  constructor(private readonly backendUrl: string) {}

  async storeFile(data: ArrayBuffer, mimeType: string, filename: string): Promise<string> {
    const blob = new Blob([data], { type: mimeType });
    const form = new FormData();
    form.append("file", blob, filename);
    const res = await fetch(`${this.backendUrl}/api/files`, {
      method: "POST",
      body: form,
      credentials: "include",
    });
    if (!res.ok) throw new Error(`File upload failed: ${res.statusText}`);
    const json = (await res.json()) as { id: string; url: string };
    return `${this.backendUrl}${json.url}`;
  }

  async resolveUrl(url: string): Promise<string> {
    return url;
  }
}
