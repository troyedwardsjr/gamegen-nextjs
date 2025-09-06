/**
 * Achievements API Route
 * 
 * Handles achievement system operations including listing achievements,
 * checking progress, and awarding achievements to users.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Achievement, UserAchievement, SocialDatabase } from '@/types/social';

interface AchievementsResponse {
  success: boolean;
  achievements?: (Achievement & { 
    user_achievement?: UserAchievement;
    progress?: number;
  })[];
  error?: string;
}

interface UserAchievementsResponse {
  success: boolean;
  achievements?: (UserAchievement & { 
    achievement: Achievement;
  })[];
  stats?: {
    total_achievements: number;
    total_points: number;
    featured_count: number;
    latest_achievement?: UserAchievement & { achievement: Achievement };
  };
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const rarity = searchParams.get('rarity');
    const userId = searchParams.get('userId'); // For getting user-specific achievements
    const onlyUnlocked = searchParams.get('onlyUnlocked') === 'true';
    
    const supabase = createRouteHandlerClient<SocialDatabase>({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (userId) {
      // Get achievements for a specific user
      let query = supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('unlocked_at', { ascending: false });

      const { data: userAchievements, error: achievementsError } = await query;

      if (achievementsError) {
        console.error('User achievements error:', achievementsError);
        return NextResponse.json(
          { success: false, error: 'Failed to fetch user achievements' },
          { status: 500 }
        );
      }

      // Calculate stats
      const totalPoints = userAchievements?.reduce((sum, ua) => 
        sum + (ua.achievement as Achievement).points, 0) || 0;
      const featuredCount = userAchievements?.filter(ua => ua.is_featured).length || 0;
      const latestAchievement = userAchievements?.[0] || null;

      const response: UserAchievementsResponse = {
        success: true,
        achievements: userAchievements || [],
        stats: {
          total_achievements: userAchievements?.length || 0,
          total_points: totalPoints,
          featured_count: featuredCount,
          latest_achievement: latestAchievement
        }
      };

      return NextResponse.json(response);
    }

    // Get all achievements with user progress
    let query = supabase
      .from('achievements')
      .select(`
        *,
        user_achievements!left(
          id,
          unlocked_at,
          is_featured,
          is_public
        )
      `)
      .eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    if (rarity) {
      query = query.eq('rarity', rarity);
    }

    // Filter by user's achievements
    if (user) {
      query = query.eq('user_achievements.user_id', user.id);
    }

    const { data: achievements, error: achievementsError } = await query;

    if (achievementsError) {
      console.error('Achievements error:', achievementsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch achievements' },
        { status: 500 }
      );
    }

    // Process achievements to calculate progress for incomplete ones
    const processedAchievements = await Promise.all(
      (achievements || []).map(async (achievement) => {
        const userAchievement = achievement.user_achievements?.[0];
        
        if (userAchievement || achievement.is_secret) {
          return {
            ...achievement,
            user_achievement: userAchievement,
            progress: userAchievement ? 100 : 0
          };
        }

        // Calculate progress for incomplete achievements
        let progress = 0;
        try {
          progress = await calculateAchievementProgress(supabase, user.id, achievement);
        } catch (error) {
          console.error('Progress calculation error:', error);
        }

        return {
          ...achievement,
          progress
        };
      })
    );

    // Filter by unlock status if requested
    const filteredAchievements = onlyUnlocked
      ? processedAchievements.filter(a => a.user_achievement)
      : processedAchievements;

    const response: AchievementsResponse = {
      success: true,
      achievements: filteredAchievements
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Achievements API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function calculateAchievementProgress(
  supabase: any,
  userId: string,
  achievement: Achievement
): Promise<number> {
  try {
    const conditions = achievement.conditions as any;
    
    switch (conditions.type) {
      case 'games_created': {
        const { count } = await supabase
          .from('games')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', userId)
          .eq('visibility', 'public');
        
        return Math.min(100, ((count || 0) / conditions.threshold) * 100);
      }
      
      case 'followers': {
        const { count } = await supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId);
        
        return Math.min(100, ((count || 0) / conditions.threshold) * 100);
      }
      
      case 'likes_received': {
        const { data: games } = await supabase
          .from('games')
          .select('like_count')
          .eq('creator_id', userId);
        
        const totalLikes = games?.reduce((sum, game) => sum + (game.like_count || 0), 0) || 0;
        return Math.min(100, (totalLikes / conditions.threshold) * 100);
      }
      
      case 'challenges_won': {
        // This would require a more complex query involving challenge results
        // For now, return 0 as this requires additional implementation
        return 0;
      }
      
      case 'days_active': {
        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', userId)
          .single();
        
        if (profile) {
          const daysActive = Math.floor(
            (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );
          return Math.min(100, (daysActive / conditions.threshold) * 100);
        }
        return 0;
      }
      
      default:
        return 0;
    }
  } catch (error) {
    console.error('Progress calculation error:', error);
    return 0;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<SocialDatabase>({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'check_progress') {
      // Trigger achievement check for user
      const { error: checkError } = await supabase
        .rpc('check_user_achievements', { user_id: user.id });

      if (checkError) {
        console.error('Achievement check error:', checkError);
        return NextResponse.json(
          { success: false, error: 'Failed to check achievements' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'Achievement check completed' });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Achievements POST API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}