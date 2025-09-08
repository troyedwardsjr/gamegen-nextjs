"use client";

import React, { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { motion } from "framer-motion";
import { Users, Trophy, Target, TrendingUp, Star } from "lucide-react";

import { CommunityDiscover } from "@/components/social/community/CommunityDiscover";
import { ChallengeCard } from "@/components/social/challenges/ChallengeCard";
import { AchievementProgress } from "@/components/social/achievements/AchievementProgress";
import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";
import { useAuth } from "@/lib/auth/context";

export default function CommunityPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("discover");

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const sectionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  // Mock challenge data
  const featuredChallenge = {
    id: "featured-challenge",
    title: "Winter Game Jam 2024",
    description:
      "Create a cozy winter-themed game using pixel art. Show us your creativity!",
    type: "creation" as const,
    status: "active" as const,
    difficulty: "intermediate" as const,
    start_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnail_url: null,
    prize_pool: 1000,
    max_participants: 100,
    current_participants: 47,
    rules: [],
    submission_requirements: [],
    judging_criteria: [],
    created_by: "admin",
    tags: ["winter", "pixel-art", "cozy"],
    featured: true,
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "discover":
        return (
          <motion.div variants={sectionVariants}>
            <CommunityDiscover currentUserId={user?.id} />
          </motion.div>
        );

      case "challenges":
        return (
          <motion.div className="space-y-6" variants={sectionVariants}>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Community Challenges</h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                Participate in exciting challenges, compete with other creators,
                and showcase your skills to win amazing prizes!
              </p>
            </div>

            {/* Featured Challenge */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Star className="w-6 h-6 text-warning" />
                Featured Challenge
              </h3>
              <ChallengeCard
                challenge={featuredChallenge}
                currentUserId={user?.id}
                variant="featured"
                onJoin={(challenge) =>
                  console.log("Joined challenge:", challenge.id)
                }
                onView={(challenge) =>
                  console.log("View challenge:", challenge.id)
                }
              />
            </div>

            {/* More Challenges Grid */}
            <div>
              <h3 className="text-xl font-semibold mb-4">More Challenges</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* These would be loaded from the database */}
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-64 bg-foreground/5 rounded-lg border-2 border-dashed border-foreground/20 flex items-center justify-center"
                  >
                    <p className="text-foreground/40">
                      More challenges coming soon!
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case "achievements":
        return (
          <motion.div variants={sectionVariants}>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Community Achievements
              </h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                Track your progress, unlock achievements, and see how you
                compare with other community members.
              </p>
            </div>

            <AchievementProgress
              showFilters={true}
              showStats={true}
              userId={user?.id}
              variant="dashboard"
            />
          </motion.div>
        );

      case "leaderboards":
        return (
          <motion.div className="space-y-6" variants={sectionVariants}>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Community Leaderboards
              </h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                See who&apos;s leading the way in different categories and compete to
                reach the top!
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Creators */}
              <GlassmorphicCard {...GameGenCardPresets.gameCard}>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-warning" />
                    Top Creators
                  </h3>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((rank) => (
                      <div
                        key={rank}
                        className="flex items-center gap-3 p-2 rounded-lg bg-background/30"
                      >
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center font-bold">
                          #{rank}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Creator {rank}</div>
                          <div className="text-sm text-foreground/60">
                            {Math.floor(Math.random() * 1000)} games
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {(1000 - rank * 100).toLocaleString()}
                          </div>
                          <div className="text-xs text-foreground/60">
                            points
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassmorphicCard>

              {/* Most Active */}
              <GlassmorphicCard {...GameGenCardPresets.gameCard}>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-success" />
                    Most Active
                  </h3>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((rank) => (
                      <div
                        key={rank}
                        className="flex items-center gap-3 p-2 rounded-lg bg-background/30"
                      >
                        <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center font-bold">
                          #{rank}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Player {rank}</div>
                          <div className="text-sm text-foreground/60">
                            {Math.floor(Math.random() * 100)} hours
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            {(500 - rank * 50).toLocaleString()}
                          </div>
                          <div className="text-xs text-foreground/60">
                            activities
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </GlassmorphicCard>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      animate="animate"
      className="container mx-auto px-4 py-8 max-w-7xl"
      initial="initial"
      variants={pageVariants}
    >
      {/* Header */}
      <motion.div className="text-center mb-8" variants={sectionVariants}>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
          GameGen Community
        </h1>
        <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
          Connect with fellow creators, discover amazing games, participate in
          challenges, and be part of our thriving game development community.
        </p>
      </motion.div>

      {/* Main Navigation Tabs */}
      <motion.div variants={sectionVariants}>
        <GlassmorphicCard {...GameGenCardPresets.gameCard}>
          <div className="p-6">
            <Tabs
              classNames={{
                tabList:
                  "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                cursor: "w-full bg-primary",
                tab: "max-w-fit px-0 h-12",
                tabContent: "group-data-[selected=true]:text-primary",
              }}
              selectedKey={activeTab}
              variant="underlined"
              onSelectionChange={(key) => setActiveTab(key as string)}
            >
              <Tab
                key="discover"
                title={
                  <div className="flex items-center space-x-2">
                    <Users size={18} />
                    <span>Discover</span>
                  </div>
                }
              />
              <Tab
                key="challenges"
                title={
                  <div className="flex items-center space-x-2">
                    <Target size={18} />
                    <span>Challenges</span>
                  </div>
                }
              />
              <Tab
                key="achievements"
                title={
                  <div className="flex items-center space-x-2">
                    <Trophy size={18} />
                    <span>Achievements</span>
                  </div>
                }
              />
              <Tab
                key="leaderboards"
                title={
                  <div className="flex items-center space-x-2">
                    <TrendingUp size={18} />
                    <span>Leaderboards</span>
                  </div>
                }
              />
            </Tabs>

            <div className="mt-8">{renderTabContent()}</div>
          </div>
        </GlassmorphicCard>
      </motion.div>
    </motion.div>
  );
}
