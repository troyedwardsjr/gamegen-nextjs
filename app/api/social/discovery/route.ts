/**
 * Community Discovery API Route
 * 
 * Provides curated content discovery including trending games,
 * recommended users, featured content, and personalized suggestions.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SocialDatabase, TrendingGame } from '@/types/social';

interface DiscoveryResponse {
  success: boolean;
  trending_games?: TrendingGame[];
  featured_challenges?: any[];
  recommended_users?: any[];
  recent_activities?: any[];
  featured_collections?: any[];
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section'); // 'trending', 'challenges', 'users', 'activities', 'collections'
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    
    const supabase = createRouteHandlerClient<SocialDatabase>({ cookies });
    
    // Get current user for personalization
    const { data: { user } } = await supabase.auth.getUser();
    
    const response: DiscoveryResponse = { success: true };

    // Fetch trending games
    if (!section || section === 'trending') {
      try {
        // Refresh trending games view first
        await supabase.rpc('refresh_trending_games');
        
        const { data: trendingGames, error: trendingError } = await supabase
          .from('trending_games')
          .select(`
            *,
            creator:profiles!creator_id(username, display_name, avatar_url)
          `)
          .limit(limit);

        if (trendingError) {
          console.error('Trending games error:', trendingError);
        } else {
          response.trending_games = trendingGames || [];
        }
      } catch (error) {
        console.error('Trending games fetch error:', error);
      }
    }

    // Fetch featured challenges
    if (!section || section === 'challenges') {
      try {
        const { data: challenges, error: challengesError } = await supabase
          .from('challenges')
          .select(`
            id,
            title,
            short_description,
            challenge_type,
            difficulty,
            starts_at,
            ends_at,
            participant_count,
            submission_count,
            thumbnail_url,
            banner_url,
            is_official,
            tags,
            creator:profiles!creator_id(username, display_name, avatar_url)
          `)
          .eq('is_featured', true)
          .in('status', ['upcoming', 'active'])
          .order('starts_at', { ascending: true })
          .limit(limit);

        if (challengesError) {
          console.error('Featured challenges error:', challengesError);
        } else {
          response.featured_challenges = challenges || [];
        }
      } catch (error) {
        console.error('Featured challenges fetch error:', error);
      }
    }

    // Fetch recommended users (creators to follow)
    if (!section || section === 'users') {
      try {
        let usersQuery = supabase
          .from('profiles')
          .select(`
            id,
            username,
            display_name,
            avatar_url,
            bio,
            total_games_created,
            is_verified
          `)
          .eq('is_active', true)
          .gt('total_games_created', 0)
          .order('total_games_created', { ascending: false })
          .limit(limit);

        // Exclude users the current user already follows or is blocked by
        if (user) {
          // Get users the current user already follows
          const { data: following } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', user.id);

          const followingIds = following?.map(f => f.following_id) || [];
          
          // Get users who have blocked the current user
          const { data: blockers } = await supabase
            .from('user_blocks')
            .select('blocker_id')
            .eq('blocked_id', user.id);

          const blockerIds = blockers?.map(b => b.blocker_id) || [];
          
          // Exclude current user, already followed users, and blockers
          const excludeIds = [user.id, ...followingIds, ...blockerIds];
          usersQuery = usersQuery.not('id', 'in', `(${excludeIds.join(',')})`);
        }

        const { data: users, error: usersError } = await usersQuery;

        if (usersError) {
          console.error('Recommended users error:', usersError);
        } else {
          response.recommended_users = users || [];
        }
      } catch (error) {
        console.error('Recommended users fetch error:', error);
      }
    }

    // Fetch recent community activities
    if (!section || section === 'activities') {
      try {
        let activitiesQuery = supabase
          .from('activities')
          .select(`
            id,
            activity_type,
            activity_data,
            created_at,
            user:profiles!user_id(id, username, display_name, avatar_url),
            target_game:games!target_game_id(id, title, thumbnail_url),
            target_user:profiles!target_user_id(id, username, display_name, avatar_url)
          `)
          .eq('visibility', 'public')
          .in('activity_type', [
            'game_created', 'game_published', 'achievement_unlocked', 
            'challenge_completed', 'game_featured'
          ])
          .order('created_at', { ascending: false })
          .limit(limit);

        // Exclude blocked users if user is logged in
        if (user) {
          const { data: blocked } = await supabase
            .from('user_blocks')
            .select('blocked_id')
            .eq('blocker_id', user.id);

          const blockedIds = blocked?.map(b => b.blocked_id) || [];
          if (blockedIds.length > 0) {
            activitiesQuery = activitiesQuery.not('user_id', 'in', `(${blockedIds.join(',')})`);
          }
        }

        const { data: activities, error: activitiesError } = await activitiesQuery;

        if (activitiesError) {
          console.error('Recent activities error:', activitiesError);
        } else {
          response.recent_activities = activities || [];
        }
      } catch (error) {
        console.error('Recent activities fetch error:', error);
      }
    }

    // Fetch featured collections
    if (!section || section === 'collections') {
      try {
        const { data: collections, error: collectionsError } = await supabase
          .from('collections')
          .select(`
            id,
            name,
            description,
            game_count,
            created_at,
            creator:profiles!creator_id(username, display_name, avatar_url),
            collection_games(
              game:games!game_id(id, title, thumbnail_url)
            )
          `)
          .eq('is_public', true)
          .gte('game_count', 3) // Only collections with at least 3 games
          .order('game_count', { ascending: false })
          .limit(limit);

        if (collectionsError) {
          console.error('Featured collections error:', collectionsError);
        } else {
          // Transform collections to include preview games
          const transformedCollections = collections?.map(collection => ({
            ...collection,
            preview_games: collection.collection_games?.slice(0, 3).map(cg => cg.game) || [],
            collection_games: undefined
          }));

          response.featured_collections = transformedCollections || [];
        }
      } catch (error) {
        console.error('Featured collections fetch error:', error);
      }
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Discovery API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
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
    const { action, target_id, target_type } = body;

    if (action === 'refresh_trending') {
      // Manually refresh the trending games view
      const { error: refreshError } = await supabase.rpc('refresh_trending_games');
      
      if (refreshError) {
        console.error('Refresh trending error:', refreshError);
        return NextResponse.json(
          { success: false, error: 'Failed to refresh trending data' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Trending data refreshed successfully'
      });
    }

    if (action === 'interaction') {
      // Record user interaction for improving recommendations
      if (!target_id || !target_type) {
        return NextResponse.json(
          { success: false, error: 'Target ID and type are required' },
          { status: 400 }
        );
      }

      // Update engagement count for the target
      if (target_type === 'activity') {
        await supabase
          .from('activities')
          .update({ engagement_count: supabase.rpc('increment_count') })
          .eq('id', target_id);
      }

      return NextResponse.json({
        success: true,
        message: 'Interaction recorded'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Discovery POST API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}