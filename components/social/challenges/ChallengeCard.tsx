"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { motion } from "framer-motion";
import {
  Target,
  Calendar,
  Users,
  Trophy,
  Star,
  Zap,
  Crown,
  Medal,
  Play,
  Eye,
  ArrowRight,
  Timer,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";

import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";
import { createClient } from "@/lib/supabase/client";

type ChallengeType =
  | "creation"
  | "gameplay"
  | "community"
  | "educational"
  | "seasonal";
type ChallengeStatus = "upcoming" | "active" | "completed" | "ended";
type ChallengeDifficulty = "beginner" | "intermediate" | "advanced" | "expert";

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  status: ChallengeStatus;
  difficulty: ChallengeDifficulty;
  start_date: string;
  end_date: string;
  thumbnail_url?: string | null;
  prize_pool?: number;
  max_participants?: number;
  current_participants: number;
  rules: string[];
  submission_requirements: string[];
  judging_criteria: string[];
  created_by: string;
  creator_profile?: {
    username: string;
    display_name?: string | null;
    avatar_url?: string | null;
  };
  tags?: string[];
  featured?: boolean;
  metadata?: {
    submission_format?: string;
    theme?: string;
    target_audience?: string;
  };
}

interface ChallengeCardProps {
  challenge: Challenge;
  currentUserId?: string;
  variant?: "default" | "compact" | "featured" | "minimal";
  showActions?: boolean;
  showProgress?: boolean;
  className?: string;
  onClick?: (challenge: Challenge) => void;
  onJoin?: (challenge: Challenge) => void;
  onView?: (challenge: Challenge) => void;
}

const CHALLENGE_ICONS = {
  creation: Target,
  gameplay: Play,
  community: Users,
  educational: Star,
  seasonal: Crown,
};

const DIFFICULTY_CONFIG = {
  beginner: {
    color: "success",
    label: "Beginner",
    icon: Star,
  },
  intermediate: {
    color: "warning",
    label: "Intermediate",
    icon: Medal,
  },
  advanced: {
    color: "danger",
    label: "Advanced",
    icon: Trophy,
  },
  expert: {
    color: "secondary",
    label: "Expert",
    icon: Crown,
  },
};

const STATUS_CONFIG = {
  upcoming: {
    color: "default",
    label: "Coming Soon",
    bgColor: "bg-foreground/10",
  },
  active: {
    color: "success",
    label: "Active",
    bgColor: "bg-success/10",
  },
  completed: {
    color: "warning",
    label: "Completed",
    bgColor: "bg-primary/10",
  },
  ended: {
    color: "default",
    label: "Ended",
    bgColor: "bg-foreground/5",
  },
};

