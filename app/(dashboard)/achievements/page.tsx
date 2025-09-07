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
      className="px-0 py-8"
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