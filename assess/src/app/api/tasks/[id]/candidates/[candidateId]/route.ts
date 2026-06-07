import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findHiringTaskById } from "@/lib/dbStore";

// POST handler to register a brand new candidate session under a Task ID
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id;
    const body = await req.json();
    const { name } = body;

    if (!taskId || !name) {
      return NextResponse.json({ error: "Missing identity payloads or name string." }, { status: 400 });
    }

    console.log(`[API_CANDIDATES_POST] Registering candidate "${name}" for task: ${taskId}`);

    // 1. Production Database Insert Pipeline
    if (process.env.DATABASE_URL && !taskId.startsWith("demo-") && !taskId.startsWith("task-")) {
      const dbClient = prisma as any;
      
      const candidate = await dbClient.candidate.create({
        data: {
          name: name,
          hiringTaskId: taskId,
          overall: 0
        }
      });

      return NextResponse.json({ success: true, candidate });
    }

    // 2. Sandboxed Local Memory Array Mock Fallback
    const matchedTask = await findHiringTaskById(taskId);
    if (matchedTask) {
      const fakeCandidate = {
        id: "cand_" + Math.random().toString(36).substring(2, 7),
        name,
        aptScore: null,
        domScore: null,
        intScore: null,
        overall: 0
      };
      matchedTask.candidates = matchedTask.candidates || [];
      matchedTask.candidates.push(fakeCandidate);
      return NextResponse.json({ success: true, candidate: fakeCandidate });
    }

    return NextResponse.json({ error: "Target hiring task reference not found." }, { status: 404 });

  } catch (error: any) {
    console.error(`[API_CANDIDATES_POST_CRITICAL_FAILURE] ${error.message}`);
    return NextResponse.json({ error: "Internal server registry error.", details: error.message }, { status: 500 });
  }
}