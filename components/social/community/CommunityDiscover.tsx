"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import { Chip } from "@heroui/chip";
import { motion } from "framer-motion";
import { 
  Search, 
  TrendingUp, 
  Star, 
  Users, 
  Calendar,
  Filter,
  Gamepad2,
  Crown,
  BookOpen,
  Zap
} from "lucide-react";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";
import { GameGrid } from "../game/GameGrid";
import { TrendingGames } from "./TrendingGames";
import { FeaturedCreators } from "./FeaturedCreators";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";

type Game = Database["public"]["Tables"]["games"]["Row"];

interface CommunityDiscoverProps {
  currentUserId?: string;
  className?: string;
}

interface CommunityStats {
  totalGames: number;
  totalCreators: number;
  activeUsers: number;
  totalPlays: number;
}

export function CommunityDiscover({
  currentUserId,
  className,
}: CommunityDiscoverProps) {
  const [activeTab, setActiveTab] = useState("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<CommunityStats>({
    totalGames: 0,
    totalCreators: 0,
    activeUsers: 0,
    totalPlays: 0,
  });
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [trendingGames, setTrendingGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    setLoading(true);
    
    try {
      const [
        gamesResponse,
        creatorsResponse,
        featuredResponse,
        trendingResponse,
        statsResponse
      ] = await Promise.all([
        // Total games count
        supabase
          .from("games")
          .select("id", { count: "exact", head: true })
          .eq("is_public", true)
          .eq("status", "published"),

        // Total creators count
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true }),

        // Featured games
        supabase
          .from("games")
          .select("*")
          .eq("is_public", true)
          .eq("status", "published")
          .eq("is_featured", true)
          .order("created_at", { ascending: false })
          .limit(6),

        // Trending games (recent popular games)
        supabase
          .from("games")
          .select("*")
          .eq("is_public", true)
          .eq("status", "published")
          .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
          .order("play_count", { ascending: false })
          .limit(8),

        // Total plays (approximate)
        supabase
          .from("games")
          .select("play_count")
          .eq("is_public", true)
      ]);

      const totalPlays = statsResponse.data?.reduce((sum, game) => sum + (game.play_count || 0), 0) || 0;

      setStats({
        totalGames: gamesResponse.count || 0,
        totalCreators: creatorsResponse.count || 0,
        activeUsers: Math.floor((creatorsResponse.count || 0) * 0.3), // Estimate 30% active
        totalPlays,
      });

      setFeaturedGames(featuredResponse.data || []);
      setTrendingGames(trendingResponse.data || []);

    } catch (error) {
      console.error("Error fetching community data:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderWelcomeSection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-8"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-2xl blur-xl" />
        <GlassmorphicCard {...GameGenCardPresets.heroCard} className="relative">
          <div className="p-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              Community Hub
            </h1>
            <p className="text-lg text-foreground/70 mb-6 max-w-2xl mx-auto">
              Discover amazing games created by our community, connect with talented creators, 
              and share your own creations with the world.
            </p>
            
            {/* Community Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {stats.totalGames.toLocaleString()}
                </div>
                <div className="text-sm text-foreground/60">Games Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary mb-1">
                  {stats.totalCreators.toLocaleString()}
                </div>
                <div className="text-sm text-foreground/60">Creators</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success mb-1">
                  {stats.activeUsers.toLocaleString()}
                </div>
                <div className="text-sm text-foreground/60">Active Users</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning mb-1">
                  {(stats.totalPlays / 1000).toFixed(1)}K
                </div>
                <div className="text-sm text-foreground/60">Total Plays</div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-md mx-auto">
              <Input
                placeholder="Search games, creators, or topics..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                startContent={<Search size={20} />}
                size="lg"
                classNames={{
                  input: "bg-transparent",
                  inputWrapper: "bg-background/50 backdrop-blur-md border-1 border-white/20",
                }}
              />
            </div>
          </div>
        </GlassmorphicCard>
      </div>
    </motion.div>
  );

  const renderQuickFilters = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex flex-wrap gap-2 mb-6"
    >
      <Chip
        variant="flat"
        startContent={<Crown size={14} />}
        className="cursor-pointer hover:scale-105 transition-transform"
      >
        Featured
      </Chip>
      <Chip
        variant="flat"
        startContent={<TrendingUp size={14} />}
        className="cursor-pointer hover:scale-105 transition-transform"
      >
        Trending
      </Chip>
      <Chip
        variant="flat"
        startContent={<BookOpen size={14} />}
        className="cursor-pointer hover:scale-105 transition-transform"
      >
        Educational
      </Chip>
      <Chip
        variant="flat"
        startContent={<Gamepad2 size={14} />}
        className="cursor-pointer hover:scale-105 transition-transform"
      >
        Arcade
      </Chip>
      <Chip
        variant="flat"
        startContent={<Zap size={14} />}
        className="cursor-pointer hover:scale-105 transition-transform"
      >
        New
      </Chip>
      <Chip
        variant="flat"
        startContent={<Star size={14} />}
        className="cursor-pointer hover:scale-105 transition-transform"
      >
        Top Rated
      </Chip>
    </motion.div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "trending":
        return (
          <div className="space-y-8">
            <TrendingGames
              games={trendingGames}
              currentUserId={currentUserId}
              loading={loading}
            />
            <GameGrid
              currentUserId={currentUserId}
              showSearch={false}
              maxGames={12}
              variant="default"
            />
          </div>
        );

      case "featured":
        return (
          <GameGrid
            initialGames={featuredGames}
            currentUserId={currentUserId}
            showSearch={false}
            showFilters={false}
            maxGames={12}
            variant="default"
            emptyMessage="No featured games available at the moment."
          />
        );

      case "creators":
        return (
          <FeaturedCreators
            currentUserId={currentUserId}
          />
        );

      case "events":
        return (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Community Events</h3>
            <p className="text-foreground/70 mb-6">
              Stay tuned for exciting community events, game jams, and competitions!
            </p>
            <Button color="primary" variant="flat">
              Subscribe to Updates
            </Button>
          </div>
        );

      case "all":
      default:
        return (
          <GameGrid
            currentUserId={currentUserId}
            showSearch={!searchQuery}
            showFilters={true}
            variant="default"
          />
        );
    }
  };

  return (
    <div className={className}>
      {renderWelcomeSection()}
      {renderQuickFilters()}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
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
                key="trending"
                title={
                  <div className="flex items-center space-x-2">
                    <TrendingUp size={16} />
                    <span>Trending</span>
                  </div>
                }
              />
              <Tab
                key="featured"
                title={
                  <div className="flex items-center space-x-2">
                    <Star size={16} />
                    <span>Featured</span>
                  </div>
                }
              />
              <Tab
                key="creators"
                title={
                  <div className="flex items-center space-x-2">
                    <Users size={16} />
                    <span>Creators</span>
                  </div>
                }
              />
              <Tab
                key="events"
                title={
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>Events</span>
                  </div>
                }
              />
              <Tab
                key="all"
                title={
                  <div className="flex items-center space-x-2">
                    <Gamepad2 size={16} />
                    <span>All Games</span>
                  </div>
                }
              />
            </Tabs>

            <div className="mt-6">
              {renderTabContent()}
            </div>
          </div>
        </GlassmorphicCard>
      </motion.div>
    </div>
  );
}

export default CommunityDiscover;