"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Textarea } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { motion } from "framer-motion";
import { Star, MessageSquare, ThumbsUp, Edit3 } from "lucide-react";
import { toast } from "sonner";

import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";
import { createClient } from "@/lib/supabase/client";

interface GameRatingProps {
  gameId: string;
  currentUserId: string;
  currentRating?: number;
  totalRatings?: number;
  showReviews?: boolean;
  variant?: "default" | "compact" | "inline";
  className?: string;
  onRatingChange?: (newAverage: number, newCount: number) => void;
}

interface Rating {
  id: string;
  user_id: string;
  rating: number;
  review?: string | null;
  created_at: string;
  updated_at: string;
  user_profile?: {
    username: string;
    display_name?: string | null;
    avatar_url?: string | null;
  };
}

export function GameRating({
  gameId,
  currentUserId,
  currentRating = 0,
  totalRatings = 0,
  showReviews = true,
  variant = "default",
  className,
  onRatingChange,
}: GameRatingProps) {
  const [userRating, setUserRating] = useState<number>(0);
  const [userReview, setUserReview] = useState<string>("");
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasUserRated, setHasUserRated] = useState(false);
  const [averageRating, setAverageRating] = useState(currentRating);
  const [ratingCount, setRatingCount] = useState(totalRatings);

  const supabase = createClient();

  useEffect(() => {
    fetchUserRating();
    if (showReviews) {
      fetchRatings();
    }
  }, [gameId, currentUserId]);

  const fetchUserRating = async () => {
    try {
      const { data, error } = await supabase
        .from("game_ratings")
        .select("rating, review")
        .eq("game_id", gameId)
        .eq("user_id", currentUserId)
        .single();

      if (data && !error) {
        setUserRating(data.rating);
        setUserReview(data.review || "");
        setHasUserRated(true);
      }
    } catch (error) {
      // User hasn't rated yet
    }
  };

  const fetchRatings = async () => {
    try {
      const { data, error } = await supabase
        .from("game_ratings")
        .select(
          `
          id,
          user_id,
          rating,
          review,
          created_at,
          updated_at,
          profiles!inner (
            username,
            display_name,
            avatar_url
          )
        `,
        )
        .eq("game_id", gameId)
        .not("review", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (data && !error) {
        const ratingsWithProfiles = data.map((rating) => ({
          ...rating,
          user_profile: rating.profiles,
        }));

        setRatings(ratingsWithProfiles as Rating[]);
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  const submitRating = async () => {
    if (!userRating) {
      toast.error("Please select a rating");

      return;
    }

    setIsLoading(true);

    try {
      const ratingData = {
        game_id: gameId,
        user_id: currentUserId,
        rating: userRating,
        review: userReview.trim() || null,
      };

      let result;

      if (hasUserRated) {
        // Update existing rating
        result = await supabase
          .from("game_ratings")
          .update(ratingData)
          .eq("game_id", gameId)
          .eq("user_id", currentUserId);
      } else {
        // Insert new rating
        result = await supabase.from("game_ratings").insert(ratingData);
      }

      if (result.error) throw result.error;

      // Recalculate average rating
      const { data: allRatings } = await supabase
        .from("game_ratings")
        .select("rating")
        .eq("game_id", gameId);

      if (allRatings) {
        const newAverage =
          allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
        const newCount = allRatings.length;

        setAverageRating(newAverage);
        setRatingCount(newCount);
        setHasUserRated(true);
        onRatingChange?.(newAverage, newCount);
      }

      // Create activity
      await supabase.from("activities").insert({
        user_id: currentUserId,
        activity_type: hasUserRated ? "game_rating_updated" : "game_rated",
        target_game_id: gameId,
        activity_data: {
          game_id: gameId,
          rating: userRating,
          has_review: !!userReview.trim(),
        },
        visibility: "public",
      });

      setShowRatingModal(false);
      toast.success(hasUserRated ? "Rating updated!" : "Rating submitted!");

      if (showReviews) {
        fetchRatings();
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (
    rating: number,
    size: number = 20,
    interactive: boolean = false,
    showValue: boolean = false,
  ) => {
    return (
      <div className="flex items-center gap-1">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-all`}
              disabled={!interactive}
              type="button"
              whileHover={interactive ? { scale: 1.1 } : {}}
              whileTap={interactive ? { scale: 0.95 } : {}}
              onClick={() => interactive && setUserRating(star)}
              onMouseEnter={() => interactive && setHoverRating(star)}
              onMouseLeave={() => interactive && setHoverRating(0)}
            >
              <Star
                className={`transition-colors ${
                  star <= (interactive ? hoverRating || userRating : rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-400"
                }`}
                size={size}
              />
            </motion.button>
          ))}
        </div>
        {showValue && (
          <span className="text-sm text-foreground/70 ml-2">
            {rating.toFixed(1)} ({ratingCount}{" "}
            {ratingCount === 1 ? "rating" : "ratings"})
          </span>
        )}
      </div>
    );
  };

  const renderCompactView = () => (
    <div className="flex items-center gap-2">
      {renderStars(averageRating, 16, false, true)}
      <Button
        size="sm"
        startContent={hasUserRated ? <Edit3 size={14} /> : <Star size={14} />}
        variant="flat"
        onPress={() => setShowRatingModal(true)}
      >
        {hasUserRated ? "Update" : "Rate"}
      </Button>
    </div>
  );

  const renderInlineView = () => (
    <div className="flex items-center justify-between">
      {renderStars(averageRating, 18, false, true)}
      <Button
        color={hasUserRated ? "default" : "primary"}
        size="sm"
        startContent={hasUserRated ? <Edit3 size={16} /> : <Star size={16} />}
        variant={hasUserRated ? "flat" : "solid"}
        onPress={() => setShowRatingModal(true)}
      >
        {hasUserRated ? "Update Rating" : "Rate Game"}
      </Button>
    </div>
  );

  const renderDefaultView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {renderStars(averageRating, 24, false)}
            <span className="text-lg font-semibold">
              {averageRating.toFixed(1)}/5
            </span>
          </div>
          <p className="text-sm text-foreground/70">
            Based on {ratingCount} {ratingCount === 1 ? "rating" : "ratings"}
          </p>
        </div>

        <Button
          color={hasUserRated ? "secondary" : "primary"}
          startContent={hasUserRated ? <Edit3 size={18} /> : <Star size={18} />}
          variant={hasUserRated ? "flat" : "solid"}
          onPress={() => setShowRatingModal(true)}
        >
          {hasUserRated ? "Update Rating" : "Rate This Game"}
        </Button>
      </div>

      {/* Reviews */}
      {showReviews && ratings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare size={18} />
            Reviews
          </h4>

          <div className="space-y-3">
            {ratings.map((rating) => (
              <GlassmorphicCard
                key={rating.id}
                {...GameGenCardPresets.chatPanel}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold text-sm">
                        {(
                          rating.user_profile?.display_name ||
                          rating.user_profile?.username
                        )
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">
                          {rating.user_profile?.display_name ||
                            rating.user_profile?.username}
                        </p>
                        <p className="text-xs text-foreground/60">
                          {new Date(rating.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {renderStars(rating.rating, 16, false)}
                  </div>

                  {rating.review && (
                    <p className="text-foreground/80">{rating.review}</p>
                  )}
                </div>
              </GlassmorphicCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className={className}>
        {variant === "compact" && renderCompactView()}
        {variant === "inline" && renderInlineView()}
        {variant === "default" && renderDefaultView()}
      </div>

      {/* Rating Modal */}
      <Modal
        backdrop="blur"
        classNames={{
          base: "bg-transparent",
          backdrop: "bg-black/50",
        }}
        isOpen={showRatingModal}
        size="lg"
        onClose={() => setShowRatingModal(false)}
      >
        <ModalContent>
          <GlassmorphicCard {...GameGenCardPresets.modalCard}>
            <ModalHeader className="flex flex-col gap-1">
              {hasUserRated ? "Update Your Rating" : "Rate This Game"}
            </ModalHeader>

            <ModalBody>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-foreground/70 mb-4">
                    How would you rate this game?
                  </p>
                  {renderStars(userRating, 32, true)}
                  {userRating > 0 && (
                    <motion.p
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-sm text-foreground/60"
                      initial={{ opacity: 0, y: 10 }}
                    >
                      {userRating === 1 && "Poor"}
                      {userRating === 2 && "Fair"}
                      {userRating === 3 && "Good"}
                      {userRating === 4 && "Great"}
                      {userRating === 5 && "Excellent"}
                    </motion.p>
                  )}
                </div>

                <Textarea
                  classNames={{
                    base: "max-w-full",
                    input: "resize-y min-h-[80px]",
                  }}
                  label="Write a review (optional)"
                  maxRows={4}
                  placeholder="Share your thoughts about this game..."
                  value={userReview}
                  onValueChange={setUserReview}
                />
              </div>
            </ModalBody>

            <ModalFooter>
              <Button variant="flat" onPress={() => setShowRatingModal(false)}>
                Cancel
              </Button>
              <Button
                color="primary"
                isDisabled={!userRating}
                isLoading={isLoading}
                startContent={!isLoading && <ThumbsUp size={16} />}
                onPress={submitRating}
              >
                {hasUserRated ? "Update Rating" : "Submit Rating"}
              </Button>
            </ModalFooter>
          </GlassmorphicCard>
        </ModalContent>
      </Modal>
    </>
  );
}

export default GameRating;
