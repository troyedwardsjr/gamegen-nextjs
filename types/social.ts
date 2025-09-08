/**
 * GameGen Social Features Types
 *
 * TypeScript type definitions for social features extending the main database types.
 * This includes achievements, activities, notifications, challenges, and community features.
 */

import { Database, Json } from "../src/types/database";

// Social Features Database Table Extensions
export interface SocialTables {
  achievements: {
    Row: {
      id: string;
      name: string;
      description: string;
      category: "creator" | "social" | "milestone" | "special" | "community";
      icon_url: string | null;
      badge_color: string;
      points: number;
      rarity: "common" | "rare" | "epic" | "legendary";
      conditions: Json;
      is_secret: boolean;
      is_active: boolean;
      total_unlocked: number;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      name: string;
      description: string;
      category: "creator" | "social" | "milestone" | "special" | "community";
      icon_url?: string | null;
      badge_color?: string;
      points?: number;
      rarity?: "common" | "rare" | "epic" | "legendary";
      conditions?: Json;
      is_secret?: boolean;
      is_active?: boolean;
      total_unlocked?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      name?: string;
      description?: string;
      category?: "creator" | "social" | "milestone" | "special" | "community";
      icon_url?: string | null;
      badge_color?: string;
      points?: number;
      rarity?: "common" | "rare" | "epic" | "legendary";
      conditions?: Json;
      is_secret?: boolean;
      is_active?: boolean;
      total_unlocked?: number;
      created_at?: string;
      updated_at?: string;
    };
  };

  user_achievements: {
    Row: {
      id: string;
      user_id: string;
      achievement_id: string;
      unlocked_at: string;
      unlock_data: Json;
      progress_data: Json;
      is_featured: boolean;
      is_public: boolean;
    };
    Insert: {
      id?: string;
      user_id: string;
      achievement_id: string;
      unlocked_at?: string;
      unlock_data?: Json;
      progress_data?: Json;
      is_featured?: boolean;
      is_public?: boolean;
    };
    Update: {
      id?: string;
      user_id?: string;
      achievement_id?: string;
      unlocked_at?: string;
      unlock_data?: Json;
      progress_data?: Json;
      is_featured?: boolean;
      is_public?: boolean;
    };
  };

  activities: {
    Row: {
      id: string;
      user_id: string;
      activity_type: ActivityType;
      target_game_id: string | null;
      target_user_id: string | null;
      target_collection_id: string | null;
      target_achievement_id: string | null;
      activity_data: Json;
      visibility: "public" | "followers" | "private";
      impression_count: number;
      engagement_count: number;
      created_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      activity_type: ActivityType;
      target_game_id?: string | null;
      target_user_id?: string | null;
      target_collection_id?: string | null;
      target_achievement_id?: string | null;
      activity_data?: Json;
      visibility?: "public" | "followers" | "private";
      impression_count?: number;
      engagement_count?: number;
      created_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      activity_type?: ActivityType;
      target_game_id?: string | null;
      target_user_id?: string | null;
      target_collection_id?: string | null;
      target_achievement_id?: string | null;
      activity_data?: Json;
      visibility?: "public" | "followers" | "private";
      impression_count?: number;
      engagement_count?: number;
      created_at?: string;
    };
  };

  notifications: {
    Row: {
      id: string;
      recipient_id: string;
      sender_id: string | null;
      notification_type: NotificationType;
      title: string;
      content: string | null;
      related_game_id: string | null;
      related_comment_id: string | null;
      related_activity_id: string | null;
      is_read: boolean;
      read_at: string | null;
      action_url: string | null;
      notification_data: Json;
      created_at: string;
    };
    Insert: {
      id?: string;
      recipient_id: string;
      sender_id?: string | null;
      notification_type: NotificationType;
      title: string;
      content?: string | null;
      related_game_id?: string | null;
      related_comment_id?: string | null;
      related_activity_id?: string | null;
      is_read?: boolean;
      read_at?: string | null;
      action_url?: string | null;
      notification_data?: Json;
      created_at?: string;
    };
    Update: {
      id?: string;
      recipient_id?: string;
      sender_id?: string | null;
      notification_type?: NotificationType;
      title?: string;
      content?: string | null;
      related_game_id?: string | null;
      related_comment_id?: string | null;
      related_activity_id?: string | null;
      is_read?: boolean;
      read_at?: string | null;
      action_url?: string | null;
      notification_data?: Json;
      created_at?: string;
    };
  };

