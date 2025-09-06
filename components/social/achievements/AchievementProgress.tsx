"use client";

import React, { useState, useEffect } from "react";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Target, 
  Star, 
  TrendingUp,
  Award,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  List,
  Grid3X3
} from "lucide-react";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";
import { AchievementCard, AchievementType, AchievementRarity } from "./AchievementCard";
import { createClient } from "@/lib/supabase/client";

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: AchievementType;
  rarity: AchievementRarity;
  status: "locked" | "in_progress" | "completed";
  icon: string;
  progress?: {
    current: number;
    target: number;
    unit?: string;
  };
  unlocked_at?: string | null;
  points: number;
  secret?: boolean;
  category?: string;
}

interface ProgressStats {
  total_achievements: number;
  completed_achievements: number;
  in_progress_achievements: number;
  total_points_earned: number;
  total_points_available: number;
  completion_percentage: number;
  achievements_by_rarity: Record<AchievementRarity, { completed: number; total: number }>;
  achievements_by_type: Record<AchievementType, { completed: number; total: number }>;
  recent_completions: Achievement[];
  streak_days: number;
  next_milestone: {
    points_needed: number;
    milestone_name: string;
  };
}

interface AchievementProgressProps {
  userId?: string;
  variant?: "dashboard" | "profile" | "compact";
  showFilters?: boolean;
  showStats?: boolean;
  maxRecentAchievements?: number;
  className?: string;
  onAchievementClick?: (achievement: Achievement) => void;
}

const RARITY_COLORS = {
  common: "default",
  rare: "primary", 
  epic: "secondary",
  legendary: "warning",
  mythic: "danger",
} as const;

const TYPE_ICONS = {
  gameplay: Target,
  creation: Trophy,
  social: Award,
  milestone: Star,
  special: TrendingUp,
};

