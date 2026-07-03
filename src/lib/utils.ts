import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(2)}s`;
  const m = Math.floor(s / 60);
  const rest = s - m * 60;
  return `${m}m ${rest.toFixed(1)}s`;
}

/** UTF-8 byte length of a string (Fish bills per million UTF-8 bytes). */
export function utf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function formatUtf8Bytes(text: string): string {
  return `${formatBytes(utf8ByteLength(text), 1)} UTF-8`;
}

/** Estimate audio duration in seconds from PCM-style byte length and format. */
export function estimateAudioSeconds(bytes: number, format: string, sampleRate = 24000): number {
  if (!bytes) return 0;
  switch (format) {
    case "pcm":
      // 16-bit mono PCM: 2 bytes per sample.
      return bytes / 2 / sampleRate;
    case "wav":
      // RIFF header is 44 bytes; assume 16-bit mono after that.
      return Math.max(0, (bytes - 44) / 2 / sampleRate);
    case "mp3":
    case "opus":
    default:
      // Rough 1 Mbps-ish assumption; only used as a fallback hint.
      return bytes / 16000;
  }
}

export function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error("Clipboard API unavailable"));
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text: string, filename: string, mime = "text/plain"): void {
  downloadBlob(new Blob([text], { type: `${mime};charset=utf-8` }), filename);
}

export function toCurl(url: string, init: RequestInit): string {
  const headers = (init.headers as Record<string, string>) ?? {};
  const lines = [`curl -X ${init.method ?? "GET"} '${url}'`];
  for (const [k, v] of Object.entries(headers)) {
    lines.push(`  -H '${k}: ${v.replace(/'/g, "'\\''")}'`);
  }
  if (init.body) {
    const body =
      typeof init.body === "string" ? init.body : JSON.stringify(init.body);
    lines.push(`  -d '${body.replace(/'/g, "'\\''")}'`);
  }
  return lines.join(" \\\n");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9一-鿿]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "audio";
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** Remove undefined/null/empty-string keys but keep explicit false and 0. */
export function pruneEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as Partial<T>;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function secToTimestamp(sec: number, withHours = false): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const ms = Math.round((sec % 1) * 1000);
  const total = Math.floor(sec);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  if (withHours || h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
  }
  return `${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}
