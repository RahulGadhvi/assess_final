import { NextResponse } from "next/server";
import { getAllHiringTasks } from "@/lib/dbStore";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tasks = await getAllHiringTasks(session.user.id);
    return NextResponse.json(
      { success: true, tasks },
      { headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" } }
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch tasks." }, { status: 500 });
  }
}
