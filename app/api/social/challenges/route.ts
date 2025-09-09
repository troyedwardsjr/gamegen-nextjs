/**
 * Challenges API Route - Simplified Version
 * 
 * Returns placeholder challenges until full social features are implemented
 */

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, challenges: [], error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Return empty challenges for now
    return NextResponse.json({
      success: true,
      challenges: [],
      featured_challenges: [],
      user_participations: [],
    });
  } catch (error) {
    console.error("Challenges API error:", error);

    return NextResponse.json(
      { success: false, challenges: [], error: "Internal server error" },
      { status: 500 },
    );
  }
}