  challenges: {
    Row: {
      id: string;
      creator_id: string;
      title: string;
      description: string;
      short_description: string | null;
      challenge_type: ChallengeType;
      difficulty: ChallengeDifficulty;
      starts_at: string;
      ends_at: string;
      submission_deadline: string | null;
      voting_ends_at: string | null;
      rules: Json;
      constraints: Json;
      max_participants: number | null;
      team_size_limit: number;
      allow_solo: boolean;
      allow_teams: boolean;
      prizes: Json;
      winner_count: number;
      banner_url: string | null;
      thumbnail_url: string | null;
      status: ChallengeStatus;
      participant_count: number;
      submission_count: number;
      is_featured: boolean;
      is_official: boolean;
      tags: string[] | null;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      creator_id: string;
      title: string;
      description: string;
      short_description?: string | null;
      challenge_type?: ChallengeType;
      difficulty?: ChallengeDifficulty;
      starts_at: string;
      ends_at: string;
      submission_deadline?: string | null;
      voting_ends_at?: string | null;
      rules?: Json;
      constraints?: Json;
      max_participants?: number | null;
      team_size_limit?: number;
      allow_solo?: boolean;
      allow_teams?: boolean;
      prizes?: Json;
      winner_count?: number;
      banner_url?: string | null;
      thumbnail_url?: string | null;
      status?: ChallengeStatus;
      participant_count?: number;
      submission_count?: number;
      is_featured?: boolean;
      is_official?: boolean;
      tags?: string[] | null;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      creator_id?: string;
      title?: string;
      description?: string;
      short_description?: string | null;
      challenge_type?: ChallengeType;
      difficulty?: ChallengeDifficulty;
      starts_at?: string;
      ends_at?: string;
      submission_deadline?: string | null;
      voting_ends_at?: string | null;
      rules?: Json;
      constraints?: Json;
      max_participants?: number | null;
      team_size_limit?: number;
      allow_solo?: boolean;
      allow_teams?: boolean;
      prizes?: Json;
      winner_count?: number;
      banner_url?: string | null;
      thumbnail_url?: string | null;
      status?: ChallengeStatus;
      participant_count?: number;
      submission_count?: number;
      is_featured?: boolean;
      is_official?: boolean;
      tags?: string[] | null;
      created_at?: string;
      updated_at?: string;
    };
  };

  challenge_participants: {
    Row: {
      id: string;
      challenge_id: string;
      user_id: string;
      team_name: string | null;
      team_members: string[] | null;
      team_lead_id: string | null;
      joined_at: string;
      status: ParticipantStatus;
      submission_game_id: string | null;
      submitted_at: string | null;
      submission_notes: string | null;
    };
    Insert: {
      id?: string;
      challenge_id: string;
      user_id: string;
      team_name?: string | null;
      team_members?: string[] | null;
      team_lead_id?: string | null;
      joined_at?: string;
      status?: ParticipantStatus;
      submission_game_id?: string | null;
      submitted_at?: string | null;
      submission_notes?: string | null;
    };
    Update: {
      id?: string;
      challenge_id?: string;
      user_id?: string;
      team_name?: string | null;
      team_members?: string[] | null;
      team_lead_id?: string | null;
      joined_at?: string;
      status?: ParticipantStatus;
      submission_game_id?: string | null;
      submitted_at?: string | null;
      submission_notes?: string | null;
    };
  };

  game_ratings: {
    Row: {
      id: string;
      game_id: string;
      user_id: string;
      rating: number;
      review_title: string | null;
      review_content: string | null;
      gameplay_rating: number | null;
      graphics_rating: number | null;
      audio_rating: number | null;
      difficulty_rating: number | null;
      is_verified_purchase: boolean;
      playtime_minutes: number | null;
      completed_game: boolean;
      is_flagged: boolean;
      is_featured: boolean;
      helpful_count: number;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      game_id: string;
      user_id: string;
      rating: number;
      review_title?: string | null;
      review_content?: string | null;
      gameplay_rating?: number | null;
      graphics_rating?: number | null;
      audio_rating?: number | null;
      difficulty_rating?: number | null;
      is_verified_purchase?: boolean;
      playtime_minutes?: number | null;
      completed_game?: boolean;
      is_flagged?: boolean;
      is_featured?: boolean;
      helpful_count?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      game_id?: string;
      user_id?: string;
      rating?: number;
      review_title?: string | null;
      review_content?: string | null;
      gameplay_rating?: number | null;
      graphics_rating?: number | null;
      audio_rating?: number | null;
      difficulty_rating?: number | null;
      is_verified_purchase?: boolean;
      playtime_minutes?: number | null;
      completed_game?: boolean;
      is_flagged?: boolean;
      is_featured?: boolean;
      helpful_count?: number;
      created_at?: string;
      updated_at?: string;
    };
  };

