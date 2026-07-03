"use client";

import * as React from "react";
import { Loader2, Play, Square, Package, ListOrdered } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppStore } from "@/lib/use-app-store";
import { runBatch, splitText, type BatchTaskState, type SplitMode } from "@/lib/batch";
import { MAX_BATCH_CONCURRENCY } from "@/lib/constants";
import type { TtsForm } from "@/lib/schemas";
import { extForFormat, mimeForFormat } from "@/lib/client-media";
import { downloadBlob, slugify, formatBytes } from "@/lib/utils";
import JSZip from "jszip";

interface Props {
  form: TtsForm;
  setForm: React.Dispatch<React.SetStateAction<TtsForm>>;
  mock: boolean;
}

export function BatchPanel({ form, mock }: Props) {
  const store = useAppStore();
  const [concurrency, setConcurrency] = React.useState(1);
  const [chunkSize, setChunkSize] = React.useState(800);
  const [splitMode, setSplitMode] = React.useState<SplitMode>("paragraph");
  const [maxRetries, setMaxRetries] = React.useState(3);
  const [backoff, setBackoff] = React.useState(500);
  const [running, setRunning] = React.useState(false);
  const [tasks, setTasks] = React.useState<BatchTaskState[]>([]);
  const abortRef = React.useRef<AbortController | null>(null);

  const preview = React.useMemo(
    () => splitText(form.text, splitMode, chunkSize),
    [form.text, splitMode, chunkSize],
  );

  const run = async () => {
    if (!form.text.trim()) {
      toast.error("请输入文本");
      return;
    }
    const chunks = preview;
    if (chunks.length === 0) {
      toast.error("拆分后没有可执行块");
      return;
    }
    setRunning(true);
    setTasks([]);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const { blobs, metas } = await runBatch(form, chunks, {
        concurrency,
        maxRetries,
        backoffBaseMs: backoff,
        mock,
        signal: ac.signal,
        onTask: (t) => {
          setTasks((prev) => {
            const next = [...prev];
            next[t.index] = t;
            return next;
          });
        },
      });
      // Save to history.
      const okBlobs = blobs.filter(Boolean) as Blob[];
      await store.addHistory(
        {
          text: form.text.slice(0, 200),
          voiceId: form.reference_id,
          model: form.model,
          format: form.format,
          params: { ...form, batch: { chunks: chunks.length, concurrency } },
          responseBytes: okBlobs.reduce((a, b) => a + b.size, 0),
          mode: "batch",
          mock,
        },
        undefined,
      );
      toast.success(`批量完成 · ${okBlobs.length}/${chunks.length}`);
      void metas;
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setRunning(false);
    toast("已请求停止");
  };

  const exportZip = async () => {
    const done = tasks.filter((t) => t.audioBlob);
    if (done.length === 0) {
      toast.error("没有可导出的音频");
      return;
    }
    const zip = new JSZip();
    for (const t of done) {
      const ext = extForFormat(form.format);
      const name = `${String(t.index).padStart(3, "0")}.${ext}`;
      zip.file(name, t.audioBlob!);
    }
    zip.file(
      "metadata.json",
      JSON.stringify(
        {
          model: form.model,
          format: form.format,
          voice: form.reference_id,
          generatedAt: new Date().toISOString(),
          mock,
          items: done.map((t) => ({
            index: t.index,
            text: t.text,
            durationMs: t.durationMs,
            responseBytes: t.responseBytes,
          })),
        },
        null,
        2,
      ),
    );
    zip.file(
      "payload.json",
      JSON.stringify(
        {
          ...form,
          batch: { splitMode, chunkSize, concurrency, maxRetries, backoffBaseMs: backoff },
        },
        null,
        2,
      ),
    );
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${slugify(form.text.slice(0, 16)) || "batch"}.zip`);
  };

  const doneCount = tasks.filter((t) => t?.status === "done").length;
  const errCount = tasks.filter((t) => t?.status === "error").length;
  const progress = tasks.length ? ((doneCount + errCount) / tasks.length) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label className="text-xs">拆分方式</Label>
          <Select
            value={splitMode}
            onValueChange={(v) => setSplitMode(v as SplitMode)}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paragraph">按段落</SelectItem>
              <SelectItem value="sentences">按句子 (max chars)</SelectItem>
              <SelectItem value="chars">按字符数</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label className="text-xs">块大小 ({chunkSize})</Label>
          <Slider
            value={[chunkSize]}
            min={100}
            max={2000}
            step={50}
            onValueChange={(v) => setChunkSize(v[0])}
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs">并发 ({concurrency}, max {MAX_BATCH_CONCURRENCY})</Label>
          <Slider
            value={[concurrency]}
            min={1}
            max={MAX_BATCH_CONCURRENCY}
            step={1}
            onValueChange={(v) => setConcurrency(v[0])}
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs">429 重试次数 ({maxRetries})</Label>
          <Slider
            value={[maxRetries]}
            min={0}
            max={6}
            step={1}
            onValueChange={(v) => setMaxRetries(v[0])}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[10px]">
          <ListOrdered className="h-3 w-3" /> {preview.length} 块
        </Badge>
        {!running ? (
          <Button size="sm" onClick={run}>
            <Play className="h-3.5 w-3.5" /> 开始批量
          </Button>
        ) : (
          <Button size="sm" variant="destructive" onClick={stop}>
            <Square className="h-3.5 w-3.5" /> 停止
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={exportZip} disabled={doneCount === 0}>
          <Package className="h-3.5 w-3.5" /> 导出 zip
        </Button>
        {running && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>

      {tasks.length > 0 && (
        <>
          <Progress value={progress} />
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>完成 {doneCount}</span>
            <span>错误 {errCount}</span>
            <span>共 {tasks.length}</span>
          </div>
          <ScrollArea className="h-48 rounded-md border">
            <div className="p-2 space-y-1.5">
              {tasks.map((t) => (
                <div
                  key={t?.id}
                  className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs"
                >
                  <Badge
                    variant={
                      t?.status === "done"
                        ? "success"
                        : t?.status === "error"
                          ? "destructive"
                          : t?.status === "retry"
                            ? "warning"
                            : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {t?.status}
                  </Badge>
                  <span className="w-6 text-muted-foreground">{t?.index}</span>
                  <span className="flex-1 truncate">{t?.text}</span>
                  {t?.attempts ? (
                    <span className="text-muted-foreground">×{t.attempts}</span>
                  ) : null}
                  {t?.audioBlob && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px]"
                      onClick={() =>
                        t.audioUrl &&
                          downloadBlob(
                            t.audioBlob!,
                            `${String(t.index).padStart(3, "0")}.${extForFormat(form.format)}`,
                          )
                      }
                    >
                      {formatBytes(t.responseBytes || 0)}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}

      <p className="text-[11px] text-muted-foreground">
        遇到 429 / 5xx 时指数退避重试；导出 zip 包含音频、metadata.json、payload.json。
      </p>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>统一音频格式</span>
        <Badge variant="outline" className="text-[10px]">{form.format}</Badge>
        <span className="ml-auto">{mock ? "mock 模式" : "真实调用"}</span>
      </div>
    </div>
  );
}
