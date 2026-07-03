"use client";

import * as React from "react";
import { Loader2, Play, Sparkles, Wand2, Clock, Layers, Settings2, Waypoints } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VoicePicker } from "./voice-picker";
import { TextEditor } from "./text-editor";
import { TtsAdvancedSettings } from "./tts-advanced-settings";
import { AudioPlayer } from "./audio-player";
import { PresetPicker } from "./preset-picker";
import { HistoryPanel } from "./history-panel";
import { useAppStore } from "@/lib/use-app-store";
import { useHealth } from "@/lib/use-health";
import { DEFAULT_FORM } from "@/lib/form-defaults";
import type { TtsForm } from "@/lib/schemas";
import type { HistoryItem } from "@/lib/types";
import { requestTts } from "@/lib/api-client";
import { mimeForFormat, extForFormat } from "@/lib/client-media";
import { utf8ByteLength, formatBytes, downloadBlob, slugify } from "@/lib/utils";
import { TimestampPanel } from "./timestamp-panel";
import { BatchPanel } from "./batch-panel";

type GenMode = "normal" | "stream" | "timestamp";

export function TtsWorkbench() {
  const store = useAppStore();
  const health = useHealth();
  const [form, setForm] = React.useState<TtsForm>(DEFAULT_FORM);
  const [busy, setBusy] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [durationMs, setDurationMs] = React.useState<number | undefined>();
  const [responseBytes, setResponseBytes] = React.useState<number | undefined>();
  const [error, setError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<GenMode>("normal");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const mockMode = health.mock || !health.hasApiKey;

  const restore = React.useCallback(
    (item: HistoryItem) => {
      setForm({
        ...DEFAULT_FORM,
        ...item.params,
        text: item.text,
        reference_id: item.voiceId,
        model: item.model,
        format: item.format as TtsForm["format"],
      } as TtsForm);
      setError(null);
      toast.success("已还原历史参数");
    },
    [],
  );

  const onApplyPreset = React.useCallback(
    (params: Partial<TtsForm>) => {
      setForm((p) => ({
        ...p,
        ...params,
        prosody: { ...p.prosody, ...(params.prosody || {}) },
      }));
    },
    [],
  );

  const buildForm = (): TtsForm => ({
    ...form,
    reference_id: form.reference_id?.trim() || undefined,
  });

  const recordHistory = async (
    blob: Blob | null,
    partial: Omit<HistoryItem, "id" | "createdAt">,
  ) => {
    try {
      await store.addHistory(partial, blob || undefined);
    } catch {
      /* ignore */
    }
  };

  const generateNormal = async () => {
    const f = buildForm();
    if (!f.text.trim()) {
      toast.error("请输入文本");
      return;
    }
    setBusy(true);
    setError(null);
    const start = performance.now();
    try {
      if (mockMode) {
        const blob = await makeMockBlob(f);
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setResponseBytes(blob.size);
        setDurationMs(performance.now() - start);
        await recordHistory(blob, {
          text: f.text,
          voiceId: f.reference_id,
          model: f.model,
          format: f.format,
          params: f as Record<string, unknown>,
          durationMs: performance.now() - start,
          responseBytes: blob.size,
          mode: "mock",
          mock: true,
        });
        toast.success("Mock 生成完成");
        return;
      }

      const blob = await requestTts(f);
      const url = URL.createObjectURL(blob);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioBlob(blob);
      setAudioUrl(url);
      setResponseBytes(blob.size);
      const dur = performance.now() - start;
      setDurationMs(dur);
      await recordHistory(blob, {
        text: f.text,
        voiceId: f.reference_id,
        model: f.model,
        format: f.format,
        params: f as Record<string, unknown>,
        durationMs: dur,
        responseBytes: blob.size,
        mode: mode === "stream" ? "stream" : "normal",
        mock: false,
      });
      toast.success("生成完成");
    } catch (e) {
      const err = e as { message?: string; status?: number };
      setError(err.message || "生成失败");
      toast.error(err.message || "生成失败");
      await recordHistory(null, {
        text: f.text,
        voiceId: f.reference_id,
        model: f.model,
        format: f.format,
        params: f as Record<string, unknown>,
        error: err.message,
        mode: mode === "stream" ? "stream" : "normal",
        mock: false,
      });
    } finally {
      setBusy(false);
    }
  };

  const onRegenerate = () => generateNormal();

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {mockMode && (
          <Alert variant="warning">
            <Wand2 className="h-4 w-4" />
            <AlertTitle>
              {health.hasApiKey ? "Mock 模式已启用" : "未检测到 FISH_API_KEY"}
            </AlertTitle>
            <AlertDescription>
              {health.hasApiKey
                ? "当前为 Mock 演示：将生成静音/占位音频，不会调用 Fish API。关闭右上角 Mock 开关即可真实调用。"
                : "请在项目根目录 .env.local 设置 FISH_API_KEY 并重启 dev server；当前为 Mock 演示模式，可体验表单与历史流程。"}
            </AlertDescription>
          </Alert>
        )}

        <section className="clay p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">TTS 工作台</h2>
            <PresetPicker form={form} onApply={onApplyPreset} />
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as GenMode)}>
            <TabsList>
              <TabsTrigger value="normal" className="text-xs">
                <Play className="h-3.5 w-3.5" /> 普通
              </TabsTrigger>
              <TabsTrigger value="stream" className="text-xs">
                <Layers className="h-3.5 w-3.5" /> HTTP 流式
              </TabsTrigger>
              <TabsTrigger value="timestamp" className="text-xs">
                <Clock className="h-3.5 w-3.5" /> 带时间戳
              </TabsTrigger>
            </TabsList>

            <TabsContent value="normal" className="mt-4 space-y-4">
              <VoiceSection form={form} setForm={setForm} />
              <TextEditor
                value={form.text}
                onChange={(v) => setForm((p) => ({ ...p, text: v }))}
                textareaRef={textareaRef}
              />
              <GenerateBar
                busy={busy}
                bytes={utf8ByteLength(form.text)}
                onGenerate={generateNormal}
                mock={mockMode}
              />
              {error && <ErrorAlert message={error} />}
              <AudioPlayer
                blob={audioBlob}
                audioUrl={audioUrl}
                format={form.format}
                text={form.text}
                form={form}
                durationMs={durationMs}
                responseBytes={responseBytes}
                onRegenerate={onRegenerate}
                busy={busy}
              />
            </TabsContent>

            <TabsContent value="stream" className="mt-4 space-y-4">
              <VoiceSection form={form} setForm={setForm} />
              <TextEditor
                value={form.text}
                onChange={(v) => setForm((p) => ({ ...p, text: v }))}
                textareaRef={textareaRef}
              />
              <p className="text-xs text-muted-foreground">
                HTTP 流式：同一 <code>/api/fish/tts</code> 端点返回 chunked
                response，浏览器边接收边缓冲，完成后可播放/下载。
              </p>
              <GenerateBar
                busy={busy}
                bytes={utf8ByteLength(form.text)}
                onGenerate={generateNormal}
                mock={mockMode}
                label="流式生成"
              />
              {error && <ErrorAlert message={error} />}
              <AudioPlayer
                blob={audioBlob}
                audioUrl={audioUrl}
                format={form.format}
                text={form.text}
                form={form}
                durationMs={durationMs}
                responseBytes={responseBytes}
                onRegenerate={onRegenerate}
                busy={busy}
              />
            </TabsContent>

            <TabsContent value="timestamp" className="mt-4 space-y-4">
              <TimestampPanel form={form} setForm={setForm} mock={mockMode} />
            </TabsContent>
          </Tabs>
        </section>

        <section className="clay p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Waypoints className="h-4 w-4 text-muted-foreground" />
              长文本批量
            </h2>
            <Badge variant="outline" className="text-[10px]">
              并发 1–5 · 429 退避
            </Badge>
          </div>
          <BatchPanel form={form} setForm={setForm} mock={mockMode} />
        </section>

        <section className="clay p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              高级设置
            </h2>
            <Badge variant="soft" className="text-[10px]">
              {form.model}
            </Badge>
          </div>
          <TtsAdvancedSettings form={form} setForm={setForm} />
        </section>
      </div>

      <aside className="lg:sticky lg:top-[72px] lg:h-[calc(100vh-96px)]">
        <div className="clay h-full overflow-hidden">
          <HistoryPanel onRestore={restore} />
        </div>
      </aside>
    </div>
  );
}

