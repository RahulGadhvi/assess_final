import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findHiringTaskById, taskRegistry } from "@/lib/dbStore";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const targetId = params.id;
    if (!targetId) {
      return NextResponse.json({ error: "Missing identity token tracker param." }, { status: 400 });
    }

    const matchedTask = await findHiringTaskById(targetId);

    if (!matchedTask) {
      return NextResponse.json({ error: "Assessment track record not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: matchedTask });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[API_TASK_GET_ERROR] ${message}`);
    return NextResponse.json({ error: "Internal processing crash." }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const targetId = params.id;
    if (!targetId) {
      return NextResponse.json({ error: "Missing required Task ID parameter." }, { status: 400 });
    }

    console.log(`[API_DELETE_ROUTE] Initiating delete pipeline for task identity slot: ${targetId}`);

    if (process.env.DATABASE_URL && !targetId.startsWith("demo-") && !targetId.startsWith("task-")) {
      try {
        await prisma.hiringTask.delete({
          where: { id: targetId }
        });

        console.log(`[PRISMA_DELETE_SYNC] Successfully purged row id ${targetId} from Supabase database tables.`);
        return NextResponse.json({ success: true, message: "Task dropped from relational database storage layers." });
      } catch (dbError) {
        const message = dbError instanceof Error ? dbError.message : "Unknown database error";
        console.error(`[PRISMA_DELETE_EXCEPTION] Database call failed, falling back to RAM index: ${message}`);
      }
    }

    const taskIndex = taskRegistry.findIndex((t) => t.id === targetId);
    if (taskIndex !== -1) {
      taskRegistry.splice(taskIndex, 1);
      console.log(`[SANDBOX_DELETE_SYNC] Purged index trace ${targetId} from temporary fallback registry store arrays.`);
      return NextResponse.json({ success: true, message: "Task cleared out from sandboxed memory arrays." });
    }

    return NextResponse.json({ error: "Target position index could not be located anywhere in storage clusters." }, { status: 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[API_TASK_DELETE_CRITICAL_FAILURE] ${message}`);
    return NextResponse.json({ error: "Internal system error processing data purge command.", details: message }, { status: 500 });
  }
}