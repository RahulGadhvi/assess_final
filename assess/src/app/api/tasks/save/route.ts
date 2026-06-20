import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskRegistry } from "@/lib/dbStore";

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
    const companyName = typeof body.companyName === "string" ? body.companyName : undefined;

    if (!title || !location || !workType || !jdText) {
      return NextResponse.json({ error: "Missing core data parameters." }, { status: 400 });
    }

    const uniqueTaskId = "task_" + Math.random().toString(36).substring(2, 7);

    const normalizedAptitudeQuestions = normalizeQuestions(aptitudeQuestions, "General Reasoning");
    const normalizedDomainQuestions = normalizeQuestions(domainQuestions, "Domain Knowledge");
    const normalizedInterviewQuestions = (interviewContent ?? []).map((item, index) => ({
      id: item.id ?? `interview-${index}`,
      competency: item.competency,
      question: item.question,
      followUpProbe: item.followUpProbe,
      signalToLookFor: item.signalToLookFor,
    }));

    const formattedRecord: any = {
      id: uniqueTaskId,
      title,
      location,
      workType,
      jdText,
      date: new Date().toISOString().split("T")[0],
      candidatesCount: 0,
      completionRate: 0,
      status: "Active",
      aptitudeQuestions: normalizedAptitudeQuestions,
      domainQuestions: normalizedDomainQuestions,
      interviewQuestions: normalizedInterviewQuestions,
      candidates: []
    };

    if (process.env.DATABASE_URL) {
      const createdTask = await prisma.hiringTask.create({
        data: {
          title,
          location,
          workType,
          jdText,
          status: "Active",
          candidatesCount: 0,
          completionRate: 0,
          aptitudeQuestions: {
            create: normalizedAptitudeQuestions.map((q) => ({
              section: q.section || "General Reasoning",
              text: q.text,
              options: {
                create: (q.options || []).map((o) => ({
                  text: o.text,
                  isCorrect: o.isCorrect || false
                }))
              }
            }))
          },
          domainQuestions: {
            create: normalizedDomainQuestions.map((q) => ({
              section: q.section || "Domain Knowledge",
              text: q.text,
              options: {
                create: (q.options || []).map((o) => ({
                  text: o.text,
                  isCorrect: o.isCorrect || false
                }))
              }
            }))
          },
          interviewQuestions: {
            create: normalizedInterviewQuestions.map((i) => ({
              competency: i.competency,
              question: i.question,
              followUpProbe: i.followUpProbe,
              signalToLookFor: i.signalToLookFor
            }))
          },
          candidates: {
            create: []
          }
        }
      });

      console.log(`[PRISMA_SYNC] Fresh evaluation kit deployed cleanly onto PostgreSQL slot: ${createdTask.id}`);
      return NextResponse.json({ success: true, taskId: createdTask.id });
    }

    // attach simple company marker for in-memory registry if provided
    if (companyName) {
      formattedRecord.company = companyName;
    }

    taskRegistry.unshift(formattedRecord);
    console.log(`[STORE_SYNC] Clean sandbox task slot initialized in-memory: ${uniqueTaskId}`);

    return NextResponse.json({ success: true, taskId: uniqueTaskId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SAVE_ROUTE_CRITICAL_FAILURE] - ${message}`);
    return NextResponse.json({ error: "Internal processing tracking subsystem failure." }, { status: 500 });
  }
}