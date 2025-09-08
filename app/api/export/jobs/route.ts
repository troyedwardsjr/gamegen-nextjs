import type { CreateExportJobRequest } from "@/types/export";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { ExportService } from "@/lib/export/services";

// GET /api/export/jobs - List user's export jobs
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const platform = searchParams.get("platform");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const exportService = new ExportService(true);

    const jobs = await exportService.getUserExportJobs(user.id, {
      status: status ? [status as any] : undefined,
      platform: platform as any,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: jobs,
      meta: {
        total: jobs.length,
        limit,
        offset,
      },
    });
  } catch (error: any) {
    console.error("Error fetching export jobs:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch export jobs",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// POST /api/export/jobs - Create a new export job
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateExportJobRequest = await request.json();

    // Validate required fields
    if (!body.game_id || !body.platform) {
      return NextResponse.json(
        { error: "Missing required fields: game_id, platform" },
        { status: 400 },
      );
    }

    // Verify user owns the game
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id, creator_id, title")
      .eq("id", body.game_id)
      .eq("creator_id", user.id)
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: "Game not found or access denied" },
        { status: 404 },
      );
    }

    const exportService = new ExportService(true);
    const result = await exportService.createExportJob(body, user.id);

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: `Export job created for ${game.title}`,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating export job:", error);

    // Handle specific error types
    if (error.code === "INSUFFICIENT_TIER") {
      return NextResponse.json(
        {
          error: "Insufficient subscription tier",
          details: error.message,
          required_tier: error.details?.required_tier,
        },
        { status: 402 }, // Payment required
      );
    }

    if (error.code === "LIMIT_EXCEEDED") {
      return NextResponse.json(
        {
          error: "Export limit exceeded",
          details: error.message,
          limit: error.details?.limit,
          used: error.details?.used,
        },
        { status: 429 }, // Too many requests
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create export job",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
