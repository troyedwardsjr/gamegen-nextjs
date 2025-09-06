"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  Play, 
  Heart, 
  Eye, 
  Star,
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Users,
  ArrowUp
} from "lucide-react";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import Image from "next/image";

type Game = Database["public"]["Tables"]["games"]["Row"] & {
  creator_profile?: {
    username: string;
    display_name?: string | null;
    avatar_url?: string | null;
  };
  trending_score?: number;
  growth_percentage?: number;
};

interface TrendingGamesProps {
  games?: Game[];
  currentUserId?: string;
  variant?: "carousel" | "grid" | "compact";
  showHeader?: boolean;
  maxGames?: number;
  className?: string;
  onGameSelect?: (game: Game) => void;
  loading?: boolean;
}

export function TrendingGames({
  games: propGames = [],
  currentUserId,
  variant = "carousel",
  showHeader = true,
  maxGames = 8,
  className,
  onGameSelect,
  loading: propLoading = false,
}: TrendingGamesProps) {
  const [games, setGames] = useState<Game[]>(propGames);
  const [loading, setLoading] = useState(propLoading || propGames.length === 0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleGames, setVisibleGames] = useState(4);

  const supabase = createClient();

  useEffect(() => {
    if (propGames.length === 0) {
      fetchTrendingGames();
    } else {
      setGames(propGames);
      setLoading(propLoading);
    }
  }, [propGames]);

  useEffect(() => {
    const updateVisibleGames = () => {
      if (window.innerWidth >= 1280) setVisibleGames(4);
      else if (window.innerWidth >= 768) setVisibleGames(3);
      else if (window.innerWidth >= 640) setVisibleGames(2);
      else setVisibleGames(1);
    };

    updateVisibleGames();
    window.addEventListener('resize', updateVisibleGames);
    return () => window.removeEventListener('resize', updateVisibleGames);
  }, []);

  const fetchTrendingGames = async () => {
    setLoading(true);
    
    try {
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch games with activity data
      const { data, error } = await supabase
        .from("games")
        .select(`
          *,
          profiles!games_creator_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `)
        .eq("is_public", true)
        .eq("status", "published")
        .gte("updated_at", lastMonth.toISOString())
        .order("play_count", { ascending: false })
        .limit(maxGames * 2); // Fetch more for better sorting

      if (error) throw error;

      if (data) {
        // Calculate trending scores
        const gamesWithScores = data.map(game => {
          const gameAge = (now.getTime() - new Date(game.created_at).getTime()) / (1000 * 60 * 60 * 24); // days
          const recentActivity = (game.play_count || 0) / Math.max(gameAge, 1); // plays per day
          const engagement = ((game.like_count || 0) * 3) + (game.play_count || 0); // weighted engagement
          
          // Trending score based on recent activity, engagement, and recency
          const trendingScore = (recentActivity * 10) + (engagement * 0.1) + (gameAge > 7 ? 0 : 100 - gameAge * 10);
          
          // Calculate growth (simplified - would need historical data for real growth)
          const estimatedGrowth = Math.max(0, Math.min(500, recentActivity * 20));

          return {
            ...game,
            creator_profile: game.profiles,
            trending_score: trendingScore,
            growth_percentage: estimatedGrowth,
          };
        });

        // Sort by trending score and take the top games
        const sortedGames = gamesWithScores
          .sort((a, b) => (b.trending_score || 0) - (a.trending_score || 0))
          .slice(0, maxGames);

        setGames(sortedGames);
      }
    } catch (error) {
      console.error("Error fetching trending games:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => 
      prev + visibleGames >= games.length ? 0 : prev + visibleGames
    );
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, games.length - visibleGames) : Math.max(0, prev - visibleGames)
    );
  };

  const handleGameClick = (game: Game) => {
    onGameSelect?.(game);
  };

  const renderGameCard = (game: Game, index: number) => {
    const cardVariants = {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: { delay: index * 0.1 }
      },
      hover: { 
        scale: 1.05, 
        transition: { duration: 0.2 } 
      }
    };

    if (variant === "compact") {
      return (
        <motion.div
          key={game.id}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
          className="cursor-pointer"
          onClick={() => handleGameClick(game)}
        >
          <GlassmorphicCard {...GameGenCardPresets.chatPanel}>
            <div className="p-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0">
                  {game.thumbnail_url ? (
                    <Image
                      src={game.thumbnail_url}
                      alt={game.title}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-5 h-5 text-foreground/40" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{game.title}</h4>
                  <p className="text-xs text-foreground/60 truncate">
                    by {game.creator_profile?.display_name || game.creator_profile?.username}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1 text-xs text-success">
                      <ArrowUp size={10} />
                      {game.growth_percentage?.toFixed(0)}%
                    </div>
                    <div className="flex items-center gap-1 text-xs text-foreground/60">
                      <Play size={10} />
                      {(game.play_count || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </GlassmorphicCard>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={game.id}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        className="group cursor-pointer"
        onClick={() => handleGameClick(game)}
      >
        <GlassmorphicCard {...GameGenCardPresets.gameCard} className="h-full">
          <div className="p-0 relative">
            {/* Trending Badge */}
            <div className="absolute top-3 left-3 z-10">
              <Chip
                color="warning"
                variant="solid"
                size="sm"
                startContent={<TrendingUp size={12} />}
                className="font-semibold"
              >
                #{index + 1}
              </Chip>
            </div>

            {/* Growth Indicator */}
            {game.growth_percentage && game.growth_percentage > 10 && (
              <div className="absolute top-3 right-3 z-10">
                <Chip
                  color="success"
                  variant="flat"
                  size="sm"
                  startContent={<ArrowUp size={12} />}
                  className="font-semibold"
                >
                  +{game.growth_percentage.toFixed(0)}%
                </Chip>
              </div>
            )}

            {/* Game Thumbnail */}
            <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
              {game.thumbnail_url ? (
                <Image
                  src={game.thumbnail_url}
                  alt={game.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-12 h-12 text-foreground/40" />
                </div>
              )}
              
              {/* Play Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                  className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center backdrop-blur-sm"
                >
                  <Play className="w-6 h-6 text-white ml-1" />
                </motion.div>
              </div>
            </div>

            {/* Game Info */}
            <div className="p-4">
              <h3 className="font-semibold text-lg truncate mb-2">{game.title}</h3>
              
              {/* Stats Row */}
              <div className="flex items-center justify-between text-sm text-foreground/70 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Play size={14} />
                    <span>{(game.play_count || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart size={14} />
                    <span>{(game.like_count || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={14} />
                    <span>{(game.view_count || 0).toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-success font-semibold">
                  <TrendingUp size={12} />
                  {game.trending_score?.toFixed(0)}
                </div>
              </div>

              {/* Creator */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-semibold">
                  {(game.creator_profile?.display_name || game.creator_profile?.username)?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-foreground/70">
                  {game.creator_profile?.display_name || game.creator_profile?.username}
                </span>
              </div>

              {/* Tags */}
              {game.tags && game.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {game.tags.slice(0, 3).map((tag) => (
                    <Chip key={tag} size="sm" variant="flat" className="text-xs">
                      {tag}
                    </Chip>
                  ))}
                </div>
              )}
            </div>
          </div>
        </GlassmorphicCard>
      </motion.div>
    );
  };

  const renderCarousel = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      );
    }

    if (games.length === 0) {
      return (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
          <p className="text-foreground/70">No trending games available right now.</p>
        </div>
      );
    }

    const canNavigate = games.length > visibleGames;

    return (
      <div className="relative">
        {/* Navigation Buttons */}
        {canNavigate && (
          <>
            <Button
              isIconOnly
              variant="flat"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
              onPress={handlePrev}
            >
              <ChevronLeft size={18} />
            </Button>
            <Button
              isIconOnly
              variant="flat"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
              onPress={handleNext}
            >
              <ChevronRight size={18} />
            </Button>
          </>
        )}

        {/* Games Carousel */}
        <div className="overflow-hidden mx-8">
          <motion.div
            className="flex gap-4"
            animate={{ 
              x: `-${(currentIndex * (100 / visibleGames))}%` 
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ width: `${(games.length / visibleGames) * 100}%` }}
          >
            {games.map((game, index) => (
              <div
                key={game.id}
                className={`flex-shrink-0`}
                style={{ width: `${100 / games.length}%` }}
              >
                {renderGameCard(game, index)}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Indicators */}
        {canNavigate && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.ceil(games.length / visibleGames) }).map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  Math.floor(currentIndex / visibleGames) === index
                    ? 'bg-primary'
                    : 'bg-foreground/30 hover:bg-foreground/50'
                }`}
                onClick={() => setCurrentIndex(index * visibleGames)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderGrid = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence>
          {games.map((game, index) => renderGameCard(game, index))}
        </AnimatePresence>
      </div>
    );
  };

  const renderCompact = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Spinner />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <AnimatePresence>
          {games.slice(0, 5).map((game, index) => renderGameCard(game, index))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-warning to-warning-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Trending Games</h2>
              <p className="text-foreground/70">Popular games rising in the community</p>
            </div>
          </div>
          
          {variant === "carousel" && (
            <Button variant="flat" size="sm">
              View All
            </Button>
          )}
        </div>
      )}

      {variant === "carousel" && renderCarousel()}
      {variant === "grid" && renderGrid()}
      {variant === "compact" && renderCompact()}
    </div>
  );
}

export default TrendingGames;