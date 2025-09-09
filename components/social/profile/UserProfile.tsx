"use client";

import React, { useState, useEffect } from "react";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
import { Spinner } from "@heroui/spinner";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Link as LinkIcon,
  Trophy,
  Users,
  GamepadIcon,
} from "lucide-react";

import { GameGrid } from "../game/GameGrid";
import { AchievementBadge } from "../achievements/AchievementBadge";

import { UserStats } from "./UserStats";
import { FollowButton } from "./FollowButton";

import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";
import { Database } from "@/lib/supabase/database.types";
import { UserSocialStats, UserAchievement } from "@/src/types/social";
import { createClient } from "@/lib/supabase/client";
import { useUserSocialStats } from "@/hooks/useSocialRealtime";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Game = Database["public"]["Tables"]["games"]["Row"];

interface UserProfileProps {
  userId: string;
  currentUserId?: string;
  profile?: Profile;
  className?: string;
}

export function UserProfile({
  userId,
  currentUserId,
  profile,
  className,
}: UserProfileProps) {
  const [profileData, setProfileData] = useState<Profile | null>(
    profile || null,
  );
  const [games, setGames] = useState<Game[]>([]);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [socialStats, setSocialStats] = useState<UserSocialStats>({
    followers_count: 0,
    following_count: 0,
    total_likes_received: 0,
    total_achievements: 0,
    games_created: 0,
    challenges_completed: 0,
  });

  // Use real-time social stats hook
  const { stats: realtimeStats, loading: statsLoading } = useUserSocialStats(userId);
  const [loading, setLoading] = useState(!profile);
  const [activeTab, setActiveTab] = useState("games");
  const [isFollowing, setIsFollowing] = useState(false);

  const supabase = createClient();
  const isOwnProfile = currentUserId === userId;

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

  // Update social stats when real-time stats change
  useEffect(() => {
    if (!statsLoading && realtimeStats) {
      setSocialStats(prev => ({
        ...prev,
        followers_count: realtimeStats.followersCount,
        following_count: realtimeStats.followingCount,
        total_likes_received: realtimeStats.totalLikesReceived,
        total_achievements: realtimeStats.totalAchievements,
        games_created: realtimeStats.gamesCreated,
        challenges_completed: 0, // This would need to be added to the hook
      }));
    }
  }, [realtimeStats, statsLoading]);

  const fetchProfileData = async () => {
    if (profile) {
      setProfileData(profile);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      // Fetch profile if not provided
      if (!profile) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError) {
          // If profile doesn't exist (new user), create a default profile object
          if (profileError.code === 'PGRST116') {
            console.info(`No profile found for user ${userId}, this is normal for new users`);
            // Set a minimal profile data for new users
            setProfileData({
              id: userId,
              username: null,
              display_name: null,
              bio: null,
              avatar_url: null,
              website_url: null,
              social_links: null,
              subscription_tier: 'free',
              subscription_status: 'active',
              subscription_ends_at: null,
              stripe_customer_id: null,
              credits_remaining: 100,
              credits_used_today: 0,
              credits_reset_date: new Date().toISOString().split('T')[0],
              preferences: {
                ai: { content_filter: "moderate", generation_style: "balanced" },
                theme: "system",
                editor: { show_fps: false, auto_save: true, grid_snap: true },
                notifications: { push: false, email: true, follows: true, comments: true }
              },
              is_verified: false,
              is_educator: false,
              last_active_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            } as Profile);
          } else {
            // For other errors, log them but don't show error to user
            console.error("Profile fetch error:", profileError);
          }
        } else if (profileData) {
          setProfileData(profileData);
        }
      }

      // Fetch user games
      const { data: gamesData } = await supabase
        .from("games")
        .select("*")
        .eq("creator_id", userId)
        .eq("visibility", "public")
        .not("published_at", "is", null)
        .order("created_at", { ascending: false })
        .limit(12);

      if (gamesData) setGames(gamesData);

      // Fetch user achievements (featured ones for profile display)
      const { data: achievementsData } = await (supabase as any)
        .from("user_achievements")
        .select(
          `
          *,
          achievements:achievement_id (
            name,
            description,
            icon_url,
            badge_color,
            rarity,
            points
          )
        `,
        )
        .eq("user_id", userId)
        .eq("is_featured", true)
        .eq("is_public", true)
        .limit(6);

      if (achievementsData) setAchievements(achievementsData);

      // Fetch social stats
      const statsPromises = [
        supabase
          .from("user_follows")
          .select("id", { count: "exact" })
          .eq("following_id", userId),
        supabase
          .from("user_follows")
          .select("id", { count: "exact" })
          .eq("follower_id", userId),
        supabase
          .from("games")
          .select("id", { count: "exact" })
          .eq("creator_id", userId)
          .eq("visibility", "public"),
        (supabase as any)
          .from("user_achievements")
          .select("id", { count: "exact" })
          .eq("user_id", userId),
      ];

      const [
        followersResult,
        followingResult,
        gamesResult,
        achievementsResult,
      ] = await Promise.all(statsPromises);

      setSocialStats({
        followers_count: followersResult.count || 0,
        following_count: followingResult.count || 0,
        total_likes_received: 0, // This would need a more complex query
        total_achievements: achievementsResult.count || 0,
        games_created: gamesResult.count || 0,
        challenges_completed: 0, // This would need a challenge participants query
      });

      // Check if current user is following this profile
      if (currentUserId && !isOwnProfile) {
        const { data: followData } = await supabase
          .from("user_follows")
          .select("id")
          .eq("follower_id", currentUserId)
          .eq("following_id", userId)
          .single();

        setIsFollowing(!!followData);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (following: boolean) => {
    setIsFollowing(following);
    setSocialStats((prev) => ({
      ...prev,
      followers_count: prev.followers_count + (following ? 1 : -1),
    }));
  };

  if (loading) {
    return (
      <GlassmorphicCard
        {...GameGenCardPresets.floatingPanel}
        className={className}
      >
        <CardBody className="flex items-center justify-center py-12">
          <Spinner color="secondary" size="lg" />
          <p className="mt-4 text-foreground/70">Loading profile...</p>
        </CardBody>
      </GlassmorphicCard>
    );
  }

  if (!profileData) {
    return (
      <GlassmorphicCard
        {...GameGenCardPresets.floatingPanel}
        className={className}
      >
        <CardBody className="flex items-center justify-center py-12">
          <p className="text-foreground/70">Profile not found</p>
        </CardBody>
      </GlassmorphicCard>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Header */}
      <GlassmorphicCard {...GameGenCardPresets.heroCard}>
        <CardBody className="p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 flex-1">
              <Avatar
                isBordered
                className="w-24 h-24 text-large"
                color="secondary"
                name={
                  profileData.display_name || profileData.username || "User"
                }
                size="lg"
                src={profileData.avatar_url || undefined}
              />

              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    {profileData.display_name || profileData.username}
                  </h1>
                  {profileData.display_name && (
                    <p className="text-foreground/60">
                      @{profileData.username}
                    </p>
                  )}
                </div>

                {profileData.bio && (
                  <p className="text-foreground/80 mb-4 max-w-md">
                    {profileData.bio}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/60">
                  {profileData.website_url && (
                    <a
                      className="flex items-center gap-1 hover:text-secondary-500 transition-colors"
                      href={profileData.website_url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <LinkIcon size={14} />
                      Website
                    </a>
                  )}
                  <div className="flex items-center gap-1">
                    <CalendarDays size={14} />
                    Joined{" "}
                    {new Date(profileData.created_at || new Date()).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                      },
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {!isOwnProfile && currentUserId && (
                <FollowButton
                  currentUserId={currentUserId}
                  isFollowing={isFollowing}
                  targetUserId={userId}
                  onFollowChange={handleFollowChange}
                />
              )}
              {isOwnProfile && (
                <Button
                  as="a"
                  color="secondary"
                  href="/settings"
                  startContent={<LinkIcon size={16} />}
                  variant="flat"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>

          {/* Social Stats */}
          <div className="mt-8 pt-6 border-t border-divider">
            <UserStats stats={socialStats} />
          </div>

          {/* Featured Achievements */}
          {achievements.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Trophy className="text-secondary-500" size={20} />
                Featured Achievements
              </h3>
              <div className="flex flex-wrap gap-2">
                {achievements.map((userAchievement) => (
                  <AchievementBadge
                    key={userAchievement.id}
                    achievement={userAchievement.achievement_id as any}
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </GlassmorphicCard>

      {/* Profile Content Tabs */}
      <GlassmorphicCard {...GameGenCardPresets.floatingPanel}>
        <CardHeader className="pb-0">
          <Tabs
            classNames={{
              tabList: "gap-6 w-full",
              cursor: "w-full bg-secondary-500",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-secondary-500",
            }}
            color="secondary"
            selectedKey={activeTab}
            variant="underlined"
            onSelectionChange={(key) => setActiveTab(key as string)}
          >
            <Tab
              key="games"
              title={
                <div className="flex items-center gap-2">
                  <GamepadIcon size={16} />
                  <span>Games</span>
                  <Chip color="secondary" size="sm" variant="flat">
                    {games.length}
                  </Chip>
                </div>
              }
            />
            <Tab
              key="achievements"
              title={
                <div className="flex items-center gap-2">
                  <Trophy size={16} />
                  <span>Achievements</span>
                  <Chip color="secondary" size="sm" variant="flat">
                    {socialStats.total_achievements}
                  </Chip>
                </div>
              }
            />
            <Tab
              key="following"
              title={
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>Following</span>
                  <Chip color="secondary" size="sm" variant="flat">
                    {socialStats.following_count}
                  </Chip>
                </div>
              }
            />
          </Tabs>
        </CardHeader>

        <CardBody className="pt-6">
          {activeTab === "games" && (
            <div>
              {games.length > 0 ? (
                <GameGrid initialGames={games} />
              ) : (
                <div className="text-center py-12">
                  <GamepadIcon
                    className="mx-auto text-foreground/30 mb-4"
                    size={48}
                  />
                  <p className="text-foreground/70">
                    {isOwnProfile
                      ? "You haven't published any games yet"
                      : "No games published yet"}
                  </p>
                  {isOwnProfile && (
                    <Button
                      as="a"
                      className="mt-4"
                      color="secondary"
                      href="/game-creator"
                      variant="flat"
                    >
                      Create Your First Game
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "achievements" && (
            <div>
              {achievements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((userAchievement) => (
                    <motion.div
                      key={userAchievement.id}
                      animate={{ opacity: 1, y: 0 }}
                      initial={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <GlassmorphicCard
                        {...GameGenCardPresets.gameCard}
                        className="text-center"
                      >
                        <CardBody className="p-4">
                          <AchievementBadge
                            achievement={userAchievement.achievement_id as any}
                            className="mx-auto mb-3"
                            size="lg"
                          />
                          <p className="text-sm text-foreground/70">
                            Unlocked{" "}
                            {new Date(
                              userAchievement.unlocked_at,
                            ).toLocaleDateString()}
                          </p>
                        </CardBody>
                      </GlassmorphicCard>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy
                    className="mx-auto text-foreground/30 mb-4"
                    size={48}
                  />
                  <p className="text-foreground/70">
                    {isOwnProfile
                      ? "Start creating games to unlock achievements!"
                      : "No public achievements yet"}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "following" && (
            <div className="text-center py-12">
              <Users className="mx-auto text-foreground/30 mb-4" size={48} />
              <p className="text-foreground/70">Following list coming soon!</p>
            </div>
          )}
        </CardBody>
      </GlassmorphicCard>
    </div>
  );
}
