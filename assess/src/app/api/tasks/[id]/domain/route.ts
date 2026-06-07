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

      // Wrap overwrite sequences safely in a transaction
      await dbClient.$transaction([
        dbClient.question.deleteMany({
          where: { domainTaskId: taskId }
        }),
        ...questions.map((q: any) => dbClient.question.create({
          data: {
            section: q.section || "Domain Knowledge",
            text: q.text,
            domainTaskId: taskId,
            options: {
              create: q.options.map((o: any) => ({
                text: o.text,
                isCorrect: o.isCorrect || false
              }))
            }
          }
        }))
      ]);

      console.log(`[DB_DOMAIN_SYNC] Overwrote challenge matrix rows on task id: ${taskId}`);
      return NextResponse.json({ success: true, message: "Domain profile synced successfully." });
    }

    // 2. Local Fallback Sandbox Cache Overwrite
    const matchedTask = await findHiringTaskById(taskId);
    if (matchedTask) {
      matchedTask.domainQuestions = questions;
      return NextResponse.json({ success: true, message: "Domain sandbox cache synced." });
    }

    return NextResponse.json({ error: "Target task missing." }, { status: 404 });

  } catch (error: any) {
    console.error(`[API_DOMAIN_PUT_CRITICAL_FAILURE] ${error.message}`);
    return NextResponse.json({ error: "Internal database server update failure." }, { status: 500 });
  }
}