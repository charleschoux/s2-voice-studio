import { NextRequest, NextResponse } from "next/server";
import { fishFetch, FishApiError, getDefaultModel } from "@/lib/server-config";
import { encodeMsgpack } from "@/lib/media";
import { ttsFormSchema } from "@/lib/schemas";
import { pruneEmpty } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/fish/tts
 * Forwards to Fish Audio `POST /v1/tts`.
 * Body: JSON matching ttsFormSchema, OR `{"_msgpack": true, ...}` when raw
 * binary references are present — the server re-encodes to MessagePack.
 *
 * Returns the raw audio blob with the same content-type Fish returned.
 * Supports HTTP streaming (chunked) by passing the response body straight through.
 */
export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json(
      { status: 400, message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const parsed = ttsFormSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { status: 422, message: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") },
      { status: 422 },
    );
  }
  const data = parsed.data;

  const model = data.model || getDefaultModel();
  const useMsgpack = (json as { _msgpack?: boolean } | null)?._msgpack === true;

  // Build the payload: everything except `model` (it is a header) and the
  // internal `_msgpack` flag.
  const { model: _omitModel, _msgpack: _omitFlag, ...rest } = data;
  void _omitModel;
  void _omitFlag;
  const body = pruneEmpty(rest as Record<string, unknown>);

  let bodyBytes: Uint8Array;
  let contentType: string;
  if (useMsgpack) {
    bodyBytes = encodeMsgpack(body);
    contentType = "application/msgpack";
  } else {
    bodyBytes = new TextEncoder().encode(JSON.stringify(body));
    contentType = "application/json";
  }

  try {
    const upstream = await fishFetch("/v1/tts", {
      method: "POST",
      modelHeader: model,
      headers: { "Content-Type": contentType },
      body: bodyBytes as unknown as BodyInit,
    });

    const ct = upstream.headers.get("content-type") || "audio/mpeg";
    // Stream the response body straight back to the client.
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
