import { NextRequest, NextResponse } from "next/server";
import { fishFetch, FishApiError, getDefaultModel } from "@/lib/server-config";
import { encodeMsgpack } from "@/lib/media";
import { pruneEmpty } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/fish/models/upload-msgpack
 * Instant voice clone for TTS: instead of cloning a persistent model, pass
 * `references` (raw audio + transcript) directly to /v1/tts. Because JSON
 * cannot carry raw binary, this endpoint re-encodes the request as
 * MessagePack before forwarding.
 *
 * Body (JSON):
 *  { model?, text, references: [{ filename, mime, base64, text?, audio_format?, sample_rate? }],
 *    ...other TTS params }
 */
export async function POST(req: NextRequest) {
  let json: Record<string, unknown>;
  try {
    json = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ status: 400, message: "Invalid JSON" }, { status: 400 });
  }

  const model = (json.model as string) || getDefaultModel();
  const refsIn = json.references;
  if (!Array.isArray(refsIn) || refsIn.length === 0) {
    return NextResponse.json(
      { status: 422, message: "references 必填且为非空数组" },
      { status: 422 },
    );
  }
  if (typeof json.text !== "string" || !json.text) {
    return NextResponse.json(
      { status: 422, message: "text 必填" },
      { status: 422 },
    );
  }

  // Build references with raw bytes for MessagePack.
  const references = (refsIn as {
    base64: string;
    text?: string;
    audio_format?: string;
    sample_rate?: number;
  }[]).map((r) => {
    const bin = Buffer.from(r.base64, "base64");
    const out: Record<string, unknown> = {
      audio: new Uint8Array(bin.buffer, bin.byteOffset, bin.byteLength),
    };
    if (r.text) out.text = r.text;
    if (r.audio_format) out.audio_format = r.audio_format;
    if (r.sample_rate) out.sample_rate = r.sample_rate;
    return out;
  });

  const { model: _m, references: _r, ...rest } = json;
  void _m;
  void _r;
  const payload = pruneEmpty({
    ...rest,
    references,
  });

  const bodyBytes = encodeMsgpack(payload);

  try {
    const upstream = await fishFetch("/v1/tts", {
      method: "POST",
      modelHeader: model,
      headers: { "Content-Type": "application/msgpack" },
      body: bodyBytes as unknown as BodyInit,
    });
    const ct = upstream.headers.get("content-type") || "audio/mpeg";
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "no-store",
        "X-Fish-Model": model,
      },
    });
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
