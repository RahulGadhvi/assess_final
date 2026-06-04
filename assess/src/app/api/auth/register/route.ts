import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, companyName } = body;

    if (!email || !password || !companyName) {
      return NextResponse.json({ error: "All fields are required to register." }, { status: 400 });
    }

    // Cast to any to bypass stale generated client type definitions
    const dbClient = prisma as any;

    // Check if the company workspace already exists
    const existingUser = await dbClient.employer.findFirst({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    // Create a new independent multi-tenant organization row
    const newEmployer = await dbClient.employer.create({
      data: {
        email,
        passwordHash: password,
        companyName,
      },
    });

    return NextResponse.json({ success: true, company: newEmployer.companyName });
  } catch (error: any) {
    console.error("[REGISTRATION_ERROR]", error);
    return NextResponse.json({ error: "Failed to create account workspace." }, { status: 500 });
  }
}