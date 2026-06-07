import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findHiringTaskById } from "@/lib/dbStore";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id;
    const body = await req.json();
    const { name } = body;

    if (!taskId || !name) {
      return NextResponse.json({ error: "Missing identity payloads or name string." }, { status: 400 });
    }

    const normalizedName = name.trim().toLowerCase();
    
    // Fixed: Swapped out python print typo with a native node log stream descriptor 
    console.log(`[CANDIDATE_GATEKEEPER] Request from "${name}" for task ID: ${taskId}`);

    // 1. Production Database Deduplication Check
    if (process.env.DATABASE_URL && !taskId.startsWith("demo-") && !taskId.startsWith("task-")) {
      const dbClient = prisma as any;
      
      try {
        const existingCandidate = await dbClient.candidate.findFirst({
          where: {
            taskId: taskId,
            name: {
              equals: name.trim(),
              mode: 'insensitive' // Matches "Rahul", "rahul", or "RAHUL" identically
            }
          }
        });

        if (existingCandidate) {
          console.log(`[DB_REGISTRATION_MATCH] Found existing record for "${name}" (ID: ${existingCandidate.id}). Merging evaluation sessions.`);
          return NextResponse.json({ success: true, candidate: existingCandidate });
        }

        const candidate = await dbClient.candidate.create({
          data: {
            name: name.trim(),
            taskId: taskId,
            overall: 0
          }
        });

        console.log(`[DB_REGISTRATION_SUCCESS] Created new candidate row: ${candidate.id}`);
        return NextResponse.json({ success: true, candidate });
      } catch (dbError: any) {
        console.error(`[DATABASE_WRITE_CRASH] Prisma query failed: ${dbError.message}`);
        return NextResponse.json({ error: "Database transaction failed.", details: dbError.message }, { status: 500 });
      }
    }

    // 2. Sandboxed Local Memory Mock Deduplication Fallback
    const matchedTask = await findHiringTaskById(taskId);
    if (matchedTask) {
      matchedTask.candidates = matchedTask.candidates || [];
      
      const existingFakeCandidate = matchedTask.candidates.find(
        (c: any) => c.name.trim().toLowerCase() === normalizedName
      );

      if (existingFakeCandidate) {
        console.log(`[SANDBOX_REGISTRATION_MATCH] Merging sandbox session profiles for: "${name}"`);
        return NextResponse.json({ success: true, candidate: existingFakeCandidate });
      }

      const fakeCandidate = {
        id: "cand_" + Math.random().toString(36).substring(2, 7),
        name: name.trim(),
        aptScore: null,
        domScore: null,
        intScore: null,
        overall: 0
      };
      matchedTask.candidates.push(fakeCandidate);
      return NextResponse.json({ success: true, candidate: fakeCandidate });
    }

    return NextResponse.json({ error: "Target task context missing." }, { status: 404 });

  } catch (error: any) {
    console.error(`[API_CANDIDATES_POST_CRITICAL_FAILURE] ${error.message}`);
    return NextResponse.json({ error: "Internal server registry error.", details: error.message }, { status: 500 });
  }
}