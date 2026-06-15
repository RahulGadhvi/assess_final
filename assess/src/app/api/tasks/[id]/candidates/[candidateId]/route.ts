import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findHiringTaskById } from "@/lib/dbStore";

interface CandidatePatchBody {
  field?: string;
  value?: number | null;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; candidateId: string } }
) {
  try {
    const { id: taskId, candidateId } = params;
    const body = (await req.json()) as CandidatePatchBody;
    const field = body.field;
    const value = body.value;

    if (!taskId || !candidateId || !field) {
      return NextResponse.json({ error: "Missing validation payloads." }, { status: 400 });
    }

    console.log(`[PATCH_METRIC_TRIGGER] Patching field "${field}" to "${value}" on candidate ID: ${candidateId}`);

    if (process.env.DATABASE_URL && !taskId.startsWith("demo-") && !taskId.startsWith("task-")) {
      const currentCandidate = await prisma.candidate.findUnique({
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

      const validScores = [nextScores.aptScore, nextScores.domScore, nextScores.intScore].filter((s): s is number => s !== null);
      const balancedOverall = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;

      const updatedCandidate = await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          [field]: value,
          overall: balancedOverall
        }
      });

      return NextResponse.json({ success: true, candidate: updatedCandidate });
    }

    const matchedTask = await findHiringTaskById(taskId);
    if (matchedTask && matchedTask.candidates) {
      const matchCandidate = matchedTask.candidates.find((c) => c.id === candidateId);
      if (matchCandidate) {
        const scoreField = field as "aptScore" | "domScore" | "intScore";
        matchCandidate[scoreField] = value ?? null;
        const validScores = [matchCandidate.aptScore, matchCandidate.domScore, matchCandidate.intScore].filter((s): s is number => s !== null);
        matchCandidate.overall = validScores.length > 0 ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length) : 0;

        return NextResponse.json({ success: true, candidate: matchCandidate });
      }
    }

    return NextResponse.json({ error: "Target records missing across pipeline parameters." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[API_CANDIDATE_PATCH_CRITICAL_FAILURE] ${message}`);
    return NextResponse.json({ error: "Internal processing spreadsheet metrics sync crash.", details: message }, { status: 500 });
  }
}