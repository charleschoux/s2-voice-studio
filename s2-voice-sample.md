# S2 Voice Studio · 7 个内置预设示例音频

以下 7 段示例均通过本工作台的服务端代理 `/api/fish/tts` 真实调用 Fish Audio `s2.1-pro-free` 生成。每段给出：**预设 → 声音 (reference_id) → 文本 → 完整参数**，可直接在工作台「普通」生成模式复刻。

> 通用规则：`model` 固定为 `s2.1-pro-free`（header）；`reference_id` 在「声音选择 → 手动」中粘贴；其余参数在「高级设置」中按表填入，或在「应用预设」下拉里选择对应内置预设后再微调。
>
> 声音来自 Fish Audio 公开模型库（`GET /model`，按 score 排序筛选），均为公开可见 (`public`) 声音，仅用于演示。

---

## 1. 旁白 / Documentary

- **预设**：旁白 / Documentary（内置）
- **声音**：央视配音 `59cb5986671546eaa6ca8ae6f29f6d22`（zh · male · documentary narration）
- **文本**：
  > 在广袤无垠的宇宙中，地球如同一粒微尘，悬浮在阳光之下。而我们每一个人，都是这粒微尘上短暂而璀璨的光。
- **参数**：

| 参数 | 值 |
| --- | --- |
| format | mp3 |
| sample_rate | 44100 |
| mp3_bitrate | 192 |
| latency | normal |
| temperature | 0.6 |
| top_p | 0.7 |
| prosody.speed | 0.95 |
| prosody.volume | 0 |
| prosody.normalize_loudness | true |
| chunk_length | 300 |
| normalize | true |
| max_new_tokens | 1024 |
| repetition_penalty | 1.2 |
| condition_on_previous_chunks | true |
| early_stop_threshold | 1 |

**输出**：`01-narration.mp3` · 192 kbps · 约 10.8s

---

## 2. 客服 / Customer Service

- **预设**：客服 / Customer Service（内置）
- **声音**：陶衿 `b7f6ea6bf21246de894f6b9b499add43`（zh · female · calm professional）
- **文本**：
  > 您好，感谢致电客户服务中心。请问有什么可以帮您？请提供您的订单号，我将为您尽快查询处理进度。
- **参数**：

| 参数 | 值 |
| --- | --- |
| format | mp3 |
| sample_rate | 44100 |
| mp3_bitrate | 128 |
| latency | normal |
| temperature | 0.5 |
| top_p | 0.7 |
| prosody.speed | 1.05 |
| prosody.volume | 0 |
| prosody.normalize_loudness | true |
| chunk_length | 200 |
| normalize | true |
| max_new_tokens | 1024 |
| repetition_penalty | 1.2 |
| condition_on_previous_chunks | true |
| early_stop_threshold | 1 |

**输出**：`02-customer-service.mp3` · 128 kbps · 约 7.4s

---

## 3. 播客 / Podcast

- **预设**：播客 / Podcast（内置）
- **声音**：影视解说 `b4bdf5dc66004241a21ff2df165bf442`（zh · male · conversational expressive）
- **文本**：
  > 大家好，欢迎收听本期播客。今天我们要聊的话题，是如何在信息洪流中保持专注，以及那些被我们忽略的小确幸。
- **参数**：

| 参数 | 值 |
| --- | --- |
| format | mp3 |
| sample_rate | 44100 |
| mp3_bitrate | 192 |
| latency | normal |
| temperature | 0.8 |
| top_p | 0.8 |
| prosody.speed | 1.0 |
| prosody.volume | 0 |
| prosody.normalize_loudness | true |
| chunk_length | 300 |
| normalize | true |
| max_new_tokens | 1024 |
| repetition_penalty | 1.1 |
| condition_on_previous_chunks | true |
| early_stop_threshold | 1 |

**输出**：`03-podcast.mp3` · 192 kbps · 约 8.2s

---

## 4. 实时对话 / Low Latency

- **预设**：低延迟对话 / Low Latency（内置）
- **声音**：丁真 `54a5170264694bfc8e9ad98df7bd89c3`（zh · male · young calm gentle friendly）
- **文本**：
  > 嗨，刚才说到哪儿了？对，那件事后来又有新进展了，我跟你说，真的挺离谱的。
- **参数**：

| 参数 | 值 |
| --- | --- |
| format | pcm |
| sample_rate | 24000 |
| latency | balanced |
| temperature | 0.7 |
| top_p | 0.7 |
| prosody.speed | 1.0 |
| prosody.volume | 0 |
| prosody.normalize_loudness | true |
| chunk_length | 120 |
| min_chunk_length | 30 |
| normalize | true |
| max_new_tokens | 1024 |
| repetition_penalty | 1.2 |
| condition_on_previous_chunks | true |
| early_stop_threshold | 1 |

**输出**：`04-low-latency.pcm` · raw 24 kHz mono s16le · 约 8.1s（浏览器播放需用 wav 封装，工作台会直接播放 pcm）

> 注：低延迟预设使用 `latency=balanced` + `format=pcm` + 较小 `chunk_length`，适合对话场景；浏览器原生 `<audio>` 不直接播 raw PCM，工作台对 pcm 输出会做兼容提示，建议切到 `wav` 或 `mp3` 复刻以直接试听。

---

## 5. 有声书 / Audiobook

- **预设**：有声书 / Audiobook（内置）
- **声音**：仿真人（故事男声）`6fc59d2b56cf402eb572934114c8d8aa`（zh · male · narration storytelling）
- **文本**（《百年孤独》开篇）：
  > 《百年孤独》开篇写道：多年以后，面对行刑队，奥雷里亚诺·布恩迪亚上校将会回想起，父亲带他去见识冰块的那个遥远的下午。
