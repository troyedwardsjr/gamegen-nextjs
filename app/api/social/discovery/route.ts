/**
 * Discovery API Route - Simplified Version
 * 
 * Returns basic game discovery based on existing games table
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
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get trending games (public games with highest play counts)
    const { data: trendingGames } = await supabase
      .from("games")
      .select(`
        id,
        title,
        description,
        creator_id,
        thumbnail_url,
        tags,
        genre,
        play_count,
        like_count,
        fork_count,
        created_at,
        profiles!games_creator_id_fkey(username, display_name, avatar_url)
      `)
      .eq("visibility", "public")
      .order("play_count", { ascending: false })
      .limit(10);

    // Get featured games
    const { data: featuredGames } = await supabase
      .from("games")
      .select(`
        id,
        title,
        description,
        creator_id,
        thumbnail_url,
        tags,
        genre,
        play_count,
        like_count,
        created_at,
        profiles!games_creator_id_fkey(username, display_name, avatar_url)
      `)
      .eq("visibility", "public")
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(5);

    // Get recommended users (users with most public games)
    const { data: recommendedUsers } = await supabase
      .from("profiles")
      .select(`
        id,
        username,
        display_name,
        bio,
        avatar_url,
        is_verified
      `)
      .limit(5);

    return NextResponse.json({
      success: true,
      trending_games: trendingGames || [],
      featured_content: featuredGames || [],
      recommended_users: recommendedUsers || [],
      categories: [
        { id: "platformer", name: "Platformer", count: 0 },
        { id: "puzzle", name: "Puzzle", count: 0 },
        { id: "rpg", name: "RPG", count: 0 },
        { id: "shooter", name: "Shooter", count: 0 },
      ],
    });
  } catch (error) {
    console.error("Discovery API error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}