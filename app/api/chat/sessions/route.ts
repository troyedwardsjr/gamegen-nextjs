import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

interface CreateSessionRequest {
  title?: string;
  contextType: "game-design" | "code-help" | "art-generation" | "general";
  gameId?: string;
  settings?: Record<string, any>;
}

interface UpdateSessionRequest {
  title?: string;
  contextType?: "game-design" | "code-help" | "art-generation" | "general";
  status?: "active" | "archived" | "completed";
  settings?: Record<string, any>;
}

// GET /api/chat/sessions - List user's chat sessions
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
    const contextType = searchParams.get("contextType");
    const gameId = searchParams.get("gameId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = (supabase as any)
      .from("chat_sessions")
      .select(
        `
        *,
        total_messages,
        total_tokens_used,
        total_cost_cents
      `,
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (contextType) {
      query = query.eq("context_type", contextType);
    }
    if (gameId) {
      query = query.eq("game_id", gameId);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error("Failed to fetch sessions:", error);

      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      sessions: sessions || [],
      pagination: {
        limit,
        offset,
        hasMore: (sessions?.length || 0) === limit,
      },
    });
  } catch (error) {
    console.error("Sessions API error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/chat/sessions - Create new chat session
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

    const body: CreateSessionRequest = await request.json();
    const { title, contextType, gameId, settings } = body;

    // Validate required fields
    if (!contextType) {
      return NextResponse.json(
        { error: "Context type is required" },
        { status: 400 },
      );
    }

    // Create session
    const { data: session, error } = await (supabase as any)
      .from("chat_sessions")
      .insert({
        user_id: user.id,
        title: title || "New Chat Session",
        context_type: contextType,
        game_id: gameId,
        settings: settings || {},
        status: "active",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create session:", error);

      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error("Create session error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
