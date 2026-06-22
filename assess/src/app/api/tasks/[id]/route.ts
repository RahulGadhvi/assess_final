import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findHiringTaskById } from "@/lib/dbStore";
import { auth } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const matchedTask = await findHiringTaskById(id);
    if (!matchedTask) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, task: matchedTask });
  } catch {
    return NextResponse.json({ error: "Failed to fetch task." }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const task = await prisma.hiringTask.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }
    if (task.employerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    await prisma.hiringTask.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Task deleted." });
  } catch {
    return NextResponse.json({ error: "Failed to delete task." }, { status: 500 });
  }
}
