/**
 * Challenges API Route
 *
 * Handles community challenges and game jams including listing, creating,
 * joining, and managing submissions.
 */

import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

import {
  Challenge,
  ChallengeParticipant,
  SocialDatabase,
} from "@/types/social";

interface ChallengesResponse {
  success: boolean;
  challenges?: (Challenge & {
    participant?: ChallengeParticipant;
    creator: {
      username: string;
      display_name: string;
      avatar_url: string;
    };
  })[];
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
    const limit = Math.min(parseInt(searchParams.get("limit") || "12"), 50);
    const offset = (page - 1) * limit;
    const status = searchParams.get("status"); // Filter by status
    const type = searchParams.get("type"); // Filter by challenge type
    const featured = searchParams.get("featured") === "true";
    const myParticipation = searchParams.get("myParticipation") === "true";

    const supabase = createRouteHandlerClient<SocialDatabase>({ cookies });

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    // Build query
    let query = supabase
      .from("challenges")
      .select(
        `
        *,
        creator:profiles!creator_id(username, display_name, avatar_url),
        challenge_participants!left(
          id,
          user_id,
          status,
          team_name,
          submission_game_id,
          submitted_at
        )
      `,
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    } else {
      // Default to showing active and upcoming challenges
      query = query.in("status", ["upcoming", "active", "voting", "completed"]);
    }

    if (type) {
      query = query.eq("challenge_type", type);
    }

    if (featured) {
      query = query.eq("is_featured", true);
    }

    if (myParticipation && user) {
      query = query.eq("challenge_participants.user_id", user.id);
    }

    const { data: challenges, error: challengesError } = await query;

    if (challengesError) {
      console.error("Challenges error:", challengesError);

      return NextResponse.json(
        { success: false, error: "Failed to fetch challenges" },
        { status: 500 },
      );
    }

    // Process challenges to find user participation
    const processedChallenges = challenges?.map((challenge) => {
      const participant = user
        ? challenge.challenge_participants?.find(
            (p: any) => p.user_id === user.id,
          )
        : null;

      return {
        ...challenge,
        participant,
        challenge_participants: undefined, // Remove from response for cleaner output
      };
    });

    // Get total count for pagination
    let countQuery = supabase
      .from("challenges")
      .select("*", { count: "exact", head: true });

    if (status) {
      countQuery = countQuery.eq("status", status);
    } else {
      countQuery = countQuery.in("status", [
        "upcoming",
        "active",
        "voting",
        "completed",
      ]);
    }

    if (type) {
      countQuery = countQuery.eq("challenge_type", type);
    }

    if (featured) {
      countQuery = countQuery.eq("is_featured", true);
    }

    const { count: totalCount } = await countQuery;

    const response: ChallengesResponse = {
      success: true,
      challenges: processedChallenges || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        hasMore: (totalCount || 0) > offset + limit,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Challenges API error:", error);

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
    const { action, challenge_id } = body;

    if (action === "join") {
      if (!challenge_id) {
        return NextResponse.json(
          { success: false, error: "Challenge ID is required" },
          { status: 400 },
        );
      }

      // Check if challenge exists and is joinable
      const { data: challenge, error: challengeError } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challenge_id)
        .single();

      if (challengeError || !challenge) {
        return NextResponse.json(
          { success: false, error: "Challenge not found" },
          { status: 404 },
        );
      }

      // Check if challenge is in a joinable state
      if (!["upcoming", "active"].includes(challenge.status)) {
        return NextResponse.json(
          { success: false, error: "Challenge is not open for participation" },
          { status: 400 },
        );
      }

      // Check if user is already participating
      const { data: existingParticipation } = await supabase
        .from("challenge_participants")
        .select("*")
        .eq("challenge_id", challenge_id)
        .eq("user_id", user.id)
        .single();

      if (existingParticipation) {
        return NextResponse.json(
          { success: false, error: "Already participating in this challenge" },
          { status: 400 },
        );
      }

      // Check participant limit
      if (challenge.max_participants) {
        const { count: currentParticipants } = await supabase
          .from("challenge_participants")
          .select("*", { count: "exact", head: true })
          .eq("challenge_id", challenge_id);

        if ((currentParticipants || 0) >= challenge.max_participants) {
          return NextResponse.json(
            { success: false, error: "Challenge is full" },
            { status: 400 },
          );
        }
      }

      // Join the challenge
      const { data: participation, error: joinError } = await supabase
        .from("challenge_participants")
        .insert({
          challenge_id,
          user_id: user.id,
          status: "registered",
        })
        .select()
        .single();

      if (joinError) {
        console.error("Join challenge error:", joinError);

        return NextResponse.json(
          { success: false, error: "Failed to join challenge" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        participation,
        message: "Successfully joined the challenge!",
      });
    }

    if (action === "submit") {
      const { game_id, notes } = body;

      if (!challenge_id || !game_id) {
        return NextResponse.json(
          { success: false, error: "Challenge ID and game ID are required" },
          { status: 400 },
        );
      }

      // Verify user is participating in the challenge
      const { data: participation, error: participationError } = await supabase
        .from("challenge_participants")
        .select("*")
        .eq("challenge_id", challenge_id)
        .eq("user_id", user.id)
        .single();

      if (participationError || !participation) {
        return NextResponse.json(
          {
            success: false,
            error: "You are not participating in this challenge",
          },
          { status: 400 },
        );
      }

      // Check if challenge accepts submissions
      const { data: challenge, error: challengeError } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challenge_id)
        .single();

      if (challengeError || !challenge) {
        return NextResponse.json(
          { success: false, error: "Challenge not found" },
          { status: 404 },
        );
      }

      // Check submission deadline
      const now = new Date();
      const deadline = new Date(
        challenge.submission_deadline || challenge.ends_at,
      );

      if (now > deadline) {
        return NextResponse.json(
          { success: false, error: "Submission deadline has passed" },
          { status: 400 },
        );
      }

      // Verify user owns the game
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("*")
        .eq("id", game_id)
        .eq("creator_id", user.id)
        .single();

      if (gameError || !game) {
        return NextResponse.json(
          { success: false, error: "Game not found or not owned by user" },
          { status: 404 },
        );
      }

      // Submit the game
      const { error: submitError } = await supabase
        .from("challenge_participants")
        .update({
          submission_game_id: game_id,
          submitted_at: new Date().toISOString(),
          submission_notes: notes || null,
          status: "submitted",
        })
        .eq("id", participation.id);

      if (submitError) {
        console.error("Submit challenge error:", submitError);

        return NextResponse.json(
          { success: false, error: "Failed to submit to challenge" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Game submitted to challenge successfully!",
      });
    }

    if (action === "create") {
      // Only allow admins or verified users to create challenges
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_verified, subscription_tier")
        .eq("id", user.id)
        .single();

      if (
        !profile?.is_verified &&
        profile?.subscription_tier !== "enterprise"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Only verified users can create challenges",
          },
          { status: 403 },
        );
      }

      const challengeData = body.challenge;

      if (!challengeData) {
        return NextResponse.json(
          { success: false, error: "Challenge data is required" },
          { status: 400 },
        );
      }

      // Create the challenge
      const { data: challenge, error: createError } = await supabase
        .from("challenges")
        .insert({
          ...challengeData,
          creator_id: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error("Create challenge error:", createError);

        return NextResponse.json(
          { success: false, error: "Failed to create challenge" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        challenge,
        message: "Challenge created successfully!",
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Challenges POST API error:", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
