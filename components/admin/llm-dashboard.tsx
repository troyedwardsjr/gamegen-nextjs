"use client";

import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Badge } from "@heroui/badge";

import { useLLMProvider } from "@/lib/hooks/use-llm-provider";
import { createClient } from "@/lib/supabase/client";

interface LLMMetrics {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  success_rate: number;
  avg_response_time: number;
  errors_today: number;
  requests_by_provider: Record<string, number>;
  tokens_by_provider: Record<string, number>;
  hourly_requests: Array<{ hour: string; count: number }>;
  top_users: Array<{ user_id: string; requests: number; tokens: number }>;
}

export function LLMDashboard() {
  const { providers, getProviderMetrics } = useLLMProvider();
  const [metrics, setMetrics] = useState<LLMMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d" | "30d">(
    "24h",
  );

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [timeRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Calculate time range
      const now = new Date();
      const startTime = new Date();

      switch (timeRange) {
        case "1h":
          startTime.setHours(now.getHours() - 1);
          break;
        case "24h":
          startTime.setDate(now.getDate() - 1);
          break;
        case "7d":
          startTime.setDate(now.getDate() - 7);
          break;
        case "30d":
          startTime.setDate(now.getDate() - 30);
          break;
      }

      // Fetch metrics from database
      const supabase = createClient();
      const { data: requests, error: requestsError } = await (supabase as any)
        .from("llm_requests")
        .select("*")
        .gte("created_at", startTime.toISOString());

      if (requestsError) throw requestsError;

      // Calculate aggregated metrics
      const aggregatedMetrics: LLMMetrics = {
        total_requests: requests?.length || 0,
        total_tokens:
          requests?.reduce(
            (sum: number, r: any) => sum + (r.tokens_used || 0),
            0,
          ) || 0,
        total_cost:
          requests?.reduce((sum: number, r: any) => sum + (r.cost || 0), 0) ||
          0,
        success_rate: calculateSuccessRate(requests || []),
        avg_response_time: calculateAvgResponseTime(requests || []),
        errors_today:
          requests?.filter((r: any) => r.status === "error").length || 0,
        requests_by_provider: groupByProvider(requests || [], "count"),
        tokens_by_provider: groupByProvider(requests || [], "tokens"),
        hourly_requests: calculateHourlyRequests(requests || []),
        top_users: await getTopUsers(startTime),
      };

      setMetrics(aggregatedMetrics);
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSuccessRate = (requests: any[]) => {
    if (requests.length === 0) return 0;
    const successful = requests.filter((r) => r.status === "success").length;

    return (successful / requests.length) * 100;
  };

  const calculateAvgResponseTime = (requests: any[]) => {
    if (requests.length === 0) return 0;
    const sum = requests.reduce((acc, r) => acc + (r.response_time || 0), 0);

    return Math.round(sum / requests.length);
  };

  const groupByProvider = (requests: any[], metric: "count" | "tokens") => {
    const grouped: Record<string, number> = {};

    requests.forEach((r) => {
      const provider = r.provider_id || "unknown";

      if (metric === "count") {
        grouped[provider] = (grouped[provider] || 0) + 1;
      } else {
        grouped[provider] = (grouped[provider] || 0) + (r.tokens_used || 0);
      }
    });

    return grouped;
  };

  const calculateHourlyRequests = (requests: any[]) => {
    const hourly: Record<string, number> = {};

    requests.forEach((r) => {
      const hour = new Date(r.created_at).getHours();
      const key = `${hour}:00`;

      hourly[key] = (hourly[key] || 0) + 1;
    });

    // Convert to array and sort
    return Object.entries(hourly)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  };

  const getTopUsers = async (startTime: Date) => {
    const supabase = createClient();
    const { data, error } = await (supabase as any)
      .from("llm_requests")
      .select("user_id, tokens_used")
      .gte("created_at", startTime.toISOString());

    if (error || !data) return [];

    const userStats: Record<string, { requests: number; tokens: number }> = {};

    data.forEach((r: any) => {
      if (!userStats[r.user_id]) {
        userStats[r.user_id] = { requests: 0, tokens: 0 };
      }
      userStats[r.user_id].requests++;
      userStats[r.user_id].tokens += r.tokens_used || 0;
    });

    return Object.entries(userStats)
      .map(([user_id, stats]) => ({ user_id, ...stats }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 5);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  if (loading && !metrics) {
    return <div>Loading metrics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-2">
        {(["1h", "24h", "7d", "30d"] as const).map((range) => (
          <button
            key={range}
            className={`px-4 py-2 rounded-lg transition-colors ${
              timeRange === range
                ? "bg-primary text-primary-foreground"
                : "bg-default-100 hover:bg-default-200"
            }`}
            onClick={() => setTimeRange(range)}
          >
            {range === "1h"
              ? "Last Hour"
              : range === "24h"
                ? "Last 24 Hours"
                : range === "7d"
                  ? "Last 7 Days"
                  : "Last 30 Days"}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-small text-default-500">Total Requests</p>
            <p className="text-2xl font-bold">
              {formatNumber(metrics?.total_requests || 0)}
            </p>
            <Progress
              className="mt-2"
              maxValue={10000}
              size="sm"
              value={metrics?.total_requests || 0}
            />
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-small text-default-500">Total Tokens</p>
            <p className="text-2xl font-bold">
              {formatNumber(metrics?.total_tokens || 0)}
            </p>
            <p className="text-tiny text-default-400">
              ~{Math.round((metrics?.total_tokens || 0) / 750)} pages
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-small text-default-500">Total Cost</p>
            <p className="text-2xl font-bold">
              {formatCurrency(metrics?.total_cost || 0)}
            </p>
            <p className="text-tiny text-default-400">
              Avg:{" "}
              {formatCurrency(
                (metrics?.total_cost || 0) /
                  Math.max(1, metrics?.total_requests || 1),
              )}{" "}
              per request
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-small text-default-500">Success Rate</p>
            <p className="text-2xl font-bold">
              {(metrics?.success_rate ?? 0).toFixed(1)}%
            </p>
            <Badge
              className="mt-2"
              color={
                (metrics?.success_rate ?? 0) >= 95
                  ? "success"
                  : (metrics?.success_rate ?? 0) >= 90
                    ? "warning"
                    : "danger"
              }
            >
              {metrics?.errors_today || 0} errors today
            </Badge>
          </CardBody>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Performance</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-small text-default-500 mb-2">
                Average Response Time
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xl font-semibold">
                  {metrics?.avg_response_time}ms
                </p>
                <Badge
                  color={
                    (metrics?.avg_response_time ?? 0) < 1000
                      ? "success"
                      : (metrics?.avg_response_time ?? 0) < 3000
                        ? "warning"
                        : "danger"
                  }
                  variant="flat"
                >
                  {(metrics?.avg_response_time ?? 0) < 1000
                    ? "Fast"
                    : (metrics?.avg_response_time ?? 0) < 3000
                      ? "Normal"
                      : "Slow"}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-small text-default-500 mb-2">
                Requests by Provider
              </p>
              <div className="space-y-2">
                {Object.entries(metrics?.requests_by_provider || {}).map(
                  ([provider, count]) => (
                    <div
                      key={provider}
                      className="flex justify-between items-center"
                    >
                      <span className="text-small">{provider}</span>
                      <Badge variant="flat">{count}</Badge>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Usage by Hour */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Hourly Usage</h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-end gap-1 h-32">
            {metrics?.hourly_requests.map(({ hour, count }) => {
              const maxCount = Math.max(
                ...(metrics?.hourly_requests.map((h) => h.count) || [1]),
              );
              const height = (count / maxCount) * 100;

              return (
                <div
                  key={hour}
                  className="flex-1 bg-primary opacity-70 hover:opacity-100 transition-opacity rounded-t"
                  style={{ height: `${height}%` }}
                  title={`${hour}: ${count} requests`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-tiny text-default-400">00:00</span>
            <span className="text-tiny text-default-400">23:00</span>
          </div>
        </CardBody>
      </Card>

      {/* Top Users */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Top Users</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {metrics?.top_users.map((user, index) => (
              <div
                key={user.user_id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    color={index === 0 ? "warning" : "default"}
                    variant="flat"
                  >
                    #{index + 1}
                  </Badge>
                  <span className="text-small font-mono">
                    {user.user_id.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex gap-4 text-small">
                  <span>{formatNumber(user.requests)} requests</span>
                  <span className="text-default-500">
                    {formatNumber(user.tokens)} tokens
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
