import { NextRequest, NextResponse } from "next/server";
import { fishFetch, FishApiError } from "@/lib/server-config";
import { modelPatchSchema } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Params {
  params: { id: string };
}

/** GET /api/fish/models/:id — fetch a single model. */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const res = await fishFetch(`/model/${encodeURIComponent(params.id)}`, {
      method: "GET",
    });
    const data = await res.json();
    return NextResponse.json(data);
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

/** PATCH /api/fish/models/:id — update title/description/visibility/tags/cover_image. */
export async function PATCH(req: NextRequest, { params }: Params) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ status: 400, message: "Invalid JSON" }, { status: 400 });
  }
  const parsed = modelPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { status: 422, message: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 422 },
    );
  }

  // PATCH /model expects multipart/form-data with cover_image as a file field
  // when present. For text-only fields we can still send multipart.
  const form = new FormData();
  const data = parsed.data;
  if (data.title !== undefined) form.set("title", data.title);
  if (data.description !== undefined) form.set("description", data.description);
  if (data.visibility !== undefined) form.set("visibility", data.visibility);
  if (data.tags !== undefined) {
    for (const t of data.tags) form.append("tags", t);
  }
  if (data.cover_image) {
    const bin = Buffer.from(data.cover_image, "base64");
    const blob = new Blob([bin], { type: "image/png" });
    form.append("cover_image", blob, "cover.png");
  }

  try {
    const res = await fishFetch(`/model/${encodeURIComponent(params.id)}`, {
      method: "PATCH",
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

/** DELETE /api/fish/models/:id — delete a model. */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await fishFetch(`/model/${encodeURIComponent(params.id)}`, {
      method: "DELETE",
    });
    return NextResponse.json({ ok: true });
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
