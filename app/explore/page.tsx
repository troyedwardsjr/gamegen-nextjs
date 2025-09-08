"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
import { Avatar } from "@heroui/avatar";

import {
  MagnifyingGlassIcon,
  FireIcon,
  ClockIcon,
  StarIcon,
  HeartIcon,
  PlayIcon,
  SparklesIcon,
  TrophyIcon,
  FilterIcon,
  GameIcon2Icon,
} from "@/components/icons";

interface Game {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  author: {
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  stats: {
    plays: number;
    likes: number;
    rating: number;
  };
  category: string;
  tags: string[];
  createdAt: string;
  featured?: boolean;
}

interface GameCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  color: string;
}

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState("trending");

  const categories: GameCategory[] = [
    {
      id: "action",
      name: "Action",
      icon: FireIcon,
      count: 142,
      color: "text-red-400 bg-red-500/20 border-red-500/30",
    },
    {
      id: "puzzle",
      name: "Puzzle",
      icon: SparklesIcon,
      count: 98,
      color: "text-purple-400 bg-purple-500/20 border-purple-500/30",
    },
    {
      id: "platformer",
      name: "Platformer",
      icon: GameIcon2Icon,
      count: 76,
      color: "text-green-400 bg-green-500/20 border-green-500/30",
    },
    {
      id: "racing",
      name: "Racing",
      icon: ClockIcon,
      count: 54,
      color: "text-blue-400 bg-blue-500/20 border-blue-500/30",
    },
    {
      id: "rpg",
      name: "RPG",
      icon: TrophyIcon,
      count: 32,
      color: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
    },
  ];

  const featuredGames: Game[] = [
    {
      id: "1",
      title: "Neon Runner",
      description: "High-speed cyberpunk racing through neon-lit city streets",
      thumbnail: "https://picsum.photos/400/300?random=1",
      author: {
        name: "CyberDev",
        verified: true,
      },
      stats: {
        plays: 15420,
        likes: 892,
        rating: 4.8,
      },
      category: "racing",
      tags: ["cyberpunk", "racing", "neon"],
      createdAt: "2024-01-15",
      featured: true,
    },
    {
      id: "2",
      title: "Crystal Caverns",
      description:
        "Explore mysterious underground caves filled with magical crystals",
      thumbnail: "https://picsum.photos/400/300?random=2",
      author: {
        name: "PixelMage",
        verified: false,
      },
      stats: {
        plays: 8934,
        likes: 567,
        rating: 4.6,
      },
      category: "platformer",
      tags: ["adventure", "magic", "exploration"],
      createdAt: "2024-01-12",
      featured: true,
    },
  ];

  const trendingGames: Game[] = [
    {
      id: "3",
      title: "Space Odyssey",
      description: "Epic space adventure across multiple galaxies",
      thumbnail: "https://picsum.photos/400/300?random=3",
      author: {
        name: "CosmicCreator",
        verified: true,
      },
      stats: {
        plays: 12350,
        likes: 734,
        rating: 4.7,
      },
      category: "action",
      tags: ["space", "adventure", "sci-fi"],
      createdAt: "2024-01-10",
    },
    {
      id: "4",
      title: "Mind Bender",
      description: "Challenging puzzles that will twist your brain",
      thumbnail: "https://picsum.photos/400/300?random=4",
      author: {
        name: "BrainGamez",
        verified: false,
      },
      stats: {
        plays: 9876,
        likes: 432,
        rating: 4.4,
      },
      category: "puzzle",
      tags: ["brain", "logic", "challenge"],
      createdAt: "2024-01-08",
    },
    {
      id: "5",
      title: "Dragon Quest",
      description: "Medieval fantasy RPG with epic battles",
      thumbnail: "https://picsum.photos/400/300?random=5",
      author: {
        name: "FantasyMaker",
        verified: true,
      },
      stats: {
        plays: 7654,
        likes: 321,
        rating: 4.5,
      },
      category: "rpg",
      tags: ["fantasy", "rpg", "dragons"],
      createdAt: "2024-01-05",
    },
    {
      id: "6",
      title: "Pixel Parkour",
      description: "Fast-paced platforming with precise jumping",
      thumbnail: "https://picsum.photos/400/300?random=6",
      author: {
        name: "JumpMaster",
        verified: false,
      },
      stats: {
        plays: 6543,
        likes: 298,
        rating: 4.3,
      },
      category: "platformer",
      tags: ["platformer", "speed", "challenge"],
      createdAt: "2024-01-03",
    },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }

    return num.toString();
  };

  const getGamesForTab = () => {
    switch (selectedTab) {
      case "featured":
        return featuredGames;
      case "trending":
        return trendingGames;
      case "new":
        return [...trendingGames].reverse(); // Mock new games
      default:
        return trendingGames;
    }
  };

  const filteredGames = getGamesForTab().filter((game) => {
    const matchesSearch =
      searchQuery === "" ||
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesCategory =
      selectedCategory === null || game.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                Explore Games
              </h1>
              <p className="text-gray-400 text-lg">
                Discover amazing games created by our community
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                className="w-full"
                classNames={{
                  input: "text-white",
                  inputWrapper:
                    "border-purple-500/30 hover:border-purple-500/50 bg-gray-900/50 backdrop-blur-xl",
                }}
                placeholder="Search games, creators, or tags..."
                startContent={
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                }
                value={searchQuery}
                variant="bordered"
                onValueChange={setSearchQuery}
              />
            </div>
            <Button
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              startContent={<FilterIcon className="w-4 h-4" />}
              variant="bordered"
            >
              Filters
            </Button>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-3">
            <Button
              className={`${
                selectedCategory === null
                  ? "bg-purple-500 text-white"
                  : "border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              }`}
              variant={selectedCategory === null ? "solid" : "bordered"}
              onPress={() => setSelectedCategory(null)}
            >
              All Categories
            </Button>
            {categories.map((category) => {
              const Icon = category.icon;

              return (
                <Button
                  key={category.id}
                  className={`${
                    selectedCategory === category.id
                      ? "bg-purple-500 text-white"
                      : "border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                  }`}
                  startContent={<Icon className="w-4 h-4" />}
                  variant={
                    selectedCategory === category.id ? "solid" : "bordered"
                  }
                  onPress={() => setSelectedCategory(category.id)}
                >
                  {category.name} ({category.count})
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs
            classNames={{
              tabList:
                "bg-gray-900/50 backdrop-blur-xl border border-purple-500/20",
              tab: "text-gray-400 data-[selected=true]:text-white",
              cursor: "bg-purple-500",
            }}
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
          >
            <Tab
              key="trending"
              title={
                <div className="flex items-center gap-2">
                  <FireIcon className="w-4 h-4" />
                  Trending
                </div>
              }
            />
            <Tab
              key="featured"
              title={
                <div className="flex items-center gap-2">
                  <StarIcon className="w-4 h-4" />
                  Featured
                </div>
              }
            />
            <Tab
              key="new"
              title={
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-4 h-4" />
                  New Releases
                </div>
              }
            />
          </Tabs>
        </motion.div>

        {/* Games Grid */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <AnimatePresence>
            {filteredGames.map((game, index) => (
              <motion.div
                key={game.id}
                layout
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                initial={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all duration-300 group">
                  <CardBody className="p-0">
                    {/* Thumbnail */}
                    <div className="relative overflow-hidden rounded-t-xl">
                      <div className="w-full h-48 bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                        <GameIcon2Icon className="w-12 h-12 text-white/50" />
                      </div>
                      {game.featured && (
                        <div className="absolute top-2 right-2">
                          <Chip
                            className="bg-yellow-500/80 text-black text-xs font-semibold"
                            startContent={<StarIcon className="w-3 h-3" />}
                          >
                            Featured
                          </Chip>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-2 right-2">
                          <Button
                            isIconOnly
                            className="bg-purple-500 text-white hover:bg-purple-400"
                            size="sm"
                          >
                            <PlayIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">
                        {game.title}
                      </h3>
                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {game.description}
                      </p>

                      {/* Author */}
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar
                          className="w-6 h-6 text-tiny"
                          name={game.author.name}
                          size="sm"
                        />
                        <span className="text-sm text-gray-300 flex items-center gap-1">
                          {game.author.name}
                          {game.author.verified && (
                            <span className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {game.tags.slice(0, 2).map((tag) => (
                          <Chip
                            key={tag}
                            className="bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30"
                            size="sm"
                          >
                            {tag}
                          </Chip>
                        ))}
                        {game.tags.length > 2 && (
                          <Chip
                            className="bg-gray-500/20 text-gray-400 text-xs"
                            size="sm"
                          >
                            +{game.tags.length - 2}
                          </Chip>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <PlayIcon className="w-3 h-3" />
                            {formatNumber(game.stats.plays)}
                          </span>
                          <span className="flex items-center gap-1">
                            <HeartIcon className="w-3 h-3" />
                            {formatNumber(game.stats.likes)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <StarIcon className="w-3 h-3 text-yellow-400" />
                          <span>{game.stats.rating}</span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Load More */}
        {filteredGames.length > 0 && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <Button
              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              size="lg"
              variant="bordered"
            >
              Load More Games
            </Button>
          </motion.div>
        )}

        {/* Empty State */}
        {filteredGames.length === 0 && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="w-24 h-24 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MagnifyingGlassIcon className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No games found
            </h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search or filters to find what you&apos;re
              looking for.
            </p>
            <Button
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
              onPress={() => {
                setSearchQuery("");
                setSelectedCategory(null);
              }}
            >
              Clear Filters
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
