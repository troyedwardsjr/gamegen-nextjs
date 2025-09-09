import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ProjectGridItem, ProjectFilter, ProjectSort, ProjectSearchResult } from '@/types/dashboard';
import { Database } from '@/lib/supabase/database.types';
import { getAuthenticatedUser, createAuthErrorResponse } from '@/lib/auth/dev-server-auth';

type GameRow = Database['public']['Tables']['games']['Row'];

// Define valid game statuses and types based on the dashboard types and database constraints
const VALID_GAME_STATUSES = ['draft', 'in_development', 'testing', 'published', 'archived'] as const;
const VALID_GAME_TYPES = ['bullet_hell', 'rpg', 'action_adventure', 'team_deathmatch', 'platformer', 'puzzle', 'racing', 'strategy', 'simulation', 'other'] as const;
const VALID_VISIBILITIES = ['private', 'unlisted', 'public', 'educational'] as const;
const VALID_SORT_FIELDS = ['title', 'created_at', 'updated_at', 'play_count', 'like_count'] as const;

interface QueryParams {
  page?: string;
  limit?: string;
  search?: string;
  status?: string;
  gameType?: string;
  visibility?: string;
  tags?: string;
  sortField?: string;
  sortDirection?: string;
  dateStart?: string;
  dateEnd?: string;
}

/**
 * Transform database game row to ProjectGridItem
 */
function transformGameToProjectGridItem(game: GameRow, commentCounts: Record<string, number> = {}): ProjectGridItem {
  // Calculate relative time for lastModified
  const lastModified = game.updated_at || game.created_at || new Date().toISOString();
  
  // Map database fields to ProjectGridItem
  return {
    id: game.id,
    user_id: game.creator_id,
    title: game.title,
    description: game.description,
    slug: game.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    game_type: game.genre as any, // Map genre to game_type
    status: 'published', // Default status since games table doesn't have status field yet
    visibility: (game.visibility as any) || 'private',
    thumbnail_url: game.thumbnail_url,
    lastModified: lastModified,
    tags: game.tags || [],
    analyticsPreview: {
      plays: game.play_count || 0,
      likes: game.like_count || 0,
      comments: commentCounts[game.id] || 0,
    },
    genre_tags: game.tags || [],
    target_audience: 'all', // Default value
    difficulty_level: 'intermediate', // Default value
    estimated_playtime_minutes: 30, // Default value
    game_config: game.game_data || {},
    source_code: {},
    compiled_game_url: null,
    screenshots: game.screenshot_urls || [],
    is_template: game.is_template || false,
    template_category: null,
    play_count: game.play_count || 0,
    like_count: game.like_count || 0,
    comment_count: commentCounts[game.id] || 0,
    rating_average: 0, // TODO: Calculate from ratings
    rating_count: 0, // TODO: Calculate from ratings
    featured_at: game.is_featured ? game.created_at : null,
    published_at: game.published_at,
    last_played_at: null, // TODO: Get from play_sessions
    version: 1, // Default version
    toxoid_version: '1.0.0', // Default version
    build_status: 'success', // Default status
    build_log: null,
    seo_title: null,
    seo_description: null,
    created_at: game.created_at || new Date().toISOString(),
    updated_at: game.updated_at || new Date().toISOString(),
  };
}

/**
 * Build database query with filters, sorting, and pagination
 */
function buildQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  filters: ProjectFilter,
  sort: ProjectSort,
  search: string,
  page: number,
  limit: number
) {
  let query = supabase
    .from('games')
    .select('*')
    .eq('creator_id', userId);

  // Apply search
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply filters
  if (filters.gameType?.length) {
    query = query.in('genre', filters.gameType);
  }

  if (filters.visibility?.length) {
    query = query.in('visibility', filters.visibility);
  }

  if (filters.tags?.length) {
    // Use overlap operator for array fields
    query = query.overlaps('tags', filters.tags);
  }

  if (filters.dateRange) {
    if (filters.dateRange.start) {
      query = query.gte('created_at', filters.dateRange.start.toISOString());
    }
    if (filters.dateRange.end) {
      query = query.lte('created_at', filters.dateRange.end.toISOString());
    }
  }

  // Apply sorting
  query = query.order(sort.field, { ascending: sort.direction === 'asc' });

  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  return query;
}

/**
 * Get comment counts for games
 */
