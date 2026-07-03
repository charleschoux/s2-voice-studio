"use client";

import type { TtsForm } from "./schemas";

export type SplitMode = "paragraph" | "sentences" | "chars";

export function splitText(text: string, mode: SplitMode, size: number): string[] {
  if (!text.trim()) return [];
  switch (mode) {
    case "paragraph":
      return text
        .split(/\n{1,}/)
        .map((s) => s.trim())
        .filter(Boolean);
    case "sentences":
      return chunkBySentences(text, size);
    case "chars":
    default: {
      const out: string[] = [];
      let i = 0;
      while (i < text.length) {
        out.push(text.slice(i, i + size));
        i += size;
      }
      return out.filter(Boolean);
    }
  }
}

function chunkBySentences(text: string, maxChars: number): string[] {
  const sentences = text
    .split(/(?<=[。！？!?.\n])\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if ((buf + s).length > maxChars && buf) {
      out.push(buf);
      buf = s;
    } else {
      buf = (buf + " " + s).trim();
    }
    if (buf.length >= maxChars) {
      out.push(buf);
      buf = "";
    }
  }
  if (buf) out.push(buf);
  return out;
}

export interface BatchTaskState {
  id: string;
  index: number;
  text: string;
  status: "pending" | "running" | "done" | "error" | "retry";
  attempts: number;
  error?: string;
  audioUrl?: string;
  audioBlob?: Blob;
  durationMs?: number;
  responseBytes?: number;
}

export interface BatchRunResult {
  tasks: BatchTaskState[];
  blobs: Blob[];
  metas: { index: number; text: string; durationMs?: number; responseBytes?: number; error?: string }[];
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Run batch with bounded concurrency + exponential backoff on 429/5xx. */
export async function runBatch(
  form: TtsForm,
  chunks: string[],
  opts: {
    concurrency: number;
    maxRetries: number;
    backoffBaseMs: number;
    mock: boolean;
    onTask: (task: BatchTaskState) => void;
    signal?: AbortSignal;
  },
): Promise<BatchRunResult> {
  const tasks: BatchTaskState[] = chunks.map((text, index) => ({
    id: `batch-${index}`,
    index,
    text,
    status: "pending",
    attempts: 0,
  }));
  const blobs: Blob[] = new Array(chunks.length).fill(null);
  const metas: BatchRunResult["metas"] = new Array(chunks.length).fill(null).map((_, i) => ({
    index: i,
    text: chunks[i],
  }));

  let cursor = 0;
  let active = 0;
  let resolveDone: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));

  const launch = async (task: BatchTaskState) => {
    active++;
    task.status = "running";
    task.attempts = 0;
    opts.onTask({ ...task });
    const start = performance.now();
    while (task.attempts <= opts.maxRetries) {
      if (opts.signal?.aborted) {
        task.status = "error";
        task.error = "aborted";
        opts.onTask({ ...task });
        break;
      }
      try {
        let blob: Blob;
        if (opts.mock) {
          await sleep(120);
          blob = makeMockBatchBlob(task.text);
        } else {
          const res = await fetch("/api/fish/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...form, text: task.text }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            const status = res.status;
            if ((status === 429 || status >= 500) && task.attempts < opts.maxRetries) {
              task.attempts++;
              task.status = "retry";
              const delay = opts.backoffBaseMs * Math.pow(2, task.attempts);
              opts.onTask({ ...task });
              await sleep(delay);
              continue;
            }
            throw new Error(err.message || `HTTP ${status}`);
          }
          blob = await res.blob();
        }
        task.status = "done";
        task.audioBlob = blob;
        task.audioUrl = URL.createObjectURL(blob);
        task.responseBytes = blob.size;
        task.durationMs = performance.now() - start;
        blobs[task.index] = blob;
        metas[task.index] = {
          index: task.index,
          text: task.text,
          durationMs: task.durationMs,
          responseBytes: blob.size,
        };
        opts.onTask({ ...task });
        break;
      } catch (e) {
        task.attempts++;
        if (task.attempts > opts.maxRetries) {
          task.status = "error";
          task.error = (e as Error).message;
          metas[task.index] = {
            index: task.index,
            text: task.text,
            error: task.error,
          };
          opts.onTask({ ...task });
          break;
        }
        const delay = opts.backoffBaseMs * Math.pow(2, task.attempts);
        task.status = "retry";
        opts.onTask({ ...task });
        await sleep(delay);
      }
    }
    active--;
    pump();
  };

  const pump = () => {
    while (active < opts.concurrency && cursor < tasks.length) {
      const t = tasks[cursor++];
      launch(t);
    }
    if (active === 0 && cursor >= tasks.length) {
      resolveDone();
    }
  };
  pump();
  await done;
  return { tasks, blobs, metas };
}

function makeMockBatchBlob(text: string): Blob {
  const framesNeeded = Math.max(2, Math.min(80, Math.ceil(text.length / 6)));
  const frame = new Uint8Array([
    0xff, 0xfb, 0x90, 0x44, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
  const buf = new Uint8Array(frame.length * framesNeeded);
  for (let i = 0; i < framesNeeded; i++) buf.set(frame, i * frame.length);
  return new Blob([buf], { type: "audio/mpeg" });
}
