import { NextRequest, NextResponse } from "next/server";
import { fishFetch, FishApiError } from "@/lib/server-config";
import { modelQuerySchema } from "@/lib/schemas";
import type { VoiceModel } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/fish/models — proxy GET /model with query params. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    params[k] = v;
  });

  const parsed = modelQuerySchema.safeParse({
    page_size: params.page_size ? Number(params.page_size) : undefined,
    page_number: params.page_number ? Number(params.page_number) : undefined,
    title: params.title,
    tag: params.tag,
    self: params.self === "true" ? true : params.self === "false" ? false : undefined,
    author_id: params.author_id,
    language: params.language,
    title_language: params.title_language,
    sort_by: params.sort_by,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { status: 422, message: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 422 },
    );
  }

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined || v === null || v === "") continue;
    qs.set(k, String(v));
  }
  const path = `/model${qs.toString() ? `?${qs.toString()}` : ""}`;

  try {
    const res = await fishFetch(path, { method: "GET" });
    const data = await res.json();
    // Fish returns either an array or { items, ... }; normalize.
    const items: VoiceModel[] = Array.isArray(data)
      ? data
      : Array.isArray((data as { items?: VoiceModel[] }).items)
        ? (data as { items: VoiceModel[] }).items
        : [];
    return NextResponse.json({ items, raw: data });
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
