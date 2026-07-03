/** Client-side base64 / arraybuffer helpers (no Node Buffer). */

export function base64ToUint8Array(b64: string): Uint8Array {
  const cleaned = b64.replace(/\s+/g, "");
  const bin = atob(cleaned);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function uint8ArrayToBlob(
  chunks: Uint8Array[],
  mime: string,
): Blob {
  return new Blob(chunks.map((c) => c.slice()), { type: mime });
}

export async function blobToBase64Client(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function mimeForFormat(format: string): string {
  switch (format) {
    case "wav":
      return "audio/wav";
    case "pcm":
      return "audio/pcm";
    case "opus":
      return "audio/ogg";
    case "mp3":
    default:
      return "audio/mpeg";
  }
}

export function extForFormat(format: string): string {
  switch (format) {
    case "wav":
      return "wav";
    case "pcm":
      return "pcm";
    case "opus":
      return "opus";
    case "mp3":
    default:
      return "mp3";
  }
}
