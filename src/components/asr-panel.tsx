"use client";

import * as React from "react";
import { Loader2, Upload, FileAudio, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
      <div className="space-y-3 rounded-md border p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">ASR (语音识别)</h3>
          <Badge variant="warning" className="text-[10px]">独立计费</Badge>
        </div>
        <Alert variant="warning">
          <AlertTitle>注意</AlertTitle>
          <AlertDescription>
            /v1/asr 是独立计费接口，用于把参考音频转成文字，供声音克隆 transcript 使用。
          </AlertDescription>
        </Alert>
        <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          <Upload className="mx-auto mb-2 h-6 w-6" />
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setFile((e.target.files || [])[0] || null)}
          />
        </div>
        {file && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileAudio className="h-3.5 w-3.5" /> {file.name} · {(file.size / 1024).toFixed(1)} KB
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>language</Label>
            <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="zh/en/… 留空自动" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <Label>use_itn (逆文本归一化)</Label>
          <Switch checked={useItn} onCheckedChange={setUseItn} />
        </div>
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <Label>ignore_start_end</Label>
          <Switch checked={ignoreStartEnd} onCheckedChange={setIgnoreStartEnd} />
        </div>
        <Button onClick={run} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileAudio className="h-4 w-4" />}
          识别
        </Button>
        {err && <p className="text-xs text-destructive">{err}</p>}
      </div>
      <div className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Transcript</h3>
          {transcript && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(transcript).then(() => toast.success("已复制"))}
            >
              <Copy className="h-3.5 w-3.5" /> 复制
            </Button>
          )}
        </div>
        <Textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="识别结果，可编辑后用于声音克隆 transcript"
          className="min-h-[200px]"
        />
      </div>
    </div>
  );
}
