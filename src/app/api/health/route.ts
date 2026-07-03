import { NextResponse } from "next/server";
import { getApiKey, getDefaultModel } from "@/lib/server-config";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    hasApiKey: !!getApiKey(),
    defaultModel: getDefaultModel(),
    timestamp: new Date().toISOString(),
  });
}
