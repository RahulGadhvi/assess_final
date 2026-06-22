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

const normalizeQuestions = (questions: QuestionPayload[] | undefined, fallbackSection: string) =>
  (questions ?? []).map((question, index) => ({
    id: question.id ?? `question-${index}`,
    section: question.section ?? fallbackSection,
    text: question.text,
    options: (question.options ?? []).map((option, optionIndex) => ({
      id: option.id ?? `option-${index}-${optionIndex}`,
      text: option.text,
      isCorrect: Boolean(option.isCorrect),
    })),
  }));

interface InterviewPayload {
  id?: string;
  competency: string;
  question: string;
  followUpProbe: string;
  signalToLookFor: string;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      title?: string;
      location?: string;
      workType?: string;
      jdText?: string;
      aptitudeQuestions?: QuestionPayload[];
      domainQuestions?: QuestionPayload[];
      interviewContent?: InterviewPayload[];
    };
    const { title, location, workType, jdText, aptitudeQuestions, domainQuestions, interviewContent } = body;

    if (!title || !location || !workType || !jdText) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const normalizedAptitudeQuestions = normalizeQuestions(aptitudeQuestions, "General Reasoning");
    const normalizedDomainQuestions = normalizeQuestions(domainQuestions, "Domain Knowledge");
    const normalizedInterviewQuestions = (interviewContent ?? []).map((item, index) => ({
      id: item.id ?? `interview-${index}`,
      competency: item.competency,
      question: item.question,
      followUpProbe: item.followUpProbe,
      signalToLookFor: item.signalToLookFor,
    }));

    const createdTask = await prisma.hiringTask.create({
      data: {
        title,
        location,
        workType,
        jdText,
        status: "Active",
        candidatesCount: 0,
        completionRate: 0,
        employerId: session.user.id,
        aptitudeQuestions: {
          create: normalizedAptitudeQuestions.map((q) => ({
            section: q.section,
            text: q.text,
            options: {
              create: q.options.map((o) => ({
                text: o.text,
                isCorrect: o.isCorrect,
              })),
            },
          })),
        },
        domainQuestions: {
          create: normalizedDomainQuestions.map((q) => ({
            section: q.section,
            text: q.text,
            options: {
              create: q.options.map((o) => ({
                text: o.text,
                isCorrect: o.isCorrect,
              })),
            },
          })),
        },
        interviewQuestions: {
          create: normalizedInterviewQuestions.map((i) => ({
            competency: i.competency,
            question: i.question,
            followUpProbe: i.followUpProbe,
            signalToLookFor: i.signalToLookFor,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, taskId: createdTask.id });
  } catch {
    return NextResponse.json({ error: "Failed to save task." }, { status: 500 });
  }
}
