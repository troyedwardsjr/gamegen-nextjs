import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

interface UpdateSessionRequest {
  title?: string;
  contextType?: "game-design" | "code-help" | "art-generation" | "general";
  status?: "active" | "archived" | "completed";
  settings?: Record<string, any>;
}

// GET /api/chat/sessions/[sessionId] - Get specific session with messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const includeMessages = searchParams.get("includeMessages") === "true";
    const messageLimit = parseInt(searchParams.get("messageLimit") || "50");
    const messageOffset = parseInt(searchParams.get("messageOffset") || "0");

    // Fetch session
    const { data: session, error: sessionError } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    let messages = null;

    if (includeMessages) {
      const { data: messagesData, error: messagesError } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("sequence_number", { ascending: true })
        .range(messageOffset, messageOffset + messageLimit - 1);

      if (messagesError) {
        console.error("Failed to fetch messages:", messagesError);
      } else {
        messages = messagesData || [];
      }
    }

    const response: any = { session };

    if (messages !== null) {
      response.messages = messages;
      response.pagination = {
        limit: messageLimit,
        offset: messageOffset,
        hasMore: messages.length === messageLimit,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Get session error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT /api/chat/sessions/[sessionId] - Update session
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    const body: UpdateSessionRequest = await request.json();
    const { title, contextType, status, settings } = body;

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updates.title = title;
    if (contextType !== undefined) updates.context_type = contextType;
    if (status !== undefined) {
      updates.status = status;
      if (status === "archived") {
        updates.archived_at = new Date().toISOString();
      }
    }
    if (settings !== undefined) updates.settings = settings;

    // Update session
    const { data: session, error } = await supabase
      .from("chat_sessions")
      .update(updates)
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 },
        );
      }
      console.error("Failed to update session:", error);

      return NextResponse.json(
        { error: "Failed to update session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Update session error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE /api/chat/sessions/[sessionId] - Delete session and all messages
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    // Verify ownership before deletion
    const { data: session, error: verifyError } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (verifyError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Delete session (messages will be deleted by CASCADE)
    const { error: deleteError } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Failed to delete session:", deleteError);

      return NextResponse.json(
        { error: "Failed to delete session" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete session error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
