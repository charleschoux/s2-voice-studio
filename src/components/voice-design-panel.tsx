"use client";

import * as React from "react";
import { Loader2, Play, Sparkles, Download, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Panel, PanelHeader, SectionLabel } from "./studio-primitives";
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
      <Panel className="overflow-hidden">
        <PanelHeader
          title="Voice Design"
          zh="提示词声音设计"
          icon={<Wand2 className="h-3.5 w-3.5" />}
          right={<Badge variant="warning">独立计费</Badge>}
        />
        <div className="space-y-3 p-4">
          <Alert variant="warning" className="py-2.5">
            <AlertDescription>
              <code className="readout">/v1/voice-design</code> 是独立计费接口（header{" "}
              <code className="readout">model: voice-design-1</code>），<b>不是</b>免费 TTS。请确认你的账户有权限。
            </AlertDescription>
          </Alert>
          <div className="grid gap-2">
            <Label className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
              <span>instruction *</span>
              <span className="readout normal-case text-primary">{instruction.length}/2000</span>
            </Label>
            <Textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value.slice(0, 2000))}
              placeholder="e.g. A warm, confident female narrator with a slight British accent."
              className="min-h-[110px]"
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">reference_text (≤150)</Label>
            <Input
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value.slice(0, 150))}
              placeholder="可选参考文本"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">language</Label>
              <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en/zh/…" />
            </div>
            <div className="grid gap-2">
              <Label className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                <span>n</span>
                <span className="readout normal-case text-primary">{n}</span>
              </Label>
              <Slider value={[n]} min={1} max={4} step={1} onValueChange={(v) => setN(v[0])} />
            </div>
          </div>
          <SliderRow label="speed" value={speed} min={0} max={3} step={0.05} onChange={setSpeed} display={(v) => v.toFixed(2)} />
          <SliderRow label="num_step" value={numStep} min={1} max={128} step={1} onChange={setNumStep} display={(v) => `${v}`} />
          <SliderRow label="guidance_scale" value={guidance} min={0} max={20} step={0.1} onChange={setGuidance} display={(v) => v.toFixed(1)} />
          <SliderRow label="instruct_guidance_scale" value={instructGuidance} min={0} max={10} step={0.1} onChange={setInstructGuidance} display={(v) => v.toFixed(1)} />
          <div className="grid gap-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">seed (可选)</Label>
            <Input value={seed} onChange={(e) => setSeed(e.target.value.replace(/[^0-9]/g, ""))} placeholder="留空随机" />
          </div>
          <Button onClick={run} disabled={busy} size="lg">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            生成候选
          </Button>
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <PanelHeader title="Candidates" zh="候选音频" icon={<Play className="h-3.5 w-3.5" />} />
        <div className="space-y-3 p-4">
          {candidates.length === 0 ? (
            <div className="clay-inset flex h-48 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-5 w-5 opacity-50" />
              <span>生成后候选音频显示在这里</span>
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.map((c) => (
                <div key={c.index} className="rounded-md border border-border bg-card/50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="warning">候选 {c.index + 1}</Badge>
                    {c.audioBase64 ? (
                      <Button size="sm" variant="ghost" className="ml-auto" onClick={() => download(c)}>
                        <Download className="h-3.5 w-3.5" /> 下载
                      </Button>
                    ) : (
                      <span className="ml-auto text-[11px] text-muted-foreground">mock 占位</span>
                    )}
                  </div>
                  {c.url ? (
                    <audio src={c.url} controls className="w-full rounded-md" />
                  ) : (
                    <div className="flex h-10 items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Play className="h-3.5 w-3.5" /> mock 占位音频
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Panel>
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
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
        <span className="readout text-xs text-primary">{display(value)}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}
