/**
 * Follows API Route - Working Version
 * 
 * Uses existing user_follows table for following/unfollowing functionality
 */

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") || "following"; // "following" or "followers"

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

    const targetUserId = userId || user.id;

    if (type === "following") {
      // Get users that this user is following
      const { data: following, error } = await supabase
        .from("user_follows")
        .select(`
          id,
          following_id,
          created_at,
          profiles!user_follows_following_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            bio
          )
        `)
        .eq("follower_id", targetUserId);

      if (error) {
        console.error("Following error:", error);
        return NextResponse.json(
          { success: false, error: "Failed to fetch following" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        follows: following?.map(f => ({
          id: f.id,
          user: f.profiles,
          created_at: f.created_at,
        })) || [],
        total: following?.length || 0,
      });
    } else {
      // Get users following this user
      const { data: followers, error } = await supabase
        .from("user_follows")
        .select(`
          id,
          follower_id,
          created_at,
          profiles!user_follows_follower_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            bio
          )
        `)
        .eq("following_id", targetUserId);

      if (error) {
        console.error("Followers error:", error);
        return NextResponse.json(
          { success: false, error: "Failed to fetch followers" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        follows: followers?.map(f => ({
          id: f.id,
          user: f.profiles,
          created_at: f.created_at,
        })) || [],
        total: followers?.length || 0,
      });
    }
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

    const { userId: targetUserId } = await request.json();

    if (!targetUserId || targetUserId === user.id) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID" },
        { status: 400 },
      );
    }

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
        { status: 409 },
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
      message: "User followed successfully",
    });
  } catch (error) {
    console.error("Follow API error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: "User ID required" },
        { status: 400 },
      );
    }

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
      message: "User unfollowed successfully",
    });
  } catch (error) {
    console.error("Unfollow API error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}