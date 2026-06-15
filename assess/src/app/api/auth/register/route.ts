import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    const companyName = typeof body.companyName === "string" ? body.companyName : "";

    if (!email || !password || !companyName) {
      return NextResponse.json({ error: "All fields are required to register." }, { status: 400 });
    }

    const existingUser = await prisma.employer.findFirst({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    const newEmployer = await prisma.employer.create({
      data: {
        email,
        passwordHash: password,
        companyName,
      },
    });

    return NextResponse.json({ success: true, company: newEmployer.companyName });
  } catch (error) {
    console.error("[REGISTRATION_ERROR]", error);
    return NextResponse.json({ error: "Failed to create account workspace.", details: getErrorMessage(error) }, { status: 500 });
  }
}