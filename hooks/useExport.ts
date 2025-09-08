"use client";

import type {
  ExportJob,
  ExportJobResponse,
  ExportStatusResponse,
  CreateExportJobRequest,
  ExportPlatform,
  ExportStatus,
  UseExportJobOptions,
} from "@/types/export";

import { useState, useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";

// Hook for creating export jobs
export function useCreateExportJob() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExportJob = useCallback(
    async (
      request: CreateExportJobRequest,
    ): Promise<ExportJobResponse | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/export/jobs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage =
            data.details || data.error || "Failed to create export job";

          if (response.status === 402) {
            toast.error(`Upgrade Required: ${errorMessage}`, {
              description: data.required_tier
                ? `This feature requires ${data.required_tier} tier or higher`
                : undefined,
              action: {
                label: "Upgrade",
                onClick: () => (window.location.href = "/pricing"),
              },
            });
          } else if (response.status === 429) {
            toast.error(`Export Limit Exceeded: ${errorMessage}`, {
              description: `Daily limit: ${data.limit}, Used: ${data.used}`,
              action: {
                label: "View Usage",
                onClick: () =>
                  (window.location.href = "/dashboard/exports/usage"),
              },
            });
          } else {
            toast.error(`Export Error: ${errorMessage}`);
          }

          throw new Error(errorMessage);
        }

        toast.success(
          `Export job created for ${data.message?.split(" ").slice(-1)[0] || "your game"}`,
          {
            description: `Estimated wait time: ${data.data.estimated_wait_time_minutes} minutes`,
            action: {
              label: "View Status",
              onClick: () =>
                (window.location.href = `/dashboard/exports/jobs/${data.data.job.id}`),
            },
          },
        );

        return data.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create export job";

        setError(errorMessage);

        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    createExportJob,
    loading,
    error,
  };
}

// Hook for fetching a specific export job with auto-refresh
export function useExportJob(jobId: string, options: UseExportJobOptions = {}) {
  const {
    auto_refresh = false,
    refresh_interval_ms = 5000,
    subscribe_to_updates = false,
  } = options;

  const [data, setData] = useState<ExportStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;

    try {
      setError(null);
      const response = await fetch(`/api/export/jobs/${jobId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch export job");
      }

      setData(result.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch export job";

      setError(errorMessage);
      console.error("Error fetching export job:", err);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Auto-refresh for active jobs
  useEffect(() => {
    if (!auto_refresh || !data?.job) return;

    const isActive = ["queued", "processing"].includes(data.job.status);

    if (!isActive) return;

    const interval = setInterval(fetchJob, refresh_interval_ms);

    return () => clearInterval(interval);
  }, [auto_refresh, refresh_interval_ms, data?.job?.status, fetchJob]);

  // Initial fetch
  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId, fetchJob]);

  // Cancel export job
  const cancelJob = useCallback(async (): Promise<boolean> => {
    if (!jobId) return false;

    try {
      const response = await fetch(`/api/export/jobs/${jobId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to cancel export job");
      }

      toast.success("Export job cancelled successfully");
      fetchJob(); // Refresh the job data

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to cancel export job";

      toast.error(`Cancel Error: ${errorMessage}`);

      return false;
    }
  }, [jobId, fetchJob]);

  return {
    job: data?.job || null,
    artifacts: data?.artifacts || [],
    analytics: data?.analytics || null,
    queuePosition: data?.queue_position,
    estimatedCompletion: data?.estimated_completion,
    loading,
    error,
    refetch: fetchJob,
    cancelJob,
  };
}