  user_follows: {
    Row: {
      id: string;
      follower_id: string;
      following_id: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      follower_id: string;
      following_id: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      follower_id?: string;
      following_id?: string;
      created_at?: string;
    };
  };

  game_likes: {
    Row: {
      id: string;
      user_id: string;
      game_id: string;
      created_at: string;
    };
    Insert: {
      id?: string;
      user_id: string;
      game_id: string;
      created_at?: string;
    };
    Update: {
      id?: string;
      user_id?: string;
      game_id?: string;
      created_at?: string;
    };
  };

  game_comments: {
    Row: {
      id: string;
      game_id: string;
      author_id: string;
      content: string;
      parent_comment_id: string | null;
      is_edited: boolean;
      is_deleted: boolean;
      is_flagged: boolean;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      game_id: string;
      author_id: string;
      content: string;
      parent_comment_id?: string | null;
      is_edited?: boolean;
      is_deleted?: boolean;
      is_flagged?: boolean;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      game_id?: string;
      author_id?: string;
      content?: string;
      parent_comment_id?: string | null;
      is_edited?: boolean;
      is_deleted?: boolean;
      is_flagged?: boolean;
      created_at?: string;
      updated_at?: string;
    };
  };

  collections: {
    Row: {
      id: string;
      creator_id: string;
      name: string;
      description: string | null;
      is_public: boolean;
      is_collaborative: boolean;
      game_count: number;
      created_at: string;
      updated_at: string;
    };
    Insert: {
      id?: string;
      creator_id: string;
      name: string;
      description?: string | null;
      is_public?: boolean;
      is_collaborative?: boolean;
      game_count?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: {
      id?: string;
      creator_id?: string;
      name?: string;
      description?: string | null;
      is_public?: boolean;
      is_collaborative?: boolean;
      game_count?: number;
      created_at?: string;
      updated_at?: string;
    };
  };

  collection_games: {
    Row: {
      id: string;
      collection_id: string;
      game_id: string;
      added_by: string;
      order_index: number;
      created_at: string;
    };
    Insert: {
      id?: string;
      collection_id: string;
      game_id: string;
      added_by: string;
      order_index?: number;
      created_at?: string;
    };
    Update: {
      id?: string;
      collection_id?: string;
      game_id?: string;
      added_by?: string;
      order_index?: number;
      created_at?: string;
    };
  };
}

// Social Feature Enums
export type AchievementCategory =
  | "creator"
  | "social"
  | "milestone"
  | "special"
  | "community";
export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export type ActivityType =
  | "game_created"
  | "game_published"
  | "game_liked"
  | "game_commented"
  | "user_followed"
  | "achievement_unlocked"
  | "collection_created"
  | "template_shared"
  | "asset_uploaded"
  | "challenge_completed"
  | "game_featured"
  | "milestone_reached"
  | "collaboration_joined";

export type ActivityVisibility = "public" | "followers" | "private";

export type NotificationType =
  | "follow"
  | "game_like"
  | "game_comment"
  | "game_featured"
  | "achievement_unlocked"
  | "challenge_invite"
  | "mention"
  | "collaboration_invite"
  | "collection_add"
  | "system_announcement";

export type ChallengeType =
  | "game_jam"
  | "weekly"
  | "themed"
  | "skill"
  | "community";
export type ChallengeDifficulty =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "all";
export type ChallengeStatus =
  | "draft"
  | "upcoming"
  | "active"
  | "voting"
  | "completed"
  | "cancelled";
export type ParticipantStatus =
  | "registered"
  | "active"
  | "submitted"
  | "disqualified"
  | "withdrawn";

// Extended Database interface with social features
export interface SocialDatabase extends Database {
  public: Database["public"] & {
    Tables: Database["public"]["Tables"] & SocialTables;
    Views: Database["public"]["Views"] & {
      trending_games: {
        Row: {
          id: string;
          title: string;
          creator_id: string;
          thumbnail_url: string | null;
          description: string | null;
          tags: string[] | null;
          created_at: string | null;
          play_count: number | null;
          like_count: number | null;
          fork_count: number | null;
          trending_score: number | null;
        };
      };
    };
    Functions: Database["public"]["Functions"] & {
      refresh_trending_games: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      check_user_achievements: {
        Args: { user_id: string };
        Returns: undefined;
      };
      get_user_activity_feed: {
        Args: {
          user_id: string;
          limit_count?: number;
          offset_count?: number;
        };
        Returns: Array<{
          id: string;
          activity_type: string;
          user_id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          activity_data: Json;
          created_at: string;
        }>;
      };
    };
  };
}

// Social Feature Type Exports
export type Achievement = SocialTables["achievements"]["Row"];
export type UserAchievement = SocialTables["user_achievements"]["Row"];
export type Activity = SocialTables["activities"]["Row"];
export type Notification = SocialTables["notifications"]["Row"];
export type Challenge = SocialTables["challenges"]["Row"];
export type ChallengeParticipant =
  SocialTables["challenge_participants"]["Row"];
export type GameRating = SocialTables["game_ratings"]["Row"];
export type UserFollow = SocialTables["user_follows"]["Row"];
export type GameLike = SocialTables["game_likes"]["Row"];
export type GameComment = SocialTables["game_comments"]["Row"];
export type Collection = SocialTables["collections"]["Row"];
export type CollectionGame = SocialTables["collection_games"]["Row"];

// Insert types for social features
export type AchievementInsert = SocialTables["achievements"]["Insert"];
export type UserAchievementInsert = SocialTables["user_achievements"]["Insert"];
export type ActivityInsert = SocialTables["activities"]["Insert"];
export type NotificationInsert = SocialTables["notifications"]["Insert"];
export type ChallengeInsert = SocialTables["challenges"]["Insert"];
export type ChallengeParticipantInsert =
  SocialTables["challenge_participants"]["Insert"];
export type GameRatingInsert = SocialTables["game_ratings"]["Insert"];
export type UserFollowInsert = SocialTables["user_follows"]["Insert"];
export type GameLikeInsert = SocialTables["game_likes"]["Insert"];
export type GameCommentInsert = SocialTables["game_comments"]["Insert"];
export type CollectionInsert = SocialTables["collections"]["Insert"];
export type CollectionGameInsert = SocialTables["collection_games"]["Insert"];

// Update types for social features
export type AchievementUpdate = SocialTables["achievements"]["Update"];
export type UserAchievementUpdate = SocialTables["user_achievements"]["Update"];
export type ActivityUpdate = SocialTables["activities"]["Update"];
export type NotificationUpdate = SocialTables["notifications"]["Update"];
export type ChallengeUpdate = SocialTables["challenges"]["Update"];
export type ChallengeParticipantUpdate =
  SocialTables["challenge_participants"]["Update"];
export type GameRatingUpdate = SocialTables["game_ratings"]["Update"];
export type UserFollowUpdate = SocialTables["user_follows"]["Update"];
export type GameLikeUpdate = SocialTables["game_likes"]["Update"];
export type GameCommentUpdate = SocialTables["game_comments"]["Update"];
export type CollectionUpdate = SocialTables["collections"]["Update"];
export type CollectionGameUpdate = SocialTables["collection_games"]["Update"];

// Trending Games View Type
export type TrendingGame =
  SocialDatabase["public"]["Views"]["trending_games"]["Row"];

// Activity Feed Response Type
export type ActivityFeedItem = {
  id: string;
  activity_type: ActivityType;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  activity_data: Json;
  created_at: string;
};

// Social Statistics Types
export interface UserSocialStats {
  followers_count: number;
  following_count: number;
  total_likes_received: number;
  total_achievements: number;
  games_created: number;
  challenges_completed: number;
}

export interface GameSocialStats {
  like_count: number;
  comment_count: number;
  rating_average: number;
  rating_count: number;
  collection_count: number;
  fork_count: number;
}

// Challenge Prize Interface
export interface ChallengePrize {
  place: number | "community_choice" | "participation";
  prize: string;
  value: number;
}

// Achievement Condition Interface
export interface AchievementCondition {
  type:
    | "games_created"
    | "followers"
    | "likes_received"
    | "challenges_won"
    | "days_active"
    | "manual";
  threshold?: number;
  description?: string;
}

// Activity Data Interfaces
export interface GameCreatedActivityData {
  game_title: string;
  game_type: string;
  is_first_game: boolean;
}

export interface AchievementUnlockedActivityData {
  achievement_name: string;
  points_earned: number;
  unlock_context: Json;
}

export interface UserFollowedActivityData {
  followed_username: string;
}

export interface GameLikedActivityData {
  game_title: string;
}

// Basic Game type for social sharing
export interface Game {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  cover_image_url?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
  creator_id: string;
  is_published: boolean;
  visibility: "public" | "unlisted" | "private";
}
