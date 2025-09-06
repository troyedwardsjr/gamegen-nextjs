"use client";

import React, { useState, useEffect } from "react";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
import { Spinner } from "@heroui/spinner";
import { motion } from "framer-motion";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";
import { UserStats } from "./UserStats";
import { FollowButton } from "./FollowButton";
import { GameGrid } from "../game/GameGrid";
import { AchievementBadge } from "../achievements/AchievementBadge";
import { CalendarDays, MapPin, Link as LinkIcon, Trophy, Users, GamepadIcon, Star } from "lucide-react";
import { Database } from "@/lib/supabase/database.types";
import { UserSocialStats, UserAchievement } from "@/src/types/social";
import { createClient } from "@/lib/supabase/client";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Game = Database["public"]["Tables"]["games"]["Row"];

interface UserProfileProps {
  userId: string;
  currentUserId?: string;
  profile?: Profile;
  className?: string;
}

export function UserProfile({ userId, currentUserId, profile, className }: UserProfileProps) {
  const [profileData, setProfileData] = useState<Profile | null>(profile || null);
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
  const [loading, setLoading] = useState(!profile);
  const [activeTab, setActiveTab] = useState("games");
  const [isFollowing, setIsFollowing] = useState(false);

  const supabase = createClient();
  const isOwnProfile = currentUserId === userId;

  useEffect(() => {
    fetchProfileData();
  }, [userId]);

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
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        
        if (profileData) setProfileData(profileData);
      }

      // Fetch user games
      const { data: gamesData } = await supabase
        .from("games")
        .select(`
          id,
          title,
          description,
          thumbnail_url,
          created_at,
          is_published,
          play_count,
          like_count,
          fork_count,
          tags
        `)
        .eq("creator_id", userId)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(12);

      if (gamesData) setGames(gamesData);

      // Fetch user achievements (featured ones for profile display)
      const { data: achievementsData } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievements:achievement_id (
            name,
            description,
            icon_url,
            badge_color,
            rarity,
            points
          )
        `)
        .eq("user_id", userId)
        .eq("is_featured", true)
        .eq("is_public", true)
        .limit(6);

      if (achievementsData) setAchievements(achievementsData);

      // Fetch social stats
      const statsPromises = [
        supabase.from("user_follows").select("id", { count: "exact" }).eq("following_id", userId),
        supabase.from("user_follows").select("id", { count: "exact" }).eq("follower_id", userId),
        supabase.from("games").select("id", { count: "exact" }).eq("creator_id", userId).eq("is_published", true),
        supabase.from("user_achievements").select("id", { count: "exact" }).eq("user_id", userId),
      ];

      const [followersResult, followingResult, gamesResult, achievementsResult] = await Promise.all(statsPromises);

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
    setSocialStats(prev => ({
      ...prev,
      followers_count: prev.followers_count + (following ? 1 : -1)
    }));
  };

  if (loading) {
    return (
      <GlassmorphicCard {...GameGenCardPresets.floatingPanel} className={className}>
        <CardBody className="flex items-center justify-center py-12">
          <Spinner size="lg" color="secondary" />
          <p className="mt-4 text-foreground/70">Loading profile...</p>
        </CardBody>
      </GlassmorphicCard>
    );
  }

  if (!profileData) {
    return (
      <GlassmorphicCard {...GameGenCardPresets.floatingPanel} className={className}>
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
                src={profileData.avatar_url || undefined}
                name={profileData.display_name || profileData.username || "User"}
                size="lg"
                className="w-24 h-24 text-large"
                isBordered
                color="secondary"
              />
              
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    {profileData.display_name || profileData.username}
                  </h1>
                  {profileData.display_name && (
                    <p className="text-foreground/60">@{profileData.username}</p>
                  )}
                </div>
                
                {profileData.bio && (
                  <p className="text-foreground/80 mb-4 max-w-md">{profileData.bio}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-foreground/60">
                  {profileData.location && (
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      {profileData.location}
                    </div>
                  )}
                  {profileData.website && (
                    <a
                      href={profileData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-secondary-500 transition-colors"
                    >
                      <LinkIcon size={14} />
                      Website
                    </a>
                  )}
                  <div className="flex items-center gap-1">
                    <CalendarDays size={14} />
                    Joined {new Date(profileData.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {!isOwnProfile && currentUserId && (
                <FollowButton
                  targetUserId={userId}
                  currentUserId={currentUserId}
                  isFollowing={isFollowing}
                  onFollowChange={handleFollowChange}
                />
              )}
              {isOwnProfile && (
                <Button 
                  variant="flat" 
                  color="secondary"
                  startContent={<LinkIcon size={16} />}
                  href="/settings/profile"
                  as="a"
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
                <Trophy size={20} className="text-secondary-500" />
                Featured Achievements
              </h3>
              <div className="flex flex-wrap gap-2">
                {achievements.map((userAchievement) => (
                  <AchievementBadge
                    key={userAchievement.id}
                    achievement={userAchievement.achievements}
                    size="sm"
                    showTooltip
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
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(key as string)}
            color="secondary"
            variant="underlined"
            classNames={{
              tabList: "gap-6 w-full",
              cursor: "w-full bg-secondary-500",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-secondary-500"
            }}
          >
            <Tab
              key="games"
              title={
                <div className="flex items-center gap-2">
                  <GamepadIcon size={16} />
                  <span>Games</span>
                  <Chip size="sm" variant="flat" color="secondary">
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
                  <Chip size="sm" variant="flat" color="secondary">
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
                  <Chip size="sm" variant="flat" color="secondary">
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
                <GameGrid games={games} />
              ) : (
                <div className="text-center py-12">
                  <GamepadIcon size={48} className="mx-auto text-foreground/30 mb-4" />
                  <p className="text-foreground/70">
                    {isOwnProfile ? "You haven't published any games yet" : "No games published yet"}
                  </p>
                  {isOwnProfile && (
                    <Button
                      as="a"
                      href="/game-creator"
                      color="secondary"
                      variant="flat"
                      className="mt-4"
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <GlassmorphicCard {...GameGenCardPresets.gameCard} className="text-center">
                        <CardBody className="p-4">
                          <AchievementBadge
                            achievement={userAchievement.achievements}
                            size="lg"
                            className="mx-auto mb-3"
                          />
                          <p className="text-sm text-foreground/70">
                            Unlocked {new Date(userAchievement.unlocked_at).toLocaleDateString()}
                          </p>
                        </CardBody>
                      </GlassmorphicCard>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy size={48} className="mx-auto text-foreground/30 mb-4" />
                  <p className="text-foreground/70">
                    {isOwnProfile ? "Start creating games to unlock achievements!" : "No public achievements yet"}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "following" && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-foreground/30 mb-4" />
              <p className="text-foreground/70">Following list coming soon!</p>
            </div>
          )}
        </CardBody>
      </GlassmorphicCard>
    </div>
  );
}