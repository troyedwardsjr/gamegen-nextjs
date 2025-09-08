/**
 * React Hook for LLM Provider Management
 *
 * Custom React hooks for managing LLM providers, monitoring status,
 * and handling provider configuration in the frontend.
 */

"use client";

import type {
  ProviderStatus,
  ProviderConfiguration,
  LLMSystemConfig,
  ProviderMetrics,
  ProviderHealthStatus,
} from "@/lib/llm/types";

import { useState, useEffect, useCallback, useRef } from "react";

import { createClient } from "@/lib/supabase/client";

export interface UseLLMProviderOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealtime?: boolean;
}

export interface LLMProviderState {
  providers: ProviderStatus[];
  config: LLMSystemConfig | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface LLMProviderActions {
  refresh: () => Promise<void>;
  updateProviderConfig: (
    providerId: string,
    config: Partial<ProviderConfiguration>,
  ) => Promise<void>;
  toggleProvider: (providerId: string, enabled: boolean) => Promise<void>;
  getProviderMetrics: (providerId: string) => Promise<ProviderMetrics | null>;
  resetCircuitBreaker: (providerId: string) => Promise<void>;
}

/**
 * Hook for managing LLM providers
 */
export function useLLMProvider(
  options: UseLLMProviderOptions = {},
): LLMProviderState & LLMProviderActions {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableRealtime = true,
  } = options;

  const [state, setState] = useState<LLMProviderState>({
    providers: [],
    config: null,
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const supabase = createClient();
  const refreshIntervalRef = useRef<NodeJS.Timeout>();
  const mounted = useRef(true);

  /**
   * Fetch provider status and configuration
   */
  const fetchProviderData = useCallback(async (): Promise<void> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Fetch from API endpoint
      const response = await fetch("/api/llm/generate", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch provider data: ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (!mounted.current) return;

      if (data.success) {
        setState((prev) => ({
          ...prev,
          providers: data.data.providers || [],
          config: data.data.config || null,
          isLoading: false,
          lastUpdated: new Date(),
        }));
      } else {
        throw new Error(data.error || "Failed to fetch provider data");
      }
    } catch (error) {
      if (!mounted.current) return;

      console.error("[useLLMProvider] Error fetching provider data:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  }, []);

  /**
   * Refresh provider data
   */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchProviderData();
  }, [fetchProviderData]);

  /**
   * Update provider configuration
   */
  const updateProviderConfig = useCallback(
    async (
      providerId: string,
      config: Partial<ProviderConfiguration>,
    ): Promise<void> => {
      try {
        setState((prev) => ({ ...prev, error: null }));

        const response = await fetch(
          `/api/llm/providers/${providerId}/config`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(config),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();

          throw new Error(
            errorData.error || "Failed to update provider configuration",
          );
        }

        // Refresh data to get updated configuration
        await fetchProviderData();
      } catch (error) {
        console.error(
          "[useLLMProvider] Error updating provider config:",
          error,
        );
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to update configuration",
        }));
        throw error;
      }
    },
    [fetchProviderData],
  );

