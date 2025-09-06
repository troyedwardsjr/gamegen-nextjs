"use client";

import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { Card, CardBody } from "@heroui/card";
import { motion } from "framer-motion";
import { 
  Users, 
  Trophy, 
  Target, 
  TrendingUp,
  Star,
  Play,
  Heart,
  Crown
} from "lucide-react";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";

export default function CommunityPageMinimal() {
  const [activeTab, setActiveTab] = useState("discover");

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const sectionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "discover":
        return (
          <motion.div variants={sectionVariants} className="space-y-6">
            {/* Community Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <GlassmorphicCard {...GameGenCardPresets.chatPanel}>
                <div className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    125
                  </div>
                  <div className="text-sm text-foreground/60">Games Created</div>
                </div>
              </GlassmorphicCard>
              <GlassmorphicCard {...GameGenCardPresets.chatPanel}>
                <div className="p-4 text-center">
                  <div className="text-2xl font-bold text-secondary mb-1">
                    47
                  </div>
                  <div className="text-sm text-foreground/60">Creators</div>
                </div>
              </GlassmorphicCard>
              <GlassmorphicCard {...GameGenCardPresets.chatPanel}>
                <div className="p-4 text-center">
                  <div className="text-2xl font-bold text-success mb-1">
                    23
                  </div>
                  <div className="text-sm text-foreground/60">Active Users</div>
                </div>
              </GlassmorphicCard>
              <GlassmorphicCard {...GameGenCardPresets.chatPanel}>
                <div className="p-4 text-center">
                  <div className="text-2xl font-bold text-warning mb-1">
                    2.1K
                  </div>
                  <div className="text-sm text-foreground/60">Total Plays</div>
                </div>
              </GlassmorphicCard>
            </div>

            {/* Sample Games */}
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-primary" />
                Featured Games
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <GlassmorphicCard key={i} {...GameGenCardPresets.gameCard}>
                    <div className="p-4">
                      <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg mb-3 flex items-center justify-center">
                        <Play className="w-8 h-8 text-foreground/40" />
                      </div>
                      <h4 className="font-semibold mb-2">Sample Game {i}</h4>
                      <div className="flex items-center justify-between text-sm text-foreground/70 mb-3">
                        <div className="flex items-center gap-2">
                          <Play size={14} />
                          <span>{Math.floor(Math.random() * 1000)}</span>
                          <Heart size={14} />
                          <span>{Math.floor(Math.random() * 100)}</span>
                        </div>
                        <Chip size="sm" variant="flat" startContent={<Crown size={12} />}>
                          Featured
                        </Chip>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-semibold">
                          U
                        </div>
                        <span className="text-sm text-foreground/70">Creator {i}</span>
                      </div>
                    </div>
                  </GlassmorphicCard>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case "challenges":
        return (
          <motion.div variants={sectionVariants} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Community Challenges</h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                Participate in exciting challenges and compete with other creators!
              </p>
            </div>

            <GlassmorphicCard {...GameGenCardPresets.gameCard}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Star className="w-6 h-6 text-warning" />
                    Winter Game Jam 2024
                  </h3>
                  <Chip color="success" variant="solid">Active</Chip>
                </div>
                <p className="text-foreground/70 mb-4">
                  Create a cozy winter-themed game using pixel art. Show us your creativity!
                </p>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-foreground/60">
                    47/100 participants
                  </div>
                  <div className="text-sm text-foreground/60">
                    5 days remaining
                  </div>
                </div>
                <Button color="primary" className="w-full">
                  Join Challenge
                </Button>
              </div>
            </GlassmorphicCard>
          </motion.div>
        );

      case "achievements":
        return (
          <motion.div variants={sectionVariants} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Community Achievements</h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                Track your progress and unlock achievements!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "First Game", description: "Create your first game", progress: 100 },
                { title: "Popular Creator", description: "Get 100+ plays", progress: 65 },
                { title: "Community Star", description: "Get 50+ likes", progress: 30 },
                { title: "Pixel Artist", description: "Create 5 games", progress: 80 },
              ].map((achievement, i) => (
                <GlassmorphicCard key={i} {...GameGenCardPresets.chatPanel}>
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-warning to-warning-500 rounded-lg flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <p className="text-sm text-foreground/60">{achievement.description}</p>
                      </div>
                    </div>
                    <div className="w-full bg-foreground/10 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                    <div className="text-right text-xs text-foreground/60 mt-1">
                      {achievement.progress}%
                    </div>
                  </div>
                </GlassmorphicCard>
              ))}
            </div>
          </motion.div>
        );

      case "leaderboards":
        return (
          <motion.div variants={sectionVariants} className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Community Leaderboards</h2>
              <p className="text-foreground/70 max-w-2xl mx-auto">
                See who's leading the way in different categories!
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
                      <div key={rank} className="flex items-center gap-3 p-2 rounded-lg bg-background/30">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center font-bold">
                          #{rank}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Creator {rank}</div>
                          <div className="text-sm text-foreground/60">{Math.floor(Math.random() * 10)} games</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{(1000 - rank * 100).toLocaleString()}</div>
                          <div className="text-xs text-foreground/60">points</div>
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
                      <div key={rank} className="flex items-center gap-3 p-2 rounded-lg bg-background/30">
                        <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center font-bold">
                          #{rank}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Player {rank}</div>
                          <div className="text-sm text-foreground/60">{Math.floor(Math.random() * 50)} hours</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{(500 - rank * 50).toLocaleString()}</div>
                          <div className="text-xs text-foreground/60">activities</div>
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
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      {/* Header */}
      <motion.div variants={sectionVariants} className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
          GameGen Community
        </h1>
        <p className="text-lg text-foreground/70 max-w-3xl mx-auto">
          Connect with fellow creators, discover amazing games, participate in challenges, 
          and be part of our thriving game development community.
        </p>
      </motion.div>

      {/* Main Navigation Tabs */}
      <motion.div variants={sectionVariants}>
        <GlassmorphicCard {...GameGenCardPresets.gameCard}>
          <div className="p-6">
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

            <div className="mt-8">
              {renderTabContent()}
            </div>
          </div>
        </GlassmorphicCard>
      </motion.div>
    </motion.div>
  );
}