import type { z } from "zod";
import type { presetParamsSchema } from "./schemas";

export const FISH_BASE_URL = "https://api.fish.audio";
export const DEFAULT_MODEL = "s2.1-pro-free";
export const VOICE_DESIGN_MODEL = "voice-design-1";

export const TTS_MODELS = [
  {
    id: "s2.1-pro-free",
    label: "S2.1-Pro Free",
    description:
      "S2.1-Pro 同模型免费开发层，公平使用，无硬性字符上限，但无 TTFA/DPA/SLA 保证。",
    free: true,
    recommended: true,
  },
  {
    id: "s2.1-pro",
    label: "S2.1-Pro",
    description: "付费生产级 S2.1-Pro。",
    free: false,
    recommended: false,
  },
  {
    id: "s2-pro",
    label: "S2-Pro",
    description: "多说话人友好，OpenAPI schema 标注多说话人主要面向该模型。",
    free: false,
    recommended: false,
  },
  {
    id: "s1",
    label: "S1",
    description: "上一代主力模型。",
    free: false,
    recommended: false,
  },
] as const;

export const AUDIO_FORMATS = ["mp3", "wav", "pcm", "opus"] as const;

export const SAMPLE_RATES_BY_FORMAT: Record<string, number[]> = {
  wav: [8000, 16000, 24000, 32000, 44100],
  pcm: [8000, 16000, 24000, 32000, 44100],
  mp3: [32000, 44100],
  opus: [48000],
};

export const MP3_BITRATES = [64, 128, 192] as const;
export const OPUS_BITRATES = [-1000, 24000, 32000, 48000, 64000] as const;
export const LATENCY_MODES = ["normal", "balanced", "low"] as const;

// S2 emotion / tone bracket cues.
export const EMOTION_TAGS: { label: string; insert: string; hint?: string }[] = [
  { label: "Happy", insert: "[happy]" },
  { label: "Sad", insert: "[sad]" },
  { label: "Angry", insert: "[angry]" },
  { label: "Excited", insert: "[excited]" },
  { label: "Whispering", insert: "[whispering]" },
  { label: "Shouting", insert: "[shouting]" },
  { label: "Laughing", insert: "[laughing]" },
  { label: "Sighing", insert: "[sighing]" },
  { label: "Gasping", insert: "[gasping]" },
  { label: "Break", insert: "[break]", hint: "短停顿" },
  { label: "Long Break", insert: "[long-break]", hint: "长停顿" },
];

export const NATURAL_CUE_EXAMPLES = [
  "[whispers sweetly]",
  "[laughing nervously]",
  "[shouts angrily]",
  "[sighs deeply]",
];

// Chinese phoneme template (pinyin with tone numbers), one tag per char/syllable.
export const CN_PHONEME_TEMPLATE = "<|phoneme_start|>gong1<|phoneme_end|>";
// English CMU Arpabet phoneme template.
export const EN_PHONEME_TEMPLATE =
  "<|phoneme_start|>EH1 N JH AH0 N IH1 R<|phoneme_end|>";

export const SPEAKER_TAG_PREFIX = "<|speaker:";

// Default voice ids shipped by Fish Audio (commonly available).
export const DEFAULT_VOICES: {
  id: string;
  title: string;
  lang: string;
}[] = [
  { id: "alex-eyzo-2jvb4", title: "Alex (EN)", lang: "en" },
  { id: "anna-wt0f0r", title: "Anna (EN)", lang: "en" },
  { id: "bella-qeqhmj", title: "Bella (EN)", lang: "en" },
  { id: "benjamin-tzfplp", title: "Benjamin (EN)", lang: "en" },
  { id: "claire-zqs4zr", title: "Claire (EN)", lang: "en" },
  { id: "david-qqs4zr", title: "David (EN)", lang: "en" },
  { id: "ella-fqrgrq", title: "Ella (EN)", lang: "en" },
  { id: "fernando-qrgrq", title: "Fernando (ES)", lang: "es" },
  { id: "gao-q4k0f0", title: "Gao (ZH)", lang: "zh" },
  { id: "helen-3vqs4z", title: "Helen (EN)", lang: "en" },
  { id: "lili-qeqhmj", title: "Lili (ZH)", lang: "zh" },
  { id: "maria-3vqs4z", title: "Maria (ES)", lang: "es" },
  { id: "max-3vqs4z", title: "Max (EN)", lang: "en" },
  { id: "nina-3vqs4z", title: "Nina (EN)", lang: "en" },
  { id: "olivia-3vqs4z", title: "Olivia (EN)", lang: "en" },
  { id: "paul-3vqs4z", title: "Paul (EN)", lang: "en" },
  { id: "rita-3vqs4z", title: "Rita (EN)", lang: "en" },
  { id: "sam-3vqs4z", title: "Sam (EN)", lang: "en" },
  { id: "tara-3vqs4z", title: "Tara (EN)", lang: "en" },
  { id: "wei-3vqs4z", title: "Wei (ZH)", lang: "zh" },
];

