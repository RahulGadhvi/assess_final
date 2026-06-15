import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskRegistry } from "@/lib/dbStore";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";
    const isDemoMode = body.isDemoMode === true;

    if (isDemoMode || email === "demo@assess.com") {
      console.log("[AUTH_HUB] Initializing isolated, high-speed presentation workspace.");

      taskRegistry.length = 0;
      taskRegistry.push(
        {
          id: "demo-task-1",
          title: "Sales Executive",
          location: "Mumbai, India",
          workType: "Full-time",
          jdText: "Looking for an energetic Sales Executive with 1+ years of experience to manage corporate clients and close enterprise deals.",
          date: new Date().toISOString().split("T")[0],
          candidatesCount: 3,
          completionRate: 88,
          status: "Active",
          aptitudeQuestions: [],
          domainQuestions: [],
          interviewQuestions: [],
          candidates: [
            { id: "dc1", name: "Aisha Patel", aptScore: 88, domScore: 92, intScore: 85, overall: 88 },
            { id: "dc2", name: "Rahul Singh", aptScore: 70, domScore: 65, intScore: null, overall: 68 },
            { id: "dc3", name: "Priya Sharma", aptScore: 42, domScore: 50, intScore: 40, overall: 44 }
          ]
        },
        {
          id: "demo-task-2",
          title: "Customer Success Lead",
          location: "Remote",
          workType: "Full-time",
          jdText: "Manage high-value accounts, reduce churn rates, and coordinate onboarding milestones.",
          date: "2026-06-01",
          candidatesCount: 1,
          completionRate: 100,
          status: "Active",
          aptitudeQuestions: [],
          domainQuestions: [],
          interviewQuestions: [],
          candidates: [
            { id: "dc4", name: "Vikram Malhotra", aptScore: 95, domScore: 90, intScore: 92, overall: 92 }
          ]
        }
      );

      return NextResponse.json({ success: true, user: "demo@assess.com", role: "Demo Sandbox" });
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Please enter your email and password." }, { status: 400 });
    }

    const matchedEmployer = await prisma.employer.findFirst({ where: { email } });

    if (!matchedEmployer || matchedEmployer.passwordHash !== password) {
      return NextResponse.json({ error: "Invalid email or password combination." }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: matchedEmployer.email,
      company: matchedEmployer.companyName
    });
  } catch (error) {
    console.error("[AUTH_HUB_CRASH]", error);
    return NextResponse.json({ error: "Authentication system is currently offline.", details: getErrorMessage(error) }, { status: 500 });
  }
}