/**
 * Theme Asset Processor Tests
 * 
 * Comprehensive test suite for theme-based batch processing,
 * asset pack generation, and thematic consistency management.
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { 
  ThemeAssetProcessor, 
  GAME_THEMES, 
  ASSET_PACK_TEMPLATES 
} from '@/lib/ai/asset-generation/theme-processor';
import { AssetGenerationManager } from '@/lib/ai/asset-generation/manager';
import { AssetGenerationQueue } from '@/lib/ai/asset-generation/queue';
import {
  AssetGenerationError,
  ERROR_CODES,
} from '@/lib/ai/asset-generation/types';

// Mock dependencies
const mockGenerationManager = {
  generateAsset: jest.fn(),
  estimateGenerationTime: jest.fn(),
  getProviderStatus: jest.fn(),
};

const mockGenerationQueue = {
  enqueueBatchGeneration: jest.fn(),
  getJobStatus: jest.fn(),
  cancelJob: jest.fn(),
};

const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(),
  order: jest.fn(() => mockSupabase),
};

jest.mock('@/lib/ai/asset-generation/manager', () => ({
  AssetGenerationManager: jest.fn(() => mockGenerationManager),
}));

jest.mock('@/lib/ai/asset-generation/queue', () => ({
  AssetGenerationQueue: jest.fn(() => mockGenerationQueue),
}));

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase,
}));

describe('ThemeAssetProcessor', () => {
  let themeProcessor: ThemeAssetProcessor;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock responses
    mockSupabase.single.mockResolvedValue({
      data: { 
        subscription_tier: 'pro', 
        subscription_status: 'active' 
      },
      error: null,
    });

    mockSupabase.insert.mockResolvedValue({
      data: {
        id: 'pack_retro_platformer_123456_abcdef',
        theme_id: 'retro_platformer',
        status: 'queued',
        total_assets: 38,
        created_at: new Date().toISOString(),
      },
      error: null,
    });

    mockGenerationQueue.enqueueBatchGeneration.mockResolvedValue({
      jobId: 'batch-job-123',
      queuePosition: 2,
      estimatedCompletion: new Date(Date.now() + 1800000).toISOString(), // 30 minutes
    });

    // Initialize theme processor
    themeProcessor = new ThemeAssetProcessor(
      mockGenerationManager as any,
      mockGenerationQueue as any,
      true
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Theme Pack Generation', () => {
    test('should generate theme asset pack successfully', async () => {
      const result = await themeProcessor.generateThemeAssetPack(
        'retro_platformer',
        'test-user',
        undefined,
        'normal'
      );

      expect(result).toEqual({
        packId: 'pack_retro_platformer_123456_abcdef',
        estimatedCompletion: expect.any(String),
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_asset_packs');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user',
          theme_id: 'retro_platformer',
          status: 'queued',
        })
      );

      expect(mockGenerationQueue.enqueueBatchGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          baseRequest: expect.any(Object),
          prompts: expect.any(Array),
          maintainConsistency: true,
        }),
        'test-user',
        'normal'
      );
    });

    test('should validate theme exists', async () => {
      await expect(
        themeProcessor.generateThemeAssetPack(
          'invalid_theme',
          'test-user'
        )
      ).rejects.toThrow("Theme 'invalid_theme' not found");
    });

    test('should require Pro+ subscription for theme packs', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { 
          subscription_tier: 'free', 
          subscription_status: 'active' 
        },
        error: null,
      });

      await expect(
        themeProcessor.generateThemeAssetPack(
          'retro_platformer',
          'test-user'
        )
      ).rejects.toThrow('Theme asset packs require Pro or Max subscription');
    });

    test('should require Max subscription for complex themes', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { 
          subscription_tier: 'pro', 
          subscription_status: 'active' 
        },
        error: null,
      });

      await expect(
        themeProcessor.generateThemeAssetPack(
          'fantasy_rpg', // Complex theme
          'test-user'
        )
      ).rejects.toThrow('Complex theme packs require Max subscription');
    });

    test('should handle custom pack configuration', async () => {
      const customConfig = {
        assetCategories: {
          characters: {
            count: 10,
            priority: 'high' as const,
            templates: ['hero sprite', 'villain sprite'],
          },
        },
        generation: {
          maxConcurrent: 5,
          qualityThreshold: 0.9,
          autoApprove: false,
        },
      };

      const result = await themeProcessor.generateThemeAssetPack(
        'retro_platformer',
        'test-user',
        customConfig
      );

      expect(result.packId).toBeDefined();
      expect(mockGenerationQueue.enqueueBatchGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          prompts: expect.arrayContaining([
            expect.stringContaining('hero sprite'),
            expect.stringContaining('villain sprite'),
          ]),
        }),
        'test-user',
        'normal'
      );
    });

    test('should calculate total assets correctly', async () => {
      const customConfig = {
        assetCategories: {
          characters: {
            count: 5,
            priority: 'high' as const,
            templates: ['sprite 1', 'sprite 2'],
            variations: 2,
          },
          items: {
            count: 3,
            priority: 'normal' as const,
            templates: ['item 1', 'item 2', 'item 3'],
          },
        },
      };

      await themeProcessor.generateThemeAssetPack(
        'retro_platformer',
        'test-user',
        customConfig
      );

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          total_assets: 8, // (2 templates * 2 variations) + 3 items = 7, but count is 5 + 3 = 8
        })
      );
    });
  });

  describe('Theme Pack Progress Tracking', () => {
    test('should get theme pack progress', async () => {
      const mockPack = {
        id: 'test-pack-id',
        user_id: 'test-user',
        theme_id: 'retro_platformer',
        status: 'processing',
        total_assets: 20,
        completed_assets: 8,
        current_category: 'characters',
        current_asset: 'hero sprite',
        config: {
          assetCategories: {
            characters: { count: 8 },
            environments: { count: 12 },
          },
        },
        completed_assets_by_category: {
          characters: 5,
          environments: 3,
        },
        quality_scores: [0.85, 0.78, 0.92],
        consistency_checks: [
          { type: 'color', passed: true, score: 0.9 },
          { type: 'style', passed: true, score: 0.8 },
        ],
        estimated_completion: new Date(Date.now() + 3600000).toISOString(),
      };

      mockSupabase.single.mockResolvedValue({
        data: mockPack,
        error: null,
      });

      const progress = await themeProcessor.getThemePackProgress(
        'test-pack-id',
        'test-user'
      );

      expect(progress).toEqual({
        packId: 'test-pack-id',
        totalAssets: 20,
        completedAssets: 8,
        currentCategory: 'characters',
        currentAsset: 'hero sprite',
        overallProgress: 40, // 8/20 * 100
        categoryProgress: {
          characters: 63, // 5/8 * 100
          environments: 25, // 3/12 * 100
        },
        estimatedCompletion: mockPack.estimated_completion,
        qualityScores: [0.85, 0.78, 0.92],
        consistencyChecks: mockPack.consistency_checks,
      });
    });

    test('should handle pack not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Pack not found' },
      });

      await expect(
        themeProcessor.getThemePackProgress('invalid-pack-id', 'test-user')
      ).rejects.toThrow('Asset pack not found');
    });

    test('should get job progress when available', async () => {
      const mockPack = {
        id: 'test-pack-id',
        generation_job_id: 'job-123',
        status: 'processing',
        total_assets: 10,
        completed_assets: 3,
        config: { assetCategories: {} },
      };

      mockSupabase.single.mockResolvedValue({
        data: mockPack,
        error: null,
      });

      mockGenerationQueue.getJobStatus.mockResolvedValue({
        id: 'job-123',
        status: 'processing',
        progress: 60,
        currentStep: 'Generating sprite 6 of 10',
      });

      const progress = await themeProcessor.getThemePackProgress(
        'test-pack-id',
        'test-user'
      );

      expect(mockGenerationQueue.getJobStatus).toHaveBeenCalledWith(
        'job-123',
        'test-user'
      );
    });
  });

  describe('Theme Pack Results', () => {
    test('should get completed theme pack results', async () => {
      const mockPack = {
        id: 'completed-pack-id',
        theme_id: 'retro_platformer',
        status: 'completed',
        total_assets: 15,
        completed_assets: 15,
        failed_assets: [],
        processing_time_ms: 180000,
        credits_used: 225,
        package_url: 'https://cdn.example.com/pack.zip',
        sprite_sheets: [
          {
            category: 'characters',
            url: 'https://cdn.example.com/characters.png',
            assetIds: ['char1', 'char2', 'char3'],
          },
        ],
        config: ASSET_PACK_TEMPLATES.platformer_complete,
      };

      mockSupabase.single.mockResolvedValue({
        data: mockPack,
        error: null,
      });

      const mockAssets = Array(15).fill(null).map((_, i) => ({
        id: `asset-${i}`,
        name: `Asset ${i}`,
        url: `https://cdn.example.com/asset-${i}.png`,
        metadata: { qualityScore: 0.8 + (i % 3) * 0.05 },
      }));

      mockSupabase.select.mockResolvedValue({
        data: mockAssets,
        error: null,
      });

      const result = await themeProcessor.getThemePackResult(
        'completed-pack-id',
        'test-user'
      );

      expect(result).toEqual({
        success: true,
        themeId: 'retro_platformer',
        packId: 'completed-pack-id',
        totalAssets: 15,
        generatedAssets: mockAssets,
        failedAssets: [],
        consistencyScore: expect.any(Number),
        qualityScore: expect.any(Number),
        processingTime: 180000,
        creditsUsed: 225,
        packageUrl: 'https://cdn.example.com/pack.zip',
        spriteSheets: mockPack.sprite_sheets,
      });
    });

    test('should not return results for incomplete packs', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'incomplete-pack-id',
          status: 'processing',
        },
        error: null,
      });

      await expect(
        themeProcessor.getThemePackResult('incomplete-pack-id', 'test-user')
      ).rejects.toThrow('Asset pack is not yet completed');
    });

    test('should calculate quality metrics correctly', async () => {
      const mockPack = {
        id: 'quality-test-pack',
        theme_id: 'retro_platformer',
        status: 'completed',
        total_assets: 4,
        config: {},
      };

      const mockAssets = [
        { id: 'asset1', metadata: { qualityScore: 0.9 } },
        { id: 'asset2', metadata: { qualityScore: 0.8 } },
        { id: 'asset3', metadata: { qualityScore: 0.7 } },
        { id: 'asset4', metadata: { qualityScore: 0.6 } },
      ];

      mockSupabase.single.mockResolvedValue({
        data: mockPack,
        error: null,
      });

      mockSupabase.select.mockResolvedValue({
        data: mockAssets,
        error: null,
      });

      const result = await themeProcessor.getThemePackResult(
        'quality-test-pack',
        'test-user'
      );

      expect(result.qualityScore).toBe(0.75); // Average of quality scores
    });
  });

  describe('Theme Pack Cancellation', () => {
    test('should cancel theme pack generation', async () => {
      const mockPack = {
        generation_job_id: 'job-123',
        status: 'processing',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockPack,
        error: null,
      });

      mockSupabase.update.mockResolvedValue({
        data: null,
        error: null,
      });

      await themeProcessor.cancelThemePackGeneration(
        'test-pack-id',
        'test-user'
      );

      expect(mockGenerationQueue.cancelJob).toHaveBeenCalledWith(
        'job-123',
        'test-user'
      );

      expect(mockSupabase.update).toHaveBeenCalledWith({
        status: 'cancelled',
        updated_at: expect.any(String),
      });
    });

    test('should not cancel completed packs', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          status: 'completed',
        },
        error: null,
      });

      await expect(
        themeProcessor.cancelThemePackGeneration('completed-pack-id', 'test-user')
      ).rejects.toThrow('Cannot cancel completed or non-existent pack');
    });
  });

  describe('Theme Management', () => {
    test('should get available themes', () => {
      const themes = themeProcessor.getAvailableThemes();

      expect(themes).toBeInstanceOf(Array);
      expect(themes.length).toBeGreaterThan(0);
      expect(themes[0]).toHaveProperty('id');
      expect(themes[0]).toHaveProperty('name');
      expect(themes[0]).toHaveProperty('description');
      expect(themes[0]).toHaveProperty('stylePreferences');
      expect(themes[0]).toHaveProperty('metadata');
    });

    test('should include all predefined themes', () => {
      const themes = themeProcessor.getAvailableThemes();
      const themeIds = themes.map(t => t.id);

      expect(themeIds).toContain('retro_platformer');
      expect(themeIds).toContain('space_shooter');
      expect(themeIds).toContain('fantasy_rpg');
      expect(themeIds).toContain('cyberpunk');
      expect(themeIds).toContain('cartoon_adventure');
    });

    test('should get asset pack templates', () => {
      const templates = themeProcessor.getAssetPackTemplates();

      expect(templates).toBeInstanceOf(Object);
      expect(Object.keys(templates).length).toBeGreaterThan(0);
      expect(templates.platformer_complete).toBeDefined();
      expect(templates.platformer_complete.theme).toBeDefined();
      expect(templates.platformer_complete.assetCategories).toBeDefined();
    });
  });

  describe('Prompt Generation', () => {
    test('should generate thematic prompts correctly', () => {
      const theme = GAME_THEMES.retro_platformer;
      
      // Test the private method through the public interface
      const packResult = themeProcessor.generateThemeAssetPack(
        'retro_platformer',
        'test-user'
      );

      // Check that the batch generation was called with properly themed prompts
      expect(mockGenerationQueue.enqueueBatchGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          prompts: expect.arrayContaining([
            expect.stringMatching(/8bit pixel art style/),
            expect.stringMatching(/using colors #FF6B6B, #4ECDC4, #45B7D1/),
          ]),
        }),
        'test-user',
        'normal'
      );
    });

    test('should handle prompt variations', async () => {
      const customConfig = {
        assetCategories: {
          characters: {
            count: 2,
            priority: 'high' as const,
            templates: ['hero sprite'],
            variations: 3, // Should generate 3 variations of hero sprite
          },
        },
      };

      await themeProcessor.generateThemeAssetPack(
        'retro_platformer',
        'test-user',
        customConfig
      );

      const batchCall = mockGenerationQueue.enqueueBatchGeneration.mock.calls[0][0];
      const prompts = batchCall.prompts;

      expect(prompts).toHaveLength(3); // 1 template * 3 variations
      expect(prompts).toContain(expect.stringContaining('hero sprite'));
      expect(prompts).toContain(expect.stringContaining('variation 2'));
      expect(prompts).toContain(expect.stringContaining('variation 3'));
    });
  });

  describe('Asset Type Categorization', () => {
    test('should categorize asset types correctly', async () => {
      const customConfig = {
        assetCategories: {
          characters: { count: 1, priority: 'high' as const, templates: ['sprite'] },
          environments: { count: 1, priority: 'normal' as const, templates: ['background'] },
          items: { count: 1, priority: 'normal' as const, templates: ['item'] },
          ui: { count: 1, priority: 'low' as const, templates: ['button'] },
        },
      };

      await themeProcessor.generateThemeAssetPack(
        'retro_platformer',
        'test-user',
        customConfig
      );

      const batchCall = mockGenerationQueue.enqueueBatchGeneration.mock.calls[0][0];
      const baseRequest = batchCall.baseRequest;

      // Should default to sprite for the base request
      expect(baseRequest.assetType).toBe('sprite');
    });
  });

  describe('Error Handling', () => {
    test('should handle database insertion errors', async () => {
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        themeProcessor.generateThemeAssetPack('retro_platformer', 'test-user')
      ).rejects.toThrow('Failed to create asset pack record');
    });

    test('should handle queue errors', async () => {
      mockGenerationQueue.enqueueBatchGeneration.mockRejectedValue(
        new AssetGenerationError('Queue full', ERROR_CODES.RATE_LIMIT_EXCEEDED)
      );

      await expect(
        themeProcessor.generateThemeAssetPack('retro_platformer', 'test-user')
      ).rejects.toThrow('Queue full');
    });

    test('should validate user permissions', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });

      await expect(
        themeProcessor.generateThemeAssetPack('retro_platformer', 'invalid-user')
      ).rejects.toThrow('User profile not found');
    });
  });

  describe('Configuration Validation', () => {
    test('should validate theme configuration', () => {
      // Test theme structure
      const themes = Object.values(GAME_THEMES);
      
      themes.forEach(theme => {
        expect(theme).toHaveProperty('id');
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('description');
        expect(theme).toHaveProperty('stylePreferences');
        expect(theme).toHaveProperty('colorPalette');
        expect(theme).toHaveProperty('artDirection');
        expect(theme).toHaveProperty('metadata');

        expect(theme.stylePreferences).toBeInstanceOf(Array);
        expect(theme.stylePreferences.length).toBeGreaterThan(0);

        expect(theme.colorPalette).toHaveProperty('primary');
        expect(theme.colorPalette).toHaveProperty('secondary');
        expect(theme.colorPalette).toHaveProperty('accent');

        expect(theme.metadata).toHaveProperty('gameGenre');
        expect(theme.metadata).toHaveProperty('complexity');
        expect(theme.metadata).toHaveProperty('estimatedAssetCount');
      });
    });

    test('should validate asset pack templates', () => {
      const templates = Object.values(ASSET_PACK_TEMPLATES);

      templates.forEach(template => {
        expect(template).toHaveProperty('theme');
        expect(template).toHaveProperty('assetCategories');
        expect(template).toHaveProperty('consistency');
        expect(template).toHaveProperty('generation');
        expect(template).toHaveProperty('output');

        expect(template.assetCategories).toBeInstanceOf(Object);
        expect(Object.keys(template.assetCategories).length).toBeGreaterThan(0);

        Object.values(template.assetCategories).forEach(category => {
          expect(category).toHaveProperty('count');
          expect(category).toHaveProperty('priority');
          expect(category).toHaveProperty('templates');
          expect(category.templates).toBeInstanceOf(Array);
          expect(category.templates.length).toBeGreaterThan(0);
        });
      });
    });
  });
});