"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import Link from "next/link";

import {
  GameIcon,
  SparklesIcon,
  UserGroupIcon,
  ChartBarIcon,
  PlayIcon,
  PlusIcon,
  TrophyIcon,
  ClockIcon,
} from "@/components/icons";

interface DashboardStats {
  gamesCreated: number;
  totalPlays: number;
  communityFollowers: number;
  achievementsUnlocked: number;
}

interface RecentGame {
  id: string;
  title: string;
  lastModified: string;
  thumbnail?: string;
  status: "draft" | "published" | "in_review";
}

export default function DashboardPage() {
  // Mock data - replace with real data from your API
  const stats: DashboardStats = {
    gamesCreated: 3,
    totalPlays: 1247,
    communityFollowers: 89,
    achievementsUnlocked: 12,
  };

  const recentGames: RecentGame[] = [
    {
      id: "1",
      title: "Pixel Adventure Quest",
      lastModified: "2 hours ago",
      status: "published",
    },
    {
      id: "2",
      title: "Space Invaders Remix",
      lastModified: "1 day ago",
      status: "draft",
    },
    {
      id: "3",
      title: "Puzzle Platformer",
      lastModified: "3 days ago",
      status: "in_review",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "success";
      case "in_review":
        return "warning";
      case "draft":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "published":
        return "Published";
      case "in_review":
        return "In Review";
      case "draft":
        return "Draft";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 -mx-4 sm:-mx-6 lg:-mx-8 xl:-mx-12 2xl:-mx-16">
      <div className="px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-8">
        {/* Header */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, Creator!
          </h1>
          <p className="text-gray-400 text-lg">
            Ready to continue building amazing games?
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-wrap gap-4">
            <Link href="/creator">
              <Button
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold hover:from-purple-400 hover:to-purple-500 shadow-lg shadow-purple-500/25"
                size="lg"
                startContent={<PlusIcon className="w-5 h-5" />}
              >
                Create New Game
              </Button>
            </Link>
            <Link href="/explore">
              <Button
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                size="lg"
                startContent={<SparklesIcon className="w-5 h-5" />}
                variant="bordered"
              >
                Explore Games
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-500/20 backdrop-blur-xl">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-sm font-medium">
                    Games Created
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stats.gamesCreated}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <GameIcon className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-500/20 backdrop-blur-xl">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-sm font-medium">
                    Total Plays
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stats.totalPlays.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <PlayIcon className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-500/20 backdrop-blur-xl">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm font-medium">
                    Followers
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stats.communityFollowers}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <UserGroupIcon className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-yellow-500/20 backdrop-blur-xl">
            <CardBody className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-400 text-sm font-medium">
                    Achievements
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {stats.achievementsUnlocked}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <TrophyIcon className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Games */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <GameIcon className="w-5 h-5 text-purple-400" />
                  Recent Games
                </h3>
              </CardHeader>
              <CardBody className="p-6 pt-0">
                <div className="space-y-4">
                  {recentGames.map((game, index) => (
                    <motion.div
                      key={game.id}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-900/20 to-transparent rounded-xl border border-purple-500/10 hover:border-purple-500/30 transition-all duration-300"
                      initial={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <GameIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-semibold">
                            {game.title}
                          </h4>
                          <p className="text-gray-400 text-sm flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {game.lastModified}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            game.status === "published"
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : game.status === "in_review"
                                ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                                : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                          }`}
                        >
                          {getStatusText(game.status)}
                        </span>
                        <Button
                          className="text-purple-400 hover:text-purple-300"
                          size="sm"
                          variant="ghost"
                        >
                          Edit
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6">
                  <Link href="/creator">
                    <Button
                      className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                      startContent={<PlusIcon className="w-4 h-4" />}
                      variant="bordered"
                    >
                      Create New Game
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          </motion.div>

          {/* Activity & Progress */}
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* Progress Card */}
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-purple-400" />
                  Creator Progress
                </h3>
              </CardHeader>
              <CardBody className="p-6 pt-0">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Level Progress</span>
                      <span className="text-purple-400">Level 3 - 65%</span>
                    </div>
                    <Progress
                      className="mb-4"
                      classNames={{
                        indicator:
                          "bg-gradient-to-r from-purple-500 to-purple-400",
                        track: "bg-gray-700/50",
                      }}
                      color="secondary"
                      value={65}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-300">Monthly Goals</span>
                      <span className="text-blue-400">2/3 Goals</span>
                    </div>
                    <Progress
                      className="mb-4"
                      classNames={{
                        indicator: "bg-gradient-to-r from-blue-500 to-blue-400",
                        track: "bg-gray-700/50",
                      }}
                      color="primary"
                      value={66}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Quick Links */}
            <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
              <CardBody className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  Quick Links
                </h3>
                <div className="space-y-3">
                  <Link href="/profile">
                    <Button
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-500/10"
                      startContent={<UserGroupIcon className="w-4 h-4" />}
                      variant="ghost"
                    >
                      My Profile
                    </Button>
                  </Link>
                  <Link href="/achievements">
                    <Button
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-500/10"
                      startContent={<TrophyIcon className="w-4 h-4" />}
                      variant="ghost"
                    >
                      Achievements
                    </Button>
                  </Link>
                  <Link href="/community">
                    <Button
                      className="w-full justify-start text-gray-300 hover:text-white hover:bg-purple-500/10"
                      startContent={<SparklesIcon className="w-4 h-4" />}
                      variant="ghost"
                    >
                      Community
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
