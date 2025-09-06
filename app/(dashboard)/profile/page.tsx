"use client";

import React, { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { motion } from "framer-motion";
import { User, Trophy, Activity, Settings } from "lucide-react";
import { UserProfile } from "@/components/social/profile/UserProfile";
import { ActivityFeed } from "@/components/social/activity/ActivityFeed";
import { AchievementProgress } from "@/components/social/achievements/AchievementProgress";
import { GameGrid } from "@/components/social/game/GameGrid";
import { useAuth } from "@/lib/auth/context";

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      <UserProfile
        userId={user?.id}
        currentUserId={user?.id}
        variant="profile"
        showEditButton={true}
        className="mb-8"
      />

      <Tabs
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        variant="underlined"
        className="w-full"
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
              userId={user?.id}
              variant="compact"
              maxActivities={10}
              showFilters={false}
            />
            <AchievementProgress
              userId={user?.id}
              variant="compact"
              showStats={true}
              maxRecentAchievements={5}
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
              currentUserId={user?.id}
              showSearch={true}
              showFilters={true}
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
              userId={user?.id}
              variant="dashboard"
              showFilters={true}
              showStats={true}
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
              userId={user?.id}
              variant="default"
              showFilters={true}
            />
          </div>
        </Tab>
      </Tabs>
    </motion.div>
  );
}