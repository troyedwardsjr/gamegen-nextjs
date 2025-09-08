"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Flag,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

import { SocialShareButton } from "./SocialShareButton";
import { GameRating } from "./GameRating";
import { GameComments } from "./GameComments";

import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { GameSocialStats } from "@/src/types/social";

type Game = Database["public"]["Tables"]["games"]["Row"];

interface GameSocialPanelProps {
  game: Game;
  currentUserId?: string;
  showComments?: boolean;
  showRating?: boolean;
  showSharing?: boolean;
  variant?: "default" | "compact" | "embedded" | "floating";
  className?: string;
  onLike?: (liked: boolean, newCount: number) => void;
  onComment?: (newCount: number) => void;
}

export function GameSocialPanel({
  game,
  currentUserId,
  showComments = true,
  showRating = true,
  showSharing = true,
  variant = "default",
  className,
  onLike,
  onComment,
}: GameSocialPanelProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [socialStats, setSocialStats] = useState<GameSocialStats>({
    like_count: game.like_count || 0,
    comment_count: 0,
    rating_average: 0,
    rating_count: 0,
    collection_count: 0,
    fork_count: game.fork_count || 0,
  });
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const isOwnGame = currentUserId === game.creator_id;

  useEffect(() => {
    if (currentUserId) {
      fetchUserInteractions();
    }
    fetchSocialStats();
  }, [game.id, currentUserId]);

  const fetchUserInteractions = async () => {
    if (!currentUserId) return;

    try {
      const [likeResult, bookmarkResult] = await Promise.all([
        supabase
          .from("game_likes")
          .select("id")
          .eq("game_id", game.id)
          .eq("user_id", currentUserId)
          .single(),

        supabase
          .from("collection_games")
          .select("id")
          .eq("game_id", game.id)
          .eq("added_by", currentUserId)
          .single(),
      ]);

      setIsLiked(!!likeResult.data);
      setIsBookmarked(!!bookmarkResult.data);
    } catch (error) {
      // Ignore errors for checking user interactions
    }
  };

  const fetchSocialStats = async () => {
    try {
      const [commentsResult, ratingsResult] = await Promise.all([
        supabase
          .from("game_comments")
          .select("id", { count: "exact" })
          .eq("game_id", game.id)
          .eq("is_deleted", false),

        (supabase as any)
          .from("game_ratings")
          .select("rating")
          .eq("game_id", game.id),
      ]);

      const commentCount = commentsResult.count || 0;
      const ratings = ratingsResult.data || [];
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
            ratings.length
          : 0;

      setSocialStats((prev) => ({
        ...prev,
        comment_count: commentCount,
        rating_average: avgRating,
        rating_count: ratings.length,
      }));
    } catch (error) {
      console.error("Error fetching social stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUserId) {
      toast.error("Please log in to like games");

      return;
    }

    const newLikedState = !isLiked;
    const optimisticCount = socialStats.like_count + (newLikedState ? 1 : -1);

    // Optimistic update
    setIsLiked(newLikedState);
    setSocialStats((prev) => ({ ...prev, like_count: optimisticCount }));
    onLike?.(newLikedState, optimisticCount);

    try {
      if (newLikedState) {
        // Add like
        const { error } = await supabase.from("game_likes").insert({
          game_id: game.id,
          user_id: currentUserId,
        });

        if (error) throw error;

        // Create activity
        await (supabase as any).from("activities").insert({
          user_id: currentUserId,
          activity_type: "game_liked",
          target_game_id: game.id,
          activity_data: {
            game_title: game.title,
            game_id: game.id,
          },
          visibility: "followers",
        });

        // Send notification to game creator (if not own game)
        if (!isOwnGame) {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("username, display_name")
            .eq("id", currentUserId)
            .single();

          if (userProfile) {
            await (supabase as any).from("notifications").insert({
              recipient_id: game.creator_id,
              sender_id: currentUserId,
              notification_type: "game_like",
              title: "Your game was liked!",
              content: `${userProfile.display_name || userProfile.username} liked your game "${game.title}"`,
              related_game_id: game.id,
              action_url: `/games/${game.id}`,
              notification_data: {
                game_title: game.title,
                liker_username: userProfile.username,
                liker_display_name: userProfile.display_name,
              },
            });
          }
        }

        toast.success("Game liked!");
      } else {
        // Remove like
        const { error } = await supabase
          .from("game_likes")
          .delete()
          .eq("game_id", game.id)
          .eq("user_id", currentUserId);

        if (error) throw error;
        toast.success("Like removed");
      }
    } catch (error) {
      // Revert optimistic update
      setIsLiked(!newLikedState);
      setSocialStats((prev) => ({
        ...prev,
        like_count: prev.like_count - (newLikedState ? 1 : -1),
      }));
      onLike?.(!newLikedState, socialStats.like_count);
      console.error("Error updating like:", error);
      toast.error("Failed to update like");
    }
  };

  const handleBookmark = async () => {
    if (!currentUserId) {
      toast.error("Please log in to bookmark games");

      return;
    }

    // This would involve adding to a user's collection
    // For now, just show a toast
    toast.info("Bookmarking feature coming soon!");
  };

  const handleShare = (platform?: string) => {
    if (platform) {
      // Handle social media sharing
      const gameUrl = `${window.location.origin}/games/${game.id}`;
      const text = `Check out "${game.title}" on GameGen! ${game.description || ""}`;

      SocialShareButton.share(platform as any, {
        url: gameUrl,
        title: game.title,
        text: text,
        hashtags: game.tags || [],
      });
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const handleCopyLink = async () => {
    const gameUrl = `${window.location.origin}/games/${game.id}`;

    try {
      await navigator.clipboard.writeText(gameUrl);
      toast.success("Game link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const renderCompactView = () => (
    <div className="flex items-center gap-2">
      <Button
        color={isLiked ? "danger" : "default"}
        size="sm"
        startContent={
          <Heart fill={isLiked ? "currentColor" : "none"} size={16} />
        }
        variant="flat"
        onPress={handleLike}
      >
        {socialStats.like_count}
      </Button>

      <Button
        size="sm"
        startContent={<MessageCircle size={16} />}
        variant="flat"
        onPress={() => setShowCommentsPanel(!showCommentsPanel)}
      >
        {socialStats.comment_count}
      </Button>

      <Button
        size="sm"
        startContent={<Share2 size={16} />}
        variant="flat"
        onPress={() => handleShare()}
      />
    </div>
  );

  const renderDefaultView = () => (
    <div className="space-y-4">
      {/* Main Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              color={isLiked ? "danger" : "default"}
              isLoading={loading}
              startContent={
                <motion.div
                  animate={isLiked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Heart fill={isLiked ? "currentColor" : "none"} size={18} />
                </motion.div>
              }
              variant={isLiked ? "solid" : "flat"}
              onPress={handleLike}
            >
              {socialStats.like_count}{" "}
              {socialStats.like_count === 1 ? "Like" : "Likes"}
            </Button>
          </motion.div>

          <Button
            startContent={<MessageCircle size={18} />}
            variant="flat"
            onPress={() => setShowCommentsPanel(!showCommentsPanel)}
          >
            {socialStats.comment_count} Comments
          </Button>

          <Button
            color={isBookmarked ? "secondary" : "default"}
            startContent={
              <Bookmark
                fill={isBookmarked ? "currentColor" : "none"}
                size={18}
              />
            }
            variant="flat"
            onPress={handleBookmark}
          >
            Save
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {showSharing && (
            <div className="relative">
              <Button
                startContent={<Share2 size={18} />}
                variant="flat"
                onPress={() => setShowShareMenu(!showShareMenu)}
              >
                Share
              </Button>

              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute right-0 top-full mt-2 z-50"
                    exit={{ opacity: 0, scale: 0.95 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                  >
                    <GlassmorphicCard {...GameGenCardPresets.modalCard}>
                      <div className="p-4 space-y-2 min-w-48">
                        <Button
                          className="w-full justify-start"
                          startContent={<Copy size={16} />}
                          variant="flat"
                          onPress={handleCopyLink}
                        >
                          Copy Link
                        </Button>
                        <SocialShareButton game={game} platform="twitter" />
                        <SocialShareButton game={game} platform="facebook" />
                        <SocialShareButton game={game} platform="discord" />
                        <Divider />
                        <Button
                          className="w-full justify-start"
                          color="warning"
                          size="sm"
                          startContent={<Flag size={16} />}
                          variant="flat"
                        >
                          Report Content
                        </Button>
                      </div>
                    </GlassmorphicCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <Button
            isIconOnly
            startContent={<MoreHorizontal size={18} />}
            variant="flat"
          />
        </div>
      </div>

      {/* Game Stats */}
      <div className="flex items-center gap-4 text-sm text-foreground/70">
        <div className="flex items-center gap-1">
          <span>Plays:</span>
          <span className="font-semibold">
            {game.play_count?.toLocaleString() || 0}
          </span>
        </div>

        {socialStats.fork_count > 0 && (
          <div className="flex items-center gap-1">
            <span>Remixes:</span>
            <span className="font-semibold">
              {socialStats.fork_count.toLocaleString()}
            </span>
          </div>
        )}

        {showRating && socialStats.rating_count > 0 && (
          <div className="flex items-center gap-1">
            <span>Rating:</span>
            <span className="font-semibold">
              {socialStats.rating_average.toFixed(1)}/5
            </span>
            <span className="text-foreground/50">
              ({socialStats.rating_count})
            </span>
          </div>
        )}
      </div>

      {/* Rating Component */}
      {showRating && currentUserId && !isOwnGame && (
        <GameRating
          currentRating={socialStats.rating_average}
          currentUserId={currentUserId}
          gameId={game.id}
          totalRatings={socialStats.rating_count}
          onRatingChange={(newAvg, newCount) => {
            setSocialStats((prev) => ({
              ...prev,
              rating_average: newAvg,
              rating_count: newCount,
            }));
          }}
        />
      )}
    </div>
  );

  const getCardProps = () => {
    switch (variant) {
      case "compact":
        return GameGenCardPresets.chatPanel;
      case "embedded":
        return { ...GameGenCardPresets.chatPanel, hover: false };
      case "floating":
        return GameGenCardPresets.floatingPanel;
      default:
        return GameGenCardPresets.gameCard;
    }
  };

  return (
    <div className={className}>
      <GlassmorphicCard {...getCardProps()}>
        <div className="p-6">
          {variant === "compact" ? renderCompactView() : renderDefaultView()}
        </div>
      </GlassmorphicCard>

      {/* Comments Panel */}
      <AnimatePresence>
        {showCommentsPanel && showComments && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden mt-4"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <GameComments
              currentUserId={currentUserId}
              gameId={game.id}
              onCommentCount={(count) => {
                setSocialStats((prev) => ({ ...prev, comment_count: count }));
                onComment?.(count);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
