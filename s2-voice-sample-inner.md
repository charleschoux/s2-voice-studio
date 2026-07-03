# 内心独白 · 标签标注示例

这段台词适合用「有声书 / Audiobook」预设（`temperature 0.75`、`speed 0.98`、`mp3 192`），并配合 S2 情绪方括号标签 + 自然语言 cue 来表达「思忖 → 自嘲 → 释然 → 怅然」的情绪递进。

## 推荐标注版（可直接粘贴进工作台文本框）

```
[sighing] 齐先生，你说遇事不决，可问春风。 [break] 若春风不语，即随本心。 [long-break]

[whispering softly] 倘若我本心坚定，又怎会遇事不决？ [break] 春风亦有春风愁，不劳春风为我忧。 [long-break]

[sighing] 春风若有怜我意，[whispers] 可否许我再少年。
```

### 标签说明

| 标签 | 位置 | 作用 |
| --- | --- | --- |
| `[sighing]` | 开篇 | 起句带一声轻叹，奠定怅然基调 |
| `[break]` | 「可问春风。」后 | 短停顿，给「问春风」留余韵 |
| `[long-break]` | 段尾 | 长停顿，分出三段思辨层次 |
| `[whispering softly]` | 「倘若我本心坚定…」 | 自然语言 cue，低声自语、向内诘问 |
| `[break]` | 「又怎会遇事不决？」后 | 短停顿，诘问后留白 |
| `[long-break]` | 段尾 | 转入下一层释然 |
| `[sighing]` | 末段起 | 再叹，情绪下沉 |
| `[whispers]` | 「可否许我再少年」 | 最末一句压低声气，收束成心愿的轻喃 |

## 备选 · 更克制的旁白版

去掉强情绪，仅用停顿分层，适合更平、更稳的纪录片式旁白（可换「旁白 / Documentary」预设）：

```
齐先生，你说遇事不决，可问春风。 [break] 若春风不语，即随本心。 [long-break] 倘若我本心坚定，又怎会遇事不决？ [break] 春风亦有春风愁，不劳春风为我忧。 [long-break] 春风若有怜我意，可否许我再少年。
```

## 备选 · 戏剧化演绎版

用更强的张力，适合角色配音 / 有声剧（可适当提高 `temperature` 到 `0.85`、`top_p 0.8`）：

```
[sighing] 齐先生，你说遇事不决，可问春风。 [break] 若春风不语，即随本心。 [long-break]
[whispering] 倘若我本心坚定，又怎会遇事不决？ [shouting softly] 春风亦有春风愁，不劳春风为我忧！ [long-break]
[gasping] 春风若有怜我意，[whispers] 可否许我再少年。
```

> `[shouting softly]`、`[whispers]` 这类「自然语言 bracket cue」S2 支持，会按语义混合语气，比单一标签更细腻。

## 复刻参数（配合上述文本）

| 参数 | 值 |
| --- | --- |
| 预设 | 有声书 / Audiobook（或旁白） |
| model | s2.1-pro-free |
| reference_id | `6fc59d2b56cf402eb572934114c8d8aa`（仿真人故事男声，zh narration） |
| format | mp3 · 192 kbps · 44100 |
| temperature | 0.75（戏剧版可 0.85） |
| top_p | 0.75（戏剧版 0.8） |
| prosody.speed | 0.98 |
| chunk_length | 300 |
| normalize | true |
| latency | normal |
| repetition_penalty | 1.2 |

> 标签是 S2 方括号语法，`normalize=true` 不会破坏 `[happy]`/`[break]` 这类结构；只有 `<|phoneme_start|>` 音素模板才需要 `normalize=false`。
