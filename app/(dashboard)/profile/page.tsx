"use client";

import React, { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { motion } from "framer-motion";
import { User, Trophy, Activity } from "lucide-react";

import { UserProfile } from "@/components/social/profile/UserProfile";
import { ActivityFeed } from "@/components/social/activity/ActivityFeed";
import { AchievementProgress } from "@/components/social/achievements/AchievementProgress";
import { GameGrid } from "@/components/social/game/GameGrid";
import { useAuth } from "@/lib/auth/context";

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  if (!user?.id) {
    return <div>Loading...</div>;
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="px-0 py-8"
      initial={{ opacity: 0, y: 20 }}
    >
      <UserProfile
        className="mb-8"
        currentUserId={user.id}
        userId={user.id}
      />

      <Tabs
        className="w-full"
        selectedKey={activeTab}
        variant="underlined"
        onSelectionChange={(key) => setActiveTab(key as string)}
      >
        <Tab
          key="overview"
          title={
            <div className="flex items-center space-x-2">
              <User size={18} />
              <span>Overview</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <ActivityFeed
              maxItems={10}
              showFilters={false}
              userId={user.id}
            />
            <AchievementProgress
              maxRecentAchievements={5}
              showStats={true}
              userId={user.id}
              variant="compact"
            />
          </div>
        </Tab>

        <Tab
          key="games"
          title={
            <div className="flex items-center space-x-2">
              <Activity size={18} />
              <span>My Games</span>
            </div>
          }
        >
          <div className="mt-8">
            <GameGrid
              currentUserId={user.id}
              showFilters={true}
              showSearch={true}
              variant="default"
            />
          </div>
        </Tab>

        <Tab
          key="achievements"
          title={
            <div className="flex items-center space-x-2">
              <Trophy size={18} />
              <span>Achievements</span>
            </div>
          }
        >
          <div className="mt-8">
            <AchievementProgress
              showFilters={true}
              showStats={true}
              userId={user.id}
              variant="dashboard"
            />
          </div>
        </Tab>

        <Tab
          key="activity"
          title={
            <div className="flex items-center space-x-2">
              <Activity size={18} />
              <span>Activity</span>
            </div>
          }
        >
          <div className="mt-8">
            <ActivityFeed
              showFilters={true}
              userId={user.id}
            />
          </div>
        </Tab>
      </Tabs>
    </motion.div>
  );
}
