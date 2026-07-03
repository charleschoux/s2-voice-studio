import { z } from "zod";

// ---------------- TTS ----------------

export const audioFormatSchema = z.enum(["mp3", "wav", "pcm", "opus"]);
export const latencySchema = z.enum(["normal", "balanced", "low"]);

export const prosodySchema = z.object({
  speed: z.number().min(0.5).max(2).default(1).optional(),
  volume: z.number().min(-20).max(20).default(0).optional(),
  normalize_loudness: z.boolean().default(true).optional(),
});

export const ttsCoreSchema = z.object({
  text: z.string().min(1, "text is required"),
  reference_id: z.string().optional(),
  // Advanced multi-speaker: array of reference_ids (s2-pro oriented; s2.1-pro-free needs real testing).
  references: z
    .array(
      z.object({
        audio: z.string().optional(), // base64 raw audio bytes
        text: z.string().optional(),
        audio_format: z.string().optional(),
        sample_rate: z.number().optional(),
      }),
    )
    .optional(),
  temperature: z.number().min(0).max(1).optional(),
  top_p: z.number().min(0).max(1).optional(),
  prosody: prosodySchema.optional(),
  chunk_length: z.number().int().min(100).max(300).optional(),
  min_chunk_length: z.number().int().min(0).max(100).optional(),
  normalize: z.boolean().optional(),
  format: audioFormatSchema.default("mp3"),
  sample_rate: z.number().int().optional(),
  mp3_bitrate: z.union([z.literal(64), z.literal(128), z.literal(192)]).optional(),
  opus_bitrate: z
    .union([
      z.literal(-1000),
      z.literal(24000),
      z.literal(32000),
      z.literal(48000),
      z.literal(64000),
    ])
    .optional(),
  latency: latencySchema.optional(),
  max_new_tokens: z.number().int().min(1).max(2048).optional(),
  repetition_penalty: z.number().min(0.5).max(3).optional(),
  condition_on_previous_chunks: z.boolean().optional(),
  early_stop_threshold: z.number().min(0).max(1).optional(),
});

// Full form schema (text + core params + model header selection).
// `_msgpack` is an internal flag telling the server to re-encode as MessagePack
// (used by instant clone via /api/fish/models/upload-msgpack); never sent upstream.
export const ttsFormSchema = ttsCoreSchema.extend({
  model: z.string().default("s2.1-pro-free"),
  _msgpack: z.boolean().optional(),
});
export type TtsForm = z.infer<typeof ttsFormSchema>;
export type TtsCore = z.infer<typeof ttsCoreSchema>;

/** Preset params: everything in the core TTS form except `text` (and reference_id). */
export const presetParamsSchema = ttsCoreSchema.omit({ text: true });
export type PresetParams = z.infer<typeof presetParamsSchema>;

// ---------------- Model query (GET /model) ----------------

export const modelQuerySchema = z.object({
  page_size: z.number().int().min(1).max(100).optional(),
  page_number: z.number().int().min(1).optional(),
  title: z.string().optional(),
  tag: z.string().optional(),
  self: z.boolean().optional(),
  author_id: z.string().optional(),
  language: z.string().optional(),
  title_language: z.string().optional(),
  sort_by: z.enum(["score", "task_count", "created_at"]).optional(),
});
export type ModelQuery = z.infer<typeof modelQuerySchema>;

// ---------------- Model mutation ----------------

export const modelVisibilitySchema = z.enum(["private", "unlist", "public"]);

export const modelCreateSchema = z.object({
  type: z.literal("tts").default("tts"),
  title: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  visibility: modelVisibilitySchema.default("private"),
  train_mode: z.literal("fast").default("fast"),
  texts: z.array(z.string()).optional(),
  tags: z.array(z.string()).max(20).optional(),
  enhance_audio_quality: z.boolean().default(true),
  generate_sample: z.boolean().default(false),
});
export type ModelCreate = z.infer<typeof modelCreateSchema>;

export const modelPatchSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional(),
  visibility: modelVisibilitySchema.optional(),
  tags: z.array(z.string()).max(20).optional(),
  cover_image: z.string().optional(), // base64
});
export type ModelPatch = z.infer<typeof modelPatchSchema>;

// ---------------- Voice Design ----------------

export const voiceDesignSchema = z.object({
  instruction: z.string().min(1).max(2000),
  reference_text: z.string().max(150).optional(),
  language: z.string().optional(),
  n: z.number().int().min(1).max(4).default(1),
  speed: z.number().min(0).max(3).optional(),
  num_step: z.number().int().min(1).max(128).optional(),
  guidance_scale: z.number().optional(),
  instruct_guidance_scale: z.number().optional(),
  seed: z.number().int().optional(),
});
export type VoiceDesign = z.infer<typeof voiceDesignSchema>;

// ---------------- ASR ----------------

export const asrSchema = z.object({
  language: z.string().optional(),
  ignore_start_end: z.boolean().optional(),
  use_itn: z.boolean().optional(),
  // audio file handled separately as binary.
});
export type AsrOptions = z.infer<typeof asrSchema>;

// ---------------- Timestamp SSE ----------------

export const timestampEventSchema = z.object({
  audio_base64: z.string().optional(),
  content: z.string().optional(),
  alignment: z
    .object({
      duration: z.number().optional(),
      // Fish returns char-level alignment tokens.
      chars: z
        .array(
          z.object({
            char: z.string().optional(),
            start: z.number().optional(),
            end: z.number().optional(),
          }),
        )
        .optional(),
    })
    .passthrough()
    .optional(),
  chunk_seq: z.number().optional(),
  chunk_audio_offset_sec: z.number().optional(),
});
export type TimestampEvent = z.infer<typeof timestampEventSchema>;

// ---------------- Local storage: history / preset / favorite ----------------

export const historyItemSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  text: z.string(),
  voiceId: z.string().optional(),
  model: z.string(),
  format: z.string(),
  params: z.record(z.any()),
  durationMs: z.number().optional(),
  responseBytes: z.number().optional(),
  audioBlobKey: z.string().optional(), // IndexedDB audio store key
  audioUrl: z.string().optional(),
  error: z.string().optional(),
  alignment: z.any().optional(),
  mode: z.enum(["normal", "stream", "timestamp", "batch", "mock"]),
  mock: z.boolean().default(false),
});
export type HistoryItem = z.infer<typeof historyItemSchema>;

export const presetSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  params: presetParamsSchema,
  createdAt: z.string(),
  builtin: z.boolean().default(false),
});
export type Preset = z.infer<typeof presetSchema>;

export const favoriteSchema = z.object({
  id: z.string(), // reference_id (model id)
  title: z.string().optional(),
  addedAt: z.string(),
  note: z.string().optional(),
});
export type Favorite = z.infer<typeof favoriteSchema>;
