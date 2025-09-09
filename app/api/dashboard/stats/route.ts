import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DashboardStats } from '@/types/dashboard';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile to get subscription and credits info
    const { data: profile } = await supabase
      .from('profiles')
      .select('credits_remaining, credits_used_today')
      .eq('id', user.id)
      .single();

    // Fetch games count and aggregated analytics
    const { data: gamesData } = await supabase
      .from('games')
      .select(`
        id,
        play_count,
        like_count,
        is_template
      `)
      .eq('creator_id', user.id);

    // Calculate basic stats from games
    const gamesCreated = gamesData?.length || 0;
    const totalPlays = gamesData?.reduce((sum, game) => sum + (game.play_count || 0), 0) || 0;
    const totalLikes = gamesData?.reduce((sum, game) => sum + (game.like_count || 0), 0) || 0;

    // Count total assets
    const { count: totalAssets } = await supabase
      .from('game_assets')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', user.id);

    // Count followers (people following this user)
    const { count: communityFollowers } = await supabase
      .from('user_follows')
      .select('id', { count: 'exact', head: true })
      .eq('following_id', user.id);

    // Count active collaboration sessions
    const { count: totalCollaborations } = await supabase
      .from('collaboration_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('host_user_id', user.id);

    // TODO: Implement achievements system - for now use mock data
    const achievementsUnlocked = 0;

    // Calculate credits info
    const creditsRemaining = profile?.credits_remaining || 0;
    const creditsUsed = profile?.credits_used_today || 0;
    const totalCreditsAllowance = 4000; // This should come from subscription tier
    const remainingFromAllowance = Math.max(0, totalCreditsAllowance - creditsUsed);

    const stats: DashboardStats = {
      gamesCreated,
      totalPlays,
      communityFollowers: communityFollowers || 0,
      achievementsUnlocked,
      totalAssets: totalAssets || 0,
      totalCollaborations: totalCollaborations || 0,
      creditsUsed,
      creditsRemaining: Math.max(creditsRemaining, remainingFromAllowance),
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}