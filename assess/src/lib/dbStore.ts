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
      const dbClient = prisma as any;
      const tasks = await dbClient.hiringTask.findMany({
        where: employerId ? { employerId } : {},
        include: {
          aptitudeQuestions: { include: { options: true } },
          domainQuestions: { include: { options: true } },
          interviewQuestions: true,
          candidates: true,
        },
        orderBy: { date: "desc" },
      });

      return tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        location: t.location,
        workType: t.workType,
        jdText: t.jdText,
        date: t.date.toISOString().split("T")[0],
        candidatesCount: t.candidatesCount,
        completionRate: t.completionRate,
        status: t.status,
        aptitudeQuestions: t.aptitudeQuestions || [],
        domainQuestions: t.domainQuestions || [],
        interviewQuestions: t.interviewQuestions || [],
        candidates: t.candidates || [],
      }));
    } catch (e) {
      console.error("[DB_STORE_DAL_ERROR] Falling back to memory registry initialization loop", e);
    }
  }
  return taskRegistry;
}

export async function findHiringTaskById(id: string): Promise<HiringTask | null> {
  if (process.env.DATABASE_URL && !id.startsWith("demo-") && !id.startsWith("task-")) {
    try {
      const dbClient = prisma as any;
      const t = await dbClient.hiringTask.findUnique({
        where: { id },
        include: {
          aptitudeQuestions: { include: { options: true } },
          domainQuestions: { include: { options: true } },
          interviewQuestions: true,
          candidates: true,
        },
      });
      if (t) {
        return {
          id: t.id,
          title: t.title,
          location: t.location,
          workType: t.workType,
          jdText: t.jdText,
          date: t.date.toISOString().split("T")[0],
          candidatesCount: t.candidatesCount,
          completionRate: t.completionRate,
          status: t.status,
          aptitudeQuestions: t.aptitudeQuestions || [],
          domainQuestions: t.domainQuestions || [],
          interviewQuestions: t.interviewQuestions || [],
          candidates: t.candidates || [],
        };
      }
    } catch (e) {
      console.error(`[DB_STORE_FIND_ERROR] Verification fallback on trace id: ${id}`, e);
    }
  }
  return taskRegistry.find((t) => t.id === id) || null;
}