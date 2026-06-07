import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findHiringTaskById } from "@/lib/dbStore";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id;
    const body = await req.json();
    const { name } = body;

    console.log(`[CANDIDATE_REGISTRATION_TRIGGER] Initializing slot for: "${name}" under task ID: ${taskId}`);

    if (!taskId || !name) {
      return NextResponse.json({ error: "Missing identity tags or applicant name payload." }, { status: 400 });
    }

    // 1. Live Production PostgreSQL Registration Sync
    if (process.env.DATABASE_URL && !taskId.startsWith("demo-") && !taskId.startsWith("task-")) {
      const dbClient = prisma as any;
      
      try {
        const candidate = await dbClient.candidate.create({
          data: { 
            name: name, 
            hiringTaskId: taskId, // Assumes model schema defines this relation key field
            overall: 0
          }
        });

        console.log(`[DB_REGISTRATION_SUCCESS] Created database candidate row: ${candidate.id}`);
        return NextResponse.json({ success: true, candidate });
      } catch (dbError: any) {
        console.error(`[DATABASE_WRITE_CRASH] Prisma insert operation failed: ${dbError.message}`);
        // Fall through to memory backup if database fails to write, or return error explicit parameters
        return NextResponse.json({ error: "Database rejected write pipeline.", details: dbError.message }, { status: 500 });
      }
    }

    // 2. Sandboxed Memory Fallback Index
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
      
      console.log(`[SANDBOX_REGISTRATION_SUCCESS] Injected mockup applicant trace to memory allocation.`);
      return NextResponse.json({ success: true, candidate: fakeCandidate });
    }

    console.warn(`[REGISTRATION_ORPHAN] Target task context ${taskId} could not be resolved inside any cluster layer.`);
    return NextResponse.json({ error: "Hiring context workspace reference not found." }, { status: 404 });

  } catch (err: any) {
    console.error(`[CANDIDATE_REGISTRATION_CRITICAL_FAILURE] ${err.message}`);
    return NextResponse.json({ error: "Internal crash handling parameters.", details: err.message }, { status: 500 });
  }
}