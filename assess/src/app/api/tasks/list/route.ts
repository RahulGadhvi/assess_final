import { NextResponse } from "next/server";
import { getAllHiringTasks } from "@/lib/dbStore";

export async function GET() {
  try {
    // Queries the live persistent layer if matching configuration parameters exist
    const tasks = await getAllHiringTasks();
    
    return NextResponse.json(
      { success: true, tasks },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (error: any) {
    console.error(`[API_TASKS_LIST_CRITICAL] ${error.message}`);
    return NextResponse.json(
      { error: "Failed to pull position logs from core telemetry stack." },
      { status: 500 }
    );
  }
}