async function getCommentCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gameIds: string[]
): Promise<Record<string, number>> {
  if (gameIds.length === 0) return {};

  const { data: comments } = await supabase
    .from('game_comments')
    .select('game_id')
    .in('game_id', gameIds)
    .eq('is_deleted', false);

  const commentCounts: Record<string, number> = {};
  comments?.forEach(comment => {
    commentCounts[comment.game_id] = (commentCounts[comment.game_id] || 0) + 1;
  });

  return commentCounts;
}

/**
 * Get total count for pagination
 */
async function getTotalCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  filters: ProjectFilter,
  search: string
): Promise<number> {
  let query = supabase
    .from('games')
    .select('id', { count: 'exact', head: true })
    .eq('creator_id', userId);

  // Apply same filters as main query
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (filters.gameType?.length) {
    query = query.in('genre', filters.gameType);
  }

  if (filters.visibility?.length) {
    query = query.in('visibility', filters.visibility);
  }

  if (filters.tags?.length) {
    query = query.overlaps('tags', filters.tags);
  }

  if (filters.dateRange) {
    if (filters.dateRange.start) {
      query = query.gte('created_at', filters.dateRange.start.toISOString());
    }
    if (filters.dateRange.end) {
      query = query.lte('created_at', filters.dateRange.end.toISOString());
    }
  }

  const { count } = await query;
  return count || 0;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user (with dev mode support)
    const { user, error: authError } = await getAuthenticatedUser(supabase, request);
    
    if (authError || !user) {
      const errorResponse = createAuthErrorResponse(authError, true);
      return NextResponse.json(errorResponse, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params: QueryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      gameType: searchParams.get('gameType') || undefined,
      visibility: searchParams.get('visibility') || undefined,
      tags: searchParams.get('tags') || undefined,
      sortField: searchParams.get('sortField') || undefined,
      sortDirection: searchParams.get('sortDirection') || undefined,
      dateStart: searchParams.get('dateStart') || undefined,
      dateEnd: searchParams.get('dateEnd') || undefined,
    };

    // Validate and parse parameters
    const page = Math.max(1, parseInt(params.page || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit || '12')));
    const search = params.search || '';
    
    // Parse filters
    const filters: ProjectFilter = {};
    
    if (params.status) {
      const statuses = params.status.split(',').filter(s => VALID_GAME_STATUSES.includes(s as any));
      if (statuses.length > 0) {
        filters.status = statuses as any[];
      }
    }
    
    if (params.gameType) {
      const gameTypes = params.gameType.split(',').filter(t => VALID_GAME_TYPES.includes(t as any));
      if (gameTypes.length > 0) {
        filters.gameType = gameTypes as any[];
      }
    }
    
    if (params.visibility) {
      const visibilities = params.visibility.split(',').filter(v => VALID_VISIBILITIES.includes(v as any));
      if (visibilities.length > 0) {
        filters.visibility = visibilities as any[];
      }
    }
    
    if (params.tags) {
      filters.tags = params.tags.split(',').filter(t => t.length > 0);
    }
    
    if (params.dateStart || params.dateEnd) {
      filters.dateRange = {
        start: params.dateStart ? new Date(params.dateStart) : new Date(0),
        end: params.dateEnd ? new Date(params.dateEnd) : new Date(),
      };
    }

    // Parse sorting
    const sortField = (params.sortField && VALID_SORT_FIELDS.includes(params.sortField as any)) 
      ? params.sortField as any 
      : 'updated_at';
    const sortDirection = params.sortDirection === 'asc' ? 'asc' : 'desc';
    const sort: ProjectSort = { field: sortField, direction: sortDirection };

    // Execute main query
    const query = buildQuery(supabase, user.id, filters, sort, search, page, limit);
    const { data: games, error: gamesError } = await query;

    if (gamesError) {
      console.error('Error fetching games:', gamesError);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Get comment counts for the games
    const gameIds = games?.map(g => g.id) || [];
    const commentCounts = await getCommentCounts(supabase, gameIds);

    // Transform games to ProjectGridItems
    const projects: ProjectGridItem[] = games?.map(game => 
      transformGameToProjectGridItem(game, commentCounts)
    ) || [];

    // Get total count for pagination
    const totalCount = await getTotalCount(supabase, user.id, filters, search);

    // Build response
    const response: ProjectSearchResult = {
      projects,
      totalCount,
      hasNextPage: page * limit < totalCount,
      facets: {
        statuses: [], // TODO: Implement facets
        gameTypes: [], // TODO: Implement facets
        tags: [], // TODO: Implement facets
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Dashboard projects API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}