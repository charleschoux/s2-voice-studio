"use client";

import * as React from "react";
import {
  Play,
  Pause,
  Download,
  RefreshCw,
  Copy,
  Terminal,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { formatBytes, formatDuration, copyToClipboard, downloadBlob, slugify } from "@/lib/utils";
import { extForFormat, mimeForFormat } from "@/lib/client-media";
import type { TtsForm } from "@/lib/schemas";
import { buildUpstreamCurl } from "@/lib/api-client";
import { pruneEmpty } from "@/lib/utils";

interface AudioPlayerProps {
  blob: Blob | null;
  audioUrl: string | null;
  format: string;
  text: string;
  form: TtsForm;
  durationMs?: number;
  responseBytes?: number;
  onRegenerate?: () => void;
  busy?: boolean;
}

export function AudioPlayer({
  blob,
  audioUrl,
  format,
  text,
  form,
  durationMs,
  responseBytes,
  onRegenerate,
  busy,
}: AudioPlayerProps) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = React.useState(false);
  const [pos, setPos] = React.useState(0);
  const [dur, setDur] = React.useState(0);

  React.useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setPos(a.currentTime);
    const onDur = () => setDur(a.duration || 0);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("loadedmetadata", onDur);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("loadedmetadata", onDur);
      a.removeEventListener("ended", onEnd);
    };
  }, [audioUrl]);

  if (!audioUrl) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground">
        {busy ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            正在接收音频…
          </>
        ) : (
          "生成后音频会显示在这里"
        )}
      </div>
    );
  }

  const toggle = () => {
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

  const seek = (v: number[]) => {
    const a = audioRef.current;
    if (a) a.currentTime = v[0];
    setPos(v[0]);
  };

  const download = () => {
    if (!blob) return;
    const name = `${slugify(text.slice(0, 24)) || "audio"}.${extForFormat(format)}`;
    downloadBlob(blob, name);
  };

  const copyReqJson = () => {
    const { model: _m, _msgpack: _f, ...rest } = form as Record<string, unknown>;
    void _m;
    void _f;
    copyToClipboard(JSON.stringify(pruneEmpty(rest), null, 2)).then(() =>
      toast.success("已复制请求 JSON"),
    );
  };

  const copyCurl = () => {
    const curl = buildUpstreamCurl("/v1/tts", form, form.model || "s2.1-pro-free");
    copyToClipboard(curl).then(() => toast.success("已复制 cURL（含 $FISH_API_KEY 占位）"));
  };

  return (
    <div className="space-y-3 rounded-md border bg-card p-3">
      <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
      <div className="flex items-center gap-2">
        <Button size="icon" onClick={toggle} aria-label={playing ? "暂停" : "播放"}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <div className="flex-1">
          <Slider
            value={[Math.min(pos, dur || 0)]}
            max={dur || 0}
            step={0.01}
            onValueChange={seek}
          />
        </div>
        <span className="w-24 text-right text-xs tabular-nums text-muted-foreground">
          {fmtTime(pos)} / {fmtTime(dur)}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{format}</Badge>
        {responseBytes != null && (
          <Badge variant="secondary">{formatBytes(responseBytes)}</Badge>
        )}
        {durationMs != null && (
          <Badge variant="secondary">{formatDuration(durationMs)}</Badge>
        )}
        <div className="ml-auto flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" onClick={download}>
            <Download className="h-3.5 w-3.5" /> 下载
          </Button>
          {onRegenerate && (
            <Button size="sm" variant="outline" onClick={onRegenerate}>
              <RefreshCw className="h-3.5 w-3.5" /> 重生成
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={copyReqJson}>
            <Copy className="h-3.5 w-3.5" /> 请求 JSON
          </Button>
          <Button size="sm" variant="outline" onClick={copyCurl}>
            <Terminal className="h-3.5 w-3.5" /> cURL
          </Button>
        </div>
      </div>
    </div>
  );
}

function fmtTime(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
