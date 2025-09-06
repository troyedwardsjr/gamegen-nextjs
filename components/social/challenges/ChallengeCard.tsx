"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Avatar } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import { motion } from "framer-motion";
import { 
  Target, 
  Calendar, 
  Users, 
  Trophy,
  Clock,
  Star,
  Zap,
  Crown,
  Medal,
  Play,
  Eye,
  ArrowRight,
  Timer,
  CheckCircle
} from "lucide-react";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import Image from "next/image";

type ChallengeType = "creation" | "gameplay" | "community" | "educational" | "seasonal";
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
    color: "primary",
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
  const canJoin = isActive && !isParticipating && 
    (challenge.max_participants ? challenge.current_participants < challenge.max_participants : true);

  useEffect(() => {
    const targetDate = isActive ? challenge.end_date : challenge.start_date;
    
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
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
      const { data, error } = await supabase
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
      const { error } = await supabase
        .from("challenge_participants")
        .insert({
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
          <span>{days}d {hours}h</span>
        ) : hours > 0 ? (
          <span>{hours}h {minutes}m</span>
        ) : (
          <span>{minutes}m {seconds}s</span>
        )}
      </div>
    );
  };

  const renderParticipantProgress = () => {
    if (!showProgress || !challenge.max_participants) return null;

    const percentage = (challenge.current_participants / challenge.max_participants) * 100;
    const isFull = challenge.current_participants >= challenge.max_participants;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground/60">Participants</span>
          <span className={`font-medium ${isFull ? 'text-warning' : 'text-foreground'}`}>
            {challenge.current_participants} / {challenge.max_participants}
          </span>
        </div>
        <Progress
          value={percentage}
          size="sm"
          color={isFull ? "warning" : "primary"}
          className="w-full"
        />
      </div>
    );
  };

  const renderMinimalView = () => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-colors">
        <div className={`w-10 h-10 rounded-lg ${statusConfig.bgColor} flex items-center justify-center`}>
          <TypeIcon size={18} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{challenge.title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <Chip
              size="sm"
              variant="flat"
              color={statusConfig.color}
              className="text-xs"
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

        <ArrowRight size={16} className="text-foreground/40" />
      </div>
    </motion.div>
  );

  const renderCompactView = () => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <GlassmorphicCard {...GameGenCardPresets.chatPanel}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Challenge Icon/Image */}
            <div className={`w-12 h-12 rounded-lg ${statusConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
              {challenge.thumbnail_url ? (
                <Image
                  src={challenge.thumbnail_url}
                  alt={challenge.title}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <TypeIcon size={24} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm truncate">{challenge.title}</h3>
                {challenge.featured && (
                  <Crown size={14} className="text-warning flex-shrink-0 ml-2" />
                )}
              </div>

              <p className="text-xs text-foreground/70 line-clamp-2 mb-2">
                {challenge.description}
              </p>

              <div className="flex items-center gap-2 mb-3">
                <Chip
                  size="sm"
                  variant="flat"
                  color={statusConfig.color}
                >
                  {statusConfig.label}
                </Chip>
                <Chip
                  size="sm"
                  variant="flat"
                  color={difficultyConfig.color}
                  startContent={<DifficultyIcon size={10} />}
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
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div className="relative overflow-hidden">
        {/* Background gradient based on status */}
        <div className={`absolute inset-0 bg-gradient-to-br from-${statusConfig.color}/20 to-${statusConfig.color}/10`} />
        
        <GlassmorphicCard 
          {...GameGenCardPresets.gameCard}
          className="relative border-2 border-primary/30"
        >
          {/* Featured Badge */}
          <div className="absolute top-3 right-3 z-10">
            <Chip
              color="warning"
              variant="solid"
              size="sm"
              startContent={<Crown size={12} />}
              className="font-semibold"
            >
              Featured
            </Chip>
          </div>

          <div className="p-0">
            {/* Header Image */}
            <div className="aspect-video relative bg-gradient-to-br from-primary/20 to-secondary/20">
              {challenge.thumbnail_url ? (
                <Image
                  src={challenge.thumbnail_url}
                  alt={challenge.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <TypeIcon className="w-16 h-16 text-foreground/30" />
                </div>
              )}
              
              {/* Status Overlay */}
              <div className="absolute top-3 left-3">
                <Chip
                  color={statusConfig.color}
                  variant="solid"
                  size="sm"
                  className="font-semibold"
                >
                  {statusConfig.label}
                </Chip>
              </div>

              {/* Prize Pool */}
              {challenge.prize_pool && (
                <div className="absolute bottom-3 left-3">
                  <Chip
                    color="warning"
                    variant="solid"
                    size="sm"
                    startContent={<Trophy size={12} />}
                    className="font-semibold"
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
                    <span>{new Date(challenge.end_date).toLocaleDateString()}</span>
                  </div>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={difficultyConfig.color}
                    startContent={<DifficultyIcon size={12} />}
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
                      color="primary"
                      variant="solid"
                      startContent={<Zap size={16} />}
                      onPress={handleJoin}
                      className="flex-1"
                    >
                      Join Challenge
                    </Button>
                  ) : isParticipating ? (
                    <Button
                      color="success"
                      variant="flat"
                      startContent={<CheckCircle size={16} />}
                      className="flex-1"
                    >
                      Joined
                    </Button>
                  ) : (
                    <Button
                      variant="flat"
                      startContent={<Eye size={16} />}
                      onPress={handleViewDetails}
                      className="flex-1"
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
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <GlassmorphicCard {...GameGenCardPresets.gameCard}>
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Challenge Image/Icon */}
            <div className={`w-16 h-16 rounded-xl ${statusConfig.bgColor} flex items-center justify-center flex-shrink-0`}>
              {challenge.thumbnail_url ? (
                <Image
                  src={challenge.thumbnail_url}
                  alt={challenge.title}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover rounded-xl"
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
                      <Crown size={16} className="text-warning" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={statusConfig.color}
                    >
                      {statusConfig.label}
                    </Chip>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={difficultyConfig.color}
                      startContent={<DifficultyIcon size={12} />}
                    >
                      {difficultyConfig.label}
                    </Chip>
                    <Chip size="sm" variant="flat" className="capitalize">
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
                    <span>Ends {new Date(challenge.end_date).toLocaleDateString()}</span>
                  </div>
                  {challenge.prize_pool && (
                    <div className="flex items-center gap-1">
                      <Trophy size={14} />
                      <span>${challenge.prize_pool.toLocaleString()} prize</span>
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
                        variant="solid"
                        startContent={<Zap size={16} />}
                        onPress={handleJoin}
                        size="sm"
                      >
                        Join Challenge
                      </Button>
                      <Button
                        variant="flat"
                        startContent={<Eye size={16} />}
                        onPress={handleViewDetails}
                        size="sm"
                      >
                        Details
                      </Button>
                    </>
                  ) : isParticipating ? (
                    <Button
                      color="success"
                      variant="flat"
                      startContent={<CheckCircle size={16} />}
                      size="sm"
                    >
                      Participating
                    </Button>
                  ) : (
                    <Button
                      variant="flat"
                      startContent={<Eye size={16} />}
                      onPress={handleViewDetails}
                      size="sm"
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