export const PRESETS: {
  id: string;
  name: string;
  description: string;
  params: z.input<typeof presetParamsSchema>;
}[] = [
  {
    id: "narration",
    name: "旁白 / Documentary",
    description: "稳重、平铺直叙的旁白。",
    params: {
      temperature: 0.6,
      top_p: 0.7,
      prosody: { speed: 0.95, volume: 0, normalize_loudness: true },
      chunk_length: 300,
      normalize: true,
      latency: "normal",
      max_new_tokens: 1024,
      repetition_penalty: 1.2,
      format: "mp3",
      mp3_bitrate: 192,
    },
  },
  {
    id: "customer-service",
    name: "客服 / Customer Service",
    description: "亲切、清晰、略快。",
    params: {
      temperature: 0.5,
      top_p: 0.7,
      prosody: { speed: 1.05, volume: 0, normalize_loudness: true },
      chunk_length: 200,
      normalize: true,
      latency: "normal",
      max_new_tokens: 1024,
      repetition_penalty: 1.2,
      format: "mp3",
      mp3_bitrate: 128,
    },
  },
  {
    id: "podcast",
    name: "播客 / Podcast",
    description: "自然、有起伏的对话感。",
    params: {
      temperature: 0.8,
      top_p: 0.8,
      prosody: { speed: 1.0, volume: 0, normalize_loudness: true },
      chunk_length: 300,
      normalize: true,
      latency: "normal",
      max_new_tokens: 1024,
      repetition_penalty: 1.1,
      format: "mp3",
      mp3_bitrate: 192,
    },
  },
  {
    id: "low-latency",
    name: "实时对话 / Low Latency",
    description: "balanced 延迟，适合对话。",
    params: {
      temperature: 0.7,
      top_p: 0.7,
      prosody: { speed: 1.0, volume: 0, normalize_loudness: true },
      chunk_length: 120,
      min_chunk_length: 30,
      normalize: true,
      latency: "balanced",
      max_new_tokens: 1024,
      repetition_penalty: 1.2,
      format: "pcm",
      sample_rate: 24000,
    },
  },
  {
    id: "audiobook",
    name: "有声书 / Audiobook",
    description: "高码率 mp3，长文本稳定。",
    params: {
      temperature: 0.75,
      top_p: 0.75,
      prosody: { speed: 0.98, volume: 0, normalize_loudness: true },
      chunk_length: 300,
      normalize: true,
      latency: "normal",
      max_new_tokens: 1200,
      repetition_penalty: 1.2,
      format: "mp3",
      mp3_bitrate: 192,
    },
  },
  {
    id: "cn-correction",
    name: "中文纠音 / CN Phoneme",
    description: "中文音素模板，normalize 关闭以保留音素。",
    params: {
      temperature: 0.7,
      top_p: 0.7,
      prosody: { speed: 1.0, volume: 0, normalize_loudness: true },
      chunk_length: 200,
      normalize: false,
      latency: "normal",
      max_new_tokens: 1024,
      repetition_penalty: 1.2,
      format: "mp3",
      mp3_bitrate: 128,
    },
  },
  {
    id: "en-brandname",
    name: "英文品牌名纠音 / EN Phoneme",
    description: "CMU Arpabet 音素模板，normalize 关闭。",
    params: {
      temperature: 0.7,
      top_p: 0.7,
      prosody: { speed: 1.0, volume: 0, normalize_loudness: true },
      chunk_length: 200,
      normalize: false,
      latency: "normal",
      max_new_tokens: 1024,
      repetition_penalty: 1.2,
      format: "mp3",
      mp3_bitrate: 128,
    },
  },
];

export const SORT_OPTIONS = [
  { value: "score", label: "Score" },
  { value: "task_count", label: "Task Count" },
  { value: "created_at", label: "Created At" },
] as const;

export const MODEL_VISIBILITY = ["private", "unlist", "public"] as const;
export const MODEL_TRAIN_MODE = ["fast"] as const;

export const MAX_BATCH_CONCURRENCY = 5;

export const FISH_DOCS_LINKS = {
  modelsOverview: "https://docs.fish.audio/developer-guide/models-pricing/models-overview",
  capabilities: "https://docs.fish.audio/overview/capabilities",
  openapi: "https://api.fish.audio/openapi.json",
  tts: "https://docs.fish.audio/developer-guide/api-reference/tts",
  voiceModel: "https://docs.fish.audio/developer-guide/api-reference/model",
  voiceDesign: "https://docs.fish.audio/developer-guide/api-reference/voice-design",
  asr: "https://docs.fish.audio/developer-guide/api-reference/asr",
} as const;
