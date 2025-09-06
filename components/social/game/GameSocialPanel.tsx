"use client";

import React, { useState, useEffect } from "react";
import { Button, Chip, Divider, Tooltip } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal,
  Flag,
  Copy,
  ExternalLink,
  Download,
  Code
} from "lucide-react";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";
import { SocialShareButton } from "./SocialShareButton";
import { GameRating } from "./GameRating";
import { GameComments } from "./GameComments";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { GameSocialStats } from "@/src/types/social";
import { toast } from "sonner";

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
          .single()
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
        
        supabase
          .from("game_ratings")
          .select("rating")
          .eq("game_id", game.id)
      ]);

      const commentCount = commentsResult.count || 0;
      const ratings = ratingsResult.data || [];
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;

      setSocialStats(prev => ({
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
    setSocialStats(prev => ({ ...prev, like_count: optimisticCount }));
    onLike?.(newLikedState, optimisticCount);

    try {
      if (newLikedState) {
        // Add like
        const { error } = await supabase
          .from("game_likes")
          .insert({
            game_id: game.id,
            user_id: currentUserId,
          });

        if (error) throw error;

        // Create activity
        await supabase.from("activities").insert({
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
            await supabase.from("notifications").insert({
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
              }
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
      setSocialStats(prev => ({ ...prev, like_count: prev.like_count - (newLikedState ? 1 : -1) }));
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
      const text = `Check out "${game.title}" on GameGen! ${game.description || ''}`;
      
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
        size="sm"
        variant="flat"
        color={isLiked ? "danger" : "default"}
        startContent={<Heart size={16} fill={isLiked ? "currentColor" : "none"} />}
        onPress={handleLike}
      >
        {socialStats.like_count}
      </Button>
      
      <Button
        size="sm"
        variant="flat"
        startContent={<MessageCircle size={16} />}
        onPress={() => setShowCommentsPanel(!showCommentsPanel)}
      >
        {socialStats.comment_count}
      </Button>
      
      <Button
        size="sm"
        variant="flat"
        startContent={<Share2 size={16} />}
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
              variant={isLiked ? "solid" : "flat"}
              startContent={
                <motion.div
                  animate={isLiked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                </motion.div>
              }
              onPress={handleLike}
              isLoading={loading}
            >
              {socialStats.like_count} {socialStats.like_count === 1 ? 'Like' : 'Likes'}
            </Button>
          </motion.div>

          <Button
            variant="flat"
            startContent={<MessageCircle size={18} />}
            onPress={() => setShowCommentsPanel(!showCommentsPanel)}
          >
            {socialStats.comment_count} Comments
          </Button>

          <Button
            variant="flat"
            startContent={<Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />}
            onPress={handleBookmark}
            color={isBookmarked ? "secondary" : "default"}
          >
            Save
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {showSharing && (
            <div className="relative">
              <Button
                variant="flat"
                startContent={<Share2 size={18} />}
                onPress={() => setShowShareMenu(!showShareMenu)}
              >
                Share
              </Button>
              
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 z-50"
                  >
                    <GlassmorphicCard {...GameGenCardPresets.modalCard}>
                      <div className="p-4 space-y-2 min-w-48">
                        <Button
                          variant="flat"
                          startContent={<Copy size={16} />}
                          onPress={handleCopyLink}
                          className="w-full justify-start"
                        >
                          Copy Link
                        </Button>
                        <SocialShareButton platform="twitter" game={game} />
                        <SocialShareButton platform="facebook" game={game} />
                        <SocialShareButton platform="discord" game={game} />
                        <Divider />
                        <Button
                          variant="flat"
                          color="warning"
                          startContent={<Flag size={16} />}
                          className="w-full justify-start"
                          size="sm"
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
            variant="flat"
            isIconOnly
            startContent={<MoreHorizontal size={18} />}
          />
        </div>
      </div>

      {/* Game Stats */}
      <div className="flex items-center gap-4 text-sm text-foreground/70">
        <div className="flex items-center gap-1">
          <span>Plays:</span>
          <span className="font-semibold">{game.play_count?.toLocaleString() || 0}</span>
        </div>
        
        {socialStats.fork_count > 0 && (
          <div className="flex items-center gap-1">
            <span>Remixes:</span>
            <span className="font-semibold">{socialStats.fork_count.toLocaleString()}</span>
          </div>
        )}
        
        {showRating && socialStats.rating_count > 0 && (
          <div className="flex items-center gap-1">
            <span>Rating:</span>
            <span className="font-semibold">{socialStats.rating_average.toFixed(1)}/5</span>
            <span className="text-foreground/50">({socialStats.rating_count})</span>
          </div>
        )}
      </div>

      {/* Rating Component */}
      {showRating && currentUserId && !isOwnGame && (
        <GameRating
          gameId={game.id}
          currentUserId={currentUserId}
          currentRating={socialStats.rating_average}
          totalRatings={socialStats.rating_count}
          onRatingChange={(newAvg, newCount) => {
            setSocialStats(prev => ({
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mt-4"
          >
            <GameComments
              gameId={game.id}
              currentUserId={currentUserId}
              onCommentCount={(count) => {
                setSocialStats(prev => ({ ...prev, comment_count: count }));
                onComment?.(count);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}