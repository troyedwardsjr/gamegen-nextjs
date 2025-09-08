/**
 * Follows API Route
 *
 * Handles user following/unfollowing and follower management.
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

import { SocialDatabase } from "@/types/social";

interface FollowsResponse {
  success: boolean;
  follows?: Array<{
    id: string;
    user: {
      id: string;
      username: string;
      display_name: string;
      avatar_url: string;
    };
    created_at: string;
  }>;
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
    const userId = searchParams.get("userId"); // User to get follows for
    const type = searchParams.get("type") || "following"; // 'following' or 'followers'
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    const supabase = createRouteHandlerClient<SocialDatabase>({ cookies });

    // Get current user for privacy checks
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    // Use current user if no userId specified
    const targetUserId = userId || currentUser?.id;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 },
      );
    }

    let query;
    let userIdField;
    let userRelation;

    if (type === "followers") {
      // Get users who follow the target user
      userIdField = "follower_id";
      userRelation = "follower:profiles!follower_id";
      query = supabase
        .from("user_follows")
        .select(
          `
          id,
          created_at,
          ${userRelation}(id, username, display_name, avatar_url)
        `,
        )
        .eq("following_id", targetUserId);
    } else {
      // Get users that the target user follows
      userIdField = "following_id";
      userRelation = "following:profiles!following_id";
      query = supabase
        .from("user_follows")
        .select(
          `
          id,
          created_at,
          ${userRelation}(id, username, display_name, avatar_url)
        `,
        )
        .eq("follower_id", targetUserId);
    }

    // Apply pagination
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: follows, error: followsError } = await query;

    if (followsError) {
      console.error("Follows error:", followsError);

      return NextResponse.json(
        { success: false, error: "Failed to fetch follows" },
        { status: 500 },
      );
    }

    // Get total count
    let countQuery = supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true });

    if (type === "followers") {
      countQuery = countQuery.eq("following_id", targetUserId);
    } else {
      countQuery = countQuery.eq("follower_id", targetUserId);
    }

    const { count: totalCount } = await countQuery;

    // Transform the data
    const transformedFollows = follows?.map((follow) => ({
      id: follow.id,
      user: type === "followers" ? follow.follower : follow.following,
      created_at: follow.created_at,
    }));

    const response: FollowsResponse = {
      success: true,
      follows: transformedFollows || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        hasMore: (totalCount || 0) > offset + limit,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Follows API error:", error);

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
    const { action, user_id: targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "Target user ID is required" },
        { status: 400 },
      );
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot follow yourself" },
        { status: 400 },
      );
    }

    // Check if target user exists
    const { data: targetUser, error: userError } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("id", targetUserId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { success: false, error: "Target user not found" },
        { status: 404 },
      );
    }

    // Check if user is blocked
    const { data: blockStatus } = await supabase
      .from("user_blocks")
      .select("id")
      .or(
        `and(blocker_id.eq.${targetUserId},blocked_id.eq.${user.id}),and(blocker_id.eq.${user.id},blocked_id.eq.${targetUserId})`,
      )
      .single();

    if (blockStatus) {
      return NextResponse.json(
        { success: false, error: "Cannot follow this user" },
        { status: 403 },
      );
    }

    if (action === "follow") {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from("user_follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .single();

      if (existingFollow) {
        return NextResponse.json(
          { success: false, error: "Already following this user" },
          { status: 400 },
        );
      }

      // Create follow relationship
      const { error: followError } = await supabase
        .from("user_follows")
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
        });

      if (followError) {
        console.error("Follow error:", followError);

        return NextResponse.json(
          { success: false, error: "Failed to follow user" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: `Now following ${targetUser.username}`,
      });
    } else if (action === "unfollow") {
      // Remove follow relationship
      const { error: unfollowError } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);

      if (unfollowError) {
        console.error("Unfollow error:", unfollowError);

        return NextResponse.json(
          { success: false, error: "Failed to unfollow user" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: `Unfollowed ${targetUser.username}`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "follow" or "unfollow"' },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Follows POST API error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
