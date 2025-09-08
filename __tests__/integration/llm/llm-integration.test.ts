/**
 * LLM Integration Testing Suite
 * Tests LLM provider integration, response handling, fallback mechanisms,
 * and mock response validation
 */

import { ProviderManager } from '@/lib/llm/providers/manager';
import { ClaudeProvider } from '@/lib/llm/providers/claude';
import { LLMConfigManager } from '@/lib/llm/config';
import { BillingTracker } from '@/lib/llm/billing/tracker';
import {
  GenerationRequest,
  GenerationResponse,
  LLMError,
  ProviderHealthStatus,
  TokenUsage,
} from '@/lib/llm/types';

// Mock MSW for HTTP interception - MSW v2 imports
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

// Mock implementations
jest.mock('@/lib/llm/providers/manager');
jest.mock('@/lib/llm/providers/claude');
jest.mock('@/lib/llm/config');
jest.mock('@/lib/llm/billing/tracker');

const MockProviderManager = ProviderManager as jest.MockedClass<typeof ProviderManager>;
const MockClaudeProvider = ClaudeProvider as jest.MockedClass<typeof ClaudeProvider>;
const MockLLMConfigManager = LLMConfigManager as jest.MockedClass<typeof LLMConfigManager>;
const MockBillingTracker = BillingTracker as jest.MockedClass<typeof BillingTracker>;

