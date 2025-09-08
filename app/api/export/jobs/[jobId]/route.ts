import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { ExportService } from "@/lib/export/services";

// GET /api/export/jobs/[jobId] - Get export job status and details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 },
      );
    }

    const exportService = new ExportService(true);
    const result = await exportService.getExportJobStatus(jobId, user.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    const { jobId } = await params;

    console.error(`Error fetching export job ${jobId}:`, error);

    if (error.code === "PGRST116") {
      // Not found
      return NextResponse.json(
        { error: "Export job not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to fetch export job",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// DELETE /api/export/jobs/[jobId] - Cancel export job
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 },
      );
    }

    const exportService = new ExportService(true);

    await exportService.cancelExportJob(jobId, user.id);

    return NextResponse.json({
      success: true,
      message: "Export job cancelled successfully",
    });
  } catch (error: any) {
    const { jobId } = await params;

    console.error(`Error cancelling export job ${jobId}:`, error);

    if (error.code === "PGRST116") {
      // Not found
      return NextResponse.json(
        { error: "Export job not found or cannot be cancelled" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to cancel export job",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
