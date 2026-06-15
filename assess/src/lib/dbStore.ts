import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  section: string;
  text: string;
  options: Option[];
}

export interface InterviewQuestion {
  id: string;
  competency: string;
  question: string;
  followUpProbe: string;
  signalToLookFor: string;
}

export interface Candidate {
  id: string;
  name: string;
  aptScore: number | null;
  domScore: number | null;
  intScore: number | null;
  overall: number | null;
}

export interface HiringTask {
  id: string;
  title: string;
  location: string;
  workType: string;
  jdText: string;
  date: string;
  candidatesCount: number;
  completionRate: number;
  status: string;
  aptitudeQuestions: Question[];
  domainQuestions: Question[];
  interviewQuestions: InterviewQuestion[];
  candidates: Candidate[];
}

type HiringTaskWithRelations = Prisma.HiringTaskGetPayload<{
  include: {
    aptitudeQuestions: { include: { options: true } };
    domainQuestions: { include: { options: true } };
    interviewQuestions: true;
    candidates: true;
  };
}>;

const formatDate = (value: Date | string | null | undefined): string => {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  if (typeof value === "string") {
    return new Date(value).toISOString().split("T")[0];
  }

  return new Date().toISOString().split("T")[0];
};

const mapTask = (task: HiringTaskWithRelations): HiringTask => ({
  id: task.id,
  title: task.title,
  location: task.location,
  workType: task.workType,
  jdText: task.jdText,
  date: formatDate(task.date),
  candidatesCount: task.candidatesCount,
  completionRate: task.completionRate,
  status: task.status,
  aptitudeQuestions: (task.aptitudeQuestions ?? []).map((question) => ({
    id: question.id,
    section: question.section,
    text: question.text,
    options: (question.options ?? []).map((option) => ({
      id: option.id,
      text: option.text,
      isCorrect: option.isCorrect,
    })),
  })),
  domainQuestions: (task.domainQuestions ?? []).map((question) => ({
    id: question.id,
    section: question.section,
    text: question.text,
    options: (question.options ?? []).map((option) => ({
      id: option.id,
      text: option.text,
      isCorrect: option.isCorrect,
    })),
  })),
  interviewQuestions: (task.interviewQuestions ?? []).map((question) => ({
    id: question.id,
    competency: question.competency,
    question: question.question,
    followUpProbe: question.followUpProbe,
    signalToLookFor: question.signalToLookFor,
  })),
  candidates: (task.candidates ?? []).map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    aptScore: candidate.aptScore,
    domScore: candidate.domScore,
    intScore: candidate.intScore,
    overall: candidate.overall,
  })),
});

const globalForStore = globalThis as unknown as {
  taskRegistry: HiringTask[] | undefined;
};

if (!globalForStore.taskRegistry) {
  globalForStore.taskRegistry = [
    {
      id: "task-1",
      title: "Senior Product Designer",
      location: "Bengaluru, India",
      workType: "Hybrid",
      jdText: "Design scalable design systems and manage cross-functional UI projects.",
      date: "2026-06-01",
      candidatesCount: 3,
      completionRate: 68,
      status: "Active",
      aptitudeQuestions: [],
      domainQuestions: [],
      interviewQuestions: [],
      candidates: [
        { id: "c1", name: "Aisha Patel", aptScore: 85, domScore: 92, intScore: 88, overall: 88 },
        { id: "c2", name: "Rahul Singh", aptScore: 65, domScore: null, intScore: null, overall: 65 },
        { id: "c3", name: "Priya Sharma", aptScore: 35, domScore: 40, intScore: 45, overall: 40 },
      ]
    },
    {
      id: "task-2",
      title: "Backend Engineer (Go)",
      location: "Remote",
      workType: "Full-time",
      jdText: "Optimize concurrent database processing algorithms and build distributed pub/sub channels.",
      date: "2026-05-28",
      candidatesCount: 2,
      completionRate: 45,
      status: "Active",
      aptitudeQuestions: [],
      domainQuestions: [],
      interviewQuestions: [],
      candidates: [
        { id: "c4", name: "Arjun Mehta", aptScore: 90, domScore: 88, intScore: 95, overall: 91 },
        { id: "c5", name: "Kavita Rao", aptScore: 72, domScore: 70, intScore: 68, overall: 70 },
      ]
    }
  ];
}

export const taskRegistry = globalForStore.taskRegistry;

/**
 * Data Access Layer helper engines to abstract in-memory state scaling
 * cleanly away into production Prisma pools dynamically.
 */
export async function getAllHiringTasks(employerId?: string): Promise<HiringTask[]> {
  if (process.env.DATABASE_URL) {
    try {
      const tasks = await prisma.hiringTask.findMany({
        where: employerId ? { employerId } : {},
        include: {
          aptitudeQuestions: { include: { options: true } },
          domainQuestions: { include: { options: true } },
          interviewQuestions: true,
          candidates: true,
        },
        orderBy: { date: "desc" },
      });

      return tasks.map(mapTask);
    } catch (error) {
      console.error("[DB_STORE_DAL_ERROR] Falling back to memory registry initialization loop", error);
    }
  }
  return taskRegistry;
}

export async function findHiringTaskById(id: string): Promise<HiringTask | null> {
  if (process.env.DATABASE_URL && !id.startsWith("demo-") && !id.startsWith("task-")) {
    try {
      const task = await prisma.hiringTask.findUnique({
        where: { id },
        include: {
          aptitudeQuestions: { include: { options: true } },
          domainQuestions: { include: { options: true } },
          interviewQuestions: true,
          candidates: true,
        },
      });
      if (task) {
        return mapTask(task);
      }
    } catch (error) {
      console.error(`[DB_STORE_FIND_ERROR] Verification fallback on trace id: ${id}`, error);
    }
  }
  return taskRegistry.find((task) => task.id === id) || null;
}