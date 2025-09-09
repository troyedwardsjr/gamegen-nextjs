"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";

type GameLike = Database["public"]["Tables"]["game_likes"]["Row"];
type GameComment = Database["public"]["Tables"]["game_comments"]["Row"];
type UserFollow = Database["public"]["Tables"]["user_follows"]["Row"];
type SocialShare = any; // TODO: Update when social_shares table is added to database types

interface SocialUpdates {
  likes: GameLike[];
  comments: GameComment[];
  follows: UserFollow[];
  shares: SocialShare[];
}

interface SocialRealtimeOptions {
  gameId?: string;
  userId?: string;
  onLikeUpdate?: (like: GameLike, action: 'INSERT' | 'DELETE') => void;
  onCommentUpdate?: (comment: GameComment, action: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  onFollowUpdate?: (follow: UserFollow, action: 'INSERT' | 'DELETE') => void;
  onShareUpdate?: (share: SocialShare, action: 'INSERT') => void;
  onError?: (error: Error) => void;
}

export function useSocialRealtime({
  gameId,
  userId,
  onLikeUpdate,
  onCommentUpdate,
  onFollowUpdate,
  onShareUpdate,
  onError,
}: SocialRealtimeOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [updates, setUpdates] = useState<SocialUpdates>({
    likes: [],
    comments: [],
    follows: [],
    shares: [],
  });

  const supabase = createClient();

  const addUpdate = useCallback((type: keyof SocialUpdates, item: any) => {
    setUpdates(prev => ({
      ...prev,
      [type]: [item, ...prev[type]].slice(0, 50) // Keep only latest 50 updates
    }));
  }, []);

  useEffect(() => {
    const subscriptions: any[] = [];

    // Subscribe to game likes if gameId is provided
    if (gameId) {
      const likesSubscription = supabase
        .channel(`game-likes-${gameId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_likes',
            filter: `game_id=eq.${gameId}`,
          },
          (payload) => {
            const like = payload.new as GameLike;
            const action = payload.eventType as 'INSERT' | 'DELETE' | 'UPDATE';
            
            if (action === 'INSERT' || action === 'DELETE') {
              addUpdate('likes', like);
              onLikeUpdate?.(like, action);
            }
          }
        )
        .subscribe();

      subscriptions.push(likesSubscription);

      // Subscribe to game comments
      const commentsSubscription = supabase
        .channel(`game-comments-${gameId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_comments',
            filter: `game_id=eq.${gameId}`,
          },
          (payload) => {
            const comment = payload.new as GameComment;
            const action = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
            
            addUpdate('comments', comment);
            onCommentUpdate?.(comment, action);
          }
        )
        .subscribe();

      subscriptions.push(commentsSubscription);

      // Subscribe to game shares
      const sharesSubscription = supabase
        .channel(`game-shares-${gameId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'social_shares',
            filter: `game_id=eq.${gameId}`,
          },
          (payload) => {
            const share = payload.new as SocialShare;
            
            addUpdate('shares', share);
            onShareUpdate?.(share, 'INSERT');
          }
        )
        .subscribe();

      subscriptions.push(sharesSubscription);
    }

    // Subscribe to user follows if userId is provided
    if (userId) {
      const followsSubscription = supabase
        .channel(`user-follows-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_follows',
            filter: `following_id=eq.${userId}`,
          },
          (payload) => {
            const follow = payload.new as UserFollow;
            const action = payload.eventType as 'INSERT' | 'DELETE';
            
            if (action === 'INSERT' || action === 'DELETE') {
              addUpdate('follows', follow);
              onFollowUpdate?.(follow, action);
            }
          }
        )
        .subscribe();

      subscriptions.push(followsSubscription);
    }

    // Global activity feed subscription (for logged-in users)
    if (userId) {
      const activitySubscription = supabase
        .channel('social-activity')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_activities',
          },
          (payload) => {
            // Handle activity updates for feeds
            console.log('New activity:', payload.new);
          }
        )
        .subscribe();

      subscriptions.push(activitySubscription);
    }

