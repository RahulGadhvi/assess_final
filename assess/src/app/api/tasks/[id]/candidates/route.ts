import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findHiringTaskById } from "@/lib/dbStore";

interface CandidateRecord {
  name: string;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id;
    const body = (await req.json()) as { name?: string };
    const name = body.name?.trim() ?? "";

    if (!taskId || !name) {
      return NextResponse.json({ error: "Missing identity payloads or name string." }, { status: 400 });
    }

    const normalizedName = name.toLowerCase();

    console.log(`[CANDIDATE_GATEKEEPER] Request from "${name}" for task ID: ${taskId}`);

    if (process.env.DATABASE_URL && !taskId.startsWith("demo-") && !taskId.startsWith("task-")) {
      try {
        const existingCandidate = await prisma.candidate.findFirst({
          where: {
            taskId,
            name: {
              equals: name,
              mode: "insensitive"
            }
          }
        });

        if (existingCandidate) {
          console.log(`[DB_REGISTRATION_MATCH] Found existing record for "${name}" (ID: ${existingCandidate.id}). Merging evaluation sessions.`);
          return NextResponse.json({ success: true, candidate: existingCandidate });
        }

        const candidate = await prisma.candidate.create({
          data: {
            name,
            taskId,
            overall: 0
          }
        });

        console.log(`[DB_REGISTRATION_SUCCESS] Created new candidate row: ${candidate.id}`);
        return NextResponse.json({ success: true, candidate });
      } catch (dbError) {
        const message = dbError instanceof Error ? dbError.message : "Unknown database error";
        console.error(`[DATABASE_WRITE_CRASH] Prisma query failed: ${message}`);
        return NextResponse.json({ error: "Database transaction failed.", details: message }, { status: 500 });
      }
    }

    const matchedTask = await findHiringTaskById(taskId);
    if (matchedTask) {
      matchedTask.candidates = matchedTask.candidates || [];

      const existingFakeCandidate = matchedTask.candidates.find((c: CandidateRecord) => c.name.trim().toLowerCase() === normalizedName);

      if (existingFakeCandidate) {
        console.log(`[SANDBOX_REGISTRATION_MATCH] Merging sandbox session profiles for: "${name}"`);
        return NextResponse.json({ success: true, candidate: existingFakeCandidate });
      }

      const fakeCandidate = {
        id: "cand_" + Math.random().toString(36).substring(2, 7),
        name,
        aptScore: null,
        domScore: null,
        intScore: null,
        overall: 0
      };
      matchedTask.candidates.push(fakeCandidate);
      return NextResponse.json({ success: true, candidate: fakeCandidate });
    }

    return NextResponse.json({ error: "Target task context missing." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[API_CANDIDATES_POST_CRITICAL_FAILURE] ${message}`);
    return NextResponse.json({ error: "Internal server registry error.", details: message }, { status: 500 });
  }
}