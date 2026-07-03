# S2 Voice Studio

本地优先的专业 WebUI，面向 Fish Audio `s2.1-pro-free` TTS。首屏就是可操作的 TTS 工作台，不做营销首页。所有 Fish Audio API 调用都经服务端 API route 代理，**API Key 永远不会暴露到浏览器**。

## 技术栈

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** 风格组件 + **lucide-react**
- **zod** 表单/请求校验，**@msgpack/msgpack** 处理二进制 TTS（即时克隆）
- **IndexedDB** (via `idb`) 保存历史、参数预设、收藏 voice id；**localStorage** 保存 UI 偏好
- **JSZip** 批量结果打包导出

## 安装

需要 Node.js ≥ 20 和 pnpm。

```bash
pnpm install
cp .env.example .env.local
# 编辑 .env.local，填入 FISH_API_KEY
```

`.env.local` 示例：

```env
FISH_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# 可选
# FISH_API_BASE=https://api.fish.audio
# FISH_DEFAULT_MODEL=s2.1-pro-free
```

## 启动

```bash
pnpm dev      # 开发模式 http://localhost:3000
pnpm build    # 生产构建
pnpm start    # 生产启动
pnpm lint     # ESLint
pnpm typecheck # tsc --noEmit
```

## 主要功能

### TTS 工作台
- **普通生成**：调用 `/api/fish/tts` → Fish `POST /v1/tts`，返回音频 blob。
- **HTTP 流式生成**：同一端点 chunked response，前端边接收边缓冲，完成后播放/下载。
- **带时间戳生成**：`/api/fish/tts-with-timestamp` → Fish `POST /v1/tts/stream/with-timestamp`，解析 SSE `data:` 事件。每个事件含 `audio_base64`、`content`、`alignment`、`chunk_seq`、`chunk_audio_offset_sec`。
  - **audio 按到达顺序拼接**；**alignment 按 `chunk_seq` 替换最新快照**（不重复 append）。
  - 生成时间轴表格，支持导出 **JSON / SRT / VTT**。
- **长文本批量**：按段落/句子/字符拆分，并发默认 1、最大 5；遇 429/5xx 指数退避；导出 zip 含音频、`metadata.json`、`payload.json`。

### 表单参数（全覆盖）
`text`、`reference_id`、`temperature`(0-1, 0.7)、`top_p`(0-1, 0.7)、`prosody.speed`(0.5-2, 1)、`prosody.volume`(-20~20 dB, 0)、`prosody.normalize_loudness`(true)、`chunk_length`(100-300, 300)、`min_chunk_length`(0-100, 50)、`normalize`(true)、`format`(mp3/wav/pcm/opus)、`sample_rate`(按格式限制)、`mp3_bitrate`(64/128/192)、`opus_bitrate`(-1000/24000/32000/48000/64000)、`latency`(normal/balanced/low)、`max_new_tokens`(1024)、`repetition_penalty`(1.2)、`condition_on_previous_chunks`(true)、`early_stop_threshold`(0-1, 1)。

> `model` 是 **header** 不是 body 字段。默认 `s2.1-pro-free`，高级设置可切 `s2.1-pro`/`s2-pro`/`s1`。请求前去掉 undefined/null/空字符串字段，但保留显式 `false`/`0`。

### 声音功能
- 声音选择区：默认声音、手动输入 `reference_id`、模型库搜索、我的声音、收藏列表。
- `GET /model` 支持 `page_size`/`page_number`/`title`/`tag`/`self`/`author_id`/`language`/`title_language`/`sort_by=score|task_count|created_at`。
- 模型卡：展示 `_id`/title/state/languages/visibility/tags/author/samples/task_count/like_count；支持复制 id、设为当前 voice、试听 sample。
- **持久克隆**：`POST /model` multipart/form-data（服务端组装 boundary），字段含 `type=tts`/`title`/`description`/`visibility`/`train_mode=fast`/`voices` 多文件/`texts`/`tags`/`enhance_audio_quality`(true)/`generate_sample`(false)。
- **模型管理**：`GET /model/{id}`、`PATCH`（title/description/visibility/tags/cover_image）、`DELETE`（**二次确认**）。
- **即时克隆**：上传 10–30 秒清晰参考音频 + 精确 transcript，通过 `references` 传给 TTS；JSON 不能传 raw binary，请求由服务端用 **MessagePack** 转发。

