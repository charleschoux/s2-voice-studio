import { NextRequest, NextResponse } from "next/server";
import { fishFetch, FishApiError, getDefaultModel } from "@/lib/server-config";
import { ttsFormSchema } from "@/lib/schemas";
import { pruneEmpty } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/fish/tts-with-timestamp
 * Forwards to `POST /v1/tts/stream/with-timestamp`. Returns the SSE stream
 * from Fish verbatim so the client can parse `data:` events.
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
      {
        status: 422,
        message: parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      },
      { status: 422 },
    );
  }
  const data = parsed.data;
  const model = data.model || getDefaultModel();

  const { model: _m, _msgpack: _f, ...rest } = data;
  void _m;
  void _f;
  const body = pruneEmpty(rest as Record<string, unknown>);

  try {
    const upstream = await fishFetch("/v1/tts/stream/with-timestamp", {
      method: "POST",
      modelHeader: model,
      headers: { "Content-Type": "application/json" },
      body: new TextEncoder().encode(JSON.stringify(body)) as unknown as BodyInit,
    });

    const ct = upstream.headers.get("content-type") || "text/event-stream";
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": ct,
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
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
