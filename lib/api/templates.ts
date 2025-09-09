import { GameTemplate, TemplateCategory, TemplateFilter } from '@/types/dashboard';

export interface TemplatesResponse {
  templates: GameTemplate[];
  totalCount: number;
  hasNextPage: boolean;
  page: number;
  limit: number;
}

export interface FeaturedTemplatesResponse {
  templates: GameTemplate[];
  totalCount: number;
}

export interface TemplateCategoriesResponse {
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    iconUrl?: string;
    templateCount: number;
    sortOrder: number;
    isActive: boolean;
  }>;
  totalCategories: number;
}

export interface CreateTemplateRequest {
  gameId: string;
  templateName: string;
  templateDescription?: string;
  category?: string;
  difficulty?: string;
  price?: number;
  isPublic?: boolean;
}

export interface UseTemplateRequest {
  gameId?: string;
  usageType?: 'create_project' | 'duplicate' | 'preview' | 'download';
  metadata?: Record<string, any>;
}

export interface RateTemplateRequest {
  rating: number;
  reviewText?: string;
}

/**
 * Templates API service
 */
export class TemplatesAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/templates') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get templates with filtering, sorting, and pagination
   */
  async getTemplates(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: TemplateCategory[];
    difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
    gameType?: string[];
    isOfficial?: boolean;
    isFeatured?: boolean;
    tags?: string[];
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}): Promise<TemplatesResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          searchParams.set(key, value.join(','));
        } else {
          searchParams.set(key, String(value));
        }
      }
    });

    const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get featured templates
   */
  async getFeaturedTemplates(limit: number = 12): Promise<FeaturedTemplatesResponse> {
    const response = await fetch(`${this.baseUrl}/featured?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch featured templates: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get template categories
   */
  async getCategories(): Promise<TemplateCategoriesResponse> {
    const response = await fetch(`${this.baseUrl}/categories`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch template categories: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Create a template from an existing game
   */
  async createFromGame(request: CreateTemplateRequest): Promise<any> {
    const response = await fetch(`${this.baseUrl}/create-from-game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to create template: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Record template usage
   */
  async useTemplate(templateId: string, request: UseTemplateRequest = {}): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${templateId}/use`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to record template usage: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Rate a template
   */
  async rateTemplate(templateId: string, request: RateTemplateRequest): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${templateId}/rate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to rate template: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get template ratings and reviews
   */
  async getTemplateRatings(templateId: string, page: number = 1, limit: number = 10): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${templateId}/rate?page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch template ratings: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Delete a template rating (user's own rating)
   */
  async deleteRating(templateId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${templateId}/rate`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to delete rating: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get games suitable for template creation
   */
  async getTemplateReadyGames(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/create-from-game`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch template-ready games: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Export singleton instance
export const templatesAPI = new TemplatesAPI();

// Export convenience functions
export const getTemplates = (params?: Parameters<TemplatesAPI['getTemplates']>[0]) => 
  templatesAPI.getTemplates(params);

export const getFeaturedTemplates = (limit?: number) => 
  templatesAPI.getFeaturedTemplates(limit);

export const getTemplateCategories = () => 
  templatesAPI.getCategories();

export const createTemplateFromGame = (request: CreateTemplateRequest) => 
  templatesAPI.createFromGame(request);

export const useTemplate = (templateId: string, request?: UseTemplateRequest) => 
  templatesAPI.useTemplate(templateId, request);

export const rateTemplate = (templateId: string, request: RateTemplateRequest) => 
  templatesAPI.rateTemplate(templateId, request);