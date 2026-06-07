import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskRegistry } from "@/lib/dbStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, location, workType, jdText, aptitudeQuestions, domainQuestions, interviewContent } = body;

    if (!title || !location || !workType || !jdText) {
      return NextResponse.json({ error: "Missing core data parameters." }, { status: 400 });
    }

    const uniqueTaskId = "task_" + Math.random().toString(36).substring(2, 7);

    // Cleaned: Formatted client-side fallback blueprint starts with an absolute zero array pool footprint
    const formattedRecord = {
      id: uniqueTaskId,
      title,
      location,
      workType,
      jdText,
      date: new Date().toISOString().split('T')[0],
      candidatesCount: 0, // Reset counter metric
      completionRate: 0,
      status: "Active",
      aptitudeQuestions: aptitudeQuestions || [],
      domainQuestions: domainQuestions || [],
      interviewQuestions: interviewContent || [],
      candidates: [] // Removed placeholder records cleanly
    };

    // 1. Live Production Deployment Database Persistence Channel
    if (process.env.DATABASE_URL) {
      const dbClient = prisma as any;
      
      const createdTask = await dbClient.hiringTask.create({
        data: {
          title,
          location,
          workType,
          jdText,
          status: "Active",
          candidatesCount: 0, // Reset live table counter metric
          completionRate: 0,
          aptitudeQuestions: {
            create: (aptitudeQuestions || []).map((q: any) => ({
              section: q.section || "General Reasoning",
              text: q.text,
              options: {
                create: (q.options || []).map((o: any) => ({
                  text: o.text,
                  isCorrect: o.isCorrect || false
                }))
              }
            }))
          },
          domainQuestions: {
            create: (domainQuestions || []).map((q: any) => ({
              section: q.section || "Domain Knowledge",
              text: q.text,
              options: {
                create: (q.options || []).map((o: any) => ({
                  text: o.text,
                  isCorrect: o.isCorrect || false
                }))
              }
            }))
          },
          interviewQuestions: {
            create: (interviewContent || []).map((i: any) => ({
              competency: i.competency,
              question: i.question,
              followUpProbe: i.followUpProbe,
              signalToLookFor: i.signalToLookFor
            }))
          },
          candidates: {
            create: [] // Cleaned: Database table relation initializes completely empty
          }
        }
      });

      console.log(`[PRISMA_SYNC] Fresh evaluation kit deployed cleanly onto PostgreSQL slot: ${createdTask.id}`);
      return NextResponse.json({ success: true, taskId: createdTask.id });
    }

    // 2. Performance Local Sandbox Fallback Mode
    taskRegistry.unshift(formattedRecord);
    console.log(`[STORE_SYNC] Clean sandbox task slot initialized in-memory: ${uniqueTaskId}`);

    return NextResponse.json({ success: true, taskId: uniqueTaskId });

  } catch (error: any) {
    console.error(`[SAVE_ROUTE_CRITICAL_FAILURE] - ${error.message}`);
    return NextResponse.json({ error: "Internal processing tracking subsystem failure." }, { status: 500 });
  }
}