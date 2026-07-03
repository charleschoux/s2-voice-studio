import type { TtsForm } from "./schemas";

export const DEFAULT_FORM: TtsForm = {
  text: "",
  model: "s2.1-pro-free",
  reference_id: "",
  temperature: 0.7,
  top_p: 0.7,
  prosody: {
    speed: 1,
    volume: 0,
    normalize_loudness: true,
  },
  chunk_length: 300,
  min_chunk_length: 50,
  normalize: true,
  format: "mp3",
  sample_rate: 44100,
  mp3_bitrate: 128,
  opus_bitrate: -1000,
  latency: "normal",
  max_new_tokens: 1024,
  repetition_penalty: 1.2,
  condition_on_previous_chunks: true,
  early_stop_threshold: 1,
};

/** Resolve a format-appropriate default sample rate. */
export function defaultSampleRateFor(format: string): number {
  switch (format) {
    case "wav":
    case "pcm":
      return 24000;
    case "opus":
      return 48000;
    case "mp3":
    default:
      return 44100;
  }
}
