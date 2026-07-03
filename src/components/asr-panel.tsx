"use client";

import * as React from "react";
import { Loader2, Upload, FileAudio, Copy, Mic } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Panel, PanelHeader } from "./studio-primitives";
import { asr } from "@/lib/api-client";
import { blobToBase64Client } from "@/lib/client-media";
import { copyToClipboard } from "@/lib/utils";
import { useHealth } from "@/lib/use-health";

export function AsrPanel() {
  const health = useHealth();
  const mock = health.mock || !health.hasApiKey;
  const [file, setFile] = React.useState<File | null>(null);
  const [language, setLanguage] = React.useState("");
  const [useItn, setUseItn] = React.useState(true);
  const [ignoreStartEnd, setIgnoreStartEnd] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);

  const run = async () => {
    if (!file) return toast.error("请上传音频文件");
    setBusy(true);
    setErr(null);
    setTranscript("");
    try {
      if (mock) {
        await new Promise((r) => setTimeout(r, 400));
        setTranscript("[mock] 这是一段示例识别文本，配置 FISH_API_KEY 后将调用真实 /v1/asr。");
        toast.success("Mock ASR 完成");
        return;
      }
      const base64 = await blobToBase64Client(file);
      const res = await asr({
        audio: { filename: file.name, mime: file.type || "audio/wav", base64 },
        language: language || undefined,
        use_itn: useItn,
        ignore_start_end: ignoreStartEnd,
      });
      const t =
        (res as { transcript?: string; text?: string }).transcript ||
        (res as { text?: string }).text ||
        "";
      setTranscript(t || JSON.stringify(res, null, 2));
      toast.success("ASR 识别完成");
    } catch (e) {
      setErr((e as Error).message);
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel className="overflow-hidden">
        <PanelHeader
          title="ASR · 语音识别"
          zh="转写参考音频"
          icon={<Mic className="h-3.5 w-3.5" />}
          right={<Badge variant="warning">独立计费</Badge>}
        />
        <div className="space-y-3 p-4">
          <Alert variant="warning" className="py-2.5">
            <AlertDescription>
              <code className="readout">/v1/asr</code> 是独立计费接口，用于把参考音频转成文字，供声音克隆 transcript 使用。
            </AlertDescription>
          </Alert>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground hover:bg-accent">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
              <Upload className="h-5 w-5" />
            </span>
            <span>点击选择音频文件</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => setFile((e.target.files || [])[0] || null)}
            />
          </label>
          {file && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileAudio className="h-3.5 w-3.5 text-primary" />
              <span className="truncate">{file.name}</span>
              <span className="readout">· {(file.size / 1024).toFixed(1)} KB</span>
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">language</Label>
              <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="zh/en/… 留空自动" />
            </div>
          </div>
          <ToggleRow label="use_itn (逆文本归一化)" checked={useItn} onChange={setUseItn} />
          <ToggleRow label="ignore_start_end" checked={ignoreStartEnd} onChange={setIgnoreStartEnd} />
          <Button onClick={run} disabled={busy} size="lg">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileAudio className="h-4 w-4" />}
            识别
          </Button>
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHeader
          title="Transcript"
          zh="识别结果"
          right={
            transcript && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(transcript).then(() => toast.success("已复制"))}
              >
                <Copy className="h-3.5 w-3.5" /> 复制
              </Button>
            )
          }
        />
        <div className="p-4">
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="识别结果，可编辑后用于声音克隆 transcript"
            className="min-h-[280px]"
          />
        </div>
      </Panel>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-card/40 px-3 py-2">
      <Label className="text-xs font-medium">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