export function ChallengeCard({
  challenge,
  currentUserId,
  variant = "default",
  showActions = true,
  showProgress = true,
  className,
  onClick,
  onJoin,
  onView,
}: ChallengeCardProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isParticipating, setIsParticipating] = useState(false);

  const supabase = createClient();
  const TypeIcon = CHALLENGE_ICONS[challenge.type];
  const difficultyConfig = DIFFICULTY_CONFIG[challenge.difficulty];
  const statusConfig = STATUS_CONFIG[challenge.status];
  const DifficultyIcon = difficultyConfig.icon;

  const isActive = challenge.status === "active";
  const isUpcoming = challenge.status === "upcoming";
  const canJoin =
    isActive &&
    !isParticipating &&
    (challenge.max_participants
      ? challenge.current_participants < challenge.max_participants
      : true);

  useEffect(() => {
    const targetDate = isActive ? challenge.end_date : challenge.start_date;

    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor(
          (difference % (1000 * 60 * 60)) / (1000 * 60),
        );
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft(null);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [challenge.start_date, challenge.end_date, isActive]);

  useEffect(() => {
    if (currentUserId) {
      checkParticipationStatus();
    }
  }, [challenge.id, currentUserId]);

  const checkParticipationStatus = async () => {
    if (!currentUserId) return;

    try {
      const { data, error } = await (supabase as any)
        .from("challenge_participants")
        .select("id")
        .eq("challenge_id", challenge.id)
        .eq("user_id", currentUserId)
        .single();

      setIsParticipating(!!data && !error);
    } catch (error) {
      // User is not participating
    }
  };

  const handleJoin = async () => {
    if (!canJoin || !currentUserId) return;

    try {
      const { error } = await (supabase as any).from("challenge_participants").insert({
        challenge_id: challenge.id,
        user_id: currentUserId,
        joined_at: new Date().toISOString(),
      });

      if (!error) {
        setIsParticipating(true);
        onJoin?.(challenge);
      }
    } catch (error) {
      console.error("Error joining challenge:", error);
    }
  };

  const handleClick = () => {
    onClick?.(challenge);
  };

  const handleViewDetails = () => {
    onView?.(challenge);
  };

  const renderTimeLeft = () => {
    if (!timeLeft) return null;

    const { days, hours, minutes, seconds } = timeLeft;

    return (
      <div className="flex items-center gap-1 text-xs">
        <Timer size={12} />
        {days > 0 ? (
          <span>
            {days}d {hours}h
          </span>
        ) : hours > 0 ? (
          <span>
            {hours}h {minutes}m
          </span>
        ) : (
          <span>
            {minutes}m {seconds}s
          </span>
        )}
      </div>
    );
  };

  const renderParticipantProgress = () => {
    if (!showProgress || !challenge.max_participants) return null;

    const percentage =
      (challenge.current_participants / challenge.max_participants) * 100;
    const isFull = challenge.current_participants >= challenge.max_participants;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground/60">Participants</span>
          <span
            className={`font-medium ${isFull ? "text-warning" : "text-foreground"}`}
          >
            {challenge.current_participants} / {challenge.max_participants}
          </span>
        </div>
        <Progress
          className="w-full"
          color={isFull ? "warning" : "primary"}
          size="sm"
          value={percentage}
        />
      </div>
    );
  };

  const renderMinimalView = () => (
    <motion.div
      className={`cursor-pointer ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors">
        <div
          className={`w-10 h-10 rounded-lg ${statusConfig.bgColor} flex items-center justify-center`}
        >
          <TypeIcon size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{challenge.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Chip
              className="text-xs"
              color={statusConfig.color as "default" | "warning" | "success" | "primary" | "secondary" | "danger"}
              size="sm"
              variant="flat"
            >
              {statusConfig.label}
            </Chip>
            {timeLeft && (
              <div className="text-xs text-foreground/60">
                {renderTimeLeft()}
              </div>
            )}
          </div>
        </div>

        <ArrowRight className="text-foreground/40" size={16} />
      </div>
    </motion.div>
  );

  const renderCompactView = () => (
    <motion.div
      className={`cursor-pointer ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
    >
      <GlassmorphicCard {...GameGenCardPresets.chatPanel}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Challenge Icon/Image */}
            <div
              className={`w-12 h-12 rounded-lg ${statusConfig.bgColor} flex items-center justify-center flex-shrink-0`}
            >
              {challenge.thumbnail_url ? (
                <Image
                  alt={challenge.title}
                  className="w-full h-full object-cover rounded-lg"
                  height={48}
                  src={challenge.thumbnail_url}
                  width={48}
                />
              ) : (
                <TypeIcon size={24} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm truncate">
                  {challenge.title}
                </h3>
                {challenge.featured && (
                  <Crown
                    className="text-warning flex-shrink-0 ml-2"
                    size={14}
                  />
                )}
              </div>

              <p className="text-xs text-foreground/70 line-clamp-2 mb-2">
                {challenge.description}
              </p>

              <div className="flex items-center gap-2 mb-3">
                <Chip color={statusConfig.color as "default" | "warning" | "success" | "primary" | "secondary" | "danger"} size="sm" variant="flat">
                  {statusConfig.label}
                </Chip>
                <Chip
                  color={difficultyConfig.color as "default" | "warning" | "success" | "primary" | "secondary" | "danger"}
                  size="sm"
                  startContent={<DifficultyIcon size={10} />}
                  variant="flat"
                >
                  {difficultyConfig.label}
                </Chip>
              </div>

              <div className="flex items-center justify-between text-xs text-foreground/60">
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  {challenge.current_participants} participants
                </div>
                {timeLeft && renderTimeLeft()}
              </div>
            </div>
          </div>
        </div>
      </GlassmorphicCard>
    </motion.div>
  );

  const renderFeaturedView = () => (
    <motion.div
      className={`cursor-pointer ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
    >
      <div className="relative overflow-hidden">
        {/* Background gradient based on status */}
        <div
          className={`absolute inset-0 bg-gradient-to-br from-${statusConfig.color}/20 to-${statusConfig.color}/10`}
        />

        <GlassmorphicCard
          {...GameGenCardPresets.gameCard}
          className="relative border-2 border-primary/30"
        >
          {/* Featured Badge */}
          <div className="absolute top-3 right-3 z-10">
            <Chip
              className="font-semibold"
              color="warning"
              size="sm"
              startContent={<Crown size={12} />}
              variant="solid"
            >
              Featured
            </Chip>
          </div>

          <div className="p-0">
            {/* Header Image */}
            <div className="aspect-video relative bg-gradient-to-br from-primary/20 to-secondary/20">
              {challenge.thumbnail_url ? (
                <Image
                  fill
                  alt={challenge.title}
                  className="object-cover"
                  src={challenge.thumbnail_url}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <TypeIcon className="w-16 h-16 text-foreground/30" />
                </div>
              )}

              {/* Status Overlay */}
              <div className="absolute top-3 left-3">
                <Chip
                  className="font-semibold"
                  color={statusConfig.color as "default" | "warning" | "success" | "primary" | "secondary" | "danger"}
                  size="sm"
                  variant="solid"
                >
                  {statusConfig.label}
                </Chip>
              </div>

              {/* Prize Pool */}
              {challenge.prize_pool && (
                <div className="absolute bottom-3 left-3">
                  <Chip
                    className="font-semibold"
                    color="warning"
                    size="sm"
                    startContent={<Trophy size={12} />}
                    variant="solid"
                  >
                    ${challenge.prize_pool.toLocaleString()}
                  </Chip>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold mb-2">{challenge.title}</h2>
                  <p className="text-foreground/70 mb-3 line-clamp-3">
                    {challenge.description}
                  </p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-foreground/70">
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{challenge.current_participants} joined</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>
                      {new Date(challenge.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  <Chip
                    color={difficultyConfig.color as "default" | "warning" | "success" | "primary" | "secondary" | "danger"}
                    size="sm"
                    startContent={<DifficultyIcon size={12} />}
                    variant="flat"
                  >
                    {difficultyConfig.label}
                  </Chip>
                </div>

                {timeLeft && (
                  <div className="text-sm font-mono bg-background/50 px-3 py-1 rounded-full">
                    {renderTimeLeft()}
                  </div>
                )}
              </div>

              {renderParticipantProgress()}

              {showActions && (
                <div className="flex gap-2 mt-4">
                  {canJoin ? (
                    <Button
                      className="flex-1"
                      color="primary"
                      startContent={<Zap size={16} />}
                      variant="solid"
                      onPress={handleJoin}
                    >
                      Join Challenge
                    </Button>
                  ) : isParticipating ? (
                    <Button
                      className="flex-1"
                      color="success"
                      startContent={<CheckCircle size={16} />}
                      variant="flat"
                    >
                      Joined
                    </Button>
                  ) : (
                    <Button
                      className="flex-1"
                      startContent={<Eye size={16} />}
                      variant="flat"
                      onPress={handleViewDetails}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </GlassmorphicCard>
      </div>
    </motion.div>
  );

  const renderDefaultView = () => (
    <motion.div
      className={`cursor-pointer ${className}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={handleClick}
    >
      <GlassmorphicCard {...GameGenCardPresets.gameCard}>
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Challenge Image/Icon */}
            <div
              className={`w-16 h-16 rounded-xl ${statusConfig.bgColor} flex items-center justify-center flex-shrink-0`}
            >
              {challenge.thumbnail_url ? (
                <Image
                  alt={challenge.title}
                  className="w-full h-full object-cover rounded-xl"
                  height={64}
                  src={challenge.thumbnail_url}
                  width={64}
                />
              ) : (
                <TypeIcon size={32} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{challenge.title}</h3>
                    {challenge.featured && (
                      <Crown className="text-warning" size={16} />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Chip color={statusConfig.color as "default" | "warning" | "success" | "primary" | "secondary" | "danger"} size="sm" variant="flat">
                      {statusConfig.label}
                    </Chip>
                    <Chip
                      color={difficultyConfig.color as "default" | "warning" | "success" | "primary" | "secondary" | "danger"}
                      size="sm"
                      startContent={<DifficultyIcon size={12} />}
                      variant="flat"
                    >
                      {difficultyConfig.label}
                    </Chip>
                    <Chip className="capitalize" size="sm" variant="flat">
                      {challenge.type}
                    </Chip>
                  </div>
                </div>

                {timeLeft && (
                  <div className="text-sm font-mono bg-background/50 px-3 py-1 rounded-full">
                    {renderTimeLeft()}
                  </div>
                )}
              </div>

              <p className="text-foreground/70 mb-4 line-clamp-2">
                {challenge.description}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-foreground/70">
                  <div className="flex items-center gap-1">
                    <Users size={14} />
                    <span>{challenge.current_participants} participants</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>
                      Ends {new Date(challenge.end_date).toLocaleDateString()}
                    </span>
                  </div>
                  {challenge.prize_pool && (
                    <div className="flex items-center gap-1">
                      <Trophy size={14} />
                      <span>
                        ${challenge.prize_pool.toLocaleString()} prize
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {renderParticipantProgress()}

              {/* Actions */}
              {showActions && (
                <div className="flex gap-2 mt-4">
                  {canJoin ? (
                    <>
                      <Button
                        color="primary"
                        size="sm"
                        startContent={<Zap size={16} />}
                        variant="solid"
                        onPress={handleJoin}
                      >
                        Join Challenge
                      </Button>
                      <Button
                        size="sm"
                        startContent={<Eye size={16} />}
                        variant="flat"
                        onPress={handleViewDetails}
                      >
                        Details
                      </Button>
                    </>
                  ) : isParticipating ? (
                    <Button
                      color="success"
                      size="sm"
                      startContent={<CheckCircle size={16} />}
                      variant="flat"
                    >
                      Participating
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      startContent={<Eye size={16} />}
                      variant="flat"
                      onPress={handleViewDetails}
                    >
                      View Challenge
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassmorphicCard>
    </motion.div>
  );

  // Render based on variant
  switch (variant) {
    case "minimal":
      return renderMinimalView();
    case "compact":
      return renderCompactView();
    case "featured":
      return renderFeaturedView();
    default:
      return renderDefaultView();
  }
}

export default ChallengeCard;
