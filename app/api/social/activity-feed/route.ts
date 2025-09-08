/**
 * Activity Feed API Route
 *
 * Provides personalized activity feeds for users with ranking algorithms
 * and real-time social interaction data.
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

import { ActivityFeedItem, SocialDatabase } from "@/types/social";

interface ActivityFeedResponse {
  success: boolean;
  activities?: ActivityFeedItem[];
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

    const supabase = createRouteHandlerClient<SocialDatabase>({ cookies });

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

    // Use the database function to get personalized activity feed
    const { data: activities, error: feedError } = await supabase.rpc(
      "get_user_activity_feed",
      {
        user_id: user.id,
        limit_count: limit,
        offset_count: offset,
      },
    );

    if (feedError) {
      console.error("Activity feed error:", feedError);

      return NextResponse.json(
        { success: false, error: "Failed to fetch activity feed" },
        { status: 500 },
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("activities")
      .select("*", { count: "exact", head: true })
      .or(
        `visibility.eq.public,and(visibility.eq.followers,user_id.in.(${
          // Get user's following list for filtering
          await supabase
            .from("user_follows")
            .select("following_id")
            .eq("follower_id", user.id)
            .then((res) => res.data?.map((f) => f.following_id).join(",") || "")
        }))`,
      )
      .not(
        "user_id",
        "in",
        `(${
          // Exclude blocked users
          await supabase
            .from("user_blocks")
            .select("blocked_id")
            .eq("blocker_id", user.id)
            .then((res) => res.data?.map((b) => b.blocked_id).join(",") || "")
        })`,
      );

    const response: ActivityFeedResponse = {
      success: true,
      activities: activities || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        hasMore: (totalCount || 0) > offset + limit,
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
    const supabase = createRouteHandlerClient<SocialDatabase>({ cookies });

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

    const body = await request.json();
    const {
      activity_type,
      target_game_id,
      target_user_id,
      target_collection_id,
      target_achievement_id,
      activity_data,
      visibility = "public",
    } = body;

    // Validate required fields
    if (!activity_type) {
      return NextResponse.json(
        { success: false, error: "Activity type is required" },
        { status: 400 },
      );
    }

    // Create new activity
    const { data: activity, error: insertError } = await supabase
      .from("activities")
      .insert({
        user_id: user.id,
        activity_type,
        target_game_id,
        target_user_id,
        target_collection_id,
        target_achievement_id,
        activity_data: activity_data || {},
        visibility,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Create activity error:", insertError);

      return NextResponse.json(
        { success: false, error: "Failed to create activity" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      activity,
    });
  } catch (error) {
    console.error("Create activity API error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
