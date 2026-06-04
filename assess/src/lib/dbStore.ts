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

// Global scope initialization prevents hot-reloads from wiping out your mock data
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