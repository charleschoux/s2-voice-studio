import "server-only";

import { FISH_BASE_URL, DEFAULT_MODEL } from "./constants";

export function getApiKey(): string | null {
  const key = process.env.FISH_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

export function getBaseURL(): string {
  return (process.env.FISH_API_BASE?.trim() || FISH_BASE_URL).replace(/\/$/, "");
}

export function getDefaultModel(): string {
  return process.env.FISH_DEFAULT_MODEL?.trim() || DEFAULT_MODEL;
}

export interface FishRequestInit extends RequestInit {
  /** Optional `model` header value (required for TTS calls). */
  modelHeader?: string;
  /** Send Authorization header. Default true. */
  auth?: boolean;
}

export class FishApiError extends Error {
  status: number;
  raw?: unknown;
  constructor(status: number, message: string, raw?: unknown) {
    super(message);
    this.status = status;
    this.raw = raw;
    this.name = "FishApiError";
  }
}

/**
 * Forward a request to the Fish Audio API from the server, attaching the
 * Authorization header. Never exposes the key to the client. Returns the raw
 * Response so the caller can decide how to consume the body (JSON / blob /
 * streaming). Throws FishApiError on non-2xx.
 */
export async function fishFetch(
  path: string,
  init: FishRequestInit = {},
): Promise<Response> {
  const key = getApiKey();
  const base = getBaseURL();
  const headers = new Headers(init.headers);
  const needsAuth = init.auth !== false;

  if (needsAuth) {
    if (!key) {
      throw new FishApiError(401, "Missing FISH_API_KEY on the server.");
    }
    headers.set("Authorization", `Bearer ${key}`);
  }

  if (init.modelHeader) {
    headers.set("model", init.modelHeader);
  }

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let raw: unknown = undefined;
    let message = `Fish API ${res.status}`;
    try {
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        raw = await res.json();
        const r = raw as { status?: number; message?: string; error?: string };
        if (r && typeof r === "object") {
          message = r.message || r.error || message;
        }
      } else {
        const txt = await res.text();
        if (txt) {
          raw = txt;
          message = txt.slice(0, 500);
        }
      }
    } catch {
      /* ignore body parse error */
    }
    if (res.status === 401) message = `401: API key 无效或未授权 — ${message}`;
    else if (res.status === 402)
      message = `402: 余额不足或无权限调用该接口 — ${message}`;
    else if (res.status === 422) message = `422: 参数错误 — ${message}`;
    else if (res.status === 429) message = `429: 请求被限流，请稍后重试 — ${message}`;
    throw new FishApiError(res.status, message, raw);
  }

  return res;
}

export { FISH_BASE_URL };
