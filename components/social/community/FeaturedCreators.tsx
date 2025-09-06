"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Spinner } from "@heroui/spinner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, 
  Star, 
  Crown, 
  Heart,
  Play,
  Trophy,
  Calendar,
  MapPin,
  ExternalLink,
  UserPlus,
  UserCheck,
  Gamepad2,
  TrendingUp,
  Award
} from "lucide-react";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";
import { FollowButton } from "../profile/FollowButton";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { toast } from "sonner";
import Image from "next/image";

type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  creator_stats?: {
    total_games: number;
    total_likes: number;
    total_plays: number;
    followers_count: number;
    featured_games: number;
    avg_rating: number;
  };
  recent_games?: Array<{
    id: string;
    title: string;
    thumbnail_url?: string | null;
  }>;
  badges?: string[];
  is_following?: boolean;
};

interface FeaturedCreatorsProps {
  currentUserId?: string;
  variant?: "grid" | "list" | "carousel";
  showHeader?: boolean;
  maxCreators?: number;
  className?: string;
  onCreatorSelect?: (creator: Profile) => void;
  loading?: boolean;
}

const CREATOR_BADGES = {
  featured: { icon: Crown, label: "Featured Creator", color: "warning" },
  top_rated: { icon: Star, label: "Top Rated", color: "primary" },
  prolific: { icon: Gamepad2, label: "Prolific Creator", color: "secondary" },
  trending: { icon: TrendingUp, label: "Trending", color: "success" },
  educator: { icon: Award, label: "Educator", color: "danger" },
  verified: { icon: Trophy, label: "Verified", color: "primary" },
};

