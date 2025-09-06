"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { Filter, X, Calendar, Eye, Tag } from "lucide-react";
import { ActivityType, ActivityVisibility } from "@/src/types/social";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";

interface ActivityFiltersProps {
  onFiltersChange: (filters: {
    activityTypes?: ActivityType[];
    visibility?: ActivityVisibility[];
    dateRange?: { from: Date; to: Date };
  }) => void;
  initialFilters?: {
    activityTypes?: ActivityType[];
    visibility?: ActivityVisibility[];
    dateRange?: { from: Date; to: Date };
  };
  className?: string;
}

const ACTIVITY_TYPE_OPTIONS = [
  { key: "game_created", label: "Games Created", icon: "🎮" },
  { key: "game_published", label: "Games Published", icon: "⭐" },
  { key: "game_liked", label: "Games Liked", icon: "❤️" },
  { key: "game_commented", label: "Comments", icon: "💬" },
  { key: "user_followed", label: "Following", icon: "👥" },
  { key: "achievement_unlocked", label: "Achievements", icon: "🏆" },
  { key: "collection_created", label: "Collections", icon: "📁" },
  { key: "template_shared", label: "Templates Shared", icon: "📤" },
  { key: "asset_uploaded", label: "Assets Uploaded", icon: "🎨" },
  { key: "challenge_completed", label: "Challenges", icon: "🎯" },
  { key: "game_featured", label: "Featured Games", icon: "👑" },
  { key: "milestone_reached", label: "Milestones", icon: "🌟" },
  { key: "collaboration_joined", label: "Collaborations", icon: "🤝" },
] as const;

const VISIBILITY_OPTIONS = [
  { key: "public", label: "Public", icon: "🌍" },
  { key: "followers", label: "Followers Only", icon: "👥" },
  { key: "private", label: "Private", icon: "🔒" },
] as const;

const QUICK_DATE_RANGES = [
  { key: "today", label: "Today", days: 0 },
  { key: "week", label: "Past Week", days: 7 },
  { key: "month", label: "Past Month", days: 30 },
  { key: "quarter", label: "Past 3 Months", days: 90 },
  { key: "year", label: "Past Year", days: 365 },
] as const;

