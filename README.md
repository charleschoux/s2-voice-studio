# S2 Voice Studio

English | [简体中文](README-zh.md)

A local-first professional WebUI for Fish Audio `s2.1-pro-free` TTS. The first screen is an actionable TTS workbench, not a marketing landing page. All Fish Audio API calls are proxied through server API routes, so the **API key is never exposed to the browser**.

## Tech Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui-style** components + **lucide-react**
- **zod** for form/request validation, **@msgpack/msgpack** for binary TTS payloads used by instant cloning
- **IndexedDB** (via `idb`) for history, parameter presets, and favorite voice IDs; **localStorage** for UI preferences
- **JSZip** for exporting batch results

## Installation

Requires Node.js ≥ 20 and pnpm.

```bash
pnpm install
cp .env.example .env.local
# Edit .env.local and set FISH_API_KEY
```

Example `.env.local`:

```env
FISH_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Optional
# FISH_API_BASE=https://api.fish.audio
# FISH_DEFAULT_MODEL=s2.1-pro-free
```

## Run

```bash
pnpm dev       # Development server: http://localhost:3000
pnpm build     # Production build
pnpm start     # Start production server
pnpm lint      # ESLint
pnpm typecheck # tsc --noEmit
```

## Features

### TTS Workbench

- **Standard generation**: calls `/api/fish/tts` → Fish `POST /v1/tts`, returns an audio blob.
- **HTTP streaming generation**: uses the same endpoint with a chunked response; the browser buffers chunks as they arrive, then plays/downloads the final audio.
- **Timestamp generation**: `/api/fish/tts-with-timestamp` → Fish `POST /v1/tts/stream/with-timestamp`, parses SSE `data:` events. Each event may include `audio_base64`, `content`, `alignment`, `chunk_seq`, and `chunk_audio_offset_sec`.
  - **Audio is concatenated in arrival order**; **alignment snapshots are replaced by `chunk_seq`** instead of appended repeatedly.
  - Generates a timeline table and supports **JSON / SRT / VTT** export.
- **Long-text batching**: split by paragraph/sentence/character count; default concurrency is 1 and max is 5; exponential backoff for 429/5xx; zip export includes audio files, `metadata.json`, and `payload.json`.

### Full TTS Parameter Coverage

`text`, `reference_id`, `temperature`(0-1, 0.7), `top_p`(0-1, 0.7), `prosody.speed`(0.5-2, 1), `prosody.volume`(-20~20 dB, 0), `prosody.normalize_loudness`(true), `chunk_length`(100-300, 300), `min_chunk_length`(0-100, 50), `normalize`(true), `format`(mp3/wav/pcm/opus), `sample_rate`(format-limited), `mp3_bitrate`(64/128/192), `opus_bitrate`(-1000/24000/32000/48000/64000), `latency`(normal/balanced/low), `max_new_tokens`(1024), `repetition_penalty`(1.2), `condition_on_previous_chunks`(true), and `early_stop_threshold`(0-1, 1).

> `model` is a **header**, not a body field. The default is `s2.1-pro-free`; advanced settings can switch to `s2.1-pro`, `s2-pro`, or `s1`. Before requests are sent, undefined/null/empty-string fields are removed while explicit `false` and `0` values are preserved.

### Voice Features

- Voice picker: default voices, manual `reference_id`, model library search, own voices, and favorites.
- `GET /model` supports `page_size`/`page_number`/`title`/`tag`/`self`/`author_id`/`language`/`title_language`/`sort_by=score|task_count|created_at`.
- Model cards display `_id`/title/state/languages/visibility/tags/author/samples/task_count/like_count and support copying IDs, setting the current voice, and previewing samples.
- **Persistent cloning**: `POST /model` multipart/form-data assembled on the server. Fields include `type=tts`/`title`/`description`/`visibility`/`train_mode=fast`/multiple `voices` files/`texts`/`tags`/`enhance_audio_quality`(true)/`generate_sample`(false).
- **Model management**: `GET /model/{id}`, `PATCH` (title/description/visibility/tags/cover_image), and `DELETE` with a second confirmation.
- **Instant cloning**: upload a clear 10–30 second reference audio file plus an accurate transcript, then pass `references` into TTS. JSON cannot carry raw binary, so the server forwards the request using **MessagePack**.

### Text Editor

