"use client";

import React, { useState, useEffect } from "react";
import { Avatar, Chip } from "@heroui/react";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, TrendingUp } from "lucide-react";

import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  display_name?: string | null;
  avatar_url?: string | null;
  score: number;
  submission_count: number;
  rank: number;
  votes_received: number;
  submission_title?: string;
  submission_url?: string;
}

interface ChallengeLeaderboardProps {
  challengeId: string;
  variant?: "default" | "compact" | "podium";
  maxEntries?: number;
  showScores?: boolean;
  showSubmissions?: boolean;
  className?: string;
}

export function ChallengeLeaderboard({
  challengeId,
  variant = "default",
  maxEntries = 10,
  showScores = true,
  showSubmissions = true,
  className,
}: ChallengeLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-warning" />;
      case 2:
        return <Trophy className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "warning";
      case 2:
        return "default";
      case 3:
        return "secondary";
      default:
        return "primary";
    }
  };

  useEffect(() => {
    // Mock data - in real app would fetch from Supabase
    const mockEntries: LeaderboardEntry[] = [
      {
        id: "1",
        user_id: "user1",
        username: "gamemaster",
        display_name: "Game Master",
        score: 9850,
        submission_count: 3,
        rank: 1,
        votes_received: 247,
        submission_title: "Epic Space Adventure",
      },
      {
        id: "2",
        user_id: "user2",
        username: "pixelartist",
        display_name: "Pixel Artist",
        score: 9200,
        submission_count: 2,
        rank: 2,
        votes_received: 189,
        submission_title: "Retro Platformer",
      },
      {
        id: "3",
        user_id: "user3",
        username: "coder_pro",
        display_name: "Pro Coder",
        score: 8750,
        submission_count: 4,
        rank: 3,
        votes_received: 156,
        submission_title: "Puzzle Quest",
      },
    ];

    setEntries(mockEntries);
    setLoading(false);
  }, [challengeId]);

  if (variant === "podium") {
    const topThree = entries.slice(0, 3);

    return (
      <div className={className}>
        <GlassmorphicCard {...GameGenCardPresets.gameCard}>
          <div className="p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-warning" />
              Top Performers
            </h3>

            <div className="flex items-end justify-center gap-4">
              {/* Second Place */}
              {topThree[1] && (
                <motion.div
                  animate={{ y: 0, opacity: 1 }}
                  className="text-center"
                  initial={{ y: 50, opacity: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="bg-gradient-to-t from-gray-400 to-gray-300 w-20 h-16 rounded-t-lg flex items-end justify-center pb-2 mb-3">
                    <span className="text-white font-bold">2nd</span>
                  </div>
                  <Avatar
                    className="mb-2"
                    name={topThree[1].display_name || topThree[1].username}
                    size="md"
                    src={topThree[1].avatar_url || undefined}
                  />
                  <div className="text-sm font-semibold">
                    {topThree[1].display_name || topThree[1].username}
                  </div>
                  <div className="text-xs text-foreground/60">
                    {topThree[1].score.toLocaleString()} pts
                  </div>
                </motion.div>
              )}

              {/* First Place */}
              {topThree[0] && (
                <motion.div
                  animate={{ y: 0, opacity: 1 }}
                  className="text-center"
                  initial={{ y: 50, opacity: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="bg-gradient-to-t from-warning to-warning-400 w-24 h-20 rounded-t-lg flex items-end justify-center pb-2 mb-3">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <Avatar
                    className="mb-2"
                    name={topThree[0].display_name || topThree[0].username}
                    size="lg"
                    src={topThree[0].avatar_url || undefined}
                  />
                  <div className="text-sm font-semibold">
                    {topThree[0].display_name || topThree[0].username}
                  </div>
                  <div className="text-xs text-foreground/60">
                    {topThree[0].score.toLocaleString()} pts
                  </div>
                </motion.div>
              )}

              {/* Third Place */}
              {topThree[2] && (
                <motion.div
                  animate={{ y: 0, opacity: 1 }}
                  className="text-center"
                  initial={{ y: 50, opacity: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="bg-gradient-to-t from-amber-600 to-amber-500 w-16 h-12 rounded-t-lg flex items-end justify-center pb-1 mb-3">
                    <span className="text-white font-bold text-sm">3rd</span>
                  </div>
                  <Avatar
                    className="mb-2"
                    name={topThree[2].display_name || topThree[2].username}
                    size="sm"
                    src={topThree[2].avatar_url || undefined}
                  />
                  <div className="text-sm font-semibold">
                    {topThree[2].display_name || topThree[2].username}
                  </div>
                  <div className="text-xs text-foreground/60">
                    {topThree[2].score.toLocaleString()} pts
                  </div>
                </motion.div>
              )}
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
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            Leaderboard
          </h3>

          <div className="space-y-3">
            {entries.slice(0, maxEntries).map((entry, index) => (
              <motion.div
                key={entry.id}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-4 p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                initial={{ x: -50, opacity: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                <Avatar
                  name={entry.display_name || entry.username}
                  size="sm"
                  src={entry.avatar_url || undefined}
                />

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">
                      {entry.display_name || entry.username}
                    </span>
                    {entry.rank <= 3 && (
                      <Chip
                        className="text-xs"
                        color={getRankColor(entry.rank)}
                        size="sm"
                        variant="flat"
                      >
                        Top {entry.rank}
                      </Chip>
                    )}
                  </div>

                  {showSubmissions && entry.submission_title && (
                    <div className="text-sm text-foreground/60 truncate">
                      Latest: {entry.submission_title}
                    </div>
                  )}
                </div>

                {/* Score */}
                {showScores && (
                  <div className="text-right">
                    <div className="font-bold">
                      {entry.score.toLocaleString()}
                    </div>
                    <div className="text-xs text-foreground/60">
                      {entry.votes_received} votes
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </GlassmorphicCard>
    </div>
  );
}

export default ChallengeLeaderboard;
