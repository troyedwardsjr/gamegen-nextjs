"use client";

import React from "react";
import { motion } from "framer-motion";

import { AchievementProgress } from "@/components/social/achievements/AchievementProgress";
import { useAuth } from "@/lib/auth/context";

export default function AchievementsPage() {
  const { user } = useAuth();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="px-0 py-8"
      initial={{ opacity: 0, y: 20 }}
    >
      <AchievementProgress
        showFilters={true}
        showStats={true}
        userId={user?.id}
        variant="dashboard"
      />
    </motion.div>
  );
}
