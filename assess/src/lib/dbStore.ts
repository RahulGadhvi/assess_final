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
      title: "Senior Software Engineer",
      location: "Bengaluru, India",
      workType: "Hybrid",
      jdText: "Looking for a Senior Software Engineer proficient in React, Next.js, and TypeScript to architect accessible user interfaces and optimize frontend data flows.",
      date: "2026-06-03",
      aptitudeQuestions: [],
      domainQuestions: [],
      interviewQuestions: [],
      candidates: [
        { id: "c1", name: "Aisha Patel", aptScore: 85, domScore: 92, intScore: 88, overall: 88 },
        { id: "c2", name: "Rahul Singh", aptScore: 65, domScore: null, intScore: null, overall: 65 },
        { id: "c3", name: "Priya Sharma", aptScore: 35, domScore: 40, intScore: 45, overall: 40 },
      ]
    }
  ];
}

export const taskRegistry = globalForStore.taskRegistry;