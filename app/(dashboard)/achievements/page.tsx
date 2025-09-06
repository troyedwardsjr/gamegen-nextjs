"use client";

import React from "react";
import { motion } from "framer-motion";
import { AchievementProgress } from "@/components/social/achievements/AchievementProgress";
import { useAuth } from "@/lib/auth/context";

export default function AchievementsPage() {
  const { user } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8 max-w-7xl"
    >
      <AchievementProgress
        userId={user?.id}
        variant="dashboard"
        showFilters={true}
        showStats={true}
      />
    </motion.div>
  );
}