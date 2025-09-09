import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/lib/supabase/database.types';

type GameRow = Database['public']['Tables']['games']['Row'];

/**
 * Create a template from an existing game
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
    const { 
      gameId, 
      templateName, 
      templateDescription, 
      category, 
      difficulty, 
      price, 
      isPublic 
    } = body;

    // Validate required fields
    if (!gameId || !templateName) {
      return NextResponse.json({ 
        error: 'Missing required fields: gameId and templateName are required' 
      }, { status: 400 });
    }

    // Verify user owns the game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .eq('creator_id', user.id)
      .single();

    if (gameError || !game) {
      return NextResponse.json({ 
        error: 'Game not found or access denied' 
      }, { status: 404 });
    }

    // Ensure the game is in a suitable state to become a template
    if (game.visibility === 'private' && isPublic) {
      return NextResponse.json({ 
        error: 'Cannot create public template from private game. Please make the game public first.' 
      }, { status: 400 });
    }

    try {
      // Create template
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .insert({
          creator_id: user.id,
          game_id: gameId,
          name: templateName,
          description: templateDescription || `A template based on ${game.title}`,
          category: category || 'entertainment',
          difficulty: difficulty || 'intermediate',
          price: price || 0,
          status: 'pending', // Templates need approval
        })
        .select()
        .single();

      if (templateError) {
        console.error('Error creating template:', templateError);
        return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
      }

      // Mark the original game as a template source
      const { error: gameUpdateError } = await supabase
        .from('games')
        .update({ is_template: true })
        .eq('id', gameId);

      if (gameUpdateError) {
        console.warn('Failed to mark game as template source:', gameUpdateError);
        // Don't fail the request for this
      }

      // Get the created template with related data
      const { data: fullTemplate, error: fullTemplateError } = await supabase
        .from('templates')
        .select(`
          *,
          games(*),
          profiles(*)
        `)
        .eq('id', template.id)
        .single();

      if (fullTemplateError) {
        console.warn('Failed to get full template data:', fullTemplateError);
        return NextResponse.json({ template }, { status: 201 });
      }

      return NextResponse.json({ 
        template: fullTemplate,
        message: 'Template created successfully and is pending approval.'
      }, { status: 201 });

    } catch (dbError) {
      console.error('Database error creating template:', dbError);
      return NextResponse.json({ 
        error: 'Database error. The templates feature may not be fully deployed yet.' 
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Create template from game API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get games that can be converted to templates
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's games that are suitable for templates
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .eq('creator_id', user.id)
      .in('visibility', ['public', 'unlisted']) // Only games that can be shared
      .order('updated_at', { ascending: false });

    if (gamesError) {
      console.error('Error fetching games:', gamesError);
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
    }

    // Check which games already have templates
    const gameIds = games?.map(g => g.id) || [];
    let existingTemplates: string[] = [];
    
    if (gameIds.length > 0) {
      try {
        const { data: templates, error: templatesError } = await supabase
          .from('templates')
          .select('game_id')
          .in('game_id', gameIds);

        if (!templatesError && templates) {
          existingTemplates = templates.map(t => t.game_id);
        }
      } catch (templateError) {
        console.warn('Failed to check existing templates:', templateError);
        // Continue without this check
      }
    }

    // Transform games to include template status
    const gamesWithTemplateStatus = games?.map(game => ({
      id: game.id,
      title: game.title,
      description: game.description,
      genre: game.genre,
      tags: game.tags,
      thumbnail_url: game.thumbnail_url,
      screenshot_urls: game.screenshot_urls,
      visibility: game.visibility,
      play_count: game.play_count,
      like_count: game.like_count,
      created_at: game.created_at,
      updated_at: game.updated_at,
      hasTemplate: existingTemplates.includes(game.id),
      canCreateTemplate: !existingTemplates.includes(game.id) && game.visibility !== 'private',
    })) || [];

    return NextResponse.json({
      games: gamesWithTemplateStatus,
      totalCount: gamesWithTemplateStatus.length,
    });

  } catch (error) {
    console.error('Get template-ready games API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}