export function ActivityFilters({
  onFiltersChange,
  initialFilters = {},
  className,
}: ActivityFiltersProps) {
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<Set<string>>(
    new Set(initialFilters.activityTypes || [])
  );
  const [selectedVisibility, setSelectedVisibility] = useState<Set<string>>(
    new Set(initialFilters.visibility || [])
  );
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(
    initialFilters.dateRange || null
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleActivityTypeToggle = (type: ActivityType) => {
    const newTypes = new Set(selectedActivityTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedActivityTypes(newTypes);
  };

  const handleVisibilityToggle = (visibility: ActivityVisibility) => {
    const newVisibility = new Set(selectedVisibility);
    if (newVisibility.has(visibility)) {
      newVisibility.delete(visibility);
    } else {
      newVisibility.add(visibility);
    }
    setSelectedVisibility(newVisibility);
  };

  const handleQuickDateRange = (days: number) => {
    if (days === 0) {
      // Today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDateRange({ from: today, to: tomorrow });
    } else {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - days);
      setDateRange({ from, to });
    }
  };

  const handleClearFilters = () => {
    setSelectedActivityTypes(new Set());
    setSelectedVisibility(new Set());
    setDateRange(null);
  };

  const handleApplyFilters = () => {
    onFiltersChange({
      activityTypes: Array.from(selectedActivityTypes) as ActivityType[],
      visibility: Array.from(selectedVisibility) as ActivityVisibility[],
      dateRange,
    });
  };

  // Auto-apply filters when they change
  useEffect(() => {
    handleApplyFilters();
  }, [selectedActivityTypes, selectedVisibility, dateRange]);

  const hasActiveFilters = selectedActivityTypes.size > 0 || selectedVisibility.size > 0 || dateRange;

  return (
    <GlassmorphicCard {...GameGenCardPresets.chatPanel} className={className}>
      <div className="p-4 space-y-4">
        {/* Filter Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-secondary-500" />
            <span className="font-medium text-foreground">Activity Filters</span>
            {hasActiveFilters && (
              <Chip size="sm" color="secondary" variant="flat">
                {[selectedActivityTypes.size, selectedVisibility.size, dateRange ? 1 : 0]
                  .filter(Boolean).length} active
              </Chip>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="light"
              onPress={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? "Simple" : "Advanced"}
            </Button>
            
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="flat"
                color="danger"
                startContent={<X size={14} />}
                onPress={handleClearFilters}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Activity Types Filter */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag size={14} className="text-foreground/60" />
            <span className="text-sm font-medium text-foreground/80">Activity Types</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_TYPE_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                variant={selectedActivityTypes.has(option.key) ? "solid" : "flat"}
                color={selectedActivityTypes.has(option.key) ? "secondary" : "default"}
                size="sm"
                className="cursor-pointer"
                onClick={() => handleActivityTypeToggle(option.key as ActivityType)}
                startContent={<span className="text-xs">{option.icon}</span>}
              >
                {option.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Quick Date Ranges */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={14} className="text-foreground/60" />
            <span className="text-sm font-medium text-foreground/80">Time Range</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_DATE_RANGES.map((range) => (
              <Button
                key={range.key}
                size="sm"
                variant="flat"
                color="secondary"
                onPress={() => handleQuickDateRange(range.days)}
              >
                {range.label}
              </Button>
            ))}
          </div>
          
          {dateRange && (
            <div className="text-xs text-foreground/60 bg-secondary-500/10 rounded p-2">
              From {dateRange.from.toLocaleDateString()} to {dateRange.to.toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <>
            <Divider />
            
            {/* Visibility Filter */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Eye size={14} className="text-foreground/60" />
                <span className="text-sm font-medium text-foreground/80">Visibility</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {VISIBILITY_OPTIONS.map((option) => (
                  <Chip
                    key={option.key}
                    variant={selectedVisibility.has(option.key) ? "solid" : "flat"}
                    color={selectedVisibility.has(option.key) ? "secondary" : "default"}
                    size="sm"
                    className="cursor-pointer"
                    onClick={() => handleVisibilityToggle(option.key as ActivityVisibility)}
                    startContent={<span className="text-xs">{option.icon}</span>}
                  >
                    {option.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            <div>
              <span className="text-sm font-medium text-foreground/80 mb-3 block">Custom Date Range</span>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  label="From"
                  size="sm"
                  value={dateRange?.from?.toISOString().split('T')[0] || ''}
                  onValueChange={(value) => {
                    if (value) {
                      const date = new Date(value);
                      setDateRange(prev => ({
                        from: date,
                        to: prev?.to || new Date()
                      }));
                    }
                  }}
                />
                <Input
                  type="date"
                  label="To"
                  size="sm"
                  value={dateRange?.to?.toISOString().split('T')[0] || ''}
                  onValueChange={(value) => {
                    if (value) {
                      const date = new Date(value);
                      setDateRange(prev => ({
                        from: prev?.from || new Date(),
                        to: date
                      }));
                    }
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* Filter Summary */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-divider">
            <div className="text-xs text-foreground/60">
              Active Filters: {selectedActivityTypes.size} activity types, {selectedVisibility.size} visibility levels
              {dateRange && ", custom date range"}
            </div>
          </div>
        )}
      </div>
    </GlassmorphicCard>
  );
}

// Preset filter configurations
export const ActivityFilterPresets = {
  myActivity: {
    activityTypes: ["game_created", "game_published", "achievement_unlocked"] as ActivityType[],
    visibility: ["public", "followers"] as ActivityVisibility[],
  },
  socialActivity: {
    activityTypes: ["game_liked", "game_commented", "user_followed"] as ActivityType[],
    visibility: ["public"] as ActivityVisibility[],
  },
  achievements: {
    activityTypes: ["achievement_unlocked", "milestone_reached", "challenge_completed"] as ActivityType[],
    visibility: ["public", "followers"] as ActivityVisibility[],
  },
  gameActivity: {
    activityTypes: ["game_created", "game_published", "game_featured", "game_liked"] as ActivityType[],
    visibility: ["public"] as ActivityVisibility[],
  },
} as const;