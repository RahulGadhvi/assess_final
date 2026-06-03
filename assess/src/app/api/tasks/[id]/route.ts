import { NextResponse } from "next/server";
import { taskRegistry } from "@/lib/dbStore";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const targetId = params.id;
  const match = taskRegistry.find(t => t.id === targetId);

  if (!match) {
    return NextResponse.json({ error: "Assessment track record not found." }, { status: 404 });
  }

  return NextResponse.json({ task: match });
}