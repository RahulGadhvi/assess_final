import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ ok: true, message: "tRPC endpoint placeholder" });
}

export async function POST() {
  return NextResponse.json({ error: "tRPC endpoint is not configured" }, { status: 501 });
}
