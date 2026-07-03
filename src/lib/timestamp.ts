"use client";

import type { Alignment, TimestampEvent, TimestampResult } from "./types";
import { base64ToUint8Array, mimeForFormat } from "./client-media";

export interface ParsedEvent {
  event: TimestampEvent;
  audioBytes?: Uint8Array;
}

/**
 * Parse an SSE stream from /api/fish/tts-with-timestamp. Calls onEvent for
 * each parsed event and onProgress with the accumulated audio bytes length.
 * Returns the merged result.
 */
export async function parseTimestampStream(
  res: Response,
  format: string,
  onEvent?: (ev: TimestampEvent, audioBytes?: Uint8Array) => void,
  signal?: AbortSignal,
): Promise<TimestampResult> {
  if (!res.body) throw new Error("No response body for timestamp stream");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const audioChunks: Uint8Array[] = [];
  let latestAlignment: Alignment | null = null;
  const events: TimestampEvent[] = [];
  let content = "";

  while (true) {
    if (signal?.aborted) break;
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events separated by double newline.
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const rawEvent = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const lines = rawEvent.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const ev = JSON.parse(payload) as TimestampEvent;
          events.push(ev);
          if (typeof ev.content === "string") content += ev.content;
          if (ev.alignment) {
            // Replace snapshot (do not append).
            latestAlignment = ev.alignment as Alignment;
          }
          let audioBytes: Uint8Array | undefined;
          if (ev.audio_base64) {
            audioBytes = base64ToUint8Array(ev.audio_base64);
            // Append audio by arrival order.
            audioChunks.push(audioBytes);
          }
          onEvent?.(ev, audioBytes);
        } catch {
          /* ignore malformed line */
        }
      }
    }
  }

  const merged = new Blob(
    audioChunks.map((c) => c.slice()),
    { type: mimeForFormat(format) },
  );

  return {
    audioChunks,
    mergedAudio: merged,
    content,
    alignment: latestAlignment,
    events,
  };
}

/** Convert an alignment + content into SRT subtitle text. */
export function alignmentToSrt(
  content: string,
  alignment: Alignment | null,
): string {
  if (!alignment?.chars?.length) return "";
  const lines: string[] = [];
  let idx = 1;
  let segStart: number | undefined;
  let segEnd: number | undefined;
  let segText = "";

  const flush = () => {
    if (segText.trim() && segStart !== undefined && segEnd !== undefined) {
      lines.push(`${idx}`);
      lines.push(`${srtTime(segStart)} --> ${srtTime(segEnd)}`);
      lines.push(segText.trim());
      lines.push("");
      idx++;
    }
    segText = "";
    segStart = undefined;
    segEnd = undefined;
  };

  for (const c of alignment.chars) {
    if (c.char === undefined) continue;
    const isBreak = /[\s。！？!?.，,；;、]/.test(c.char);
    if (segStart === undefined && !isBreak) segStart = c.start;
    if (!isBreak) {
      segText += c.char;
      segEnd = c.end ?? c.start;
    } else if (segText.trim()) {
      segEnd = c.end ?? segEnd;
      flush();
    }
  }
  flush();
  // Reference content so unused var lint passes; not used directly.
  void content;
  return lines.join("\n");
}

export function alignmentToVtt(
  content: string,
  alignment: Alignment | null,
): string {
  const srt = alignmentToSrt(content, alignment);
  if (!srt) return "WEBVTT\n\n";
  return `WEBVTT\n\n${srt.replace(/^\d+\n/gm, "")}`;
}

function srtTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const ms = Math.round((sec % 1) * 1000);
  const total = Math.floor(sec);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

/** A flat timeline row for each character span. */
export interface TimelineRow {
  index: number;
  char: string;
  start: number;
  end: number;
  duration: number;
}

export function alignmentToTimeline(alignment: Alignment | null): TimelineRow[] {
  if (!alignment?.chars?.length) return [];
  const rows: TimelineRow[] = [];
  let i = 0;
  for (const c of alignment.chars) {
    if (c.char === undefined || c.start === undefined || c.end === undefined)
      continue;
    rows.push({
      index: i++,
      char: c.char,
      start: c.start,
      end: c.end,
      duration: Math.max(0, c.end - c.start),
    });
  }
  return rows;
}
