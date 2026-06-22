import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: taskId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { questions?: QuestionPayload[] };
    const questions = body.questions ?? [];

    if (!taskId || !Array.isArray(questions)) {
      return NextResponse.json({ error: "Missing required parameters." }, { status: 400 });
    }

    const task = await prisma.hiringTask.findUnique({ where: { id: taskId } });
    if (!task || task.employerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
    }

    const normalizedQuestions = normalizeQuestions(questions);

    await prisma.$transaction([
      prisma.question.deleteMany({ where: { aptitudeTaskId: taskId } }),
      ...normalizedQuestions.map((q) =>
        prisma.question.create({
          data: {
            section: q.section,
            text: q.text,
            aptitudeTaskId: taskId,
            options: {
              create: q.options.map((o) => ({
                text: o.text,
                isCorrect: o.isCorrect,
              })),
            },
          },
        })
      ),
    ]);

    return NextResponse.json({ success: true, message: "Aptitude questions updated." });
  } catch {
    return NextResponse.json({ error: "Failed to update aptitude questions." }, { status: 500 });
  }
}