    // Set connected state
    setIsConnected(true);

    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach(subscription => {
        supabase.removeChannel(subscription);
      });
      setIsConnected(false);
    };
  }, [gameId, userId, addUpdate, onLikeUpdate, onCommentUpdate, onFollowUpdate, onShareUpdate]);

  // Manual functions to trigger updates
  const triggerLikeUpdate = useCallback(async (gameId: string, userId: string, action: 'like' | 'unlike') => {
    try {
      if (action === 'like') {
        const { error } = await supabase
          .from('game_likes')
          .insert({ game_id: gameId, user_id: userId });
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('game_likes')
          .delete()
          .eq('game_id', gameId)
          .eq('user_id', userId);
        
        if (error) throw error;
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }, [supabase, onError]);

  const triggerFollowUpdate = useCallback(async (targetUserId: string, currentUserId: string, action: 'follow' | 'unfollow') => {
    try {
      if (action === 'follow') {
        const { error } = await supabase
          .from('user_follows')
          .insert({ follower_id: currentUserId, following_id: targetUserId });
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);
        
        if (error) throw error;
      }
    } catch (error) {
      onError?.(error as Error);
    }
  }, [supabase, onError]);

  return {
    isConnected,
    updates,
    triggerLikeUpdate,
    triggerFollowUpdate,
    clearUpdates: () => setUpdates({ likes: [], comments: [], follows: [], shares: [] }),
  };
}

// Hook specifically for game social stats with real-time updates
export function useGameSocialStats(gameId: string) {
  const [stats, setStats] = useState({
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    averageRating: 0,
    ratingCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  // Fetch initial stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        const [likesResult, commentsResult, sharesResult, ratingsResult] = await Promise.all([
          supabase
            .from('game_likes')
            .select('id', { count: 'exact' })
            .eq('game_id', gameId),
          supabase
            .from('game_comments')
            .select('id', { count: 'exact' })
            .eq('game_id', gameId)
            .eq('is_deleted', false),
          (supabase as any)
            .from('social_shares')
            .select('id', { count: 'exact' })
            .eq('game_id', gameId),
          (supabase as any)
            .from('game_ratings')
            .select('rating')
            .eq('game_id', gameId),
        ]);

        const ratings = ratingsResult.data || [];
        const averageRating = ratings.length > 0 
          ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length 
          : 0;

        setStats({
          likeCount: likesResult.count || 0,
          commentCount: commentsResult.count || 0,
          shareCount: sharesResult.count || 0,
          averageRating,
          ratingCount: ratings.length,
        });
      } catch (error) {
        console.error('Error fetching social stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchStats();
    }
  }, [gameId, supabase]);

  // Real-time updates
  useSocialRealtime({
    gameId,
    onLikeUpdate: (like, action) => {
      setStats(prev => ({
        ...prev,
        likeCount: prev.likeCount + (action === 'INSERT' ? 1 : -1),
      }));
    },
    onCommentUpdate: (comment, action) => {
      if (action === 'INSERT') {
        setStats(prev => ({ ...prev, commentCount: prev.commentCount + 1 }));
      } else if (action === 'DELETE') {
        setStats(prev => ({ ...prev, commentCount: prev.commentCount - 1 }));
      }
    },
    onShareUpdate: () => {
      setStats(prev => ({ ...prev, shareCount: prev.shareCount + 1 }));
    },
  });

  return { stats, loading };
}

// Hook for user social stats with real-time updates
export function useUserSocialStats(userId: string) {
  const [stats, setStats] = useState({
    followersCount: 0,
    followingCount: 0,
    totalLikesReceived: 0,
    totalAchievements: 0,
    gamesCreated: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const { data, error } = await (supabase as any).rpc('get_user_social_stats', {
          target_user_id: userId
        });

        if (error) throw error;

        if (data) {
          setStats({
            followersCount: data.followers_count || 0,
            followingCount: data.following_count || 0,
            totalLikesReceived: data.total_likes_received || 0,
            totalAchievements: data.total_achievements || 0,
            gamesCreated: data.games_created || 0,
          });
        }
      } catch (error) {
        console.error('Error fetching user social stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchStats();
    }
  }, [userId, supabase]);

  // Real-time updates for follows
  useSocialRealtime({
    userId,
    onFollowUpdate: (follow, action) => {
      setStats(prev => ({
        ...prev,
        followersCount: prev.followersCount + (action === 'INSERT' ? 1 : -1),
      }));
    },
  });

  return { stats, loading };
}