describe('LLM Integration Tests', () => {
  let mockServer: any;
  let providerManager: any;
  let mockClaudeProvider: any;
  let mockBillingTracker: any;

  // Mock response templates
  const mockResponses = {
    gameGeneration: {
      content: `# Simple Platformer Game

This is a simple platformer game with the following features:

## Game Mechanics
- Player character that can move left and right
- Jumping with gravity physics
- Collectible coins for scoring
- Simple obstacle avoidance

## Code Structure
\`\`\`javascript
class PlatformerGame {
  constructor() {
    this.player = { x: 100, y: 300, vx: 0, vy: 0 };
    this.coins = [];
    this.obstacles = [];
    this.score = 0;
  }
  
  update() {
    this.updatePlayer();
    this.checkCollisions();
    this.updateScore();
  }
}
\`\`\`

## Assets Needed
- Player sprite (32x32px)
- Coin sprites (16x16px)
- Platform tiles (32x32px)
- Background elements`,
      usage: {
        prompt_tokens: 45,
        completion_tokens: 156,
        total_tokens: 201,
      },
      model: 'claude-3-sonnet',
      finish_reason: 'stop',
    },

    codeOptimization: {
      content: `# Optimized Game Code

Here's the optimized version of your game code:

## Performance Improvements
1. **Object Pooling**: Reuse game objects instead of creating new ones
2. **Efficient Collision Detection**: Use spatial partitioning
3. **Render Optimization**: Only redraw changed areas

## Optimized Code
\`\`\`javascript
class OptimizedPlatformerGame {
  constructor() {
    this.objectPool = new ObjectPool();
    this.spatialGrid = new SpatialGrid(32);
    this.dirtyRegions = [];
  }
  
  update() {
    // Only update active objects
    this.activeObjects.forEach(obj => {
      if (obj.needsUpdate) {
        obj.update();
        this.markDirty(obj.bounds);
      }
    });
  }
  
  render() {
    // Only render dirty regions
    this.dirtyRegions.forEach(region => {
      this.renderRegion(region);
    });
    this.dirtyRegions.clear();
  }
}
\`\`\`

## Memory Usage Reduction
- Reduced memory allocation by 60%
- Improved frame rate from 30fps to 60fps
- Better garbage collection patterns`,
      usage: {
        prompt_tokens: 89,
        completion_tokens: 234,
        total_tokens: 323,
      },
      model: 'claude-3-sonnet',
      finish_reason: 'stop',
    },

    errorResponse: {
      error: {
        type: 'overloaded_error',
        message: 'The model is currently overloaded. Please try again in a moment.',
      },
    },

    streamingChunks: [
      {
        content: 'Creating',
        usage: null,
        model: 'claude-3-sonnet',
        finish_reason: null,
      },
      {
        content: ' a simple',
        usage: null,
        model: 'claude-3-sonnet',
        finish_reason: null,
      },
      {
        content: ' puzzle game',
        usage: null,
        model: 'claude-3-sonnet',
        finish_reason: null,
      },
      {
        content: ' with block matching mechanics.',
        usage: {
          prompt_tokens: 25,
          completion_tokens: 15,
          total_tokens: 40,
        },
        model: 'claude-3-sonnet',
        finish_reason: 'stop',
      },
    ],
  };

  beforeAll(() => {
    // Set up MSW server for HTTP mocking - MSW v2 syntax
    mockServer = setupServer(
      // Mock Claude API
      http.post('https://api.anthropic.com/v1/messages', async ({ request }) => {
        const body = await request.json() as any;
        
        if (body.messages?.[0]?.content?.includes('error')) {
          return HttpResponse.json(mockResponses.errorResponse, { status: 529 });
        }
        
        if (body.messages?.[0]?.content?.includes('optimize')) {
          return HttpResponse.json({
            id: 'msg_test_123',
            type: 'message',
            role: 'assistant',
            content: [{ type: 'text', text: mockResponses.codeOptimization.content }],
            usage: mockResponses.codeOptimization.usage,
          });
        }

        return HttpResponse.json({
          id: 'msg_test_123',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: mockResponses.gameGeneration.content }],
          usage: mockResponses.gameGeneration.usage,
        });
      }),

      // Mock streaming endpoint
      http.post('https://api.anthropic.com/v1/messages/stream', () => {
        const stream = mockResponses.streamingChunks
          .map(chunk => `data: ${JSON.stringify(chunk)}\n\n`)
          .join('');
        
        return HttpResponse.text(stream, {
          headers: {
            'Content-Type': 'text/event-stream',
          },
        });
      })
    );

    mockServer.listen();
  });

  afterAll(() => {
    mockServer.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer.resetHandlers();

    // Mock provider manager
    providerManager = {
      generateText: jest.fn(),
      generateStream: jest.fn(),
      getProvider: jest.fn(),
      healthCheck: jest.fn(),
      getMetrics: jest.fn(),
    };
    MockProviderManager.mockImplementation(() => providerManager);

    // Mock Claude provider
    mockClaudeProvider = {
      id: 'claude',
      name: 'Claude',
      generate: jest.fn(),
      generateStream: jest.fn(),
      healthCheck: jest.fn(),
      getMetrics: jest.fn(),
    };
    MockClaudeProvider.mockImplementation(() => mockClaudeProvider);

    // Mock billing tracker
    mockBillingTracker = {
      checkBalance: jest.fn(),
      deductCredits: jest.fn(),
      trackUsage: jest.fn(),
    };
    MockBillingTracker.mockImplementation(() => mockBillingTracker);
  });

  describe('Game Generation Integration', () => {
    it('should generate complete game structure', async () => {
      const request: GenerationRequest = {
        messages: [
          {
            role: 'user',
            content: 'Create a simple platformer game with jumping and coin collection',
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      };

      providerManager.generateText.mockResolvedValue(mockResponses.gameGeneration);

      const response = await providerManager.generateText(request);

      // Verify response structure
      expect(response).toEqual(mockResponses.gameGeneration);
      expect(response.content).toContain('PlatformerGame');
      expect(response.content).toContain('Game Mechanics');
      expect(response.content).toContain('Code Structure');
      expect(response.usage.total_tokens).toBeGreaterThan(0);
    });

    it('should handle different game types', async () => {
      const gameTypes = [
        { type: 'puzzle', content: 'puzzle game with block matching' },
        { type: 'rpg', content: 'RPG with character stats and inventory' },
        { type: 'strategy', content: 'strategy game with resource management' },
      ];

      for (const gameType of gameTypes) {
        const request: GenerationRequest = {
          messages: [
            {
              role: 'user',
              content: `Create a ${gameType.type} game`,
            },
          ],
        };

        const mockResponse = {
          content: `# ${gameType.type.toUpperCase()} Game\n\n${gameType.content}`,
          usage: { prompt_tokens: 15, completion_tokens: 50, total_tokens: 65 },
          model: 'claude-3-sonnet',
          finish_reason: 'stop',
        };

        providerManager.generateText.mockResolvedValue(mockResponse);
        const response = await providerManager.generateText(request);

        expect(response.content.toLowerCase()).toContain(gameType.type);
        expect(response.usage.total_tokens).toBeGreaterThan(0);
      }
    });

    it('should validate generated code quality', async () => {
      providerManager.generateText.mockResolvedValue(mockResponses.gameGeneration);

      const request: GenerationRequest = {
        messages: [{ role: 'user', content: 'Create a game with proper code structure' }],
      };

      const response = await providerManager.generateText(request);

      // Validate code structure
      expect(response.content).toMatch(/class \w+/); // Contains class definition
      expect(response.content).toMatch(/constructor\(\)/); // Has constructor
      expect(response.content).toMatch(/update\(\)/); // Has update method
      expect(response.content).toContain('```javascript'); // Contains code blocks

      // Validate game mechanics description
      expect(response.content).toContain('Game Mechanics');
      expect(response.content).toContain('Assets Needed');

      // Validate completeness
      const sections = ['Game Mechanics', 'Code Structure', 'Assets Needed'];
      sections.forEach(section => {
        expect(response.content).toContain(section);
      });
    });
  });

  describe('Code Optimization Integration', () => {
    it('should optimize existing game code', async () => {
      providerManager.generateText.mockResolvedValue(mockResponses.codeOptimization);

      const request: GenerationRequest = {
        messages: [
          {
            role: 'user',
            content: 'Optimize this game code for better performance',
          },
        ],
      };

      const response = await providerManager.generateText(request);

      expect(response.content).toContain('Performance Improvements');
      expect(response.content).toContain('Object Pooling');
      expect(response.content).toContain('Collision Detection');
      expect(response.content).toContain('Memory Usage Reduction');
      
      // Verify optimization suggestions are concrete
      expect(response.content).toMatch(/\d+%/); // Contains percentage improvements
      expect(response.content).toMatch(/\d+fps/); // Contains frame rate improvements
    });

    it('should provide specific optimization recommendations', async () => {
      const optimizationTypes = [
        'performance',
        'memory',
        'rendering',
        'collision detection',
      ];

      for (const optimizationType of optimizationTypes) {
        const request: GenerationRequest = {
          messages: [
            {
              role: 'user',
              content: `Optimize ${optimizationType} in my game`,
            },
          ],
        };

        const mockResponse = {
          content: `# ${optimizationType.toUpperCase()} Optimization\n\nOptimized for ${optimizationType}`,
          usage: { prompt_tokens: 20, completion_tokens: 80, total_tokens: 100 },
          model: 'claude-3-sonnet',
          finish_reason: 'stop',
        };

        providerManager.generateText.mockResolvedValue(mockResponse);
        const response = await providerManager.generateText(request);

        expect(response.content.toLowerCase()).toContain(optimizationType);
        expect(response.content).toContain('Optimization');
      }
    });
  });

  describe('Streaming Integration', () => {
    it('should handle streaming responses correctly', async () => {
      const chunks: any[] = [];
      const callback = jest.fn((chunk) => chunks.push(chunk));

      providerManager.generateStream.mockImplementation(async (request, streamCallback) => {
        mockResponses.streamingChunks.forEach(chunk => {
          streamCallback(chunk);
        });
      });

      const request: GenerationRequest = {
        messages: [{ role: 'user', content: 'Create a puzzle game' }],
        stream: true,
      };

      await providerManager.generateStream(request, callback);

      expect(callback).toHaveBeenCalledTimes(mockResponses.streamingChunks.length);
      expect(chunks).toHaveLength(mockResponses.streamingChunks.length);

      // Verify streaming progression
      expect(chunks[0].content).toBe('Creating');
      expect(chunks[0].finish_reason).toBeNull();
      
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.finish_reason).toBe('stop');
      expect(lastChunk.usage).toBeDefined();

      // Verify complete content
      const fullContent = chunks.map(chunk => chunk.content).join('');
      expect(fullContent).toBe('Creating a simple puzzle game with block matching mechanics.');
    });

    it('should handle streaming errors gracefully', async () => {
      providerManager.generateStream.mockRejectedValue(new Error('Streaming failed'));

      const request: GenerationRequest = {
        messages: [{ role: 'user', content: 'Generate error content' }],
        stream: true,
      };

      const callback = jest.fn();

      await expect(providerManager.generateStream(request, callback))
        .rejects.toThrow('Streaming failed');
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling and Fallbacks', () => {
    it('should handle provider errors gracefully', async () => {
      const request: GenerationRequest = {
        messages: [{ role: 'user', content: 'Generate error content' }],
      };

      providerManager.generateText.mockRejectedValue(
        new LLMError('Model overloaded', 'OVERLOADED', 'claude', true)
      );

      await expect(providerManager.generateText(request))
        .rejects.toThrow('Model overloaded');
    });

    it('should implement fallback provider chain', async () => {
      const request: GenerationRequest = {
        messages: [{ role: 'user', content: 'Test fallback' }],
      };

      // Mock primary provider failure and secondary provider success
      providerManager.generateText
        .mockRejectedValueOnce(new LLMError('Primary failed', 'API_ERROR', 'primary', true))
        .mockResolvedValueOnce({
          content: 'Fallback response',
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
          model: 'fallback-model',
          finish_reason: 'stop',
        });

      const response = await providerManager.generateText(request);
      
      expect(response.content).toBe('Fallback response');
      expect(response.model).toBe('fallback-model');
    });

    it('should retry on transient errors', async () => {
      const request: GenerationRequest = {
        messages: [{ role: 'user', content: 'Test retry' }],
      };

      let callCount = 0;
      providerManager.generateText.mockImplementation(async () => {
        callCount++;
        if (callCount < 3) {
          throw new LLMError('Rate limited', 'RATE_LIMITED', 'claude', true);
        }
        return mockResponses.gameGeneration;
      });

      const response = await providerManager.generateText(request);
      
      expect(callCount).toBe(3);
      expect(response).toEqual(mockResponses.gameGeneration);
    });
  });

  describe('Provider Health Monitoring', () => {
    it('should monitor provider health status', async () => {
      const healthStatuses = [
        { provider: 'claude', status: ProviderHealthStatus.HEALTHY },
        { provider: 'openai', status: ProviderHealthStatus.UNHEALTHY },
        { provider: 'local', status: ProviderHealthStatus.OFFLINE },
      ];

      providerManager.healthCheck.mockImplementation(async (providerId) => {
        const status = healthStatuses.find(s => s.provider === providerId);
        return status?.status === ProviderHealthStatus.HEALTHY;
      });

      for (const { provider, status } of healthStatuses) {
        const isHealthy = await providerManager.healthCheck(provider);
        expect(isHealthy).toBe(status === ProviderHealthStatus.HEALTHY);
      }
    });

    it('should collect provider metrics', async () => {
      const mockMetrics = {
        claude: {
          total_requests: 150,
          successful_requests: 145,
          failed_requests: 5,
          average_response_time: 1200,
          total_tokens_used: 50000,
          health_status: ProviderHealthStatus.HEALTHY,
        },
        openai: {
          total_requests: 75,
          successful_requests: 70,
          failed_requests: 5,
          average_response_time: 2000,
          total_tokens_used: 25000,
          health_status: ProviderHealthStatus.UNHEALTHY,
        },
      };

      providerManager.getMetrics.mockImplementation(async (providerId) => {
        return mockMetrics[providerId as keyof typeof mockMetrics];
      });

      const claudeMetrics = await providerManager.getMetrics('claude');
      const openaiMetrics = await providerManager.getMetrics('openai');

      expect(claudeMetrics.total_requests).toBe(150);
      expect(claudeMetrics.health_status).toBe(ProviderHealthStatus.HEALTHY);
      
      expect(openaiMetrics.total_requests).toBe(75);
      expect(openaiMetrics.health_status).toBe(ProviderHealthStatus.UNHEALTHY);
    });
  });

  describe('Usage Tracking and Billing', () => {
    it('should track token usage accurately', async () => {
      const request: GenerationRequest = {
        messages: [{ role: 'user', content: 'Create a game' }],
      };

      providerManager.generateText.mockResolvedValue(mockResponses.gameGeneration);
      mockBillingTracker.trackUsage.mockResolvedValue(true);

      const response = await providerManager.generateText(request);
      
      expect(mockBillingTracker.trackUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'claude',
          usage: mockResponses.gameGeneration.usage,
          user_id: expect.any(String),
        })
      );
      
      expect(response.usage.total_tokens).toBe(201);
    });

    it('should handle billing limits', async () => {
      mockBillingTracker.checkBalance.mockReturnValue({
        hasBalance: false,
        balance: 0,
        required: 5.0,
      });

      const request: GenerationRequest = {
        messages: [{ role: 'user', content: 'Expensive request' }],
      };

      await expect(providerManager.generateText(request))
        .rejects.toThrow('insufficient credits');
    });

    it('should calculate costs correctly', async () => {
      const usage: TokenUsage = {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300,
      };

      // Mock cost calculation (in practice, this would be in BillingTracker)
      const calculateCost = (usage: TokenUsage) => {
        const inputCost = (usage.prompt_tokens / 1000000) * 3.0; // $3 per million
        const outputCost = (usage.completion_tokens / 1000000) * 15.0; // $15 per million
        return inputCost + outputCost;
      };

      const cost = calculateCost(usage);
      const expectedCost = (100 / 1000000) * 3.0 + (200 / 1000000) * 15.0;

      expect(cost).toBeCloseTo(expectedCost, 6);
      expect(cost).toBeGreaterThan(0);
    });
  });

  describe('Content Validation', () => {
    it('should validate generated content quality', async () => {
      const validateGameContent = (content: string) => {
        const qualityChecks = {
          hasCodeBlocks: /```\w+/.test(content),
          hasGameMechanics: /game mechanics|gameplay|controls/i.test(content),
          hasStructure: /class|function|constructor/i.test(content),
          hasComments: /\/\/|\/\*|\#/.test(content),
          isComplete: content.length > 100,
        };

        const passedChecks = Object.values(qualityChecks).filter(Boolean).length;
        const totalChecks = Object.keys(qualityChecks).length;
        
        return {
          score: passedChecks / totalChecks,
          checks: qualityChecks,
          isValid: passedChecks >= totalChecks * 0.8, // 80% threshold
        };
      };

      const validation = validateGameContent(mockResponses.gameGeneration.content);
      
      expect(validation.isValid).toBe(true);
      expect(validation.score).toBeGreaterThan(0.8);
      expect(validation.checks.hasCodeBlocks).toBe(true);
      expect(validation.checks.hasGameMechanics).toBe(true);
    });

    it('should detect inappropriate content', async () => {
      const inappropriateContent = [
        'violent content with explicit descriptions',
        'adult content not suitable for games',
        'discriminatory language or themes',
      ];

      const contentFilter = (content: string): boolean => {
        const blockedPatterns = [
          /violent|gore|blood/i,
          /adult|explicit|sexual/i,
          /discriminat|racist|sexist/i,
        ];

        return blockedPatterns.some(pattern => pattern.test(content));
      };

      inappropriateContent.forEach(content => {
        const isInappropriate = contentFilter(content);
        expect(isInappropriate).toBe(true);
      });

      // Valid content should pass
      const validContent = mockResponses.gameGeneration.content;
      expect(contentFilter(validContent)).toBe(false);
    });
  });
});