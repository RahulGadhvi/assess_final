import { NextResponse } from "next/server";
import { taskRegistry } from "@/lib/dbStore";

export async function GET() {
  return NextResponse.json({ tasks: taskRegistry });
}