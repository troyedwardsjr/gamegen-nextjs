import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const projectId = searchParams.get('projectId'); // Optional: filter by specific project
    
    // Calculate date range based on timeRange
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Build the base query for play sessions
    let query = supabase
      .from('play_sessions')
      .select(`
        created_at,
        game_id,
        player_id,
        session_duration,
        completion_percentage,
        platform,
        device_info,
        games(id, creator_id, title)
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // If projectId specified, filter by that project
    if (projectId) {
      query = query.eq('game_id', projectId);
      // Also verify the user owns this project
      const { data: project } = await supabase
        .from('games')
        .select('creator_id')
        .eq('id', projectId)
        .single();
      
      if (!project || project.creator_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      // Filter to only games created by this user
      query = query.eq('games.creator_id', user.id);
    }

    const { data: playSessionsData, error: playSessionsError } = await query;

    if (playSessionsError) {
      console.error('Error fetching play sessions:', playSessionsError);
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
    }

    // Process the data into daily aggregates
    const dailyData = new Map<string, {
      date: string;
      plays: number;
      uniquePlayers: Set<string>;
      projects: Set<string>;
      totalDuration: number;
      completions: number;
      devices: { desktop: number; mobile: number; tablet: number };
      platforms: { web: number; desktop: number; mobile: number };
    }>();

    // Initialize all days in the range with zero values
    for (let i = 0; i < daysBack; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dateKey = date.toISOString().split('T')[0];
      const displayDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: daysBack > 90 ? 'numeric' : undefined 
      });
      
      dailyData.set(dateKey, {
        date: displayDate,
        plays: 0,
        uniquePlayers: new Set(),
        projects: new Set(),
        totalDuration: 0,
        completions: 0,
        devices: { desktop: 0, mobile: 0, tablet: 0 },
        platforms: { web: 0, desktop: 0, mobile: 0 }
      });
    }

    // Process play sessions data
    playSessionsData?.forEach((session) => {
      if (!session.created_at) return;
      const dateKey = new Date(session.created_at).toISOString().split('T')[0];
      const dayData = dailyData.get(dateKey);
      
      if (dayData) {
        dayData.plays += 1;
        
        if (session.player_id) {
          dayData.uniquePlayers.add(session.player_id);
        }
        
        if (session.game_id) {
          dayData.projects.add(session.game_id);
        }
        
        if (session.session_duration) {
          dayData.totalDuration += session.session_duration;
        }
        
        if (session.completion_percentage && session.completion_percentage >= 90) {
          dayData.completions += 1;
        }

        // Categorize platform/device
        const platform = session.platform?.toLowerCase() || 'web';
        const deviceInfo = session.device_info as { deviceType?: string } | null;
        const deviceType = deviceInfo?.deviceType?.toLowerCase();
        
        // Platform tracking
        if (platform === 'web') dayData.platforms.web += 1;
        else if (platform === 'desktop') dayData.platforms.desktop += 1;
        else if (platform === 'mobile') dayData.platforms.mobile += 1;
        else dayData.platforms.web += 1; // Default to web
        
        // Device tracking
        if (deviceType === 'tablet' || (platform === 'mobile' && deviceType === 'tablet')) {
          dayData.devices.tablet += 1;
        } else if (platform === 'mobile' || deviceType === 'mobile') {
          dayData.devices.mobile += 1;
        } else {
          dayData.devices.desktop += 1;
        }
      }
    });

    // Convert to final format
    const trends = Array.from(dailyData.values()).map(dayData => ({
      date: dayData.date,
      plays: dayData.plays,
      uniquePlayers: dayData.uniquePlayers.size,
      projects: dayData.projects.size,
      avgDuration: dayData.plays > 0 ? Math.round(dayData.totalDuration / dayData.plays) : 0,
      completionRate: dayData.plays > 0 ? Math.round((dayData.completions / dayData.plays) * 100) : 0,
      devices: dayData.devices,
      platforms: dayData.platforms
    }));

    // Calculate device and platform totals for percentages
    const totalPlays = trends.reduce((sum, day) => sum + day.plays, 0);
    
    const deviceTotals = trends.reduce((acc, day) => ({
      desktop: acc.desktop + day.devices.desktop,
      mobile: acc.mobile + day.devices.mobile,
      tablet: acc.tablet + day.devices.tablet
    }), { desktop: 0, mobile: 0, tablet: 0 });

    const platformTotals = trends.reduce((acc, day) => ({
      web: acc.web + day.platforms.web,
      desktop: acc.desktop + day.platforms.desktop,
      mobile: acc.mobile + day.platforms.mobile
    }), { web: 0, desktop: 0, mobile: 0 });

    // Convert to percentages
    const devicePercentages = totalPlays > 0 ? {
      desktop: Math.round((deviceTotals.desktop / totalPlays) * 100),
      mobile: Math.round((deviceTotals.mobile / totalPlays) * 100),
      tablet: Math.round((deviceTotals.tablet / totalPlays) * 100)
    } : { desktop: 0, mobile: 0, tablet: 0 };

    const platformPercentages = totalPlays > 0 ? {
      web: Math.round((platformTotals.web / totalPlays) * 100),
      desktop: Math.round((platformTotals.desktop / totalPlays) * 100),
      mobile: Math.round((platformTotals.mobile / totalPlays) * 100)
    } : { web: 0, desktop: 0, mobile: 0 };

    // Mock geographic data for now (would need IP geolocation in real implementation)
    const countryPercentages = {
      'United States': Math.floor(Math.random() * 30) + 20,
      'United Kingdom': Math.floor(Math.random() * 15) + 10,
      'Germany': Math.floor(Math.random() * 15) + 10,
      'Canada': Math.floor(Math.random() * 10) + 5,
      'Others': Math.floor(Math.random() * 20) + 10
    };

    const response = {
      timeRange,
      trends,
      summary: {
        totalPlays,
        totalUniquePlayers: new Set(playSessionsData?.map(s => s.player_id).filter(Boolean)).size,
        totalProjects: new Set(playSessionsData?.map(s => s.game_id).filter(Boolean)).size,
        avgSessionDuration: totalPlays > 0 ? Math.round(
          (playSessionsData?.reduce((sum, s) => sum + (s.session_duration || 0), 0) || 0) / totalPlays
        ) : 0
      },
      demographics: {
        devices: devicePercentages,
        platforms: platformPercentages,
        countries: countryPercentages
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Analytics trends API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}