export function AchievementProgress({
  userId,
  variant = "dashboard",
  showFilters = true,
  showStats = true,
  maxRecentAchievements = 5,
  className,
  onAchievementClick,
}: AchievementProgressProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [filterType, setFilterType] = useState<AchievementType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "in_progress" | "locked">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const supabase = createClient();

  useEffect(() => {
    if (userId) {
      fetchAchievements();
    } else {
      // Load sample achievements for demo
      loadSampleAchievements();
    }
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [achievements, filterType, filterStatus]);

  const fetchAchievements = async () => {
    setLoading(true);
    
    try {
      // In a real implementation, this would fetch from the database
      // For now, we'll use sample data
      loadSampleAchievements();
    } catch (error) {
      console.error("Error fetching achievements:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleAchievements = () => {
    const sampleAchievements: Achievement[] = [
      {
        id: "1",
        title: "First Steps",
        description: "Create your very first game",
        type: "creation",
        rarity: "common",
        status: "completed",
        icon: "first_creation",
        points: 10,
        unlocked_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        category: "Getting Started"
      },
      {
        id: "2", 
        title: "Player One",
        description: "Play your first game",
        type: "gameplay",
        rarity: "common", 
        status: "completed",
        icon: "first_game",
        points: 10,
        unlocked_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        category: "Getting Started"
      },
      {
        id: "3",
        title: "Social Butterfly", 
        description: "Receive 100 likes on your games",
        type: "social",
        rarity: "rare",
        status: "in_progress",
        icon: "likes_received",
        progress: { current: 67, target: 100, unit: "likes" },
        points: 25,
        category: "Community"
      },
      {
        id: "4",
        title: "Game Master",
        description: "Create 10 different games",
        type: "creation", 
        rarity: "epic",
        status: "in_progress",
        icon: "prolific_creator",
        progress: { current: 7, target: 10, unit: "games" },
        points: 50,
        category: "Creation"
      },
      {
        id: "5",
        title: "Viral Sensation",
        description: "Have a game reach 10,000 plays",
        type: "creation",
        rarity: "legendary", 
        status: "locked",
        icon: "viral_game",
        points: 100,
        category: "Achievement"
      },
      {
        id: "6",
        title: "The Legend",
        description: "Complete all other achievements",
        type: "milestone",
        rarity: "mythic",
        status: "locked", 
        icon: "legendary",
        points: 500,
        secret: true,
        category: "Ultimate"
      },
    ];

    setAchievements(sampleAchievements);
    calculateStats(sampleAchievements);
    setLoading(false);
  };

  const calculateStats = (achievementsList: Achievement[]) => {
    const completed = achievementsList.filter(a => a.status === "completed");
    const inProgress = achievementsList.filter(a => a.status === "in_progress");
    
    const pointsEarned = completed.reduce((sum, a) => sum + a.points, 0);
    const pointsAvailable = achievementsList.reduce((sum, a) => sum + a.points, 0);
    
    const rarityStats: Record<AchievementRarity, { completed: number; total: number }> = {
      common: { completed: 0, total: 0 },
      rare: { completed: 0, total: 0 },
      epic: { completed: 0, total: 0 },
      legendary: { completed: 0, total: 0 },
      mythic: { completed: 0, total: 0 },
    };

    const typeStats: Record<AchievementType, { completed: number; total: number }> = {
      gameplay: { completed: 0, total: 0 },
      creation: { completed: 0, total: 0 },
      social: { completed: 0, total: 0 },
      milestone: { completed: 0, total: 0 },
      special: { completed: 0, total: 0 },
    };

    achievementsList.forEach(achievement => {
      rarityStats[achievement.rarity].total++;
      typeStats[achievement.type].total++;
      
      if (achievement.status === "completed") {
        rarityStats[achievement.rarity].completed++;
        typeStats[achievement.type].completed++;
      }
    });

    const recentCompletions = completed
      .filter(a => a.unlocked_at)
      .sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
      .slice(0, maxRecentAchievements);

    setStats({
      total_achievements: achievementsList.length,
      completed_achievements: completed.length,
      in_progress_achievements: inProgress.length,
      total_points_earned: pointsEarned,
      total_points_available: pointsAvailable,
      completion_percentage: (completed.length / achievementsList.length) * 100,
      achievements_by_rarity: rarityStats,
      achievements_by_type: typeStats,
      recent_completions: recentCompletions,
      streak_days: 7, // Sample streak
      next_milestone: {
        points_needed: 100 - (pointsEarned % 100),
        milestone_name: "Achievement Hunter",
      },
    });
  };

  const applyFilters = () => {
    let filtered = achievements;

    if (filterType !== "all") {
      filtered = filtered.filter(a => a.type === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(a => a.status === filterStatus);
    }

    setFilteredAchievements(filtered);
  };

  const renderStatsOverview = () => {
    if (!stats) return null;

    return (
      <div className="space-y-6">
        {/* Main Progress */}
        <div className="text-center">
          <div className="mb-4">
            <div className="text-4xl font-bold text-primary mb-2">
              {stats.completion_percentage.toFixed(1)}%
            </div>
            <div className="text-foreground/70">
              {stats.completed_achievements} of {stats.total_achievements} achievements unlocked
            </div>
          </div>
          
          <Progress
            value={stats.completion_percentage}
            size="lg"
            color="primary"
            className="mb-4"
            classNames={{
              track: "bg-background/50",
              indicator: "bg-gradient-to-r from-primary to-secondary",
            }}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-background/30 rounded-lg">
              <div className="text-lg font-semibold text-success">
                {stats.total_points_earned}
              </div>
              <div className="text-foreground/60">Points Earned</div>
            </div>
            <div className="text-center p-3 bg-background/30 rounded-lg">
              <div className="text-lg font-semibold text-warning">
                {stats.in_progress_achievements}
              </div>
              <div className="text-foreground/60">In Progress</div>
            </div>
            <div className="text-center p-3 bg-background/30 rounded-lg">
              <div className="text-lg font-semibold text-primary">
                {stats.streak_days}
              </div>
              <div className="text-foreground/60">Day Streak</div>
            </div>
            <div className="text-center p-3 bg-background/30 rounded-lg">
              <div className="text-lg font-semibold text-secondary">
                {stats.next_milestone.points_needed}
              </div>
              <div className="text-foreground/60">To Milestone</div>
            </div>
          </div>
        </div>

        {/* Progress by Category */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 size={20} />
            Progress by Category
          </h3>
          
          <div className="space-y-3">
            {Object.entries(stats.achievements_by_type).map(([type, data]) => {
              const Icon = TYPE_ICONS[type as AchievementType];
              const percentage = data.total > 0 ? (data.completed / data.total) * 100 : 0;
              
              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 min-w-32">
                    <Icon size={16} className="text-foreground/60" />
                    <span className="capitalize text-sm">{type}</span>
                  </div>
                  
                  <div className="flex-1">
                    <Progress
                      value={percentage}
                      size="sm"
                      color="primary"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="text-sm text-foreground/60 min-w-16 text-right">
                    {data.completed}/{data.total}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Achievements */}
        {stats.recent_completions.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar size={20} />
              Recently Unlocked
            </h3>
            
            <div className="space-y-2">
              {stats.recent_completions.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  variant="compact"
                  showProgress={false}
                  showActions={false}
                  onClick={onAchievementClick}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFilters = () => (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex items-center gap-2">
        <Filter size={16} className="text-foreground/60" />
        <span className="text-sm text-foreground/70">Filters:</span>
      </div>
      
      {/* Type Filter */}
      <div className="flex gap-1">
        <Chip
          variant={filterType === "all" ? "solid" : "flat"}
          color={filterType === "all" ? "primary" : "default"}
          size="sm"
          className="cursor-pointer"
          onClick={() => setFilterType("all")}
        >
          All Types
        </Chip>
        {Object.keys(TYPE_ICONS).map(type => (
          <Chip
            key={type}
            variant={filterType === type ? "solid" : "flat"}
            color={filterType === type ? "primary" : "default"}
            size="sm"
            className="cursor-pointer capitalize"
            onClick={() => setFilterType(type as AchievementType)}
          >
            {type}
          </Chip>
        ))}
      </div>

      {/* Status Filter */}
      <div className="flex gap-1">
        {["all", "completed", "in_progress", "locked"].map(status => (
          <Chip
            key={status}
            variant={filterStatus === status ? "solid" : "flat"}
            color={filterStatus === status ? "secondary" : "default"}
            size="sm"
            className="cursor-pointer capitalize"
            onClick={() => setFilterStatus(status as any)}
          >
            {status.replace("_", " ")}
          </Chip>
        ))}
      </div>

      {/* View Mode Toggle */}
      <div className="flex ml-auto">
        <Button
          size="sm"
          variant={viewMode === "grid" ? "solid" : "flat"}
          isIconOnly
          onPress={() => setViewMode("grid")}
        >
          <Grid3X3 size={16} />
        </Button>
        <Button
          size="sm"
          variant={viewMode === "list" ? "solid" : "flat"}
          isIconOnly
          onPress={() => setViewMode("list")}
        >
          <List size={16} />
        </Button>
      </div>
    </div>
  );

  const renderAchievements = () => {
    const gridCols = variant === "compact" ? "grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

    return (
      <div className={viewMode === "grid" 
        ? `grid ${gridCols} gap-4` 
        : "space-y-3"
      }>
        <AnimatePresence>
          {filteredAchievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
            >
              <AchievementCard
                achievement={achievement}
                variant={viewMode === "list" ? "compact" : "default"}
                onClick={onAchievementClick}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  if (variant === "compact") {
    return (
      <div className={className}>
        <GlassmorphicCard {...GameGenCardPresets.gameCard}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Achievement Progress</h2>
              {stats && (
                <Chip color="primary" variant="flat">
                  {stats.completed_achievements}/{stats.total_achievements}
                </Chip>
              )}
            </div>
            
            {stats && (
              <div className="mb-4">
                <Progress
                  value={stats.completion_percentage}
                  size="md"
                  color="primary"
                  showValueLabel
                />
              </div>
            )}

            <div className="space-y-2">
              {filteredAchievements.slice(0, 3).map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  variant="minimal"
                  onClick={onAchievementClick}
                />
              ))}
            </div>
          </div>
        </GlassmorphicCard>
      </div>
    );
  }

  return (
    <div className={className}>
      <GlassmorphicCard {...GameGenCardPresets.gameCard}>
        <div className="p-6">
          {variant === "dashboard" && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Achievements</h2>
                  <p className="text-foreground/70">Track your progress and unlock rewards</p>
                </div>
              </div>
              
              {stats && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {stats.completion_percentage.toFixed(0)}%
                  </div>
                  <div className="text-sm text-foreground/60">Complete</div>
                </div>
              )}
            </div>
          )}

          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary"
            }}
          >
            <Tab
              key="overview"
              title={
                <div className="flex items-center space-x-2">
                  <PieChart size={16} />
                  <span>Overview</span>
                </div>
              }
            />
            <Tab
              key="all"
              title={
                <div className="flex items-center space-x-2">
                  <Trophy size={16} />
                  <span>All Achievements</span>
                </div>
              }
            />
          </Tabs>

          <div className="mt-6">
            {activeTab === "overview" && renderStatsOverview()}
            {activeTab === "all" && (
              <div>
                {showFilters && renderFilters()}
                {renderAchievements()}
              </div>
            )}
          </div>
        </div>
      </GlassmorphicCard>
    </div>
  );
}

export default AchievementProgress;