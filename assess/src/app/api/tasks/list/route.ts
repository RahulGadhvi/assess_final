import { NextResponse } from "next/server";
import { getAllHiringTasks } from "@/lib/dbStore";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const companyName = url.searchParams.get("companyName") || undefined;
    const tasks = await getAllHiringTasks(companyName);

    return NextResponse.json(
      { success: true, tasks },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[API_TASKS_LIST_CRITICAL] ${message}`);
    return NextResponse.json(
      { error: "Failed to pull position logs from core telemetry stack." },
      { status: 500 }
    );
  }
}