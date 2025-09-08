"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Grid3X3,
  List,
  TrendingUp,
  Clock,
  Star,
  Play,
  Heart,
  Eye,
  Calendar,
} from "lucide-react";
import Image from "next/image";

import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";

type Game = Database["public"]["Tables"]["games"]["Row"] & {
  creator_profile?: {
    username: string;
    display_name?: string | null;
    avatar_url?: string | null;
  };
  game_stats?: {
    like_count: number;
    play_count: number;
    rating_average: number;
    rating_count: number;
  };
};

type ViewMode = "grid" | "list";
type SortBy =
  | "trending"
  | "newest"
  | "oldest"
  | "most_liked"
  | "most_played"
  | "highest_rated";
type FilterBy =
  | "all"
  | "featured"
  | "educational"
  | "arcade"
  | "puzzle"
  | "rpg"
  | "strategy";

interface GameGridProps {
  initialGames?: Game[];
  currentUserId?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showViewToggle?: boolean;
  maxGames?: number;
  variant?: "default" | "compact" | "showcase";
  className?: string;
  onGameSelect?: (game: Game) => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function GameGrid({
  initialGames = [],
  currentUserId,
  showSearch = true,
  showFilters = true,
  showViewToggle = true,
  maxGames,
  variant = "default",
  className,
  onGameSelect,
  emptyMessage = "No games found. Try adjusting your filters.",
  loading: externalLoading = false,
}: GameGridProps) {
  const [games, setGames] = useState<Game[]>(initialGames);
  const [filteredGames, setFilteredGames] = useState<Game[]>(initialGames);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("trending");
  const [filterBy, setFilterBy] = useState<FilterBy>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const supabase = createClient();
  const gamesPerPage = variant === "compact" ? 6 : 12;

  useEffect(() => {
    if (initialGames.length === 0) {
      fetchGames();
    }
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [games, searchQuery, sortBy, filterBy]);

  const fetchGames = async (reset: boolean = false) => {
    setLoading(true);

    try {
      const start = reset ? 0 : games.length;
      const end = start + gamesPerPage - 1;

      let query = supabase
        .from("games")
        .select(
          `
          *,
          profiles!games_creator_id_fkey (
            username,
            display_name,
            avatar_url
          )
        `,
        )
        .eq("is_public", true)
        .eq("status", "published")
        .range(start, end);

      // Apply sorting
      switch (sortBy) {
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        case "oldest":
          query = query.order("created_at", { ascending: true });
          break;
        case "most_played":
          query = query.order("play_count", { ascending: false });
          break;
        case "most_liked":
          query = query.order("like_count", { ascending: false });
          break;
        case "trending":
        default:
          // Trending based on recent activity and engagement
          query = query.order("updated_at", { ascending: false });
          break;
      }

      const { data, error, count } = await query;

      if (error) throw error;

      const gamesWithStats: Game[] = (data || []).map((game) => ({
        ...game,
        creator_profile: game.profiles,
        game_stats: {
          like_count: game.like_count || 0,
          play_count: game.play_count || 0,
          rating_average: 0, // Would need to calculate from ratings table
          rating_count: 0,
        },
      }));

      if (reset) {
        setGames(gamesWithStats);
      } else {
        setGames((prev) => [...prev, ...gamesWithStats]);
      }

      setHasMore(gamesWithStats.length === gamesPerPage);
    } catch (error) {
      console.error("Error fetching games:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...games];

    // Apply text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      filtered = filtered.filter(
        (game) =>
          game.title.toLowerCase().includes(query) ||
          game.description?.toLowerCase().includes(query) ||
          game.tags?.some((tag) => tag.toLowerCase().includes(query)) ||
          game.creator_profile?.username.toLowerCase().includes(query) ||
          game.creator_profile?.display_name?.toLowerCase().includes(query),
      );
    }

    // Apply category filter
    if (filterBy !== "all") {
      filtered = filtered.filter((game) => {
        switch (filterBy) {
          case "featured":
            return game.is_featured;
          case "educational":
            return game.tags?.includes("educational");
          case "arcade":
            return game.tags?.includes("arcade");
          case "puzzle":
            return game.tags?.includes("puzzle");
          case "rpg":
            return game.tags?.includes("rpg");
          case "strategy":
            return game.tags?.includes("strategy");
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "most_played":
          return (b.play_count || 0) - (a.play_count || 0);
        case "most_liked":
          return (b.like_count || 0) - (a.like_count || 0);
        case "highest_rated":
          return (
            (b.game_stats?.rating_average || 0) -
            (a.game_stats?.rating_average || 0)
          );
        case "trending":
        default:
          // Simple trending algorithm based on recent activity
          const aScore =
            (a.like_count || 0) * 2 +
            (a.play_count || 0) +
            new Date(a.updated_at).getTime() / 1000000;
          const bScore =
            (b.like_count || 0) * 2 +
            (b.play_count || 0) +
            new Date(b.updated_at).getTime() / 1000000;

          return bScore - aScore;
      }
    });

    // Apply max games limit
    if (maxGames) {
      filtered = filtered.slice(0, maxGames);
    }

    setFilteredGames(filtered);
  };

  const handleGameClick = (game: Game) => {
    onGameSelect?.(game);
  };

  const renderGameCard = (game: Game, index: number) => {
    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { delay: index * 0.05 },
      },
      hover: { scale: 1.02, transition: { duration: 0.2 } },
    };

    if (viewMode === "list") {
      return (
        <motion.div
          key={game.id}
          animate="visible"
          initial="hidden"
          variants={cardVariants}
          whileHover="hover"
        >
          <GlassmorphicCard
            {...GameGenCardPresets.gameCard}
            className="cursor-pointer"
            onClick={() => handleGameClick(game)}
          >
            <div className="p-4">
              <div className="flex items-center gap-4">
                {/* Game Thumbnail */}
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 flex-shrink-0">
                  {game.thumbnail_url ? (
                    <Image
                      alt={game.title}
                      className="w-full h-full object-cover"
                      height={80}
                      src={game.thumbnail_url}
                      width={80}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Game Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold truncate mb-1">
                    {game.title}
                  </h3>
                  <p className="text-sm text-foreground/70 line-clamp-2 mb-2">
                    {game.description || "No description available."}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-foreground/60">
                    <span>
                      by{" "}
                      {game.creator_profile?.display_name ||
                        game.creator_profile?.username}
                    </span>
                    <div className="flex items-center gap-1">
                      <Play size={12} />
                      {(game.play_count || 0).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart size={12} />
                      {(game.like_count || 0).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Game Tags */}
                <div className="flex flex-wrap gap-1 max-w-40">
                  {game.tags?.slice(0, 2).map((tag) => (
                    <Chip
                      key={tag}
                      className="text-xs"
                      size="sm"
                      variant="flat"
                    >
                      {tag}
                    </Chip>
                  ))}
                </div>

                {/* Play Button */}
                <Button
                  color="primary"
                  size="sm"
                  startContent={<Play size={16} />}
                  variant="solid"
                >
                  Play
                </Button>
              </div>
            </div>
          </GlassmorphicCard>
        </motion.div>
      );
    }

    // Grid view
    return (
      <motion.div
        key={game.id}
        animate="visible"
        className="group"
        initial="hidden"
        variants={cardVariants}
        whileHover="hover"
      >
        <GlassmorphicCard
          {...GameGenCardPresets.gameCard}
          className="cursor-pointer h-full"
          onClick={() => handleGameClick(game)}
        >
          <div className="p-0">
            {/* Game Thumbnail */}
            <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
              {game.thumbnail_url ? (
                <Image
                  fill
                  alt={game.title}
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  src={game.thumbnail_url}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-12 h-12 text-foreground/40" />
                </div>
              )}

              {/* Overlay Play Button */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <motion.div
                  className="w-16 h-16 bg-primary/90 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                >
                  <Play className="w-6 h-6 text-white ml-1" />
                </motion.div>
              </div>

              {/* Featured Badge */}
              {game.is_featured && (
                <div className="absolute top-2 left-2">
                  <Chip
                    color="warning"
                    size="sm"
                    startContent={<Star size={12} />}
                    variant="solid"
                  >
                    Featured
                  </Chip>
                </div>
              )}
            </div>

            {/* Game Info */}
            <div className="p-4">
              <h3 className="font-semibold text-lg truncate mb-2">
                {game.title}
              </h3>
              <p className="text-sm text-foreground/70 line-clamp-2 mb-3">
                {game.description || "No description available."}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-foreground/60 mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Play size={12} />
                    {(game.play_count || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart size={12} />
                    {(game.like_count || 0).toLocaleString()}
                  </div>
                  {game.game_stats?.rating_average && (
                    <div className="flex items-center gap-1">
                      <Star size={12} />
                      {game.game_stats.rating_average.toFixed(1)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(game.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Creator */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-semibold">
                    {(
                      game.creator_profile?.display_name ||
                      game.creator_profile?.username
                    )
                      ?.charAt(0)
                      .toUpperCase()}
                  </div>
                  <span className="text-sm text-foreground/70 truncate">
                    {game.creator_profile?.display_name ||
                      game.creator_profile?.username}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {game.tags && game.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {game.tags.slice(0, 3).map((tag) => (
                    <Chip
                      key={tag}
                      className="text-xs"
                      size="sm"
                      variant="flat"
                    >
                      {tag}
                    </Chip>
                  ))}
                  {game.tags.length > 3 && (
                    <Chip className="text-xs" size="sm" variant="flat">
                      +{game.tags.length - 3}
                    </Chip>
                  )}
                </div>
              )}
            </div>
          </div>
        </GlassmorphicCard>
      </motion.div>
    );
  };

  const renderControls = () => (
    <div className="space-y-4 mb-6">
      {/* Search and View Toggle */}
      <div className="flex items-center gap-3">
        {showSearch && (
          <Input
            className="flex-1"
            classNames={{
              input: "bg-transparent",
            }}
            placeholder="Search games..."
            startContent={<Search size={18} />}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
        )}

        {showViewToggle && (
          <div className="flex">
            <Button
              isIconOnly
              size="sm"
              variant={viewMode === "grid" ? "solid" : "flat"}
              onPress={() => setViewMode("grid")}
            >
              <Grid3X3 size={16} />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant={viewMode === "list" ? "solid" : "flat"}
              onPress={() => setViewMode("list")}
            >
              <List size={16} />
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            className="w-40"
            label="Sort by"
            selectedKeys={[sortBy]}
            size="sm"
            onSelectionChange={(keys) =>
              setSortBy(Array.from(keys)[0] as SortBy)
            }
          >
            <SelectItem key="trending" startContent={<TrendingUp size={14} />}>
              Trending
            </SelectItem>
            <SelectItem key="newest" startContent={<Clock size={14} />}>
              Newest
            </SelectItem>
            <SelectItem key="most_played" startContent={<Play size={14} />}>
              Most Played
            </SelectItem>
            <SelectItem key="most_liked" startContent={<Heart size={14} />}>
              Most Liked
            </SelectItem>
            <SelectItem key="highest_rated" startContent={<Star size={14} />}>
              Highest Rated
            </SelectItem>
          </Select>

          <Select
            className="w-40"
            label="Category"
            selectedKeys={[filterBy]}
            size="sm"
            onSelectionChange={(keys) =>
              setFilterBy(Array.from(keys)[0] as FilterBy)
            }
          >
            <SelectItem key="all">All Games</SelectItem>
            <SelectItem key="featured">Featured</SelectItem>
            <SelectItem key="educational">Educational</SelectItem>
            <SelectItem key="arcade">Arcade</SelectItem>
            <SelectItem key="puzzle">Puzzle</SelectItem>
            <SelectItem key="rpg">RPG</SelectItem>
            <SelectItem key="strategy">Strategy</SelectItem>
          </Select>
        </div>
      )}
    </div>
  );

  const renderGames = () => {
    if (loading || externalLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      );
    }

    if (filteredGames.length === 0) {
      return (
        <div className="text-center py-12">
          <Eye className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
          <p className="text-foreground/70">{emptyMessage}</p>
        </div>
      );
    }

    const gridCols =
      variant === "compact"
        ? "grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

    return (
      <div
        className={viewMode === "grid" ? `grid ${gridCols} gap-4` : "space-y-3"}
      >
        <AnimatePresence>
          {filteredGames.map((game, index) => renderGameCard(game, index))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={className}>
      {variant !== "compact" && renderControls()}
      {renderGames()}

      {/* Load More Button */}
      {hasMore && !maxGames && filteredGames.length >= gamesPerPage && (
        <div className="flex justify-center mt-8">
          <Button
            isLoading={loading}
            variant="flat"
            onPress={() => fetchGames()}
          >
            Load More Games
          </Button>
        </div>
      )}
    </div>
  );
}

export default GameGrid;
