import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export async function compress(data: Uint8Array): Promise<Uint8Array> {
  const buf = await gzipAsync(Buffer.from(data.buffer, data.byteOffset, data.byteLength));
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

export async function decompress(data: Uint8Array): Promise<Uint8Array> {
  if (data[0] !== 0x1f || data[1] !== 0x8b) return data;
  const buf = await gunzipAsync(Buffer.from(data.buffer, data.byteOffset, data.byteLength));
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}
