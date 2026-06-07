import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findHiringTaskById } from "@/lib/dbStore";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id;
    const body = await req.json();
    const { questions } = body;

    if (!taskId || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Missing required parameters." }, { status: 400 });
    }

    // 1. Live Production PostgreSQL Sync via Prisma
    if (process.env.DATABASE_URL && !taskId.startsWith("demo-") && !taskId.startsWith("task-")) {
      const dbClient = prisma as any;

      // Wrap in a transaction to perform a clean overwrite operation
      await dbClient.$transaction([
        // Delete all old aptitude questions associated with this specific task
        dbClient.question.deleteMany({
          where: { aptitudeTaskId: taskId }
        }),
        // Re-insert the updated question matrix structure matching your schema definitions
        ...questions.map((q: any) => dbClient.question.create({
          data: {
            section: q.section || "General Reasoning",
            text: q.text,
            aptitudeTaskId: taskId,
            options: {
              create: q.options.map((o: any) => ({
                text: o.text,
                isCorrect: o.isCorrect || false
              }))
            }
          }
        }))
      ]);

      console.log(`[DB_APTITUDE_SYNC] Overwrote question matrix on slot id: ${taskId}`);
      return NextResponse.json({ success: true, message: "Aptitude profile fully synced with database." });
    }

    // 2. Fallback for Memory Sandbox Mock States
    const matchedTask = await findHiringTaskById(taskId);
    if (matchedTask) {
      matchedTask.aptitudeQuestions = questions;
      console.log(`[SANDBOX_APTITUDE_SYNC] Synced changes in local sandbox memory for task: ${taskId}`);
      return NextResponse.json({ success: true, message: "Aptitude cache synced." });
    }

    return NextResponse.json({ error: "Target task index not found." }, { status: 404 });

  } catch (error: any) {
    console.error(`[API_APTITUDE_PUT_CRITICAL_FAILURE] ${error.message}`);
    return NextResponse.json({ error: "Internal system error processing question database update." }, { status: 500 });
  }
}