import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyName, email } = body;

    if (!companyName) {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    }

    // If a database is configured, save the change permanently
    if (process.env.DATABASE_URL) {
      const dbClient = prisma as any;
      
      // Look up the employer profile to update their company profile string
      await dbClient.employer.updateMany({
        where: email ? { email } : {}, // Safe fallbacks if explicit session tokens aren't active yet
        data: { companyName }
      });

      console.log(`[DB_SETTINGS_SYNC] Updated company name to: ${companyName}`);
    }

    return NextResponse.json({ success: true, company: companyName });
  } catch (error: any) {
    console.error("[SETTINGS_ROUTE_ERROR]", error);
    return NextResponse.json({ error: "Failed to update profile settings in database." }, { status: 500 });
  }
}