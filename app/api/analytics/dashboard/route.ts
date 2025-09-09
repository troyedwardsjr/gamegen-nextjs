import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DashboardAnalytics } from '@/types/dashboard';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for time range
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    
    // Calculate date range based on timeRange
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_remaining, credits_used_today')
      .eq('id', user.id)
      .single();

    // Fetch games data for overview
    const { data: gamesData } = await supabase
      .from('games')
      .select(`
        id,
        title,
        play_count,
        like_count,
        visibility,
        created_at,
        updated_at
      `)
      .eq('creator_id', user.id);

    // Calculate overview metrics
    const totalProjects = gamesData?.length || 0;
    const publishedProjects = gamesData?.filter(g => g.visibility === 'public').length || 0;
    const totalPlays = gamesData?.reduce((sum, game) => sum + (game.play_count || 0), 0) || 0;
    const totalLikes = gamesData?.reduce((sum, game) => sum + (game.like_count || 0), 0) || 0;

    // Count followers
    const { count: followerCount } = await supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', user.id);

    // Get top projects with growth calculation
    const topProjects = await Promise.all(
      (gamesData || [])
        .sort((a, b) => (b.play_count || 0) - (a.play_count || 0))
        .slice(0, 5)
        .map(async (game) => {
          // Get recent plays for growth calculation
          const { count: recentPlays } = await supabase
            .from('play_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('game_id', game.id)
            .gte('created_at', startDate.toISOString());

          // Get previous period plays for growth comparison
          const previousStartDate = new Date(startDate.getTime() - (daysBack * 24 * 60 * 60 * 1000));
          const { count: previousPlays } = await supabase
            .from('play_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('game_id', game.id)
            .gte('created_at', previousStartDate.toISOString())
            .lt('created_at', startDate.toISOString());

          // Calculate growth percentage
          const growth = previousPlays && previousPlays > 0 
            ? ((recentPlays || 0) - previousPlays) / previousPlays * 100
            : recentPlays && recentPlays > 0 ? 100 : 0;

          return {
            projectId: game.id,
            title: game.title,
            plays: game.play_count || 0,
            growth: Math.round(growth * 10) / 10
          };
        })
    );

    // Get recent trend data (aggregate by day)
    const { data: trendData } = await supabase
      .from('play_sessions')
      .select(`
        created_at,
        game_id,
        player_id
      `)
      .eq('player_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Process trend data by day
    const trendMap = new Map<string, { plays: number; projects: Set<string> }>();
    
    trendData?.forEach((session) => {
      if (!session.created_at) return;
      const date = new Date(session.created_at).toDateString();
      if (!trendMap.has(date)) {
        trendMap.set(date, { plays: 0, projects: new Set() });
      }
      const dayData = trendMap.get(date)!;
      dayData.plays += 1;
      if (session.game_id) {
        dayData.projects.add(session.game_id);
      }
    });

    const recentTrends = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        plays: data.plays,
        projects: data.projects.size
      }))
      .slice(-30); // Last 30 days

    // Get engagement metrics
    const { count: totalComments } = await supabase
      .from('game_comments')
      .select('id', { count: 'exact', head: true })
      .in('game_id', gamesData?.map(g => g.id) || []);

    const { count: totalShares } = await supabase
      .from('user_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get collaboration metrics
    const { count: activeCollabs } = await supabase
      .from('collaboration_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('host_user_id', user.id)
      .is('ended_at', null);

    const { count: completedCollabs } = await supabase
      .from('collaboration_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('host_user_id', user.id)
      .not('ended_at', 'is', null);

    // Get credits usage data (mock for now - would need actual credits tracking)
    const creditsUsageData = Array.from({ length: Math.min(daysBack, 30) }, (_, i) => {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      return {
        date: date.toISOString().split('T')[0],
        used: Math.floor(Math.random() * 50) + 10,
        category: 'ai_generation'
      };
    }).reverse();

    const analytics: DashboardAnalytics = {
      userId: user.id,
      overview: {
        totalProjects,
        publishedProjects,
        totalPlays,
        totalLikes,
        followerCount: followerCount || 0,
        creditsUsed: profile?.credits_used_today || 0
      },
      projectPerformance: {
        topProjects,
        recentTrends
      },
      engagement: {
        communityActivity: {
          likes: totalLikes,
          comments: totalComments || 0,
          shares: totalShares || 0,
          followers: followerCount || 0
        },
        collaborations: {
          active: activeCollabs || 0,
          pending: 0, // TODO: Implement pending collaborations
          completed: completedCollabs || 0
        }
      },
      usage: {
        creditsUsage: creditsUsageData,
        featureUsage: {
          'AI Generation': Math.floor(Math.random() * 100) + 50,
          'Asset Upload': Math.floor(Math.random() * 50) + 20,
          'Code Editor': Math.floor(Math.random() * 200) + 100,
          'Collaboration': Math.floor(Math.random() * 30) + 10
        }
      }
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Analytics dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}