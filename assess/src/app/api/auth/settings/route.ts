import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const companyName = typeof body.companyName === "string" ? body.companyName : "";
    const email = typeof body.email === "string" ? body.email : "";

    if (!companyName || !email) {
      return NextResponse.json({ error: "Company name and email are required." }, { status: 400 });
    }

    if (process.env.DATABASE_URL) {
      await prisma.employer.updateMany({
        where: { email },
        data: { companyName }
      });

      console.log(`[DB_SETTINGS_SYNC] Updated company name to: ${companyName} for ${email}`);
    }

    return NextResponse.json({ success: true, company: companyName });
  } catch (error) {
    console.error("[SETTINGS_ROUTE_ERROR]", error);
    return NextResponse.json({ error: "Failed to update profile settings in database.", details: getErrorMessage(error) }, { status: 500 });
  }
}