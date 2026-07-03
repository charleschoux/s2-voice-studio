import type { z } from "zod";

export interface FishApiError {
  status: number;
  message: string;
  raw?: unknown;
}

export interface ModelSample {
  title?: string;
  text?: string;
  task_id?: string;
  audio?: string; // audio id or url
  audio_id?: string;
}

export interface VoiceModel {
  _id: string;
  _group?: string;
  title: string;
  description?: string;
  type?: string;
  cover_image?: string;
  state?: string;
  task_count?: number;
  like_count?: number;
  score?: number;
  languages?: string[];
  visibility?: string;
  tags?: string[];
  samples?: ModelSample[];
  author?: string | { _id: string; nickname?: string; avatar?: string };
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface ModelListResponse {
  // Fish returns a list at top-level (array) — we normalize.
  items: VoiceModel[];
  total?: number;
  page_number?: number;
  page_size?: number;
}

export interface BatchTask {
  id: string;
  index: number;
  text: string;
  status: "pending" | "running" | "done" | "error" | "retry";
  attempts: number;
  error?: string;
  audioBlob?: Blob;
  audioUrl?: string;
  durationMs?: number;
  responseBytes?: number;
}

export interface BatchConfig {
  concurrency: number; // 1..5
  splitMode: "paragraph" | "chars" | "sentences";
  chunkSize: number;
  backoffBaseMs: number;
  maxRetries: number;
}

export type HistoryItem = z.infer<typeof import("./schemas").historyItemSchema>;
export type Preset = z.infer<typeof import("./schemas").presetSchema>;
export type Favorite = z.infer<typeof import("./schemas").favoriteSchema>;
export type TtsForm = z.infer<typeof import("./schemas").ttsFormSchema>;
export type TimestampEvent = z.infer<
  typeof import("./schemas").timestampEventSchema
>;

export interface AlignmentChar {
  char?: string;
  start?: number;
  end?: number;
}
export interface Alignment {
  duration?: number;
  chars?: AlignmentChar[];
  [k: string]: unknown;
}

export interface TimestampResult {
  audioChunks: Uint8Array[];
  mergedAudio?: Blob;
  content: string;
  alignment: Alignment | null;
  events: TimestampEvent[];
}