// Hook for fetching user's export jobs
export function useExportJobs(
  filters: {
    status?: ExportStatus[];
    platform?: ExportPlatform;
    limit?: number;
    offset?: number;
  } = {},
) {
  const [data, setData] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      if (filters.status?.length)
        params.set("status", filters.status.join(","));
      if (filters.platform) params.set("platform", filters.platform);
      if (filters.limit) params.set("limit", filters.limit.toString());
      if (filters.offset) params.set("offset", filters.offset.toString());

      const response = await fetch(`/api/export/jobs?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch export jobs");
      }

      setData(result.data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch export jobs";

      setError(errorMessage);
      console.error("Error fetching export jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.platform, filters.limit, filters.offset]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return {
    jobs: data,
    loading,
    error,
    refetch: fetchJobs,
  };
}

// Hook for fetching available export platforms
export function useExportPlatforms() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        setError(null);
        const response = await fetch("/api/export/platforms");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch export platforms");
        }

        setData(result.data);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch export platforms";

        setError(errorMessage);
        console.error("Error fetching export platforms:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlatforms();
  }, []);

  return {
    platforms: data?.available_platforms || [],
    unavailablePlatforms: data?.unavailable_platforms || [],
    subscriptionLimits: data?.subscription_limits || null,
    userTier: data?.user_tier || "free",
    subscriptionActive: data?.subscription_active || false,
    loading,
    error,
  };
}

// Hook for fetching export usage statistics
export function useExportUsage(days: number = 30) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ days: days.toString() });
      const response = await fetch(`/api/export/usage?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch export usage");
      }

      setData(result.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch export usage";

      setError(errorMessage);
      console.error("Error fetching export usage:", err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    usage: data,
    loading,
    error,
    refetch: fetchUsage,
  };
}

// Hook for fetching export queue metrics
export function useExportQueue() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch("/api/export/queue");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch queue metrics");
      }

      setData(result.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch queue metrics";

      setError(errorMessage);
      console.error("Error fetching queue metrics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  // Auto-refresh queue data every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchQueue, 30000);

    return () => clearInterval(interval);
  }, [fetchQueue]);

  return {
    queueMetrics: data?.queue_metrics || null,
    userJobsInQueue: data?.user_jobs_in_queue || [],
    estimatedWaitTimes: data?.estimated_wait_times || {},
    loading,
    error,
    refetch: fetchQueue,
  };
}

// Hook for downloading export artifacts
export function useDownloadArtifact() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadArtifact = useCallback(
    async (artifactId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/export/artifacts/${artifactId}/download`,
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to download artifact");
        }

        if (result.data?.download_url) {
          // Create a temporary link to trigger download
          const link = document.createElement("a");

          link.href = result.data.download_url;
          link.download = result.data.file_name || "export-artifact";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          toast.success(`Downloaded ${result.data.file_name}`, {
            description: `File size: ${Math.round((result.data.file_size / (1024 * 1024)) * 100) / 100} MB`,
          });

          return true;
        } else {
          throw new Error("No download URL provided");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to download artifact";

        setError(errorMessage);
        toast.error(`Download Error: ${errorMessage}`);

        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    downloadArtifact,
    loading,
    error,
  };
}

// Hook for real-time export job updates (WebSocket integration)
export function useExportJobUpdates(jobIds: string[] = []) {
  const [updates, setUpdates] = useState<Record<string, ExportJob>>({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!jobIds.length) return;

    // This would integrate with a WebSocket connection
    // For now, we'll use polling as a fallback
    const interval = setInterval(async () => {
      try {
        const promises = jobIds.map(async (jobId) => {
          const response = await fetch(`/api/export/jobs/${jobId}`);

          if (response.ok) {
            const result = await response.json();

            return { jobId, job: result.data.job };
          }

          return null;
        });

        const results = await Promise.all(promises);
        const newUpdates: Record<string, ExportJob> = {};

        results.forEach((result) => {
          if (result) {
            newUpdates[result.jobId] = result.job;
          }
        });

        setUpdates(newUpdates);
        setConnected(true);
      } catch (err) {
        console.error("Error polling job updates:", err);
        setConnected(false);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [jobIds]);

  return {
    updates,
    connected,
  };
}

// Utility hooks and helpers
export function useExportStatusColor(status: ExportStatus): string {
  return useMemo(() => {
    switch (status) {
      case "queued":
        return "warning";
      case "processing":
        return "primary";
      case "completed":
        return "success";
      case "failed":
        return "danger";
      case "cancelled":
        return "default";
      default:
        return "default";
    }
  }, [status]);
}

export function useExportStatusText(status: ExportStatus): string {
  return useMemo(() => {
    switch (status) {
      case "queued":
        return "Queued";
      case "processing":
        return "Processing";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  }, [status]);
}

export function useExportPlatformIcon(platform: ExportPlatform): string {
  return useMemo(() => {
    switch (platform) {
      case "web":
        return "🌐";
      case "pwa":
        return "📱";
      case "desktop-windows":
        return "🪟";
      case "desktop-macos":
        return "🍎";
      case "desktop-linux":
        return "🐧";
      case "mobile-android":
        return "🤖";
      case "mobile-ios":
        return "📱";
      case "source-code":
        return "💻";
      default:
        return "📦";
    }
  }, [platform]);
}
