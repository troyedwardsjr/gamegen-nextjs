import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/database.types';

/**
 * Record template usage when a user creates a project from a template
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: templateId } = await params;

    // Get authenticated user (optional - can track anonymous usage)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const userId = user?.id || null;

    const body = await request.json();
    const { gameId, usageType = 'create_project', metadata = {} } = body;

    // Validate template exists
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .eq('status', 'approved')
      .single();

    if (templateError || !template) {
      return NextResponse.json({ 
        error: 'Template not found or not available' 
      }, { status: 404 });
    }

    try {
      // Use any to bypass TypeScript issues with new tables not in types yet
      const supabaseAny = supabase as any;
      
      // Record template usage
      const { data: usage, error: usageError } = await supabaseAny
        .from('template_usage')
        .insert({
          template_id: templateId,
          user_id: userId,
          game_id: gameId,
          usage_type: usageType,
          metadata: {
            ...metadata,
            user_agent: request.headers.get('user-agent'),
            timestamp: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (usageError) {
        console.error('Error recording template usage:', usageError);
        // Don't fail the request if usage tracking fails
      }

      // Update template download count
      const { error: updateError } = await supabase
        .from('templates')
        .update({ 
          download_count: (template.download_count || 0) + 1 
        })
        .eq('id', templateId);

      if (updateError) {
        console.warn('Failed to update template download count:', updateError);
      }

      return NextResponse.json({
        success: true,
        templateId,
        usageId: usage?.id,
        message: 'Template usage recorded successfully'
      });

    } catch (dbError) {
      console.warn('Template usage table not available, using fallback:', dbError);
      
      // Fallback: just update the download count
      const { error: updateError } = await supabase
        .from('templates')
        .update({ 
          download_count: (template.download_count || 0) + 1 
        })
        .eq('id', templateId);

      if (updateError) {
        console.warn('Failed to update template download count:', updateError);
      }

      return NextResponse.json({
        success: true,
        templateId,
        message: 'Template usage recorded (fallback mode)'
      });
    }

  } catch (error) {
    console.error('Template usage API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get template usage statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: templateId } = await params;

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this template's stats
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('creator_id')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ 
        error: 'Template not found' 
      }, { status: 404 });
    }

    // Only template creator can see usage stats
    if (template.creator_id !== user.id) {
      return NextResponse.json({ 
        error: 'Access denied' 
      }, { status: 403 });
    }

    try {
      // Use any to bypass TypeScript issues with new tables not in types yet
      const supabaseAny = supabase as any;
      
      // Get usage statistics
      const { data: usageStats, error: statsError } = await supabaseAny
        .from('template_usage')
        .select('usage_type, created_at, metadata')
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      if (statsError) {
        console.error('Error fetching usage stats:', statsError);
        return NextResponse.json({ error: 'Failed to fetch usage statistics' }, { status: 500 });
      }

      // Aggregate statistics
      const stats = {
        totalUsage: usageStats?.length || 0,
        byType: {} as Record<string, number>,
        recentUsage: usageStats?.slice(0, 10) || [],
        dailyUsage: {} as Record<string, number>,
      };

      usageStats?.forEach((usage: any) => {
        // Count by type
        stats.byType[usage.usage_type] = (stats.byType[usage.usage_type] || 0) + 1;
        
        // Count by day
        const day = new Date(usage.created_at).toISOString().split('T')[0];
        stats.dailyUsage[day] = (stats.dailyUsage[day] || 0) + 1;
      });

      return NextResponse.json({
        templateId,
        stats,
      });

    } catch (dbError) {
      console.warn('Template usage table not available:', dbError);
      
      // Fallback: get basic stats from template table
      const { data: basicTemplate, error: basicError } = await supabase
        .from('templates')
        .select('download_count, rating, rating_count, created_at')
        .eq('id', templateId)
        .single();

      if (basicError) {
        return NextResponse.json({ error: 'Failed to fetch template statistics' }, { status: 500 });
      }

      return NextResponse.json({
        templateId,
        stats: {
          totalUsage: basicTemplate.download_count || 0,
          byType: { create_project: basicTemplate.download_count || 0 },
          recentUsage: [],
          dailyUsage: {},
          rating: basicTemplate.rating,
          ratingCount: basicTemplate.rating_count,
        },
      });
    }

  } catch (error) {
    console.error('Get template usage stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}