### 文本编辑器
- 情绪/语气标签插入器（S2 方括号）：`[happy] [sad] [angry] [excited] [whispering] [shouting] [laughing] [sighing] [gasping] [break] [long-break]`。
- 自然语言 bracket cue：`[whispers sweetly]`、`[laughing nervously]`。
- 中文音素模板：`<|phoneme_start|>gong1<|phoneme_end|>`（一字/一音节一个 tag）。
- 英文音素模板：CMU Arpabet，如 `<|phoneme_start|>EH1 N JH AH0 N IH1 R<|phoneme_end|>`。
- 多说话人：`<|speaker:0|>` / `<|speaker:1|>` + reference_id 数组（UI 提示多说话人主要面向 `s2-pro`，对 `s2.1-pro-free` 需实测）。
- 显示 UTF-8 byte 估算（计费按 M UTF-8 bytes；`s2.1-pro-free` 显示 $0/M bytes 但带 fair-use 提示）。

### 输出与历史
- 每次生成保存：文本、参数、voice id、模型 header、耗时、响应大小、音频 blob/url、错误、时间戳 alignment。
- 播放器：播放/暂停/进度条/下载/重新生成/复制请求 JSON/复制 cURL。
- 错误处理：401/402/422/429，优先展示 Fish 返回的 `{status,message}`。

### 预设（内置）
旁白、客服、播客、低延迟对话、有声书、中文纠音、英文品牌名纠音；可另存自定义预设到 IndexedDB。

### 可选 Tab
- **Voice Design**：`POST /v1/voice-design`，header `model: voice-design-1`；字段 `instruction`(1-2000)/`reference_text`(≤150)/`language`/`n`(1-4)/`speed`(0-3)/`num_step`(1-128)/`guidance_scale`/`instruct_guidance_scale`/`seed`；返回候选 `audio_base64`。**独立计费，非免费 TTS**。
- **ASR**：`POST /v1/asr` 上传音频获取 transcript，用于声音克隆文本。**独立计费**。

## Mock 模式

未配置 `FISH_API_KEY` 时 UI 仍可打开，显示配置提示，Mock 模式可演示表单、历史、批量、时间轴等流程（生成静音占位音频）。右上角开关可手动切换 Mock。配置 Key 并重启 dev server 后即可真实调用。

## 安全说明

- `FISH_API_KEY` 仅在服务端 (`process.env.FISH_API_KEY`) 读取，所有 Fish 调用走 `/api/fish/*` API route 代理。
- 前端代码**绝不含** API Key；`next.config.mjs` 未开启任何会把 env 暴露给 client 的配置。
- cURL 复制使用 `$FISH_API_KEY` 占位符，不会泄露真实 Key。

## 验收

```bash
pnpm lint && pnpm typecheck && pnpm build
```

均需通过。有 `FISH_API_KEY` 时，工作台输入短文本生成 mp3 可在浏览器播放/下载。

## Fish Audio 官方文档

- 模型概览：https://docs.fish.audio/developer-guide/models-pricing/models-overview
- 能力总览：https://docs.fish.audio/overview/capabilities
- OpenAPI：https://api.fish.audio/openapi.json
- TTS：https://docs.fish.audio/developer-guide/api-reference/tts
- Voice Model：https://docs.fish.audio/developer-guide/api-reference/model
- Voice Design：https://docs.fish.audio/developer-guide/api-reference/voice-design
- ASR：https://docs.fish.audio/developer-guide/api-reference/asr

## 目录结构

```
src/
  app/
    api/fish/{tts,tts-with-timestamp,asr,voice-design,models,models/[id],models/create,models/upload-msgpack}/route.ts
    api/health/route.ts
    app/globals.css, layout.tsx, page.tsx
  components/
    ui/                 # shadcn 风格原语
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

## 关于 S2.1-Pro-Free

`s2.1-pro-free` 是 S2.1-Pro 同模型的免费开发层，公平使用，无硬性字符上限，但**无 TTFA/DPA/SLA 保证**。UI 不承诺生产 SLA。
