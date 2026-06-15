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
    section: question.section ?? "General Reasoning",
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
          where: { aptitudeTaskId: taskId }
        }),
        ...normalizedQuestions.map((q) => prisma.question.create({
          data: {
            section: q.section || "General Reasoning",
            text: q.text,
            aptitudeTaskId: taskId,
            options: {
              create: (q.options ?? []).map((o) => ({
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

    const matchedTask = await findHiringTaskById(taskId);
    if (matchedTask) {
      matchedTask.aptitudeQuestions = normalizedQuestions as typeof matchedTask.aptitudeQuestions;
      console.log(`[SANDBOX_APTITUDE_SYNC] Synced changes in local sandbox memory for task: ${taskId}`);
      return NextResponse.json({ success: true, message: "Aptitude cache synced." });
    }

    return NextResponse.json({ error: "Target task index not found." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[API_APTITUDE_PUT_CRITICAL_FAILURE] ${message}`);
    return NextResponse.json({ error: "Internal system error processing question database update." }, { status: 500 });
  }
}