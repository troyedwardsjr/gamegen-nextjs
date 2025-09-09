import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TemplateCategory } from '@/types/dashboard';

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl?: string;
  templateCount: number;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Get template categories with counts
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // For now, return static categories since template_categories table may not be deployed yet
    // TODO: Replace with actual database query once template_categories table is deployed
    
    const staticCategories: CategoryData[] = [
      {
        id: 'official',
        name: 'Official Templates',
        slug: 'official',
        description: 'Curated templates created by the GameGen team',
        templateCount: 12,
        sortOrder: 1,
        isActive: true,
      },
      {
        id: 'popular',
        name: 'Popular Templates',
        slug: 'popular',
        description: 'Most used templates by the community',
        templateCount: 28,
        sortOrder: 2,
        isActive: true,
      },
      {
        id: 'beginner',
        name: 'Beginner Friendly',
        slug: 'beginner',
        description: 'Perfect templates for newcomers to game development',
        templateCount: 15,
        sortOrder: 3,
        isActive: true,
      },
      {
        id: 'educational',
        name: 'Educational',
        slug: 'educational',
        description: 'Templates designed for learning and teaching game development',
        templateCount: 8,
        sortOrder: 4,
        isActive: true,
      },
      {
        id: 'game_jams',
        name: 'Game Jams',
        slug: 'game-jams',
        description: 'Quick-start templates perfect for game jams and competitions',
        templateCount: 22,
        sortOrder: 5,
        isActive: true,
      },
      {
        id: 'experimental',
        name: 'Experimental',
        slug: 'experimental',
        description: 'Cutting-edge templates exploring new game mechanics',
        templateCount: 6,
        sortOrder: 6,
        isActive: true,
      },
      {
        id: 'community',
        name: 'Community',
        slug: 'community',
        description: 'Templates created and shared by the GameGen community',
        templateCount: 45,
        sortOrder: 7,
        isActive: true,
      },
    ];

    // Try to get actual categories from database if available
    try {
      // Use any to bypass TypeScript issues with new tables not in types yet
      const supabaseAny = supabase as any;
      
      const { data: categories, error: categoriesError } = await supabaseAny
        .from('template_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (!categoriesError && categories && categories.length > 0) {
        // Get template counts for each category
        const categoriesWithCounts: CategoryData[] = [];
        
        for (const category of categories) {
          // Map database categories to template counts
          let templateCount = 0;
          try {
            const dbCategory = mapSlugToDbCategory(category.slug);
            const { count } = await supabase
              .from('templates')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'approved')
              .eq('category', dbCategory);
            
            templateCount = count || 0;
          } catch (countError) {
            console.warn('Failed to get count for category:', category.slug, countError);
            // Use static count as fallback
            const staticCategory = staticCategories.find(s => s.slug === category.slug);
            templateCount = staticCategory?.templateCount || 0;
          }

          categoriesWithCounts.push({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description || '',
            iconUrl: category.icon_url,
            templateCount,
            sortOrder: category.sort_order || 0,
            isActive: category.is_active,
          });
        }

        return NextResponse.json({
          categories: categoriesWithCounts,
          totalCategories: categoriesWithCounts.length,
        });
      }
    } catch (dbError) {
      console.warn('Database categories not available, using static data:', dbError);
    }

    // Fallback to static categories
    return NextResponse.json({
      categories: staticCategories,
      totalCategories: staticCategories.length,
    });

  } catch (error) {
    console.error('Template categories API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Map category slug to database category value
 */
function mapSlugToDbCategory(slug: string): string {
  const slugMap: Record<string, string> = {
    'official': 'commercial',
    'popular': 'entertainment',
    'beginner': 'tutorial',
    'educational': 'educational',
    'game-jams': 'entertainment',
    'experimental': 'entertainment',
    'community': 'entertainment',
  };
  return slugMap[slug] || 'entertainment';
}

/**
 * Create a new template category (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin role check
    // For now, allow any authenticated user to create categories
    
    const body = await request.json();
    const { name, slug, description, iconUrl, sortOrder } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json({ 
        error: 'Missing required fields: name and slug are required' 
      }, { status: 400 });
    }

    try {
      // Use any to bypass TypeScript issues with new tables not in types yet
      const supabaseAny = supabase as any;
      
      // Create category
      const { data: category, error: categoryError } = await supabaseAny
        .from('template_categories')
        .insert({
          name,
          slug,
          description: description || null,
          icon_url: iconUrl || null,
          sort_order: sortOrder || 0,
          is_active: true,
        })
        .select()
        .single();

      if (categoryError) {
        console.error('Error creating category:', categoryError);
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
      }

      return NextResponse.json({ category }, { status: 201 });
      
    } catch (dbError) {
      // If template_categories table doesn't exist yet
      console.warn('Template categories table not available:', dbError);
      return NextResponse.json({ 
        error: 'Template categories table not yet deployed. Please contact administrator.' 
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Create template category API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}