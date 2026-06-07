import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findHiringTaskById } from "@/lib/dbStore";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; candidateId: string } }
) {
  try {
    const { id: taskId, candidateId } = params;
    const body = await req.json();
    const { field, value } = body; 

    if (!taskId || !candidateId || !field) {
      return NextResponse.json({ error: "Missing validation payloads." }, { status: 400 });
    }

    console.log(`[PATCH_METRIC_TRIGGER] Patching field "${field}" to "${value}" on candidate ID: ${candidateId}`);

    // A. Live Database Patch Channel
    if (process.env.DATABASE_URL && !taskId.startsWith("demo-") && !taskId.startsWith("task-")) {
      const dbClient = prisma as any;

      const currentCandidate = await dbClient.candidate.findUnique({
        where: { id: candidateId }
      });

      if (!currentCandidate) {
        return NextResponse.json({ error: "Candidate profile record not found." }, { status: 404 });
      }

      const nextScores = {
        aptScore: currentCandidate.aptScore,
        domScore: currentCandidate.domScore,
        intScore: currentCandidate.intScore,
        [field]: value
      };

      const validScores = [nextScores.aptScore, nextScores.domScore, nextScores.intScore].filter(s => s !== null) as number[];
      const balancedOverall = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;

      const updatedCandidate = await dbClient.candidate.update({
        where: { id: candidateId },
        data: {
          [field]: value,
          overall: balancedOverall
        }
      });

      return NextResponse.json({ success: true, candidate: updatedCandidate });
    }

    // B. Sandboxed Local Backup
    const matchedTask = await findHiringTaskById(taskId);
    if (matchedTask && matchedTask.candidates) {
      const matchCandidate = matchedTask.candidates.find(c => c.id === candidateId);
      if (matchCandidate) {
        (matchCandidate as any)[field] = value;
        const validScores = [matchCandidate.aptScore, matchCandidate.domScore, matchCandidate.intScore].filter(s => s !== null) as number[];
        matchCandidate.overall = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;
        
        return NextResponse.json({ success: true, candidate: matchCandidate });
      }
    }

    return NextResponse.json({ error: "Target records missing across pipeline parameters." }, { status: 404 });

  } catch (error: any) {
    console.error(`[API_CANDIDATE_PATCH_CRITICAL_FAILURE] ${error.message}`);
    return NextResponse.json({ error: "Internal processing spreadsheet metrics sync crash.", details: error.message }, { status: 500 });
  }
}