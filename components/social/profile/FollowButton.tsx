"use client";

import React, { useState } from "react";
import { Button } from "@heroui/button";
import { UserPlus, UserCheck, UserMinus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";

interface FollowButtonProps {
  targetUserId: string;
  currentUserId: string;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: "sm" | "md" | "lg";
  variant?:
    | "solid"
    | "flat"
    | "bordered"
    | "light"
    | "faded"
    | "shadow"
    | "ghost";
  className?: string;
}

export function FollowButton({
  targetUserId,
  currentUserId,
  isFollowing: initialIsFollowing,
  onFollowChange,
  size = "md",
  variant = "solid",
  className,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const supabase = createClient();

  const handleFollow = async () => {
    if (isLoading || currentUserId === targetUserId) return;

    setIsLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);

        if (error) throw error;

        setIsFollowing(false);
        onFollowChange?.(false);
        toast.success("Unfollowed successfully");

        // Create unfollow activity
        await supabase.from("activities").insert({
          user_id: currentUserId,
          activity_type: "user_followed",
          target_user_id: targetUserId,
          activity_data: { action: "unfollow" },
          visibility: "private",
        });
      } else {
        // Follow
        const { error } = await supabase.from("user_follows").insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        });

        if (error) throw error;

        setIsFollowing(true);
        onFollowChange?.(true);
        toast.success("Following successfully");

        // Create follow activity
        await supabase.from("activities").insert({
          user_id: currentUserId,
          activity_type: "user_followed",
          target_user_id: targetUserId,
          activity_data: { action: "follow" },
          visibility: "followers",
        });

        // Create notification for the followed user
        const { data: followerProfile } = await supabase
          .from("profiles")
          .select("username, display_name")
          .eq("id", currentUserId)
          .single();

        if (followerProfile) {
          await supabase.from("notifications").insert({
            recipient_id: targetUserId,
            sender_id: currentUserId,
            notification_type: "follow",
            title: "New Follower",
            content: `${followerProfile.display_name || followerProfile.username} is now following you`,
            action_url: `/profile/${currentUserId}`,
            notification_data: {
              follower_username: followerProfile.username,
              follower_display_name: followerProfile.display_name,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
      toast.error(isFollowing ? "Failed to unfollow" : "Failed to follow");
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="animate-spin" size={16} />
          <span>{isFollowing ? "Unfollowing..." : "Following..."}</span>
        </>
      );
    }

    if (isFollowing) {
      if (isHovered) {
        return (
          <>
            <UserMinus size={16} />
            <span>Unfollow</span>
          </>
        );
      }

      return (
        <>
          <UserCheck size={16} />
          <span>Following</span>
        </>
      );
    }

    return (
      <>
        <UserPlus size={16} />
        <span>Follow</span>
      </>
    );
  };

  const getButtonColor = () => {
    if (isFollowing) {
      return isHovered ? "danger" : "success";
    }

    return "secondary";
  };

  const getButtonVariant = () => {
    if (isFollowing && !isHovered) {
      return variant === "solid" ? "flat" : variant;
    }

    return variant;
  };

  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        className={`
          transition-all duration-200
          ${isFollowing && isHovered ? "border-danger-500 text-danger-500" : ""}
          ${isFollowing && !isHovered ? "border-success-500/50" : ""}
        `}
        color={getButtonColor() as any}
        isDisabled={currentUserId === targetUserId}
        isLoading={isLoading}
        size={size}
        startContent={!isLoading && getButtonContent().props.children[0]}
        variant={getButtonVariant() as any}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onPress={handleFollow}
      >
        {getButtonContent().props.children[1]}
      </Button>
    </motion.div>
  );
}

// Compact version for use in lists or cards
interface CompactFollowButtonProps extends Omit<FollowButtonProps, "size"> {
  showLabel?: boolean;
}

export function CompactFollowButton({
  showLabel = false,
  ...props
}: CompactFollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(props.isFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowChange = (following: boolean) => {
    setIsFollowing(following);
    props.onFollowChange?.(following);
  };

  return (
    <FollowButton
      {...props}
      className="min-w-fit"
      isFollowing={isFollowing}
      size="sm"
      variant="flat"
      onFollowChange={handleFollowChange}
    />
  );
}

// Bulk follow button for managing multiple follows
interface BulkFollowButtonProps {
  userIds: string[];
  currentUserId: string;
  onBulkFollowChange?: (followedCount: number) => void;
  className?: string;
}

export function BulkFollowButton({
  userIds,
  currentUserId,
  onBulkFollowChange,
  className,
}: BulkFollowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [followedCount, setFollowedCount] = useState(0);

  const handleBulkFollow = async () => {
    if (isLoading || userIds.length === 0) return;

    setIsLoading(true);
    let successCount = 0;

    try {
      const supabase = createClient();

      // Filter out current user and create follow records
      const validUserIds = userIds.filter((id) => id !== currentUserId);

      const followRecords = validUserIds.map((targetUserId) => ({
        follower_id: currentUserId,
        following_id: targetUserId,
      }));

      const { data, error } = await supabase
        .from("user_follows")
        .upsert(followRecords, { onConflict: "follower_id,following_id" })
        .select();

      if (error) throw error;

      successCount = data?.length || 0;
      setFollowedCount(successCount);
      onBulkFollowChange?.(successCount);

      toast.success(
        `Started following ${successCount} creator${successCount === 1 ? "" : "s"}`,
      );
    } catch (error) {
      console.error("Error bulk following users:", error);
      toast.error("Failed to follow some users");
    } finally {
      setIsLoading(false);
    }
  };

  if (userIds.length === 0 || userIds.every((id) => id === currentUserId)) {
    return null;
  }

  return (
    <Button
      className={className}
      color="secondary"
      isLoading={isLoading}
      size="md"
      startContent={!isLoading && <UserPlus size={16} />}
      variant="flat"
      onPress={handleBulkFollow}
    >
      {isLoading ? "Following..." : `Follow All (${userIds.length})`}
    </Button>
  );
}
