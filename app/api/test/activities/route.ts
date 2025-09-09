import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activities/logger';

/**
 * Test endpoint for creating sample activities
 * This endpoint is for testing purposes only
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
    const { action, count = 1 } = body;

    const sampleActivities = [
      {
        activityType: 'project_created',
        title: 'Created "Pixel Adventure"',
        description: 'Created a new platformer game with pixel art graphics and challenging levels',
        metadata: { game_type: 'platformer', difficulty: 'medium' },
      },
      {
        activityType: 'asset_uploaded',
        title: 'Uploaded player sprite',
        description: 'Added a new character sprite for the main player',
        metadata: { asset_type: 'sprite', file_size: 2048 },
      },
      {
        activityType: 'achievement_unlocked',
        title: 'Unlocked "First Steps"',
        description: 'Earned the "First Steps" achievement for creating your first game!',
        metadata: { achievement_title: 'First Steps', category: 'creation' },
      },
      {
        activityType: 'template_used',
        title: 'Used "Platformer Starter"',
        description: 'Created a new project using the Platformer Starter template',
        metadata: { template_name: 'Platformer Starter', category: 'official' },
      },
      {
        activityType: 'project_published',
        title: 'Published "Space Shooter"',
        description: 'Published Space Shooter for everyone to play and enjoy!',
        metadata: { game_type: 'shooter', plays_expected: 100 },
      },
    ];

    const results = [];

    if (action === 'create_sample') {
      // Create sample activities
      for (let i = 0; i < Math.min(count, 5); i++) {
        const activity = sampleActivities[i % sampleActivities.length];
        
        const activityId = await logActivity({
          userId: user.id,
          activityType: activity.activityType as any,
          title: activity.title + (i > 0 ? ` ${i + 1}` : ''),
          description: activity.description,
          metadata: activity.metadata,
          visibility: 'public',
        });

        if (activityId) {
          results.push({ activityId, ...activity });
        }
      }
    } else if (action === 'simulate_game_creation') {
      // Simulate a full game creation flow
      const gameTitle = `Test Game ${Date.now()}`;
      
      // 1. Project created
      const createId = await logActivity({
        userId: user.id,
        activityType: 'project_created',
        title: `Created "${gameTitle}"`,
        description: `Started working on a new game called "${gameTitle}"`,
        metadata: { game_type: 'platformer' },
        visibility: 'public',
      });

      // 2. Asset uploaded
      const assetId = await logActivity({
        userId: user.id,
        activityType: 'asset_uploaded',
        title: 'Uploaded game assets',
        description: `Added sprites and graphics for "${gameTitle}"`,
        metadata: { asset_type: 'sprite', count: 5 },
        visibility: 'public',
      });

      // 3. Template used (optional)
      const templateId = await logActivity({
        userId: user.id,
        activityType: 'template_used',
        title: 'Used Platformer Template',
        description: `Applied the platformer template to "${gameTitle}"`,
        metadata: { template_name: 'Basic Platformer' },
        visibility: 'public',
      });

      results.push({ createId, assetId, templateId, gameTitle });
    }

    return NextResponse.json({
      success: true,
      message: `Created ${results.length} test activities`,
      activities: results,
    });

  } catch (error) {
    console.error('Test activities API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check activity counts
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return mock counts until table is deployed
    const totalActivities = 0;
    const publicActivities = 0;
    const recentActivities: any[] = [];

    return NextResponse.json({
      userActivities: totalActivities || 0,
      publicActivities: publicActivities || 0,
      recentActivities: recentActivities || [],
    });

  } catch (error) {
    console.error('Test activities GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}