- Emotion/tone tag inserter for S2 bracket tags: `[happy] [sad] [angry] [excited] [whispering] [shouting] [laughing] [sighing] [gasping] [break] [long-break]`.
- Natural-language bracket cues: `[whispers sweetly]`, `[laughing nervously]`.
- Chinese phoneme template: `<|phoneme_start|>gong1<|phoneme_end|>` (one tag per character/syllable).
- English phoneme template: CMU Arpabet, such as `<|phoneme_start|>EH1 N JH AH0 N IH1 R<|phoneme_end|>`.
- Multi-speaker tags: `<|speaker:0|>` / `<|speaker:1|>` + a `reference_id` array. The UI notes that multi-speaker usage is mainly intended for `s2-pro` and should be tested with `s2.1-pro-free`.
- Shows estimated UTF-8 bytes for billing. `s2.1-pro-free` is displayed as $0/M bytes with a fair-use note.

### Output and History

- Each generation saves text, parameters, voice ID, model header, duration, response size, audio blob/url, errors, and timestamp alignment.
- Player: play/pause/progress/download/regenerate/copy request JSON/copy cURL.
- Error handling: 401/402/422/429, prioritizing Fish responses shaped like `{status,message}`.

### Built-in Presets

Narration, customer support, podcast, low-latency conversation, audiobook, Chinese pronunciation correction, and English brand-name pronunciation correction. Custom presets can be saved to IndexedDB.

### Optional Tabs

- **Voice Design**: `POST /v1/voice-design`, header `model: voice-design-1`; fields include `instruction`(1-2000), `reference_text`(≤150), `language`, `n`(1-4), `speed`(0-3), `num_step`(1-128), `guidance_scale`, `instruct_guidance_scale`, and `seed`; returns candidate `audio_base64`. **Separately billed, not free TTS**.
- **ASR**: `POST /v1/asr` uploads audio and returns a transcript for voice cloning. **Separately billed**.

## Mock Mode

If `FISH_API_KEY` is not configured, the UI still opens and shows a configuration notice. Mock mode can demonstrate forms, history, batching, timelines, and related flows using silent placeholder audio. The top-right switch can manually toggle Mock mode. After setting the key and restarting the dev server, real API calls are enabled.

## Security Notes

- `FISH_API_KEY` is read only on the server (`process.env.FISH_API_KEY`), and all Fish calls go through `/api/fish/*` API route proxies.
- Client code **never includes** the API key; `next.config.mjs` does not expose env variables to the client.
- Copied cURL commands use a `$FISH_API_KEY` placeholder and do not leak the real key.

## Verification

```bash
pnpm lint && pnpm typecheck && pnpm build
```

All checks should pass. With `FISH_API_KEY` configured, entering short text in the workbench should generate an MP3 that can be played and downloaded in the browser.

## Fish Audio Official Docs

- Models overview: https://docs.fish.audio/developer-guide/models-pricing/models-overview
- Capabilities overview: https://docs.fish.audio/overview/capabilities
- OpenAPI: https://api.fish.audio/openapi.json
- TTS: https://docs.fish.audio/developer-guide/api-reference/tts
- Voice Model: https://docs.fish.audio/developer-guide/api-reference/model
- Voice Design: https://docs.fish.audio/developer-guide/api-reference/voice-design
- ASR: https://docs.fish.audio/developer-guide/api-reference/asr

## Project Structure

```text
src/
  app/
    api/fish/{tts,tts-with-timestamp,asr,voice-design,models,models/[id],models/create,models/upload-msgpack}/route.ts
    api/health/route.ts
    app/globals.css, layout.tsx, page.tsx
  components/
    ui/                 # shadcn-style primitives
    site-header.tsx, voice-studio.tsx, tts-workbench.tsx,
    voice-picker.tsx, text-editor.tsx, tts-advanced-settings.tsx,
    audio-player.tsx, preset-picker.tsx, history-panel.tsx,
    timestamp-panel.tsx, batch-panel.tsx,
    voice-management-panel.tsx, voice-design-panel.tsx, asr-panel.tsx
  lib/
    constants.ts, schemas.ts, types.ts, utils.ts,
    server-config.ts, media.ts, client-media.ts,
    db.ts, use-app-store.tsx, use-health.ts, use-local-state.ts,
    api-client.ts, timestamp.ts, batch.ts, form-defaults.ts
```

## About S2.1-Pro-Free

`s2.1-pro-free` is a free development tier of the same S2.1-Pro model. It is fair-use based and has no hard character limit, but it provides **no TTFA/DPA/SLA guarantees**. This UI does not promise production SLA.