  /**
   * Enable or disable a provider
   */
  const toggleProvider = useCallback(
    async (providerId: string, enabled: boolean): Promise<void> => {
      try {
        setState((prev) => ({ ...prev, error: null }));

        const response = await fetch(
          `/api/llm/providers/${providerId}/toggle`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ enabled }),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();

          throw new Error(errorData.error || "Failed to toggle provider");
        }

        // Update local state optimistically
        setState((prev) => ({
          ...prev,
          providers: prev.providers.map((provider) =>
            provider.provider_id === providerId
              ? ({ ...provider, enabled } as any)
              : provider,
          ),
        }));

        // Refresh data to ensure consistency
        await fetchProviderData();
      } catch (error) {
        console.error("[useLLMProvider] Error toggling provider:", error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to toggle provider",
        }));
        throw error;
      }
    },
    [fetchProviderData],
  );

  /**
   * Get detailed metrics for a specific provider
   */
  const getProviderMetrics = useCallback(
    async (providerId: string): Promise<ProviderMetrics | null> => {
      try {
        const response = await fetch(
          `/api/llm/providers/${providerId}/metrics`,
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch metrics for ${providerId}`);
        }

        const data = await response.json();

        return data.success ? data.data : null;
      } catch (error) {
        console.error(
          "[useLLMProvider] Error fetching provider metrics:",
          error,
        );

        return null;
      }
    },
    [],
  );

  /**
   * Reset circuit breaker for a provider
   */
  const resetCircuitBreaker = useCallback(
    async (providerId: string): Promise<void> => {
      try {
        setState((prev) => ({ ...prev, error: null }));

        const response = await fetch(
          `/api/llm/providers/${providerId}/reset-circuit`,
          {
            method: "POST",
          },
        );

        if (!response.ok) {
          const errorData = await response.json();

          throw new Error(errorData.error || "Failed to reset circuit breaker");
        }

        // Refresh data to get updated status
        await fetchProviderData();
      } catch (error) {
        console.error(
          "[useLLMProvider] Error resetting circuit breaker:",
          error,
        );
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to reset circuit breaker",
        }));
        throw error;
      }
    },
    [fetchProviderData],
  );

  // Setup auto-refresh
  useEffect(() => {
    // Initial fetch
    fetchProviderData();

    // Setup interval if auto-refresh is enabled
    if (autoRefresh && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(
        fetchProviderData,
        refreshInterval,
      );
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchProviderData, autoRefresh, refreshInterval]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!enableRealtime) return;

    const subscription = supabase
      .channel("llm-provider-status")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "llm_provider_status",
        },
        () => {
          // Refresh data when provider status changes
          fetchProviderData();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [enableRealtime, fetchProviderData, supabase]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mounted.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    refresh,
    updateProviderConfig,
    toggleProvider,
    getProviderMetrics,
    resetCircuitBreaker,
  };
}

/**
 * Hook for monitoring specific provider
 */
export function useProviderMonitor(
  providerId: string,
  options: { refreshInterval?: number } = {},
) {
  const { refreshInterval = 10000 } = options;

  const [provider, setProvider] = useState<ProviderStatus | null>(null);
  const [metrics, setMetrics] = useState<ProviderMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { providers, getProviderMetrics } = useLLMProvider({
    autoRefresh: true,
    refreshInterval,
  });

  // Update provider when providers list changes
  useEffect(() => {
    const foundProvider = providers.find((p) => p.provider_id === providerId);

    setProvider(foundProvider || null);
    setIsLoading(false);
  }, [providers, providerId]);

  // Fetch detailed metrics
  useEffect(() => {
    let mounted = true;

    const fetchMetrics = async () => {
      try {
        const providerMetrics = await getProviderMetrics(providerId);

        if (mounted) {
          setMetrics(providerMetrics);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch metrics",
          );
        }
      }
    };

    if (provider) {
      fetchMetrics();

      // Setup interval for metrics updates
      const interval = setInterval(fetchMetrics, refreshInterval);

      return () => {
        mounted = false;
        clearInterval(interval);
      };
    }

    return () => {
      mounted = false;
    };
  }, [provider, providerId, refreshInterval, getProviderMetrics]);

  return {
    provider,
    metrics,
    isLoading,
    error,
    isHealthy: provider?.health_status === "healthy",
    isAvailable: provider?.circuit_breaker_state === "closed",
  };
}

/**
 * Hook for provider health status
 */
export function useProviderHealth() {
  const { providers, isLoading, error } = useLLMProvider();

  const healthSummary = {
    total: providers.length,
    healthy: providers.filter((p) => p.health_status === "healthy").length,
    unhealthy: providers.filter((p) => p.health_status === "unhealthy").length,
    degraded: providers.filter((p) => p.health_status === "degraded").length,
    offline: providers.filter((p) => p.health_status === "offline").length,
    circuitOpen: providers.filter((p) => p.circuit_breaker_state === "open")
      .length,
    available: providers.filter(
      (p) =>
        p.health_status === "healthy" && p.circuit_breaker_state === "closed",
    ).length,
  };

  const healthPercentage =
    providers.length > 0 ? (healthSummary.healthy / providers.length) * 100 : 0;

  const overallStatus: ProviderHealthStatus =
    healthSummary.available === 0
      ? "offline"
      : healthPercentage >= 80
        ? "healthy"
        : healthPercentage >= 50
          ? "degraded"
          : "unhealthy";

  return {
    providers,
    summary: healthSummary,
    overallStatus,
    healthPercentage,
    isLoading,
    error,
    hasAvailableProviders: healthSummary.available > 0,
  };
}
