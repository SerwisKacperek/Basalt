import { Elysia, t } from "elysia";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const EXT_FROM_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/avif": "avif",
  "image/tiff": "tiff",
};

function extFromFilename(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot !== -1 ? name.slice(dot + 1).toLowerCase() : "";
}

function safeExt(filename: string, mimeType: string): string {
  const fromName = extFromFilename(filename);
  if (fromName && Object.values(EXT_FROM_MIME).includes(fromName)) return fromName;
  return EXT_FROM_MIME[mimeType] ?? "bin";
}

export function createFileRoutes() {
  return new Elysia({ prefix: "/files" })
    .post(
      "/",
      async ({ body, set }) => {
        const file = body.file as File;
        if (file.size > MAX_FILE_SIZE) {
          set.status = 413;
          return { error: "File too large (max 10 MB)" };
        }
        await mkdir(UPLOADS_DIR, { recursive: true });
        const ext = safeExt(file.name ?? "upload", file.type);
        const id = `${crypto.randomUUID()}.${ext}`;
        const dest = path.join(UPLOADS_DIR, id);
        await Bun.write(dest, file);
        return { id, url: `/api/files/${id}` };
      },
      {
        body: t.Object({ file: t.File() }),
      },
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        const safe = path.basename(params.id);
        const filePath = path.join(UPLOADS_DIR, safe);
        const file = Bun.file(filePath);
        if (!(await file.exists())) {
          set.status = 404;
          return new Response("Not found", { status: 404 });
        }
        return new Response(file, {
          headers: { "Cross-Origin-Resource-Policy": "cross-origin" },
        });
      },
      {
        params: t.Object({ id: t.String() }),
      },
    );
}
