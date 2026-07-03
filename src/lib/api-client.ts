"use client";

import type { VoiceModel, ModelListResponse } from "./types";
import type { TtsForm } from "./schemas";
import { pruneEmpty } from "./utils";

export interface ApiErrorPayload {
  status: number;
  message: string;
  raw?: unknown;
}

async function parseError(res: Response): Promise<ApiErrorPayload> {
  try {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const data = await res.json();
      return {
        status: data.status ?? res.status,
        message: data.message ?? `HTTP ${res.status}`,
        raw: data.raw ?? data,
      };
    }
    const txt = await res.text();
    return { status: res.status, message: txt || `HTTP ${res.status}` };
  } catch {
    return { status: res.status, message: `HTTP ${res.status}` };
  }
}

/** POST /api/fish/tts — returns an audio Blob. */
export async function requestTts(form: TtsForm): Promise<Blob> {
  const res = await fetch("/api/fish/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  if (!res.ok) throw await parseError(res);
  return res.blob();
}

/** Fetch models list. */
export async function fetchModels(
  params: Record<string, string | number | boolean | undefined>,
): Promise<ModelListResponse> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    qs.set(k, String(v));
  }
  const res = await fetch(`/api/fish/models?${qs.toString()}`, {
    method: "GET",
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function fetchModel(id: string): Promise<VoiceModel> {
  const res = await fetch(`/api/fish/models/${encodeURIComponent(id)}`);
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function patchModel(
  id: string,
  data: Record<string, unknown>,
): Promise<VoiceModel> {
  const res = await fetch(`/api/fish/models/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function deleteModel(id: string): Promise<void> {
  const res = await fetch(`/api/fish/models/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw await parseError(res);
}

export async function createModel(payload: {
  title: string;
  description?: string;
  visibility: "private" | "unlist" | "public";
  train_mode?: string;
  texts?: string[];
  tags?: string[];
  enhance_audio_quality?: boolean;
  generate_sample?: boolean;
  voices: { filename: string; mime: string; base64: string }[];
}): Promise<unknown> {
  const res = await fetch("/api/fish/models/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export interface InstantCloneRef {
  filename: string;
  mime: string;
  base64: string;
  text?: string;
  audio_format?: string;
  sample_rate?: number;
}

/** Instant clone via msgpack: returns audio Blob. */
export async function instantCloneTts(
  text: string,
  references: InstantCloneRef[],
  extra: Partial<TtsForm> = {},
): Promise<Blob> {
  const body = pruneEmpty({
    ...extra,
    text,
    references,
  });
  const res = await fetch("/api/fish/models/upload-msgpack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await parseError(res);
  return res.blob();
}

export async function voiceDesign(
  payload: Record<string, unknown>,
): Promise<unknown> {
  const res = await fetch("/api/fish/voice-design", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function asr(payload: {
  audio: { filename: string; mime: string; base64: string };
  language?: string;
  ignore_start_end?: boolean;
  use_itn?: boolean;
}): Promise<{ transcript?: string; text?: string; raw?: unknown }> {
  const res = await fetch("/api/fish/asr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function fetchHealth(): Promise<{
  ok: boolean;
  hasApiKey: boolean;
  defaultModel: string;
}> {
  const res = await fetch("/api/health");
  return res.json();
}

/** Build a cURL string approximating what the server sends upstream. Hides the key. */
export function buildUpstreamCurl(
  path: string,
  form: TtsForm,
  model: string,
): string {
  const { model: _m, _msgpack: _f, ...rest } = form as Record<string, unknown>;
  void _m;
  void _f;
  const body = pruneEmpty(rest);
  return [
    `curl -X POST 'https://api.fish.audio${path}'`,
    `  -H 'Authorization: Bearer $FISH_API_KEY'`,
    `  -H 'Content-Type: application/json'`,
    `  -H 'model: ${model}'`,
    `  -d '${JSON.stringify(body).replace(/'/g, "'\\''")}'`,
  ].join(" \\\n");
}
