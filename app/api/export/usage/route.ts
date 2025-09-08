import type { SubscriptionTier } from "@/types/export";

import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// GET /api/export/usage - Get user's export usage statistics
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
    const days = parseInt(searchParams.get("days") || "30");

    // Get user's subscription tier
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("subscription_tier, subscription_status")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    const userTier: SubscriptionTier = profile.subscription_tier;

    // Get today's usage
    const today = new Date().toISOString().split("T")[0];
    const { data: todayUsage, error: todayError } = await (supabase as any)
      .from("user_export_usage")
      .select("*")
      .eq("user_id", user.id)
      .eq("usage_date", today)
      .single();

    if (todayError && todayError.code !== "PGRST116") {
      console.error("Error fetching today's usage:", todayError);
    }

    // Get historical usage (last N days)
    const startDate = new Date();

    startDate.setDate(startDate.getDate() - days);
    const { data: historicalUsage, error: historyError } = await (
      supabase as any
    )
      .from("user_export_usage")
      .select("*")
      .eq("user_id", user.id)
      .gte("usage_date", startDate.toISOString().split("T")[0])
      .order("usage_date", { ascending: false });

    if (historyError) {
      console.error("Error fetching historical usage:", historyError);
    }

    // Get subscription limits
    const limits = getSubscriptionLimits(userTier);

    // Calculate storage usage in a readable format
    const storageUsedBytes = todayUsage?.total_storage_used_bytes || 0;
    const storageUsedMB =
      Math.round((storageUsedBytes / (1024 * 1024)) * 100) / 100;

    // Calculate total exports across all time
    const totalExports =
      historicalUsage?.reduce(
        (sum: number, usage: any) => sum + usage.total_exports,
        0,
      ) || 0;

    // Calculate platform breakdown
    const platformBreakdown = historicalUsage?.reduce(
      (acc: any, usage: any) => ({
        web: acc.web + usage.web_exports,
        desktop: acc.desktop + usage.desktop_exports,
        mobile: acc.mobile + usage.mobile_exports,
        source: acc.source + usage.source_exports,
      }),
      { web: 0, desktop: 0, mobile: 0, source: 0 },
    );

    return NextResponse.json({
      success: true,
      data: {
        subscription_tier: userTier,
        subscription_active:
          profile.subscription_status === "active" || userTier === "free",
        today: {
          exports_used: todayUsage?.exports_today || 0,
          exports_limit: limits.daily_export_limit,
          usage_percentage: Math.round(
            ((todayUsage?.exports_today || 0) / limits.daily_export_limit) *
              100,
          ),
          platform_breakdown: {
            web: todayUsage?.web_exports || 0,
            desktop: todayUsage?.desktop_exports || 0,
            mobile: todayUsage?.mobile_exports || 0,
            source: todayUsage?.source_exports || 0,
          },
        },
        storage: {
          used_mb: storageUsedMB,
          limit_mb: limits.max_file_size_mb,
          usage_percentage: Math.round(
            (storageUsedMB / limits.max_file_size_mb) * 100,
          ),
        },
        historical: {
          total_exports: totalExports,
          days_included: days,
          platform_breakdown: platformBreakdown,
          daily_usage: historicalUsage || [],
        },
        limits,
        features: limits.features,
      },
    });
  } catch (error: any) {
    console.error("Error fetching export usage:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch export usage",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

function getSubscriptionLimits(tier: SubscriptionTier) {
  const limits = {
    free: {
      daily_export_limit: 5,
      concurrent_exports: 1,
      max_file_size_mb: 50,
      features: {
        source_code_export: false,
        white_label_exports: false,
        custom_branding: false,
        priority_queue: false,
        webhook_notifications: false,
        advanced_analytics: false,
      },
    },
    pro: {
      daily_export_limit: 25,
      concurrent_exports: 3,
      max_file_size_mb: 200,
      features: {
        source_code_export: true,
        white_label_exports: false,
        custom_branding: false,
        priority_queue: false,
        webhook_notifications: true,
        advanced_analytics: true,
      },
    },
    max: {
      daily_export_limit: 100,
      concurrent_exports: 10,
      max_file_size_mb: 1000,
      features: {
        source_code_export: true,
        white_label_exports: true,
        custom_branding: true,
        priority_queue: true,
        webhook_notifications: true,
        advanced_analytics: true,
      },
    },
    educational: {
      daily_export_limit: 15,
      concurrent_exports: 2,
      max_file_size_mb: 100,
      features: {
        source_code_export: true,
        white_label_exports: false,
        custom_branding: false,
        priority_queue: false,
        webhook_notifications: false,
        advanced_analytics: false,
      },
    },
  };

  return limits[tier];
}