function VoiceSection({
  form,
  setForm,
}: {
  form: TtsForm;
  setForm: React.Dispatch<React.SetStateAction<TtsForm>>;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          声音选择
        </h3>
        <Badge variant="outline" className="text-[10px]">
          reference_id
        </Badge>
      </div>
      <VoicePicker
        value={form.reference_id || ""}
        onChange={(id) => setForm((p) => ({ ...p, reference_id: id }))}
      />
    </div>
  );
}

function GenerateBar({
  busy,
  bytes,
  onGenerate,
  mock,
  label = "生成",
}: {
  busy: boolean;
  bytes: number;
  onGenerate: () => void;
  mock: boolean;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button onClick={onGenerate} disabled={busy} className="min-w-[140px]">
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {busy ? "生成中…" : label}
      </Button>
      <span className="text-xs text-muted-foreground">
        {formatBytes(bytes, 1)} UTF-8 · {mock ? "mock" : "s2.1-pro-free"} · $0/M bytes
        {mock ? "" : " (fair-use)"}
      </span>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>生成失败</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

async function makeMockBlob(form: TtsForm): Promise<Blob> {
  const framesNeeded = Math.max(4, Math.min(200, Math.ceil(form.text.length / 4)));
  const frame = new Uint8Array([
    0xff, 0xfb, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
  const buf = new Uint8Array(frame.length * framesNeeded);
  for (let i = 0; i < framesNeeded; i++) buf.set(frame, i * frame.length);
  void form;
  return new Blob([buf], { type: mimeForFormat("mp3") });
}

export function downloadHistoryItemAudio(item: HistoryItem, blob: Blob) {
  downloadBlob(blob, `${slugify(item.text.slice(0, 24)) || "audio"}.${extForFormat(item.format)}`);
}
