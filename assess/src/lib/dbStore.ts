import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

type TaskWithRelations = Prisma.HiringTaskGetPayload<{
  include: {
    aptitudeQuestions: { include: { options: true } };
    domainQuestions: { include: { options: true } };
    interviewQuestions: true;
    candidates: true;
  };
}>;

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
  notes: string;
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
  employerId?: string;
  aptitudeQuestions: Question[];
  domainQuestions: Question[];
  interviewQuestions: InterviewQuestion[];
  candidates: Candidate[];
}

const formatDate = (value: Date | string | null | undefined): string => {
  if (value instanceof Date) return value.toISOString().split("T")[0];
  if (typeof value === "string") return new Date(value).toISOString().split("T")[0];
  return new Date().toISOString().split("T")[0];
};

const mapTask = (task: TaskWithRelations): HiringTask => ({
  id: task.id,
  title: task.title,
  location: task.location,
  workType: task.workType,
  jdText: task.jdText,
  date: formatDate(task.date),
  candidatesCount: task.candidatesCount,
  completionRate: task.completionRate,
  status: task.status,
  employerId: task.employerId ?? undefined,
  aptitudeQuestions: (task.aptitudeQuestions ?? []).map((q) => ({
    id: q.id,
    section: q.section,
    text: q.text,
    options: (q.options ?? []).map((o) => ({
      id: o.id,
      text: o.text,
      isCorrect: o.isCorrect,
    })),
  })),
  domainQuestions: (task.domainQuestions ?? []).map((q) => ({
    id: q.id,
    section: q.section,
    text: q.text,
    options: (q.options ?? []).map((o) => ({
      id: o.id,
      text: o.text,
      isCorrect: o.isCorrect,
    })),
  })),
  interviewQuestions: (task.interviewQuestions ?? []).map((q) => ({
    id: q.id,
    competency: q.competency,
    question: q.question,
    followUpProbe: q.followUpProbe,
    signalToLookFor: q.signalToLookFor,
  })),
  candidates: (task.candidates ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    aptScore: c.aptScore,
    domScore: c.domScore,
    intScore: c.intScore,
    overall: c.overall,
    notes: c.notes ?? "",
  })),
});

export async function getAllHiringTasks(employerId?: string): Promise<HiringTask[]> {
  const whereClause = employerId ? { employerId } : {};
  const tasks = await prisma.hiringTask.findMany({
    where: whereClause,
    include: {
      aptitudeQuestions: { include: { options: true } },
      domainQuestions: { include: { options: true } },
      interviewQuestions: true,
      candidates: true,
    },
    orderBy: { date: "desc" },
  });
  return tasks.map(mapTask);
}

export async function findHiringTaskById(id: string): Promise<HiringTask | null> {
  const task = await prisma.hiringTask.findUnique({
    where: { id },
    include: {
      aptitudeQuestions: { include: { options: true } },
      domainQuestions: { include: { options: true } },
      interviewQuestions: true,
      candidates: true,
    },
  });
  return task ? mapTask(task) : null;
}
