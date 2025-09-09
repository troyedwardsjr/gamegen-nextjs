import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GameTemplate } from '@/types/dashboard';
import { Database } from '@/lib/supabase/database.types';

type TemplateRow = Database['public']['Tables']['templates']['Row'];
type GameRow = Database['public']['Tables']['games']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

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
    gameType: game.genre as any,
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
    isOfficial: template.category === 'educational' || template.category === 'commercial',
    isFeatured: game.is_featured || false,
    estimatedTimeToComplete: 30,
    features: extractFeatures(game.game_data),
    requirements: ['Basic Game Logic'],
    gameConfig: game.game_data || {},
    sourceCode: undefined,
    createdAt: template.created_at || new Date().toISOString(),
    updatedAt: template.updated_at || new Date().toISOString(),
  };
}

function mapCategoryToTemplateCategory(category: string): any {
  const categoryMap: Record<string, string> = {
    'educational': 'educational',
    'commercial': 'official',
    'entertainment': 'community',
    'tutorial': 'beginner',
  };
  return categoryMap[category] || 'community';
}

function extractFeatures(gameData: any): string[] {
  const features: string[] = [];
  if (gameData?.physics) features.push('Physics Engine');
  if (gameData?.multiplayer) features.push('Multiplayer Support');
  if (gameData?.ai) features.push('AI Entities');
  return features.length > 0 ? features : ['Basic Gameplay'];
}

/**
 * Get featured templates - combines featured games and official templates
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get('limit') || '12')));

    // Query featured templates (either featured games or official categories)
    const { data: templatesData, error: templatesError } = await supabase
      .from('templates')
      .select(`
        *,
        games!inner(*),
        profiles!inner(*)
      `)
      .eq('status', 'approved')
      .or('games.is_featured.eq.true,category.in.(educational,commercial)')
      .order('games.is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (templatesError) {
      console.error('Error fetching featured templates:', templatesError);
      
      // Return empty array with proper structure when there's a database error
      // This allows the frontend to handle the empty state gracefully
      return NextResponse.json({
        templates: [],
        totalCount: 0,
        message: 'Templates are currently unavailable. Please check back later.',
      });
    }

    // Handle empty database case - return empty array with proper structure
    if (!templatesData || templatesData.length === 0) {
      console.log('No featured templates found in database - returning empty array');
      return NextResponse.json({
        templates: [],
        totalCount: 0,
        message: 'No featured templates available at the moment.',
      });
    }

    // Get mock usage and rating data
    const templates: GameTemplate[] = templatesData.map((item: any) => {
      const usage = Math.floor(Math.random() * 2000) + 500; // Mock high usage for featured
      const rating = 4.0 + Math.random() * 1.0; // Mock high rating for featured
      const ratingCount = Math.floor(Math.random() * 100) + 50;
      
      return transformTemplateToGameTemplate(
        item, 
        item.games, 
        item.profiles, 
        usage,
        rating,
        ratingCount
      );
    });

    return NextResponse.json({
      templates,
      totalCount: templates.length,
    });

  } catch (error) {
    console.error('Featured templates API error:', error);
    
    // Return empty array with proper structure instead of 500 error
    // This provides better UX by allowing the app to continue functioning
    return NextResponse.json({
      templates: [],
      totalCount: 0,
      message: 'Unable to load templates at the moment. Please try again later.',
    });
  }
}