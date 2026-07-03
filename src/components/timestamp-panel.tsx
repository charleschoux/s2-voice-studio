"use client";

import * as React from "react";
import { Clock, Download, FileJson, Loader2, Play, Pause } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VoicePicker } from "./voice-picker";
import { TextEditor } from "./text-editor";
import { useAppStore } from "@/lib/use-app-store";
import type { TtsForm } from "@/lib/schemas";
import type { TimestampResult, Alignment } from "@/lib/types";
import {
  parseTimestampStream,
  alignmentToSrt,
  alignmentToVtt,
  alignmentToTimeline,
} from "@/lib/timestamp";
import { downloadBlob, slugify, formatBytes } from "@/lib/utils";
import { extForFormat, mimeForFormat } from "@/lib/client-media";

interface Props {
  form: TtsForm;
  setForm: React.Dispatch<React.SetStateAction<TtsForm>>;
  mock: boolean;
}

export function TimestampPanel({ form, setForm, mock }: Props) {
  const store = useAppStore();
  const [busy, setBusy] = React.useState(false);
  const [result, setResult] = React.useState<TimestampResult | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [playing, setPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const run = async () => {
    if (!form.text.trim()) {
      toast.error("请输入文本");
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    const start = performance.now();
    try {
      if (mock) {
        await new Promise((r) => setTimeout(r, 400));
        const fake: TimestampResult = {
          audioChunks: [new Uint8Array(0)],
          mergedAudio: new Blob([new Uint8Array(8)], { type: mimeForFormat(form.format) }),
          content: form.text,
          alignment: {
            duration: form.text.length * 0.06,
            chars: Array.from(form.text).map((c, i) => ({
              char: c,
              start: i * 0.06,
              end: (i + 1) * 0.06,
            })),
          },
          events: [
            {
              content: form.text,
              chunk_seq: 0,
              chunk_audio_offset_sec: 0,
              alignment: {
                duration: form.text.length * 0.06,
                chars: Array.from(form.text).map((c, i) => ({
                  char: c,
                  start: i * 0.06,
                  end: (i + 1) * 0.06,
                })),
              },
            },
          ],
        };
        setResult(fake);
        setAudioUrl(URL.createObjectURL(fake.mergedAudio!));
        await store.addHistory(
          {
            text: form.text,
            voiceId: form.reference_id,
            model: form.model,
            format: form.format,
            params: form as Record<string, unknown>,
            durationMs: performance.now() - start,
            responseBytes: fake.mergedAudio?.size || 0,
            mode: "timestamp",
            mock: true,
            alignment: fake.alignment,
          },
          fake.mergedAudio || undefined,
        );
        toast.success("Mock 时间戳生成完成");
        return;
      }

      const res = await fetch("/api/fish/tts-with-timestamp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      const parsed = await parseTimestampStream(
        res,
        form.format,
        (_ev, audioBytes) => {
          if (audioBytes) setProgress((p) => p + audioBytes.length);
        },
      );
      setResult(parsed);
      if (parsed.mergedAudio) {
        setAudioUrl(URL.createObjectURL(parsed.mergedAudio));
        await store.addHistory(
          {
            text: form.text,
            voiceId: form.reference_id,
            model: form.model,
            format: form.format,
            params: form as Record<string, unknown>,
            durationMs: performance.now() - start,
            responseBytes: parsed.mergedAudio.size,
            mode: "timestamp",
            mock: false,
            alignment: parsed.alignment,
          },
          parsed.mergedAudio,
        );
      }
      toast.success(`时间戳生成完成 · ${parsed.events.length} 事件`);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const downloadAudio = () => {
    if (!result?.mergedAudio) return;
    downloadBlob(
      result.mergedAudio,
      `${slugify(form.text.slice(0, 24)) || "audio"}.${extForFormat(form.format)}`,
    );
  };
  const downloadJson = () => {
    if (!result) return;
    const payload = {
      content: result.content,
      alignment: result.alignment,
      events: result.events,
      format: form.format,
    };
    downloadBlob(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
      `${slugify(form.text.slice(0, 24)) || "alignment"}.json`,
    );
  };
  const downloadSrt = () => {
    if (!result) return;
    const srt = alignmentToSrt(result.content, result.alignment);
    if (!srt) {
      toast.error("无可用 alignment");
      return;
    }
    downloadBlob(new Blob([srt], { type: "text/plain;charset=utf-8" }), `${slugify(form.text.slice(0, 24)) || "subs"}.srt`);
  };
  const downloadVtt = () => {
    if (!result) return;
    const vtt = alignmentToVtt(result.content, result.alignment);
    downloadBlob(new Blob([vtt], { type: "text/vtt;charset=utf-8" }), `${slugify(form.text.slice(0, 24)) || "subs"}.vtt`);
  };

  const timeline = result ? alignmentToTimeline(result.alignment) : [];

  return (
    <div className="space-y-4">
      <VoicePicker
        value={form.reference_id || ""}
        onChange={(id) => setForm((p) => ({ ...p, reference_id: id }))}
      />
      <TextEditor
        value={form.text}
        onChange={(v) => setForm((p) => ({ ...p, text: v }))}
        textareaRef={textareaRef}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={run} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
          {busy ? `接收中… ${formatBytes(progress)}` : "带时间戳生成"}
        </Button>
        <span className="text-xs text-muted-foreground">
          解析 SSE <code>data:</code> 事件；audio 按到达顺序拼接，alignment 按 chunk_seq 替换最新快照。
        </span>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>生成失败</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {result && (
        <div className="space-y-3 rounded-md border bg-card p-3">
          <audio ref={audioRef} src={audioUrl || undefined} onEnded={() => setPlaying(false)} className="hidden" />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={togglePlay} disabled={!audioUrl}>
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "暂停" : "播放"}
            </Button>
            <Badge variant="secondary">{result.events.length} events</Badge>
            <Badge variant="secondary">{result.audioChunks.length} chunks</Badge>
            {result.mergedAudio && (
              <Badge variant="secondary">{formatBytesLocal(result.mergedAudio.size)}</Badge>
            )}
            <div className="ml-auto flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" onClick={downloadAudio} disabled={!result.mergedAudio}>
                <Download className="h-3.5 w-3.5" /> 音频
              </Button>
              <Button size="sm" variant="outline" onClick={downloadJson}>
                <FileJson className="h-3.5 w-3.5" /> JSON
              </Button>
              <Button size="sm" variant="outline" onClick={downloadSrt}>
                SRT
              </Button>
              <Button size="sm" variant="outline" onClick={downloadVtt}>
                VTT
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <div className="border-b bg-muted/40 px-3 py-1.5 text-xs font-semibold">
              时间轴 ({timeline.length} chars)
            </div>
            <ScrollArea className="h-56">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-background">
                  <tr className="text-left text-muted-foreground">
                    <th className="px-3 py-1.5 font-medium">#</th>
                    <th className="px-3 py-1.5 font-medium">char</th>
                    <th className="px-3 py-1.5 font-medium">start</th>
                    <th className="px-3 py-1.5 font-medium">end</th>
                    <th className="px-3 py-1.5 font-medium">dur</th>
                  </tr>
                </thead>
                <tbody>
                  {timeline.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                        无 char-level alignment
                      </td>
                    </tr>
                  ) : (
                    timeline.map((r) => (
                      <tr key={r.index} className="border-t">
                        <td className="px-3 py-1 text-muted-foreground">{r.index}</td>
                        <td className="px-3 py-1 font-mono">
                          {r.char === " " ? "␣" : r.char}
                        </td>
                        <td className="px-3 py-1 tabular-nums">{r.start.toFixed(3)}</td>
                        <td className="px-3 py-1 tabular-nums">{r.end.toFixed(3)}</td>
                        <td className="px-3 py-1 tabular-nums text-muted-foreground">
                          {r.duration.toFixed(3)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}

function formatBytesLocal(n: number): string {
  if (!n) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(n) / Math.log(k));
  return `${parseFloat((n / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
