import { net, protocol } from "electron";
import path from "node:path";
import { getFilesDir } from "../services/LocalFileService";

export const basaltFileScheme = {
  scheme: "basalt-file",
  privileges: { secure: true, standard: true, supportFetchAPI: true, corsEnabled: true },
};

export function handleBasaltFileProtocol() {
  protocol.handle("basalt-file", async (request) => {
    const url = new URL(request.url);
    // URL format: basalt-file://local/{uuid}.{ext}
    const filename = url.pathname.replace(/^\//, "");
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return new Response("Not found", { status: 404 });
    }
    const filePath = path.join(getFilesDir(), filename);
    try {
      const inner = await net.fetch(`file://${filePath}`);
      const headers = new Headers(inner.headers);
      headers.set("Cross-Origin-Resource-Policy", "cross-origin");
      return new Response(inner.body, { status: inner.status, headers });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });
}
