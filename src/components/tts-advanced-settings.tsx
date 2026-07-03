"use client";

import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  AUDIO_FORMATS,
  LATENCY_MODES,
  MP3_BITRATES,
  OPUS_BITRATES,
  SAMPLE_RATES_BY_FORMAT,
  TTS_MODELS,
} from "@/lib/constants";
import type { TtsForm } from "@/lib/schemas";
import { defaultSampleRateFor } from "@/lib/form-defaults";

interface Props {
  form: TtsForm;
  setForm: React.Dispatch<React.SetStateAction<TtsForm>>;
}

export function TtsAdvancedSettings({ form, setForm }: Props) {
  const set = <K extends keyof TtsForm>(key: K, v: TtsForm[K]) =>
    setForm((p) => ({ ...p, [key]: v }));

  const setProsody = (key: "speed" | "volume" | "normalize_loudness", v: number | boolean) =>
    setForm((p) => ({ ...p, prosody: { ...p.prosody, [key]: v } }));

  const allowedRates = SAMPLE_RATES_BY_FORMAT[form.format] || [44100];

  return (
    <Accordion type="multiple" defaultValue={["model"]} className="w-full">
      <AccordionItem value="model">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            模型与格式
            <Badge variant="soft" className="text-[10px]">{form.model}</Badge>
          </span>
        </AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div className="grid gap-2">
            <Label>模型 (header)</Label>
            <Select value={form.model} onValueChange={(v) => set("model", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TTS_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2">
                      {m.label}
                      {m.free && (
                        <Badge variant="success" className="text-[10px]">free</Badge>
                      )}
                      {m.recommended && (
                        <Badge variant="secondary" className="text-[10px]">推荐</Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {TTS_MODELS.find((m) => m.id === form.model)?.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>format</Label>
              <Select
                value={form.format}
                onValueChange={(v) => {
                  const fmt = v as TtsForm["format"];
                  const sr = defaultSampleRateFor(fmt);
                  setForm((p) => ({
                    ...p,
                    format: fmt,
                    sample_rate: allowedRatesFor(fmt).includes(p.sample_rate || 0)
                      ? p.sample_rate
                      : sr,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIO_FORMATS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>sample_rate</Label>
              <Select
                value={String(form.sample_rate)}
                onValueChange={(v) => set("sample_rate", Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedRates.map((r) => (
                    <SelectItem key={r} value={String(r)}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.format === "mp3" && (
            <div className="grid gap-2">
              <Label>mp3_bitrate</Label>
              <Select
                value={String(form.mp3_bitrate)}
                onValueChange={(v) => set("mp3_bitrate", Number(v) as TtsForm["mp3_bitrate"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MP3_BITRATES.map((b) => (
                    <SelectItem key={b} value={String(b)}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {form.format === "opus" && (
            <div className="grid gap-2">
              <Label>opus_bitrate (-1000 = auto)</Label>
              <Select
                value={String(form.opus_bitrate)}
                onValueChange={(v) => set("opus_bitrate", Number(v) as TtsForm["opus_bitrate"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPUS_BITRATES.map((b) => (
                    <SelectItem key={b} value={String(b)}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-2">
            <Label>latency</Label>
            <Select value={form.latency} onValueChange={(v) => set("latency", v as TtsForm["latency"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LATENCY_MODES.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              “实时对话”预设使用 balanced。
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="prosody">
        <AccordionTrigger>韵律 / Prosody</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <SliderRow
            label="speed"
            value={form.prosody?.speed ?? 1}
            min={0.5}
            max={2}
            step={0.01}
            onChange={(v) => setProsody("speed", v)}
            display={(v) => `${v.toFixed(2)}×`}
          />
          <SliderRow
            label="volume (dB)"
            value={form.prosody?.volume ?? 0}
            min={-20}
            max={20}
            step={1}
            onChange={(v) => setProsody("volume", v)}
            display={(v) => `${v > 0 ? "+" : ""}${v} dB`}
          />
          <ToggleRow
            id="nl"
            label="normalize_loudness"
            hint="默认 true"
            checked={form.prosody?.normalize_loudness ?? true}
            onChange={(c) => setProsody("normalize_loudness", c)}
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="sampling">
        <AccordionTrigger>采样 / Sampling</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <SliderRow
            label="temperature"
            value={form.temperature ?? 0.7}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => set("temperature", v)}
            display={(v) => v.toFixed(2)}
          />
          <SliderRow
            label="top_p"
            value={form.top_p ?? 0.7}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => set("top_p", v)}
            display={(v) => v.toFixed(2)}
          />
          <SliderRow
            label="repetition_penalty"
            value={form.repetition_penalty ?? 1.2}
            min={0.5}
            max={3}
            step={0.01}
            onChange={(v) => set("repetition_penalty", v)}
            display={(v) => v.toFixed(2)}
          />
          <SliderRow
            label="early_stop_threshold"
            value={form.early_stop_threshold ?? 1}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => set("early_stop_threshold", v)}
            display={(v) => v.toFixed(2)}
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="chunking">
        <AccordionTrigger>分块 / Chunking</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <SliderRow
            label="chunk_length"
            value={form.chunk_length ?? 300}
            min={100}
            max={300}
            step={10}
            onChange={(v) => set("chunk_length", v)}
            display={(v) => `${v}`}
          />
          <SliderRow
            label="min_chunk_length"
            value={form.min_chunk_length ?? 50}
            min={0}
            max={100}
            step={5}
            onChange={(v) => set("min_chunk_length", v)}
            display={(v) => `${v}`}
          />
          <SliderRow
            label="max_new_tokens"
            value={form.max_new_tokens ?? 1024}
            min={128}
            max={2048}
            step={64}
            onChange={(v) => set("max_new_tokens", v)}
            display={(v) => `${v}`}
          />
          <ToggleRow
            id="cop"
            label="condition_on_previous_chunks"
            hint="默认 true"
            checked={form.condition_on_previous_chunks ?? true}
            onChange={(c) => set("condition_on_previous_chunks", c)}
          />
          <ToggleRow
            id="norm"
            label="normalize"
            hint="false 时完全保留数字/URL/周边文本（音素模板场景）"
            checked={form.normalize ?? true}
            onChange={(c) => set("normalize", c)}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function allowedRatesFor(format: string): number[] {
  return SAMPLE_RATES_BY_FORMAT[format] || [44100];
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="min-w-0">
        <Label htmlFor={id}>{label}</Label>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
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
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-muted-foreground">
            {display(value)}
          </span>
          <Input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) onChange(n);
            }}
            className="h-7 w-20 text-xs"
          />
        </div>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}
