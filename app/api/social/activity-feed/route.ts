/**
 * Activity Feed API Route - Simplified Version
 *
 * Provides basic activity feed based on recent games and user activities
 * using existing database tables until full social features are implemented
 */

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

interface ActivityFeedResponse {
  success: boolean;
  activities?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = (page - 1) * limit;

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

    // Get recent games from users the current user follows (if any)
    const { data: following } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const followingIds = following?.map(f => f.following_id) || [];
    
    // Create activity feed from recent games
    let activities: any[] = [];

    if (followingIds.length > 0) {
      // Get recent games from followed users
      const { data: recentGames } = await supabase
        .from("games")
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          created_at,
          updated_at,
          visibility,
          creator_id,
          profiles!games_creator_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .in("creator_id", followingIds)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      activities = recentGames?.map(game => ({
        id: `game-${game.id}`,
        type: "game_created",
        user_id: game.creator_id,
        target_game_id: game.id,
        activity_data: {
          game_title: game.title,
          game_description: game.description,
          game_thumbnail: game.thumbnail_url
        },
        created_at: game.created_at,
        user: game.profiles
      })) || [];
    }

    // If no following activities, show recent public games
    if (activities.length === 0) {
      const { data: recentGames } = await supabase
        .from("games")
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          created_at,
          updated_at,
          visibility,
          creator_id,
          profiles!games_creator_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      activities = recentGames?.map(game => ({
        id: `game-${game.id}`,
        type: "game_created",
        user_id: game.creator_id,
        target_game_id: game.id,
        activity_data: {
          game_title: game.title,
          game_description: game.description,
          game_thumbnail: game.thumbnail_url
        },
        created_at: game.created_at,
        user: game.profiles
      })) || [];
    }

    const response: ActivityFeedResponse = {
      success: true,
      activities,
      pagination: {
        page,
        limit,
        total: activities.length,
        hasMore: activities.length === limit,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Activity feed API error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Simplified POST handler - just return success for any activity action
    return NextResponse.json({
      success: true,
      message: "Activity action completed",
    });
  } catch (error) {
    console.error("Create activity API error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
