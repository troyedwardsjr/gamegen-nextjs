// Projects API functions for server-side data fetching

import type { ProjectGridItem, ProjectFilter, ProjectSort, ProjectSearchResult } from '@/types/dashboard';

interface GetProjectsParams {
  page?: number;
  limit?: number;
  search?: string;
  filters?: ProjectFilter;
  sort?: ProjectSort;
  includeAnalytics?: boolean;
}

export async function getProjects(params: GetProjectsParams): Promise<ProjectSearchResult> {
  try {
    // In a real implementation, this would fetch from Supabase
    // For now, return mock data with realistic delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const mockProjects: ProjectGridItem[] = [
      {
        // GameProject (database) properties
        id: '1',
        user_id: 'user-123',
        title: 'Pixel Adventure Quest',
        description: 'A classic 2D platformer with pixel art graphics and challenging levels.',
        slug: 'pixel-adventure-quest',
        game_type: 'platformer',
        genre_tags: ['platformer', '2d', 'pixel-art', 'adventure'],
        target_audience: 'general',
        difficulty_level: 'intermediate',
        estimated_playtime_minutes: 45,
        game_config: null,
        source_code: null,
        compiled_game_url: null,
        thumbnail_url: '/api/placeholder/300/200',
        screenshots: ['/api/placeholder/300/200', '/api/placeholder/400/300'],
        status: 'published',
        visibility: 'public',
        is_template: false,
        template_category: null,
        play_count: 1247,
        like_count: 89,
        comment_count: 23,
        rating_average: 4.2,
        rating_count: 45,
        featured_at: null,
        published_at: '2024-01-15T10:30:00Z',
        last_played_at: '2024-01-19T08:45:00Z',
        version: 1,
        toxoid_version: '1.0.0',
        build_status: 'success',
        build_log: null,
        seo_title: 'Pixel Adventure Quest - Classic 2D Platformer',
        seo_description: 'Experience the thrill of classic platformer gaming with pixel art graphics.',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-20T14:45:00Z',
        // ProjectGridItem specific properties
        lastModified: '2024-01-20T14:45:00Z',
        tags: ['platformer', '2d', 'pixel-art', 'adventure'],
        analyticsPreview: {
          plays: 1247,
          likes: 89,
          comments: 23,
        },
      },
      {
        // GameProject (database) properties
        id: '2',
        user_id: 'user-123',
        title: 'Space Defender Elite',
        description: 'An intense space shooter with multiple weapon types and boss battles.',
        slug: 'space-defender-elite',
        game_type: 'other', // Using 'other' as 'shooter' is not in the enum
        genre_tags: ['shooter', 'space', 'action', 'arcade'],
        target_audience: 'teen',
        difficulty_level: 'advanced',
        estimated_playtime_minutes: 30,
        game_config: null,
        source_code: null,
        compiled_game_url: null,
        thumbnail_url: '/api/placeholder/300/200',
        screenshots: ['/api/placeholder/300/200', '/api/placeholder/400/300'],
        status: 'published',
        visibility: 'public',
        is_template: false,
        template_category: null,
        play_count: 2156,
        like_count: 145,
        comment_count: 67,
        rating_average: 4.5,
        rating_count: 78,
        featured_at: '2024-01-11T00:00:00Z',
        published_at: '2024-01-10T08:15:00Z',
        last_played_at: '2024-01-18T15:30:00Z',
        version: 2,
        toxoid_version: '1.0.0',
        build_status: 'success',
        build_log: null,
        seo_title: 'Space Defender Elite - Intense Space Shooter',
        seo_description: 'Defend the galaxy in this action-packed space shooter.',
        created_at: '2024-01-10T08:15:00Z',
        updated_at: '2024-01-12T16:30:00Z',
        // ProjectGridItem specific properties
        lastModified: '2024-01-12T16:30:00Z',
        tags: ['shooter', 'space', 'action', 'arcade'],
        analyticsPreview: {
          plays: 2156,
          likes: 145,
          comments: 67,
        },
      },
      {
        // GameProject (database) properties
        id: '3',
        user_id: 'user-123',
        title: 'Fantasy RPG Demo',
        description: 'A small RPG demo with character progression and magic system.',
        slug: 'fantasy-rpg-demo',
        game_type: 'rpg',
        genre_tags: ['rpg', 'fantasy', 'magic', 'adventure'],
        target_audience: 'general',
        difficulty_level: 'beginner',
        estimated_playtime_minutes: 60,
        game_config: null,
        source_code: null,
        compiled_game_url: null,
        thumbnail_url: '/api/placeholder/300/200',
        screenshots: ['/api/placeholder/300/200'],
        status: 'draft',
        visibility: 'private',
        is_template: false,
        template_category: null,
        play_count: 0,
        like_count: 0,
        comment_count: 0,
        rating_average: null,
        rating_count: null,
        featured_at: null,
        published_at: null,
        last_played_at: null,
        version: 1,
        toxoid_version: '1.0.0',
        build_status: 'pending',
        build_log: null,
        seo_title: null,
        seo_description: null,
        created_at: '2024-01-22T13:20:00Z',
        updated_at: '2024-01-24T11:45:00Z',
        // ProjectGridItem specific properties
        lastModified: '2024-01-24T11:45:00Z',
        tags: ['rpg', 'fantasy', 'magic', 'adventure'],
        analyticsPreview: {
          plays: 0,
          likes: 0,
          comments: 0,
        },
      },
    ];

    // Apply search filter
    let filteredProjects = mockProjects;
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredProjects = filteredProjects.filter(project =>
        project.title.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply other filters
    if (params.filters) {
      if (params.filters.status?.length) {
        filteredProjects = filteredProjects.filter(p => 
          params.filters!.status!.includes(p.status)
        );
      }
      if (params.filters.visibility?.length) {
        filteredProjects = filteredProjects.filter(p => 
          params.filters!.visibility!.includes(p.visibility)
        );
      }
      if (params.filters.gameType?.length) {
        filteredProjects = filteredProjects.filter(p => 
          params.filters!.gameType!.includes(p.game_type)
        );
      }
    }

    // Apply sorting
    if (params.sort) {
      filteredProjects.sort((a, b) => {
        let aVal: string | number | null, bVal: string | number | null;
        switch (params.sort!.field) {
          case 'title':
            aVal = a.title;
            bVal = b.title;
            break;
          case 'created_at':
            aVal = a.created_at;
            bVal = b.created_at;
            break;
          case 'updated_at':
            aVal = a.updated_at;
            bVal = b.updated_at;
            break;
          case 'play_count':
            aVal = a.play_count ?? 0;
            bVal = b.play_count ?? 0;
            break;
          case 'like_count':
            aVal = a.like_count ?? 0;
            bVal = b.like_count ?? 0;
            break;
          case 'status':
            aVal = a.status ?? 'draft';
            bVal = b.status ?? 'draft';
            break;
          default:
            return 0;
        }
        
        // Handle null values by treating them as empty strings for comparison
        const safeAVal = aVal ?? '';
        const safeBVal = bVal ?? '';
        const comparison = safeAVal < safeBVal ? -1 : safeAVal > safeBVal ? 1 : 0;
        return params.sort!.direction === 'desc' ? -comparison : comparison;
      });
    }

    // Paginate
    const page = params.page || 1;
    const limit = params.limit || 12;
    const startIndex = (page - 1) * limit;
    const paginatedProjects = filteredProjects.slice(startIndex, startIndex + limit);

    return {
      projects: paginatedProjects,
      totalCount: filteredProjects.length,
      hasNextPage: startIndex + limit < filteredProjects.length,
      facets: {
        statuses: [
          { status: 'draft', count: filteredProjects.filter(p => p.status === 'draft').length },
          { status: 'published', count: filteredProjects.filter(p => p.status === 'published').length },
          { status: 'in_development', count: filteredProjects.filter(p => p.status === 'in_development').length },
        ],
        gameTypes: [
          { gameType: 'platformer', count: filteredProjects.filter(p => p.game_type === 'platformer').length },
          { gameType: 'rpg', count: filteredProjects.filter(p => p.game_type === 'rpg').length },
          { gameType: 'other', count: filteredProjects.filter(p => p.game_type === 'other').length },
        ],
        tags: [
          { tag: 'platformer', count: filteredProjects.filter(p => p.tags.includes('platformer')).length },
          { tag: 'rpg', count: filteredProjects.filter(p => p.tags.includes('rpg')).length },
          { tag: 'shooter', count: filteredProjects.filter(p => p.tags.includes('shooter')).length },
        ],
      },
    };
  } catch (error) {
    console.error('Error fetching projects:', error);
    throw new Error('Failed to fetch projects');
  }
}

export default {
  getProjects,
};