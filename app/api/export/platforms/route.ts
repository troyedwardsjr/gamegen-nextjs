import type { ExportPlatform, SubscriptionTier } from "@/types/export";

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { ExportPlatformConfigService } from "@/lib/export/services";
import { PLATFORM_CAPABILITIES } from "@/types/export";

// GET /api/export/platforms - Get available export platforms and configurations
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const userTier: SubscriptionTier = (profile.subscription_tier as SubscriptionTier) || 'free';
    const isActive =
      profile.subscription_status === "active" || userTier === "free";

    // Filter platforms based on subscription tier
    const availablePlatforms = Object.entries(PLATFORM_CAPABILITIES)
      .filter(([platform, capabilities]) => {
        return isActive && capabilities.tiers.includes(userTier);
      })
      .map(([platform, capabilities]) => ({
        platform: platform as ExportPlatform,
        ...capabilities,
        enabled: true,
      }));

    const unavailablePlatforms = Object.entries(PLATFORM_CAPABILITIES)
      .filter(([platform, capabilities]) => {
        return !isActive || !capabilities.tiers.includes(userTier);
      })
      .map(([platform, capabilities]) => ({
        platform: platform as ExportPlatform,
        ...capabilities,
        enabled: false,
        required_tier: capabilities.tiers[0], // First allowed tier
      }));

    // Get platform configurations
    const configService = new ExportPlatformConfigService(true);
    const platformConfigs = await Promise.all(
      availablePlatforms.map(async (platformInfo) => {
        const configs = await configService.getPlatformConfigs(
          platformInfo.platform,
        );

        return {
          ...platformInfo,
          configurations: configs,
        };
      }),
    );

    // Get subscription limits
    const limits = getSubscriptionLimits(userTier);

    return NextResponse.json({
      success: true,
      data: {
        user_tier: userTier,
        subscription_active: isActive,
        available_platforms: platformConfigs,
        unavailable_platforms: unavailablePlatforms,
        subscription_limits: limits,
      },
    });
  } catch (error: any) {
    // TODO: Implement proper error logging system
    return NextResponse.json(
      {
        error: "Failed to fetch export platforms",
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
