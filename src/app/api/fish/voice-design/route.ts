import { NextRequest, NextResponse } from "next/server";
import { fishFetch, FishApiError } from "@/lib/server-config";
import { VOICE_DESIGN_MODEL } from "@/lib/constants";
import { voiceDesignSchema } from "@/lib/schemas";
import { pruneEmpty } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/fish/voice-design — proxy `POST /v1/voice-design`.
 * Header `model: voice-design-1`. Note: this is a separately billed endpoint,
 * NOT free TTS.
 */
export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ status: 400, message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = voiceDesignSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { status: 422, message: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 422 },
    );
  }

  const body = pruneEmpty(parsed.data as Record<string, unknown>);

  try {
    const res = await fishFetch("/v1/voice-design", {
      method: "POST",
      modelHeader: VOICE_DESIGN_MODEL,
      headers: { "Content-Type": "application/json" },
      body: new TextEncoder().encode(JSON.stringify(body)) as unknown as BodyInit,
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
