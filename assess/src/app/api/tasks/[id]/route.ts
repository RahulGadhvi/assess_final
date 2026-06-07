import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { findHiringTaskById, taskRegistry } from "@/lib/dbStore";

// 1. GET handler to fetch unique position records
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
  } catch (error: any) {
    console.error(`[API_TASK_GET_ERROR] ${error.message}`);
    return NextResponse.json({ error: "Internal processing crash." }, { status: 500 });
  }
}

// 2. NEW DELETE handler to wipe tasks permanently (Fixes the failure alert)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const targetId = params.id;
    if (!targetId) {
      return NextResponse.json({ error: "Missing required Task ID parameter." }, { status: 400 });
    }

    console.log(`[API_DELETE_ROUTE] Initiating delete pipeline for task identity slot: ${targetId}`);

    // A. Clear from PostgreSQL via Prisma if live connection string is initialized
    if (process.env.DATABASE_URL && !targetId.startsWith("demo-") && !targetId.startsWith("task-")) {
      try {
        const dbClient = prisma as any;
        
        // Relational schema configuration handles cascade deletion rules automatically
        await dbClient.hiringTask.delete({
          where: { id: targetId }
        });

        console.log(`[PRISMA_DELETE_SYNC] Successfully purged row id ${targetId} from Supabase database tables.`);
        return NextResponse.json({ success: true, message: "Task dropped from relational database storage layers." });
      } catch (dbError: any) {
        console.error(`[PRISMA_DELETE_EXCEPTION] Database call failed, falling back to RAM index: ${dbError.message}`);
      }
    }

    // B. Clear from local sandboxed in-memory array backup
    const taskIndex = taskRegistry.findIndex(t => t.id === targetId);
    if (taskIndex !== -1) {
      taskRegistry.splice(taskIndex, 1);
      console.log(`[SANDBOX_DELETE_SYNC] Purged index trace ${targetId} from temporary fallback registry store arrays.`);
      return NextResponse.json({ success: true, message: "Task cleared out from sandboxed memory arrays." });
    }

    return NextResponse.json({ error: "Target position index could not be located anywhere in storage clusters." }, { status: 404 });

  } catch (error: any) {
    console.error(`[API_TASK_DELETE_CRITICAL_FAILURE] ${error.message}`);
    return NextResponse.json({ error: "Internal system error processing data purge command.", details: error.message }, { status: 500 });
  }
}