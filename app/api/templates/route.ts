import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GameTemplate, TemplateCategory, TemplateFilter } from '@/types/dashboard';
import { Database } from '@/lib/supabase/database.types';

type TemplateRow = Database['public']['Tables']['templates']['Row'];
type GameRow = Database['public']['Tables']['games']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

// Define valid template categories and difficulties
const VALID_TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'official', 'popular', 'beginner', 'educational', 'game_jams', 'experimental', 'community'
];
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
const VALID_SORT_FIELDS = ['name', 'created_at', 'updated_at', 'download_count', 'rating'] as const;

interface QueryParams {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  difficulty?: string;
  gameType?: string;
  isOfficial?: string;
  isFeatured?: string;
  tags?: string;
  sortField?: string;
  sortDirection?: string;
}

/**
 * Transform database template row to GameTemplate
 */
function transformTemplateToGameTemplate(
  template: TemplateRow,
  game: GameRow,
  creator: ProfileRow,
  usage_count: number = 0,
  rating: number = 0,
  rating_count: number = 0
): GameTemplate {
  return {
    id: template.id,
    title: template.name,
    description: template.description || '',
    category: mapCategoryToTemplateCategory(template.category || 'community'),
    gameType: game.genre as any, // Map from game genre
    difficulty: (template.difficulty as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
    thumbnailUrl: game.thumbnail_url || '/api/placeholder/300/200',
    screenshots: game.screenshot_urls || [],
    tags: game.tags || [],
    usageCount: usage_count,
    rating: rating,
    ratingCount: rating_count,
    author: {
      id: creator.id,
      displayName: creator.display_name || creator.username,
      avatarUrl: creator.avatar_url || undefined,
    },
    isOfficial: template.category === 'educational' || template.category === 'commercial', // Map to official status
    isFeatured: game.is_featured || false,
    estimatedTimeToComplete: 30, // TODO: Calculate from template metadata
    features: extractFeatures(game.game_data),
    requirements: ['Basic Game Logic'], // TODO: Extract from template metadata
    gameConfig: game.game_data || {},
    sourceCode: undefined, // TODO: Get from game scripts if needed
    createdAt: template.created_at || new Date().toISOString(),
    updatedAt: template.updated_at || new Date().toISOString(),
  };
}

/**
 * Map database category to TemplateCategory
 */
function mapCategoryToTemplateCategory(category: string): TemplateCategory {
  const categoryMap: Record<string, TemplateCategory> = {
    'educational': 'educational',
    'commercial': 'official',
    'entertainment': 'community',
    'tutorial': 'beginner',
  };
  return categoryMap[category] || 'community';
}

/**
 * Extract features from game data
 */
function extractFeatures(gameData: any): string[] {
  // TODO: Implement feature extraction logic based on game configuration
  const features: string[] = [];
  if (gameData?.physics) features.push('Physics Engine');
  if (gameData?.multiplayer) features.push('Multiplayer Support');
  if (gameData?.ai) features.push('AI Entities');
  return features.length > 0 ? features : ['Basic Gameplay'];
}

/**
 * Build database query with filters, sorting, and pagination
 */
function buildQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  filters: TemplateFilter,
  search: string,
  page: number,
  limit: number,
  sortField: string,
  sortDirection: string
) {
  let query = supabase
    .from('templates')
    .select(`
      *,
      games!inner(*),
      profiles!inner(*)
    `)
    .eq('status', 'approved'); // Only show approved templates

  // Apply search
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Apply filters
  if (filters.category?.length) {
    const dbCategories = filters.category.map(cat => {
      switch (cat) {
        case 'official': return 'commercial';
        case 'educational': return 'educational';
        case 'beginner': return 'tutorial';
        default: return 'entertainment';
      }
    });
    query = query.in('category', dbCategories);
  }

  if (filters.difficulty?.length) {
    query = query.in('difficulty', filters.difficulty);
  }

  if (filters.gameType?.length) {
    query = query.in('games.genre', filters.gameType);
  }

  if (filters.isOfficial !== undefined) {
    if (filters.isOfficial) {
      query = query.in('category', ['educational', 'commercial']);
    } else {
      query = query.not('category', 'in', '(educational,commercial)');
    }
  }

  if (filters.isFeatured !== undefined) {
    query = query.eq('games.is_featured', filters.isFeatured);
  }

  if (filters.tags?.length) {
    query = query.overlaps('games.tags', filters.tags);
  }

  // Apply sorting
  const sortMapping: Record<string, string> = {
    'name': 'name',
    'created_at': 'created_at',
    'updated_at': 'updated_at',
    'download_count': 'download_count',
    'rating': 'rating',
  };
  const dbSortField = sortMapping[sortField] || 'updated_at';
  query = query.order(dbSortField, { ascending: sortDirection === 'asc' });

  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);

  return query;
}

