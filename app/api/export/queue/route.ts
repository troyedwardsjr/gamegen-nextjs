import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { ExportQueueService } from "@/lib/export/services";

// GET /api/export/queue - Get queue statistics and metrics
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const queueService = new ExportQueueService(true);
    const metrics = await queueService.getQueueMetrics();

    // Get user's current jobs in queue
    const { data: userQueueJobs, error: queueError } = await (supabase as any)
      .from("export_jobs")
      .select("id, platform, created_at, status, priority")
      .eq("user_id", user.id)
      .in("status", ["queued", "processing"])
      .order("created_at", { ascending: true });

    if (queueError) {
      // TODO: Implement proper error logging
    }

    return NextResponse.json({
      success: true,
      data: {
        queue_metrics: metrics,
        user_jobs_in_queue: userQueueJobs || [],
        estimated_wait_times: {
          web: Math.max(1, Math.ceil(metrics.queued_jobs * 0.5)), // 30 seconds per job
          pwa: Math.max(2, Math.ceil(metrics.queued_jobs * 0.7)), // 42 seconds per job
          desktop: Math.max(8, Math.ceil(metrics.queued_jobs * 2)), // 2 minutes per job
          mobile: Math.max(12, Math.ceil(metrics.queued_jobs * 3)), // 3 minutes per job
          source: Math.max(1, Math.ceil(metrics.queued_jobs * 0.3)), // 18 seconds per job
        },
      },
    });
  } catch (error: any) {
    // TODO: Implement proper error logging system
    return NextResponse.json(
      {
        error: "Failed to fetch queue metrics",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
