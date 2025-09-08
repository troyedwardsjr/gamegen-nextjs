"use client";

import { useState, useCallback, useEffect } from "react";

import {
  UseAssetRecommendationsReturn,
  AssetRecommendation,
  AssetRecommendationContext,
} from "@/types/assets";

// Mock recommendations data
const mockRecommendations: AssetRecommendation[] = [
  {
    assetId: "2",
    score: 95,
    reason: "Perfect match for cyberpunk theme in your current project",
    tags: ["cyberpunk", "neon", "futuristic"],
    similarity: 0.92,
    type: "style_match",
  },
  {
    assetId: "5",
    score: 88,
    reason: "Complements your player character sprites",
    tags: ["character", "animation", "walk"],
    similarity: 0.85,
    type: "complementary",
  },
  {
    assetId: "3",
    score: 82,
    reason: "Similar style to your recently used assets",
    tags: ["sfx", "action", "jump"],
    similarity: 0.78,
    type: "similar",
  },
  {
    assetId: "4",
    score: 79,
    reason: "Based on your music preferences and current theme",
    tags: ["music", "cyberpunk", "background"],
    similarity: 0.75,
    type: "style_match",
  },
];

// Simulate API delay
const simulateDelay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Mock recommendation function
const mockGetRecommendations = async (
  context: AssetRecommendationContext,
): Promise<AssetRecommendation[]> => {
  await simulateDelay(500 + Math.random() * 1000);

  // Filter out excluded assets
  let recommendations = mockRecommendations.filter(
    (rec) => !context.excludeIds?.includes(rec.assetId),
  );

  // Adjust scores based on context
  recommendations = recommendations.map((rec) => {
    let adjustedScore = rec.score;

    // Boost score for matching game genre
    if (
      context.gameGenre &&
      rec.tags.some((tag) =>
        tag.toLowerCase().includes(context.gameGenre!.toLowerCase()),
      )
    ) {
      adjustedScore = Math.min(100, adjustedScore + 10);
    }

    // Boost score for matching game style
    if (
      context.gameStyle &&
      rec.tags.some((tag) =>
        tag.toLowerCase().includes(context.gameStyle!.toLowerCase()),
      )
    ) {
      adjustedScore = Math.min(100, adjustedScore + 8);
    }

    // Boost score for matching preferences
    if (
      context.preferences?.some((pref) =>
        rec.tags.some((tag) => tag.toLowerCase().includes(pref.toLowerCase())),
      )
    ) {
      adjustedScore = Math.min(100, adjustedScore + 5);
    }

    // Adjust based on current assets (collaborative filtering)
    if (context.currentAssets?.length) {
      // In a real implementation, this would use ML models
      // For mock, just boost complementary assets
      if (rec.type === "complementary") {
        adjustedScore = Math.min(100, adjustedScore + 7);
      }
    }

    return {
      ...rec,
      score: adjustedScore,
    };
  });

  // Sort by adjusted score
  recommendations.sort((a, b) => b.score - a.score);

  // Return top 10 recommendations
  return recommendations.slice(0, 10);
};

// Generate contextual recommendations based on user behavior
const generateContextualRecommendations = (
  context: AssetRecommendationContext,
): AssetRecommendation[] => {
  const contextualRecs: AssetRecommendation[] = [];

  // Time-based recommendations
  const hour = new Date().getHours();

  if (hour >= 9 && hour <= 17) {
    // Work hours - suggest productivity assets
    contextualRecs.push({
      assetId: "productivity-pack-1",
      score: 75,
      reason: "Perfect for your current work session",
      tags: ["ui", "interface", "productivity"],
      similarity: 0.7,
      type: "usage_pattern",
    });
  } else {
    // After hours - suggest creative/game assets
    contextualRecs.push({
      assetId: "creative-pack-1",
      score: 80,
      reason: "Great for creative evening projects",
      tags: ["creative", "experimental", "indie"],
      similarity: 0.75,
      type: "usage_pattern",
    });
  }

  // Seasonal recommendations
  const month = new Date().getMonth();

  if (month >= 9 && month <= 11) {
    // October-December
    contextualRecs.push({
      assetId: "winter-theme-1",
      score: 72,
      reason: "Trending winter themes for the season",
      tags: ["winter", "holiday", "seasonal"],
      similarity: 0.68,
      type: "usage_pattern",
    });
  }

  return contextualRecs;
};

export function useAssetRecommendations(): UseAssetRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<AssetRecommendation[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = useCallback(
    async (context: AssetRecommendationContext) => {
      setLoading(true);
      setError(null);

      try {
        // Get both ML-based and contextual recommendations
        const [mlRecommendations, contextualRecs] = await Promise.all([
          mockGetRecommendations(context),
          Promise.resolve(generateContextualRecommendations(context)),
        ]);

        // Merge and deduplicate recommendations
        const allRecommendations = [...mlRecommendations, ...contextualRecs];
        const uniqueRecommendations = allRecommendations.reduce((acc, rec) => {
          const existing = acc.find((r) => r.assetId === rec.assetId);

          if (!existing) {
            acc.push(rec);
          } else if (rec.score > existing.score) {
            // Replace with higher scoring recommendation
            const index = acc.indexOf(existing);

            acc[index] = rec;
          }

          return acc;
        }, [] as AssetRecommendation[]);

        // Sort by score and limit to top 15
        const finalRecommendations = uniqueRecommendations
          .sort((a, b) => b.score - a.score)
          .slice(0, 15);

        setRecommendations(finalRecommendations);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get recommendations";

        setError(errorMessage);
        setRecommendations([]);
        console.error("Recommendation error:", err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const refresh = useCallback(async () => {
    // Re-run the last recommendation context if available
    // In a real implementation, you'd store the last context
    const defaultContext: AssetRecommendationContext = {
      gameGenre: "action",
      gameStyle: "pixel",
    };

    await getRecommendations(defaultContext);
  }, [getRecommendations]);

  // Auto-refresh recommendations periodically
  useEffect(() => {
    const interval = setInterval(
      () => {
        if (recommendations.length > 0) {
          refresh();
        }
      },
      5 * 60 * 1000,
    ); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [recommendations.length, refresh]);

  return {
    recommendations,
    loading,
    error,
    getRecommendations,
    refresh,
  };
}
