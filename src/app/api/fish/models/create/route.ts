import { NextRequest, NextResponse } from "next/server";
import { fishFetch, FishApiError } from "@/lib/server-config";
import { modelCreateSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/fish/models/create
 * Persistent voice clone via `POST /model` multipart/form-data.
 * The client sends JSON with base64-encoded audio files; we reconstruct
 * multipart on the server so we never let the browser build multipart with
 * a manual boundary.
 *
 * Body (JSON):
 *  { title, description?, visibility, train_mode, texts?, tags?,
 *    enhance_audio_quality, generate_sample,
 *    voices: [{ filename, mime, base64 }] }
 */
export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ status: 400, message: "Invalid JSON" }, { status: 400 });
  }

  const voices = (json as { voices?: unknown }).voices;
  if (!Array.isArray(voices) || voices.length === 0) {
    return NextResponse.json(
      { status: 422, message: "至少需要上传一个参考音频 (voices)" },
      { status: 422 },
    );
  }

  const parsed = modelCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { status: 422, message: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 422 },
    );
  }
  const data = parsed.data;

  const form = new FormData();
  form.set("type", data.type);
  form.set("title", data.title);
  if (data.description) form.set("description", data.description);
  form.set("visibility", data.visibility);
  form.set("train_mode", data.train_mode);
  form.set("enhance_audio_quality", String(data.enhance_audio_quality));
  form.set("generate_sample", String(data.generate_sample));
  if (data.texts && data.texts.length) {
    for (const t of data.texts) form.append("texts", t);
  }
  if (data.tags && data.tags.length) {
    for (const t of data.tags) form.append("tags", t);
  }

  for (const v of voices as { filename: string; mime: string; base64: string }[]) {
    if (!v?.base64 || !v?.filename) continue;
    const bin = Buffer.from(v.base64, "base64");
    const blob = new Blob([bin], { type: v.mime || "audio/wav" });
    form.append("voices", blob, v.filename);
  }

  try {
    const res = await fishFetch("/model", {
      method: "POST",
      body: form as unknown as BodyInit,
    });
    const out = await res.json();
    return NextResponse.json(out);
  } catch (err) {
    if (err instanceof FishApiError) {
      return NextResponse.json(
        { status: err.status, message: err.message, raw: err.raw },
        { status: err.status },
      );
    }
    return NextResponse.json(
      { status: 500, message: (err as Error).message },
      { status: 500 },
    );
  }
}