/**
 * Get template usage counts
 */
async function getTemplateUsageCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  templateIds: string[]
): Promise<Record<string, number>> {
  if (templateIds.length === 0) return {};

  // For now, use download_count from templates table
  // TODO: Implement actual usage tracking from template_usage table once it's deployed
  const usageCounts: Record<string, number> = {};
  templateIds.forEach(id => {
    usageCounts[id] = Math.floor(Math.random() * 1000) + 100; // Mock data for now
  });
  return usageCounts;
}

/**
 * Get template ratings
 */
async function getTemplateRatings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  templateIds: string[]
): Promise<Record<string, { rating: number; count: number }>> {
  if (templateIds.length === 0) return {};

  // TODO: Implement actual ratings from template_ratings table once it's deployed
  const ratings: Record<string, { rating: number; count: number }> = {};
  templateIds.forEach(id => {
    ratings[id] = {
      rating: 3.5 + Math.random() * 1.5, // Mock rating between 3.5-5.0
      count: Math.floor(Math.random() * 50) + 10, // Mock count between 10-60
    };
  });
  return ratings;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params: QueryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      gameType: searchParams.get('gameType') || undefined,
      isOfficial: searchParams.get('isOfficial') || undefined,
      isFeatured: searchParams.get('isFeatured') || undefined,
      tags: searchParams.get('tags') || undefined,
      sortField: searchParams.get('sortField') || undefined,
      sortDirection: searchParams.get('sortDirection') || undefined,
    };

    // Validate and parse parameters
    const page = Math.max(1, parseInt(params.page || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(params.limit || '12')));
    const search = params.search || '';
    
    // Parse filters
    const filters: TemplateFilter = {};
    
    if (params.category) {
      const categories = params.category.split(',').filter(c => 
        VALID_TEMPLATE_CATEGORIES.includes(c as TemplateCategory)
      ) as TemplateCategory[];
      if (categories.length > 0) {
        filters.category = categories;
      }
    }
    
    if (params.difficulty) {
      const difficulties = params.difficulty.split(',').filter(d => 
        VALID_DIFFICULTIES.includes(d as any)
      ) as ('beginner' | 'intermediate' | 'advanced')[];
      if (difficulties.length > 0) {
        filters.difficulty = difficulties;
      }
    }
    
    if (params.gameType) {
      filters.gameType = params.gameType.split(',').filter(t => t.length > 0) as any[];
    }
    
    if (params.isOfficial) {
      filters.isOfficial = params.isOfficial === 'true';
    }
    
    if (params.isFeatured) {
      filters.isFeatured = params.isFeatured === 'true';
    }
    
    if (params.tags) {
      filters.tags = params.tags.split(',').filter(t => t.length > 0);
    }

    // Parse sorting
    const sortField = (params.sortField && VALID_SORT_FIELDS.includes(params.sortField as any)) 
      ? params.sortField as any 
      : 'updated_at';
    const sortDirection = params.sortDirection === 'asc' ? 'asc' : 'desc';

    // Execute main query
    const query = buildQuery(supabase, filters, search, page, limit, sortField, sortDirection);
    const { data: templatesData, error: templatesError } = await query;

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    // Get additional data for templates
    const templateIds = templatesData?.map(t => t.id) || [];
    const usageCounts = await getTemplateUsageCounts(supabase, templateIds);
    const ratings = await getTemplateRatings(supabase, templateIds);

    // Transform to GameTemplate objects
    const templates: GameTemplate[] = templatesData?.map((item: any) => {
      const usage = usageCounts[item.id] || 0;
      const ratingData = ratings[item.id] || { rating: 0, count: 0 };
      
      return transformTemplateToGameTemplate(
        item, 
        item.games, 
        item.profiles, 
        usage,
        ratingData.rating,
        ratingData.count
      );
    }) || [];

    // Get total count for pagination
    let countQuery = supabase
      .from('templates')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'approved');

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { count: totalCount } = await countQuery;

    return NextResponse.json({
      templates,
      totalCount: totalCount || 0,
      hasNextPage: page * limit < (totalCount || 0),
      page,
      limit,
    });

  } catch (error) {
    console.error('Templates API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { gameId, name, description, category, difficulty, price } = body;

    // Validate required fields
    if (!gameId || !name) {
      return NextResponse.json({ 
        error: 'Missing required fields: gameId and name are required' 
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

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('templates')
      .insert({
        creator_id: user.id,
        game_id: gameId,
        name,
        description: description || null,
        category: category || 'entertainment',
        difficulty: difficulty || 'beginner',
        price: price || 0,
        status: 'pending', // Templates need approval
      })
      .select()
      .single();

    if (templateError) {
      console.error('Error creating template:', templateError);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({ template }, { status: 201 });

  } catch (error) {
    console.error('Create template API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}