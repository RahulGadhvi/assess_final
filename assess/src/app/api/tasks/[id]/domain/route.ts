import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findHiringTaskById } from "@/lib/dbStore";

interface QuestionOption {
  id?: string;
  text: string;
  isCorrect?: boolean;
}

interface QuestionPayload {
  id?: string;
  section?: string;
  text: string;
  options?: QuestionOption[];
}

const normalizeQuestions = (questions: QuestionPayload[]) =>
  questions.map((question, index) => ({
    id: question.id ?? `question-${index}`,
    section: question.section ?? "Domain Knowledge",
    text: question.text,
    options: (question.options ?? []).map((option, optionIndex) => ({
      id: option.id ?? `option-${index}-${optionIndex}`,
      text: option.text,
      isCorrect: Boolean(option.isCorrect),
    })),
  }));

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id;
    const body = (await req.json()) as { questions?: QuestionPayload[] };
    const questions = body.questions ?? [];

    if (!taskId || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Missing required parameters." }, { status: 400 });
    }

    const normalizedQuestions = normalizeQuestions(questions);

    if (process.env.DATABASE_URL && !taskId.startsWith("demo-") && !taskId.startsWith("task-")) {
      await prisma.$transaction([
        prisma.question.deleteMany({
          where: { domainTaskId: taskId }
        }),
        ...normalizedQuestions.map((q) => prisma.question.create({
          data: {
            section: q.section || "Domain Knowledge",
            text: q.text,
            domainTaskId: taskId,
            options: {
              create: (q.options ?? []).map((o) => ({
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

    const matchedTask = await findHiringTaskById(taskId);
    if (matchedTask) {
      matchedTask.domainQuestions = normalizedQuestions as typeof matchedTask.domainQuestions;
      return NextResponse.json({ success: true, message: "Domain sandbox cache synced." });
    }

    return NextResponse.json({ error: "Target task missing." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[API_DOMAIN_PUT_CRITICAL_FAILURE] ${message}`);
    return NextResponse.json({ error: "Internal database server update failure." }, { status: 500 });
  }
}