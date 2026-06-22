import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; candidateId: string }> }
) {
  const { candidateId } = await params;
  try {
    const body = (await req.json()) as {
      field?: string;
      value?: number | null;
      notes?: string;
    };
    const { field, value, notes } = body;

    if (!candidateId) {
      return NextResponse.json({ error: "Candidate ID is required." }, { status: 400 });
    }

    const currentCandidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!currentCandidate) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    const updateData: Record<string, any> = {};

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (field && value !== undefined) {
      const validFields = ["aptScore", "domScore", "intScore"];
      if (!validFields.includes(field)) {
        return NextResponse.json({ error: "Invalid field." }, { status: 400 });
      }

      const nextScores = {
        aptScore: currentCandidate.aptScore,
        domScore: currentCandidate.domScore,
        intScore: currentCandidate.intScore,
        [field]: value,
      };

      const validScores = [nextScores.aptScore, nextScores.domScore, nextScores.intScore].filter(
        (s): s is number => s !== null
      );
      const balancedOverall =
        validScores.length > 0
          ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
          : 0;

      updateData[field] = value;
      updateData.overall = balancedOverall;
    }

    const updatedCandidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: updateData,
    });

    return NextResponse.json({ success: true, candidate: updatedCandidate });
  } catch {
    return NextResponse.json({ error: "Failed to update candidate." }, { status: 500 });
  }
}
