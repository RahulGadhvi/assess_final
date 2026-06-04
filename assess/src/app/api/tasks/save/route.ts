import { NextResponse } from "next/server";
import { taskRegistry } from "@/lib/dbStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, location, workType, jdText, aptitudeQuestions, domainQuestions, interviewContent } = body;

    if (!title || !location || !workType || !jdText) {
      return NextResponse.json({ error: "Missing core data parameters." }, { status: 400 });
    }

    const newTaskId = "task_" + Math.random().toString(36).substring(2, 7);

    const newTaskRecord = {
      id: newTaskId,
      title,
      location,
      workType,
      jdText,
      date: new Date().toISOString().split('T')[0],
      candidatesCount: 3,
      completionRate: 0,
      status: "Active",
      aptitudeQuestions: aptitudeQuestions || [],
      domainQuestions: domainQuestions || [],
      interviewQuestions: interviewContent || [],
      candidates: [
        { id: "rc1", name: "Ananya Iyer", aptScore: 82, domScore: 78, intScore: 85, overall: 81 },
        { id: "rc2", name: "Vikram Malhotra", aptScore: 45, domScore: null, intScore: null, overall: 45 },
        { id: "rc3", name: "Sneha Reddy", aptScore: 91, domScore: 89, intScore: 92, overall: 90 }
      ]
    };

    taskRegistry.unshift(newTaskRecord);
    console.log(`[STORE_SYNC] Successfully saved "${title}" under cloud lookup ID: ${newTaskId}`);

    return NextResponse.json({ success: true, taskId: newTaskId });

  } catch (error: any) {
    console.error(`[SAVE_ROUTE_CRASH] - ${error.message}`);
    return NextResponse.json({ error: "Internal processing crash." }, { status: 500 });
  }
}