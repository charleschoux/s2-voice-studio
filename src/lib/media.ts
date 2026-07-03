import "server-only";
import { encode as msgpackEncode } from "@msgpack/msgpack";

/**
 * Encode an object to MessagePack for the Fish Audio TTS endpoint when raw
 * binary audio references must be transmitted (JSON cannot carry raw bytes).
 */
export function encodeMsgpack(data: unknown): Uint8Array {
  return msgpackEncode(data);
}

/** Convert a File/Blob to base64 (without data: prefix). */
export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Decode a base64 string to Uint8Array. Server-side safe (Buffer). */
export function base64ToBytes(b64: string): Uint8Array {
  const cleaned = b64.replace(/\s+/g, "");
  const bin = Buffer.from(cleaned, "base64");
  return new Uint8Array(bin.buffer, bin.byteOffset, bin.byteLength);
}
