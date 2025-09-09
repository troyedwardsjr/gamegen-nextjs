import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ActivityItem, ActivityType } from '@/types/dashboard';
import { UserActivitiesRow } from '@/types/supabase-activities';

interface QueryParams {
  page?: string;
  limit?: string;
  type?: string;
  since?: string;
  until?: string;
}

const VALID_ACTIVITY_TYPES: ActivityType[] = [
  'project_created', 'project_updated', 'project_published',
  'project_played', 'project_liked', 'project_commented',
  'collaboration_invited', 'collaboration_accepted',
  'asset_uploaded', 'achievement_unlocked', 'template_used'
];

/**
 * Transform database activity row to ActivityItem
 */
function transformActivityToItem(activity: any, users: any[], games: any[]): ActivityItem {
  // Find related user and game
  const user = users.find(u => u.id === activity.user_id);
  const relatedGame = activity.related_game_id ? games.find(g => g.id === activity.related_game_id) : null;

  return {
    id: activity.id,
    type: activity.activity_type as ActivityType,
    title: activity.title,
    description: activity.description,
    timestamp: activity.created_at,
    user: {
      id: user?.id || activity.user_id,
      displayName: user?.display_name || user?.username || 'Unknown User',
      avatarUrl: user?.avatar_url || null,
    },
    project: relatedGame ? {
      id: relatedGame.id,
      title: relatedGame.title,
      slug: relatedGame.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    } : undefined,
    metadata: activity.metadata || {},
  };
}

// These functions will be restored once the user_activities table is deployed

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params: QueryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      type: searchParams.get('type') || undefined,
      since: searchParams.get('since') || undefined,
      until: searchParams.get('until') || undefined,
    };

    // Validate and parse parameters
    const page = Math.max(1, parseInt(params.page || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit || '20')));

    // Parse filters
    const filters: {
      type?: ActivityType[];
      since?: Date;
      until?: Date;
    } = {};

    if (params.type) {
      const types = params.type.split(',').filter(t => 
        VALID_ACTIVITY_TYPES.includes(t as ActivityType)
      ) as ActivityType[];
      
      if (types.length > 0) {
        filters.type = types;
      }
    }

    if (params.since) {
      try {
        filters.since = new Date(params.since);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid since date format' },
          { status: 400 }
        );
      }
    }

    if (params.until) {
      try {
        filters.until = new Date(params.until);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid until date format' },
          { status: 400 }
        );
      }
    }

    // For now, return empty data until the user_activities table is deployed
    // This will be replaced with actual data fetching after migration deployment
    const activities: any[] = [];
    console.log('Activities API called - returning empty data until migration is deployed');

    // Return empty data for now
    const transformedActivities: ActivityItem[] = [];
    const totalCount = 0;
    const hasNextPage = false;

    return NextResponse.json({
      activities: transformedActivities,
      totalCount,
      hasNextPage,
      page,
      limit,
    });

  } catch (error) {
    console.error('Dashboard activities API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for creating new activities manually (for testing or system events)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, description, relatedGameId, metadata = {}, visibility = 'public' } = body;

    // Validate required fields
    if (!type || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, description' },
        { status: 400 }
      );
    }

    if (!VALID_ACTIVITY_TYPES.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid activity type' },
        { status: 400 }
      );
    }

    // For now, return a mock response until the user_activities table is deployed
    const mockActivity = {
      id: `mock-${Date.now()}`,
      user_id: user.id,
      activity_type: type,
      title,
      description,
      related_game_id: relatedGameId || null,
      metadata,
      visibility,
      created_at: new Date().toISOString(),
    };

    console.log('Activity creation called - returning mock data until migration is deployed');
    return NextResponse.json({ activity: mockActivity }, { status: 201 });

  } catch (error) {
    console.error('Create activity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}