import { NextRequest, NextResponse } from "next/server";
import { fishFetch, FishApiError } from "@/lib/server-config";
import { asrSchema } from "@/lib/schemas";
import { pruneEmpty } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/fish/asr — proxy `POST /v1/asr`.
 * Body (JSON): { audio: { filename, mime, base64 }, language?, ignore_start_end?, use_itn? }
 * Note: ASR is a separately billed endpoint.
 */
export async function POST(req: NextRequest) {
  let json: Record<string, unknown>;
  try {
    json = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ status: 400, message: "Invalid JSON" }, { status: 400 });
  }

  const audio = json.audio as { base64?: string; filename?: string; mime?: string } | undefined;
  if (!audio?.base64) {
    return NextResponse.json(
      { status: 422, message: "audio.base64 必填" },
      { status: 422 },
    );
  }

  const parsed = asrSchema.safeParse({
    language: json.language,
    ignore_start_end: json.ignore_start_end,
    use_itn: json.use_itn,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { status: 422, message: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 422 },
    );
  }

  const form = new FormData();
  const bin = Buffer.from(audio.base64, "base64");
  const blob = new Blob([bin], { type: audio.mime || "audio/wav" });
  form.append("audio", blob, audio.filename || "audio.wav");
  const opts = pruneEmpty(parsed.data as Record<string, unknown>);
  for (const [k, v] of Object.entries(opts)) {
    form.append(k, String(v));
  }

  try {
    const res = await fishFetch("/v1/asr", {
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
