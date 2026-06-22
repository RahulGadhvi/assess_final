import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const taskId = (await params).id;
  try {
    const body = (await req.json()) as { name?: string };
    const name = body.name?.trim() ?? "";

    if (!taskId || !name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const task = await prisma.hiringTask.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        taskId,
        name: { equals: name, mode: "insensitive" },
      },
    });

    if (existingCandidate) {
      return NextResponse.json({ success: true, candidate: existingCandidate });
    }

    const candidate = await prisma.candidate.create({
      data: { name, taskId, overall: 0 },
    });

    return NextResponse.json({ success: true, candidate });
  } catch {
    return NextResponse.json({ error: "Failed to register candidate." }, { status: 500 });
  }
}