- **参数**：

| 参数 | 值 |
| --- | --- |
| format | mp3 |
| sample_rate | 44100 |
| mp3_bitrate | 192 |
| latency | normal |
| temperature | 0.75 |
| top_p | 0.75 |
| prosody.speed | 0.98 |
| prosody.volume | 0 |
| prosody.normalize_loudness | true |
| chunk_length | 300 |
| normalize | true |
| max_new_tokens | 1200 |
| repetition_penalty | 1.2 |
| condition_on_previous_chunks | true |
| early_stop_threshold | 1 |

**输出**：`05-audiobook.mp3` · 192 kbps · 约 9.0s

---

## 6. 中文纠音 / CN Phoneme

- **预设**：中文纠音 / CN Phoneme（内置）
- **声音**：王琨 `4f201abba2574feeae11e5ebf737859e`（zh · male · clear crisp announcer Mandarin）
- **文本**（含中文音素 `<|phoneme_start|>...<|phoneme_end|>` 模板，一字/一音节一个 tag）：
  > 北京的天安门<|phoneme_start|>an1<|phoneme_end|>广场，<|phoneme_start|>xiong2<|phoneme_end|>雄伟壮丽，<|phoneme_start|>qi2<|phoneme_end|>气势磅礴。
- **参数**：

| 参数 | 值 |
| --- | --- |
| format | mp3 |
| sample_rate | 44100 |
| mp3_bitrate | 128 |
| latency | normal |
| temperature | 0.7 |
| top_p | 0.7 |
| prosody.speed | 1.0 |
| prosody.volume | 0 |
| prosody.normalize_loudness | true |
| chunk_length | 200 |
| **normalize** | **false**（保留音素 tag，不被规范化） |
| max_new_tokens | 1024 |
| repetition_penalty | 1.2 |
| condition_on_previous_chunks | true |
| early_stop_threshold | 1 |

**输出**：`06-cn-correction.mp3` · 128 kbps · 约 4.8s

> 注：使用音素模板时必须把 `normalize` 关闭，否则数字/符号会被规范化破坏音素结构。文本编辑器「音素模板 → 中文音素 (pinyin)」可一键插入 `<|phoneme_start|>gong1<|phoneme_end|>`。

---

## 7. 英文品牌名纠音 / EN Phoneme

- **预设**：英文品牌名纠音 / EN Phoneme（内置）
- **声音**：Slax `c5f56a6cc2ec4fa8920cb4c5889a3fb7`（en · male · clear smooth professional）
- **文本**（含 CMU Arpabet 英文音素模板，对 "engineer" 一词纠音）：
  > Welcome to the world of <|phoneme_start|>EH1 N JH AH0 N IH1 R<|phoneme_end|> engineering, where ideas become reality.
- **参数**：

| 参数 | 值 |
| --- | --- |
| format | mp3 |
| sample_rate | 44100 |
| mp3_bitrate | 128 |
| latency | normal |
| temperature | 0.7 |
| top_p | 0.7 |
| prosody.speed | 1.0 |
| prosody.volume | 0 |
| prosody.normalize_loudness | true |
| chunk_length | 200 |
| **normalize** | **false**（保留音素 tag） |
| max_new_tokens | 1024 |
| repetition_penalty | 1.2 |
| condition_on_previous_chunks | true |
| early_stop_threshold | 1 |

**输出**：`07-en-brandname.mp3` · 128 kbps · 约 5.2s

> 注：文本编辑器「音素模板 → 英文音素 (CMU Arpabet)」可一键插入 `<|phoneme_start|>EH1 N JH AH0 N IH1 R<|phoneme_end|>`。

---

## 使用步骤（在工作台）

1. 打开工作台 →「普通」生成 tab。
2. 「应用预设」下拉选择对应内置预设（旁白 / 客服 / 播客 / 低延迟对话 / 有声书 / 中文纠音 / 英文品牌名纠音），参数会自动套用。
3. 「声音选择 → 手动」粘贴上表中的 `reference_id`，点「设为当前」。
4. 文本框粘贴上表「文本」（音素模板的 `<|...|>` 标签需原样保留；也可用编辑器上方的「情绪/语气」「音素模板」按钮插入）。
5. 「高级设置」按表微调（特别是音素纠音两段要把 `normalize` 关掉）。
6. 点「生成」，音频出现后可播放 / 下载 / 复制请求 JSON / 复制 cURL，并自动存入右侧「历史」。

## 请求 JSON 模板（以「旁白」为例）

```json
{
  "text": "在广袤无垠的宇宙中，地球如同一粒微尘，悬浮在阳光之下。而我们每一个人，都是这粒微尘上短暂而璀璨的光。",
  "model": "s2.1-pro-free",
  "reference_id": "59cb5986671546eaa6ca8ae6f29f6d22",
  "temperature": 0.6,
  "top_p": 0.7,
  "prosody": { "speed": 0.95, "volume": 0, "normalize_loudness": true },
  "chunk_length": 300,
  "normalize": true,
  "format": "mp3",
  "sample_rate": 44100,
  "mp3_bitrate": 192,
  "latency": "normal",
  "max_new_tokens": 1024,
  "repetition_penalty": 1.2,
  "condition_on_previous_chunks": true,
  "early_stop_threshold": 1
}
```

> `model` 在服务端转成 `model: s2.1-pro-free` header，不会出现在 upstream body。请求前 `undefined/null/空字符串` 字段会被剔除，但显式 `false`/`0` 保留。
