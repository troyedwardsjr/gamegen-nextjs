"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import { useToast } from "@/hooks/use-toast";

interface CreditUsage {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  dailyLimit: number;
  dailyUsed: number;
  monthlyLimit: number;
  monthlyUsed: number;
  costBreakdown: {
    chat: number;
    artGeneration: number;
    codeHelp: number;
    other: number;
  };
  recentUsage: Array<{
    date: string;
    amount: number;
    feature: string;
    cost_cents: number;
  }>;
}

interface CreditUsageDisplayProps {
  compact?: boolean;
  showDetails?: boolean;
  sessionId?: string;
  className?: string;
}

const FEATURE_COLORS = {
  chat_completion: "from-blue-500 to-cyan-500",
  art_generation: "from-pink-500 to-purple-500",
  code_help: "from-green-500 to-emerald-500",
  voice_synthesis: "from-orange-500 to-red-500",
  other: "from-gray-500 to-slate-500",
} as const;

const FEATURE_ICONS = {
  chat_completion: "💬",
  art_generation: "🎨",
  code_help: "💻",
  voice_synthesis: "🎵",
  other: "⚡",
} as const;

export const CreditUsageDisplay: React.FC<CreditUsageDisplayProps> = ({
  compact = false,
  showDetails = false,
  sessionId,
  className,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClient();

  const [creditUsage, setCreditUsage] = useState<CreditUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch credit usage data
  const fetchCreditUsage = async () => {
    if (!user) return;

    try {
      setRefreshing(true);
      setError(null);

      // Get user's billing info
      const { data: billing, error: billingError } = await (supabase as any)
        .from("user_billing")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (billingError && billingError.code !== "PGRST116") {
        throw billingError;
      }

      // Get usage tracking data
      const today = new Date().toISOString().split("T")[0];
      const thisMonth = new Date().toISOString().slice(0, 7);

      // Daily usage
      const { data: dailyUsage, error: dailyError } = await (supabase as any)
        .from("usage_tracking")
        .select("tokens_used, cost_cents, feature_type")
        .eq("user_id", user.id)
        .gte("created_at", `${today}T00:00:00Z`)
        .lt("created_at", `${today}T23:59:59Z`);

      if (dailyError) throw dailyError;

      // Monthly usage
      const { data: monthlyUsage, error: monthlyError } = await (supabase as any)
        .from("usage_tracking")
        .select("tokens_used, cost_cents, feature_type")
        .eq("user_id", user.id)
        .gte("created_at", `${thisMonth}-01T00:00:00Z`);

      if (monthlyError) throw monthlyError;

      // Recent usage for breakdown
      const { data: recentUsage, error: recentError } = await (supabase as any)
        .from("usage_tracking")
        .select("created_at, tokens_used, cost_cents, feature_type, metadata")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (recentError) throw recentError;

      // Calculate totals
      const dailyCostCents =
        dailyUsage?.reduce((sum: number, item: any) => sum + (item.cost_cents || 0), 0) || 0;
      const monthlyCostCents =
        monthlyUsage?.reduce((sum: number, item: any) => sum + (item.cost_cents || 0), 0) ||
        0;

      // Feature breakdown
      const costBreakdown =
        monthlyUsage?.reduce(
          (acc: Record<string, number>, item: any) => {
            const feature = item.feature_type || "other";

            acc[feature] = (acc[feature] || 0) + (item.cost_cents || 0);

            return acc;
          },
          {} as Record<string, number>,
        ) || {};

      // Convert to credits (assuming 1 cent = 1 credit for simplicity)
      const usedCredits = monthlyCostCents;
      const totalCredits = billing?.monthly_credit_limit || 1000; // Default limit
      const remainingCredits = Math.max(0, totalCredits - usedCredits);

      setCreditUsage({
        totalCredits,
        usedCredits,
        remainingCredits,
        dailyLimit: billing?.daily_credit_limit || 100,
        dailyUsed: dailyCostCents,
        monthlyLimit: totalCredits,
        monthlyUsed: usedCredits,
        costBreakdown: {
          chat: costBreakdown.chat_completion || 0,
          artGeneration: costBreakdown.art_generation || 0,
          codeHelp: costBreakdown.code_help || 0,
          other: Object.keys(costBreakdown).reduce((sum: number, key: string) => {
            return !["chat_completion", "art_generation", "code_help"].includes(
              key,
            )
              ? sum + costBreakdown[key]
              : sum;
          }, 0),
        },
        recentUsage:
          recentUsage?.map((item: any) => ({
            date: item.created_at,
            amount: item.tokens_used || 0,
            feature: item.feature_type || "other",
            cost_cents: item.cost_cents || 0,
          })) || [],
      });
    } catch (error) {
      console.error("Failed to fetch credit usage:", error);
      setError("Failed to load credit information");
      toast({
        title: "Failed to load credits",
        description: "Unable to fetch your credit usage information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load and real-time updates
  useEffect(() => {
    if (user) {
      fetchCreditUsage();

      // Set up real-time subscription for usage updates
      const channel = supabase
        .channel("credit_usage")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "usage_tracking",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchCreditUsage();
          },
        )
        .subscribe();

      // Refresh every 5 minutes
      const interval = setInterval(fetchCreditUsage, 5 * 60 * 1000);

      return () => {
        supabase.removeChannel(channel);
        clearInterval(interval);
      };
    }
  }, [user]);

  // Calculate usage percentage and status
  const usagePercentage = useMemo(() => {
    if (!creditUsage) return 0;

    return (creditUsage.usedCredits / creditUsage.totalCredits) * 100;
  }, [creditUsage]);

  const usageStatus = useMemo(() => {
    if (usagePercentage >= 90) return "critical";
    if (usagePercentage >= 75) return "warning";

    return "normal";
  }, [usagePercentage]);

  const statusColors = {
    normal: "from-green-500 to-emerald-500",
    warning: "from-yellow-500 to-orange-500",
    critical: "from-red-500 to-pink-500",
  };

  if (!user || isLoading) {
    return compact ? (
      <div className="flex items-center space-x-2 text-white/60">
        <div className="w-4 h-4 animate-spin border-2 border-cyan-400 border-t-transparent rounded-full" />
        <span className="text-sm">Loading...</span>
      </div>
    ) : null;
  }

  if (error || !creditUsage) {
    return compact ? (
      <div className="flex items-center space-x-2 text-red-400">
        <span>⚠️</span>
        <span className="text-sm">Credit info unavailable</span>
      </div>
    ) : (
      <GlassmorphicCard className="p-4" variant="accent-rose">
        <div className="text-center text-red-400">
          <p className="font-medium">Failed to load credit information</p>
          <GlassmorphicButton
            className="mt-2"
            size="sm"
            variant="glass-ghost"
            onClick={fetchCreditUsage}
          >
            Retry
          </GlassmorphicButton>
        </div>
      </GlassmorphicCard>
    );
  }

  if (compact) {
    return (
      <div className={clsx("flex items-center space-x-2", className)}>
        {/* Credit display */}
        <div className="flex items-center space-x-1">
          <span className="text-sm text-white/60">Credits:</span>
          <GlassmorphicBadge
            size="sm"
            variant={
              usageStatus === "critical"
                ? "danger"
                : usageStatus === "warning"
                  ? "warning"
                  : "gaming"
            }
          >
            {creditUsage.remainingCredits.toLocaleString()}
          </GlassmorphicBadge>
        </div>

        {/* Usage bar */}
        <div className="flex items-center space-x-1">
          <div className="w-16 h-2 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${Math.min(100, usagePercentage)}%` }}
              className={`h-full bg-gradient-to-r ${statusColors[usageStatus]}`}
              initial={{ width: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-xs text-white/60">
            {Math.round(usagePercentage)}%
          </span>
        </div>

        {/* Refresh button */}
        <GlassmorphicButton
          className="text-white/60 hover:text-white"
          disabled={refreshing}
          size="sm"
          title="Refresh credit usage"
          variant="glass-ghost"
          onClick={fetchCreditUsage}
        >
          <motion.div
            animate={refreshing ? { rotate: 360 } : {}}
            transition={{
              duration: 1,
              repeat: refreshing ? Infinity : 0,
              ease: "linear",
            }}
          >
            🔄
          </motion.div>
        </GlassmorphicButton>
      </div>
    );
  }

  return (
    <div className={clsx("space-y-4", className)}>
      <GlassmorphicCard className="p-4" variant="subtle">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <span>💳</span>
            <span>Credit Usage</span>
          </h3>
          <div className="flex items-center space-x-2">
            <GlassmorphicButton
              size="sm"
              variant="glass-ghost"
              onClick={() => setShowBreakdown(!showBreakdown)}
            >
              {showBreakdown ? "Hide Details" : "Show Details"}
            </GlassmorphicButton>
            <GlassmorphicButton
              disabled={refreshing}
              size="sm"
              variant="glass-ghost"
              onClick={fetchCreditUsage}
            >
              <motion.div
                animate={refreshing ? { rotate: 360 } : {}}
                transition={{
                  duration: 1,
                  repeat: refreshing ? Infinity : 0,
                  ease: "linear",
                }}
              >
                🔄
              </motion.div>
            </GlassmorphicButton>
          </div>
        </div>

        {/* Main usage display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {creditUsage.remainingCredits.toLocaleString()}
            </div>
            <div className="text-sm text-white/60">Remaining Credits</div>
          </div>
          <div className="text-center">
            <div className="text-xl text-white/80">
              {creditUsage.usedCredits.toLocaleString()} /{" "}
              {creditUsage.totalCredits.toLocaleString()}
            </div>
            <div className="text-sm text-white/60">Monthly Usage</div>
          </div>
          <div className="text-center">
            <div className="text-xl text-white/80">
              {creditUsage.dailyUsed.toLocaleString()} /{" "}
              {creditUsage.dailyLimit.toLocaleString()}
            </div>
            <div className="text-sm text-white/60">Daily Usage</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-white/80">
            <span>Monthly Limit</span>
            <span>{Math.round(usagePercentage)}% used</span>
          </div>
          <div className="h-3 bg-black/30 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${Math.min(100, usagePercentage)}%` }}
              className={`h-full bg-gradient-to-r ${statusColors[usageStatus]}`}
              initial={{ width: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Status message */}
        <div className="mt-3 text-center">
          {usageStatus === "critical" && (
            <p className="text-red-400 text-sm">
              ⚠️ Credit limit almost reached
            </p>
          )}
          {usageStatus === "warning" && (
            <p className="text-orange-400 text-sm">
              🟡 High credit usage this month
            </p>
          )}
          {usageStatus === "normal" && (
            <p className="text-green-400 text-sm">✅ Credit usage is healthy</p>
          )}
        </div>
      </GlassmorphicCard>

      {/* Detailed breakdown */}
      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GlassmorphicCard className="p-4" variant="subtle">
              <h4 className="text-md font-medium text-white mb-3 flex items-center space-x-2">
                <span>📊</span>
                <span>Usage Breakdown</span>
              </h4>

              {/* Feature breakdown */}
              <div className="space-y-3">
                {Object.entries(creditUsage.costBreakdown).map(
                  ([feature, cost]) => {
                    const percentage =
                      creditUsage.usedCredits > 0
                        ? (cost / creditUsage.usedCredits) * 100
                        : 0;
                    const featureKey =
                      feature === "chat"
                        ? "chat_completion"
                        : feature === "artGeneration"
                          ? "art_generation"
                          : feature === "codeHelp"
                            ? "code_help"
                            : "other";

                    return (
                      <div key={feature} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <span>{FEATURE_ICONS[featureKey]}</span>
                            <span className="text-sm text-white/80 capitalize">
                              {feature.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-white/60">
                              {cost.toLocaleString()} credits
                            </span>
                            <span className="text-xs text-white/40">
                              ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                          <motion.div
                            animate={{ width: `${percentage}%` }}
                            className={`h-full bg-gradient-to-r ${FEATURE_COLORS[featureKey]}`}
                            initial={{ width: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

              {/* Recent usage */}
              {creditUsage.recentUsage.length > 0 && (
                <div className="mt-6">
                  <h5 className="text-sm font-medium text-white/80 mb-2">
                    Recent Usage
                  </h5>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {creditUsage.recentUsage
                      .slice(0, 10)
                      .map((usage, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-xs py-1 px-2 rounded bg-black/20"
                        >
                          <div className="flex items-center space-x-2">
                            <span>
                              {FEATURE_ICONS[
                                usage.feature as keyof typeof FEATURE_ICONS
                              ] || "⚡"}
                            </span>
                            <span className="text-white/60">
                              {new Date(usage.date).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-white/80">
                            {usage.cost_cents} credits
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </GlassmorphicCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreditUsageDisplay;
