"use client";

import * as React from "react";
import { Loader2, Play, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { voiceDesign } from "@/lib/api-client";
import { base64ToUint8Array, mimeForFormat, extForFormat } from "@/lib/client-media";
import { downloadBlob, slugify } from "@/lib/utils";
import { useHealth } from "@/lib/use-health";

interface Candidate {
  audioBase64: string;
  url: string;
  index: number;
}

export function VoiceDesignPanel() {
  const health = useHealth();
  const mock = health.mock || !health.hasApiKey;
  const [instruction, setInstruction] = React.useState("");
  const [referenceText, setReferenceText] = React.useState("");
  const [language, setLanguage] = React.useState("en");
  const [n, setN] = React.useState(1);
  const [speed, setSpeed] = React.useState(1);
  const [numStep, setNumStep] = React.useState(32);
  const [guidance, setGuidance] = React.useState(5);
  const [instructGuidance, setInstructGuidance] = React.useState(1.5);
  const [seed, setSeed] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);
  const [candidates, setCandidates] = React.useState<Candidate[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  const run = async () => {
    if (!instruction.trim()) return toast.error("请输入 instruction (1–2000 字符)");
    setBusy(true);
    setErr(null);
    setCandidates([]);
    try {
      if (mock) {
        await new Promise((r) => setTimeout(r, 500));
        const fake: Candidate[] = Array.from({ length: n }, (_, i) => ({
          audioBase64: "",
          url: "",
          index: i,
        }));
        setCandidates(fake);
        toast.success("Mock Voice Design 完成");
        return;
      }
      const payload: Record<string, unknown> = {
        instruction: instruction.trim(),
        reference_text: referenceText.trim() || undefined,
        language: language || undefined,
        n,
        speed,
        num_step: numStep,
        guidance_scale: guidance,
        instruct_guidance_scale: instructGuidance,
        seed: seed ? Number(seed) : undefined,
      };
      const res = (await voiceDesign(payload)) as {
        audio_base64?: string;
        audios?: { audio_base64?: string }[];
        candidates?: { audio_base64?: string }[];
      };
      const list: string[] = [];
      if (Array.isArray(res.audios)) list.push(...res.audios.map((a) => a.audio_base64).filter(Boolean) as string[]);
      if (Array.isArray(res.candidates)) list.push(...res.candidates.map((a) => a.audio_base64).filter(Boolean) as string[]);
      if (res.audio_base64) list.push(res.audio_base64);
      if (list.length === 0) {
        toast.warning("Voice Design 未返回候选音频");
        return;
      }
      const cands: Candidate[] = list.map((b, i) => ({
        audioBase64: b,
        url: URL.createObjectURL(new Blob([base64ToUint8Array(b).slice().buffer], { type: mimeForFormat("wav") })),
        index: i,
      }));
      setCandidates(cands);
      toast.success(`生成 ${cands.length} 个候选音频`);
    } catch (e) {
      setErr((e as Error).message);
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const download = (c: Candidate) => {
    if (!c.audioBase64) return toast.error("Mock 候选无音频");
    downloadBlob(
      new Blob([base64ToUint8Array(c.audioBase64).slice().buffer], { type: mimeForFormat("wav") }),
      `${slugify(instruction.slice(0, 16)) || "voice"}-${c.index}.${extForFormat("wav")}`,
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3 rounded-md border p-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Voice Design</h3>
          <Badge variant="warning" className="text-[10px]">独立计费</Badge>
        </div>
        <Alert variant="warning">
          <AlertTitle>注意</AlertTitle>
          <AlertDescription>
            /v1/voice-design 是独立计费接口（header <code>model: voice-design-1</code>），<b>不是</b>免费 TTS。请确认你的账户有权限。
          </AlertDescription>
        </Alert>
        <div className="grid gap-2">
          <Label>instruction * (1–2000)</Label>
          <Textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value.slice(0, 2000))}
            placeholder="e.g. A warm, confident female narrator with a slight British accent."
            className="min-h-[100px]"
          />
          <span className="text-[11px] text-muted-foreground">{instruction.length}/2000</span>
        </div>
        <div className="grid gap-2">
          <Label>reference_text (≤150)</Label>
          <Input
            value={referenceText}
            onChange={(e) => setReferenceText(e.target.value.slice(0, 150))}
            placeholder="可选参考文本"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>language</Label>
            <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en/zh/…" />
          </div>
          <div className="grid gap-2">
            <Label>n ({n})</Label>
            <Slider value={[n]} min={1} max={4} step={1} onValueChange={(v) => setN(v[0])} />
          </div>
        </div>
        <SliderRow label="speed" value={speed} min={0} max={3} step={0.05} onChange={setSpeed} display={(v) => v.toFixed(2)} />
        <SliderRow label="num_step" value={numStep} min={1} max={128} step={1} onChange={setNumStep} display={(v) => `${v}`} />
        <SliderRow label="guidance_scale" value={guidance} min={0} max={20} step={0.1} onChange={setGuidance} display={(v) => v.toFixed(1)} />
        <SliderRow label="instruct_guidance_scale" value={instructGuidance} min={0} max={10} step={0.1} onChange={setInstructGuidance} display={(v) => v.toFixed(1)} />
        <div className="grid gap-2">
          <Label>seed (可选)</Label>
          <Input value={seed} onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, ""))} placeholder="留空随机" />
        </div>
        <Button onClick={run} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          生成候选
        </Button>
        {err && <p className="text-xs text-destructive">{err}</p>}
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <h3 className="text-sm font-semibold">候选音频</h3>
        {candidates.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">生成后候选音频显示在这里</p>
        ) : (
          <div className="space-y-3">
            {candidates.map((c) => (
              <div key={c.index} className="rounded-md border p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary">候选 {c.index + 1}</Badge>
                  {c.audioBase64 ? (
                    <Button size="sm" variant="outline" onClick={() => download(c)}>
                      <Download className="h-3.5 w-3.5" /> 下载
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">mock 占位</span>
                  )}
                </div>
                {c.url ? (
                  <audio src={c.url} controls className="w-full" />
                ) : (
                  <div className="flex h-10 items-center justify-center text-xs text-muted-foreground">
                    <Play className="h-3.5 w-3.5" /> mock 占位音频
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: (v: number) => string;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">{display(value)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