export function FeaturedCreators({
  currentUserId,
  variant = "grid",
  showHeader = true,
  maxCreators = 8,
  className,
  onCreatorSelect,
  loading: propLoading = false,
}: FeaturedCreatorsProps) {
  const [creators, setCreators] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(propLoading);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const supabase = createClient();

  useEffect(() => {
    fetchFeaturedCreators();
    if (currentUserId) {
      fetchFollowingStatus();
    }
  }, [currentUserId, maxCreators]);

  const fetchFeaturedCreators = async () => {
    setLoading(true);
    
    try {
      // Fetch top creators based on games and engagement
      const { data: creatorsData, error } = await supabase
        .from("profiles")
        .select(`
          *,
          games!games_creator_id_fkey (
            id,
            title,
            thumbnail_url,
            play_count,
            like_count,
            is_featured
          )
        `)
        .not("games", "is", null)
        .limit(maxCreators * 2); // Fetch more for better filtering

      if (error) throw error;

      if (creatorsData) {
        // Calculate creator stats and sort by engagement
        const creatorsWithStats = creatorsData.map(creator => {
          const games = creator.games || [];
          const totalGames = games.length;
          const totalLikes = games.reduce((sum, game) => sum + (game.like_count || 0), 0);
          const totalPlays = games.reduce((sum, game) => sum + (game.play_count || 0), 0);
          const featuredGames = games.filter(game => game.is_featured).length;
          const avgRating = totalGames > 0 ? (totalLikes / totalGames) * 0.2 + 4.0 : 0; // Simplified rating calculation

          // Determine badges based on stats
          const badges: string[] = [];
          if (featuredGames > 0) badges.push("featured");
          if (totalGames >= 10) badges.push("prolific");
          if (avgRating >= 4.5) badges.push("top_rated");
          if (totalPlays > 10000) badges.push("trending");
          if (creator.bio?.toLowerCase().includes("teacher") || 
              creator.bio?.toLowerCase().includes("educator")) badges.push("educator");

          // Engagement score for sorting
          const engagementScore = (totalLikes * 2) + (totalPlays * 0.1) + (totalGames * 10) + (featuredGames * 50);

          return {
            ...creator,
            creator_stats: {
              total_games: totalGames,
              total_likes: totalLikes,
              total_plays: totalPlays,
              followers_count: 0, // Would need to calculate from follows table
              featured_games: featuredGames,
              avg_rating: avgRating,
            },
            recent_games: games.slice(0, 3).map(game => ({
              id: game.id,
              title: game.title,
              thumbnail_url: game.thumbnail_url,
            })),
            badges,
            engagement_score: engagementScore,
          };
        });

        // Sort by engagement score and take top creators
        const topCreators = creatorsWithStats
          .filter(creator => creator.creator_stats!.total_games > 0)
          .sort((a, b) => (b.engagement_score || 0) - (a.engagement_score || 0))
          .slice(0, maxCreators);

        setCreators(topCreators);
      }
    } catch (error) {
      console.error("Error fetching featured creators:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowingStatus = async () => {
    if (!currentUserId || creators.length === 0) return;

    try {
      const { data, error } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", currentUserId)
        .in("following_id", creators.map(c => c.id));

      if (!error && data) {
        setFollowingIds(new Set(data.map(follow => follow.following_id)));
      }
    } catch (error) {
      console.error("Error fetching following status:", error);
    }
  };

  const handleFollowToggle = async (creatorId: string, isFollowing: boolean) => {
    if (!currentUserId) {
      toast.error("Please log in to follow creators");
      return;
    }

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", creatorId);

        if (error) throw error;

        setFollowingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(creatorId);
          return newSet;
        });

        toast.success("Unfollowed creator");
      } else {
        const { error } = await supabase
          .from("user_follows")
          .insert({
            follower_id: currentUserId,
            following_id: creatorId,
          });

        if (error) throw error;

        setFollowingIds(prev => new Set([...prev, creatorId]));

        // Create activity
        await supabase.from("activities").insert({
          user_id: currentUserId,
          activity_type: "user_followed",
          target_user_id: creatorId,
          activity_data: {
            followed_user_id: creatorId,
          },
          visibility: "followers",
        });

        toast.success("Following creator!");
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("Failed to update follow status");
    }
  };

  const handleCreatorClick = (creator: Profile) => {
    onCreatorSelect?.(creator);
  };

  const renderCreatorCard = (creator: Profile, index: number) => {
    const isFollowing = followingIds.has(creator.id);
    const stats = creator.creator_stats!;

    const cardVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { delay: index * 0.1 }
      },
      hover: { scale: 1.02, transition: { duration: 0.2 } }
    };

    if (variant === "list") {
      return (
        <motion.div
          key={creator.id}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <GlassmorphicCard 
            {...GameGenCardPresets.gameCard}
            className="cursor-pointer"
            onClick={() => handleCreatorClick(creator)}
          >
            <div className="p-6">
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar
                    src={creator.avatar_url || undefined}
                    name={creator.display_name || creator.username}
                    size="lg"
                    className="w-16 h-16"
                  />
                  {creator.badges?.includes("verified") && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <Trophy className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Creator Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold truncate">
                      {creator.display_name || creator.username}
                    </h3>
                    {creator.badges?.map(badge => {
                      const BadgeConfig = CREATOR_BADGES[badge as keyof typeof CREATOR_BADGES];
                      if (BadgeConfig) {
                        const Icon = BadgeConfig.icon;
                        return (
                          <Chip
                            key={badge}
                            size="sm"
                            variant="flat"
                            color={BadgeConfig.color as any}
                            startContent={<Icon size={12} />}
                          >
                            {BadgeConfig.label}
                          </Chip>
                        );
                      }
                      return null;
                    })}
                  </div>
                  
                  <p className="text-foreground/70 mb-4 line-clamp-2">
                    {creator.bio || "Game creator passionate about making amazing experiences."}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-primary">
                        {stats.total_games}
                      </div>
                      <div className="text-foreground/60">Games</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-secondary">
                        {stats.total_likes.toLocaleString()}
                      </div>
                      <div className="text-foreground/60">Likes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-success">
                        {(stats.total_plays / 1000).toFixed(1)}K
                      </div>
                      <div className="text-foreground/60">Plays</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-warning">
                        {stats.avg_rating.toFixed(1)}
                      </div>
                      <div className="text-foreground/60">Rating</div>
                    </div>
                  </div>
                </div>

                {/* Recent Games */}
                <div className="hidden lg:flex flex-col gap-2 w-48">
                  <h4 className="text-sm font-medium text-foreground/70 mb-2">Recent Games</h4>
                  {creator.recent_games?.slice(0, 3).map(game => (
                    <div key={game.id} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                        {game.thumbnail_url ? (
                          <Image
                            src={game.thumbnail_url}
                            alt={game.title}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Play className="w-4 h-4 text-foreground/40" />
                        )}
                      </div>
                      <span className="text-sm truncate">{game.title}</span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button
                    color={isFollowing ? "default" : "primary"}
                    variant={isFollowing ? "flat" : "solid"}
                    size="sm"
                    startContent={isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                    onPress={() => handleFollowToggle(creator.id, isFollowing)}
                    className="min-w-24"
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                  <Button
                    variant="flat"
                    size="sm"
                    startContent={<ExternalLink size={14} />}
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          </GlassmorphicCard>
        </motion.div>
      );
    }

    // Grid view
    return (
      <motion.div
        key={creator.id}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        className="group"
      >
        <GlassmorphicCard 
          {...GameGenCardPresets.gameCard}
          className="cursor-pointer h-full"
          onClick={() => handleCreatorClick(creator)}
        >
          <div className="p-6 text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <Avatar
                src={creator.avatar_url || undefined}
                name={creator.display_name || creator.username}
                size="lg"
                className="w-20 h-20 mx-auto"
              />
              {creator.badges?.includes("verified") && (
                <div className="absolute -bottom-1 -right-1/2 translate-x-1/2 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            {/* Name and Badges */}
            <h3 className="text-lg font-semibold mb-2">
              {creator.display_name || creator.username}
            </h3>
            
            <div className="flex flex-wrap justify-center gap-1 mb-3">
              {creator.badges?.slice(0, 2).map(badge => {
                const BadgeConfig = CREATOR_BADGES[badge as keyof typeof CREATOR_BADGES];
                if (BadgeConfig) {
                  const Icon = BadgeConfig.icon;
                  return (
                    <Chip
                      key={badge}
                      size="sm"
                      variant="flat"
                      color={BadgeConfig.color as any}
                      startContent={<Icon size={10} />}
                      className="text-xs"
                    >
                      {BadgeConfig.label}
                    </Chip>
                  );
                }
                return null;
              })}
            </div>

            {/* Bio */}
            <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
              {creator.bio || "Game creator passionate about making amazing experiences."}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div className="text-center p-2 bg-background/50 rounded-lg">
                <div className="text-lg font-semibold text-primary">
                  {stats.total_games}
                </div>
                <div className="text-foreground/60 text-xs">Games</div>
              </div>
              <div className="text-center p-2 bg-background/50 rounded-lg">
                <div className="text-lg font-semibold text-secondary">
                  {stats.total_likes}
                </div>
                <div className="text-foreground/60 text-xs">Likes</div>
              </div>
            </div>

            {/* Recent Games Preview */}
            {creator.recent_games && creator.recent_games.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-center gap-1">
                  {creator.recent_games.slice(0, 3).map(game => (
                    <div 
                      key={game.id} 
                      className="w-8 h-8 rounded bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"
                      title={game.title}
                    >
                      {game.thumbnail_url ? (
                        <Image
                          src={game.thumbnail_url}
                          alt={game.title}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Play className="w-3 h-3 text-foreground/40" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <Button
                color={isFollowing ? "default" : "primary"}
                variant={isFollowing ? "flat" : "solid"}
                size="sm"
                startContent={isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                onPress={() => handleFollowToggle(creator.id, isFollowing)}
                className="w-full"
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            </div>
          </div>
        </GlassmorphicCard>
      </motion.div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" />
        </div>
      );
    }

    if (creators.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
          <p className="text-foreground/70">No featured creators available at the moment.</p>
        </div>
      );
    }

    const gridCols = variant === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "";

    return (
      <div className={variant === "grid" ? `grid ${gridCols} gap-6` : "space-y-4"}>
        <AnimatePresence>
          {creators.map((creator, index) => renderCreatorCard(creator, index))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className={className}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-secondary to-secondary-500 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Featured Creators</h2>
              <p className="text-foreground/70">Talented creators making amazing games</p>
            </div>
          </div>
          
          <Button variant="flat" size="sm">
            View All Creators
          </Button>
        </div>
      )}

      {renderContent()}
    </div>
  );
}

export default FeaturedCreators;