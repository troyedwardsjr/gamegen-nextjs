/**
 * Asset Generation Manager
 * 
 * Central manager for AI-powered asset generation with multi-provider support,
 * intelligent failover, load balancing, and comprehensive error handling.
 */

import { 
  AssetGenerationRequest, 
  GenerationProvider, 
  ProviderConfig, 
  ProviderStatus,
  AssetGenerationError,
  ERROR_CODES,
  GeneratedAsset,
  AssetType,
  AssetStyle,
} from './types';
import { PixellabProvider } from './providers/pixellab';
import { RetrodiffusionProvider } from './providers/retrodiffusion';
import { DalleProvider } from './providers/dalle';

interface AssetGenerationManagerConfig {
  providers: Record<string, ProviderConfig>;
  defaultProvider: GenerationProvider;
  fallbackChain?: GenerationProvider[];
  maxRetries?: number;
  timeout?: number;
  loadBalancing?: {
    strategy: 'round_robin' | 'least_load' | 'response_time';
    weights?: Record<GenerationProvider, number>;
  };
}

export class AssetGenerationManager {
  private providers = new Map<GenerationProvider, any>();
  private config: AssetGenerationManagerConfig;
  private providerStats = new Map<GenerationProvider, {
    requests: number;
    failures: number;
    avgResponseTime: number;
    lastUsed: number;
  }>();
  private roundRobinCounter = 0;

  constructor(config: AssetGenerationManagerConfig) {
    this.config = {
      maxRetries: 2,
      timeout: 60000,
      fallbackChain: ['pixellab', 'retrodiffusion', 'dalle'],
      loadBalancing: { strategy: 'round_robin' },
      ...config,
    };

    this.initializeProviders();
  }

  /**
   * Initialize all configured providers
   */
  private initializeProviders(): void {
    const providerClasses: Partial<Record<GenerationProvider, any>> = {
      pixellab: PixellabProvider,
      retrodiffusion: RetrodiffusionProvider,
      dalle: DalleProvider,
    };

    for (const [providerId, config] of Object.entries(this.config.providers)) {
      if (!config.enabled) {
        continue;
      }

      const ProviderClass = providerClasses[providerId as GenerationProvider];
      if (!ProviderClass) {
        console.warn(`Unknown provider: ${providerId}`);
        continue;
      }

      try {
        const provider = new ProviderClass(config);
        this.providers.set(providerId as GenerationProvider, provider);
        this.providerStats.set(providerId as GenerationProvider, {
          requests: 0,
          failures: 0,
          avgResponseTime: 0,
          lastUsed: 0,
        });
        
        console.log(`Initialized asset generation provider: ${providerId}`);
      } catch (error) {
        console.error(`Failed to initialize provider ${providerId}:`, error);
      }
    }

    if (this.providers.size === 0) {
      throw new Error('No asset generation providers could be initialized');
    }
  }

  /**
   * Generate asset with automatic provider selection and failover
   */
  async generateAsset(request: AssetGenerationRequest): Promise<any> {
    const startTime = Date.now();
    let lastError: AssetGenerationError | undefined;
    
    // Get ordered list of providers to try
    const providersToTry = this.getProvidersForRequest(request);
    
    if (providersToTry.length === 0) {
      throw new AssetGenerationError(
        'No available providers for this request',
        ERROR_CODES.PROVIDER_NOT_AVAILABLE,
      );
    }

    // Try each provider in order
    for (const providerId of providersToTry) {
      const provider = this.providers.get(providerId);
      if (!provider) {
        continue;
      }

      try {
        console.log(`Attempting generation with provider: ${providerId}`);
        
        // Check if provider is healthy
        const isHealthy = await this.checkProviderHealth(providerId);
        if (!isHealthy) {
          console.warn(`Provider ${providerId} failed health check, skipping`);
          continue;
        }

        // Attempt generation
        const result = await Promise.race([
          provider.generateAsset(request),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), this.config.timeout)
          ),
        ]);

        // Update statistics
        this.updateProviderStats(providerId, Date.now() - startTime, false);
        
        console.log(`Successfully generated asset with provider: ${providerId}`);
        return {
          ...result,
          generatedBy: providerId,
          processingTime: Date.now() - startTime,
        };

      } catch (error) {
        lastError = error instanceof AssetGenerationError 
          ? error 
          : new AssetGenerationError(
              `Provider ${providerId} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              ERROR_CODES.GENERATION_FAILED,
              providerId,
              true
            );

        // Update statistics
        this.updateProviderStats(providerId, Date.now() - startTime, true);
        
        console.error(`Provider ${providerId} failed:`, lastError.message);
        
        // If this is the last provider, throw the error
        if (providerId === providersToTry[providersToTry.length - 1]) {
          break;
        }
        
        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    throw new AssetGenerationError(
      `All providers failed. Last error: ${lastError?.message || 'Unknown error'}`,
      ERROR_CODES.ALL_PROVIDERS_FAILED,
      undefined,
      lastError?.retryable || false,
    );
  }

  /**
   * Get ordered list of providers to try for a request
   */
  private getProvidersForRequest(request: AssetGenerationRequest): GenerationProvider[] {
    const availableProviders = Array.from(this.providers.keys());
    
    // If specific provider requested, try it first
    if (request.provider && this.providers.has(request.provider)) {
      const providers = [request.provider];
      // Add fallback providers
      for (const fallback of this.config.fallbackChain || []) {
        if (fallback !== request.provider && this.providers.has(fallback)) {
          providers.push(fallback);
        }
      }
      return providers;
    }

    // Use load balancing strategy
    switch (this.config.loadBalancing?.strategy) {
      case 'round_robin':
        return this.roundRobinSelection(availableProviders);
      
      case 'least_load':
        return this.leastLoadSelection(availableProviders);
      
      case 'response_time':
        return this.responseTimeSelection(availableProviders);
      
      default:
        // Default to configured order with default provider first
        const ordered = [this.config.defaultProvider];
        for (const provider of availableProviders) {
          if (provider !== this.config.defaultProvider) {
            ordered.push(provider);
          }
        }
        return ordered.filter(p => this.providers.has(p));
    }
  }

  /**
   * Round-robin provider selection
   */
  private roundRobinSelection(providers: GenerationProvider[]): GenerationProvider[] {
    const sorted = [...providers];
    const primary = sorted[this.roundRobinCounter % sorted.length];
    this.roundRobinCounter++;
    
    // Put primary first, then add rest
    return [primary, ...sorted.filter(p => p !== primary)];
  }

  /**
   * Least load provider selection (based on current requests)
   */
  private leastLoadSelection(providers: GenerationProvider[]): GenerationProvider[] {
    return providers.sort((a, b) => {
      const statsA = this.providerStats.get(a);
      const statsB = this.providerStats.get(b);
      
      if (!statsA || !statsB) return 0;
      
      // Consider both failure rate and recent usage
      const loadA = statsA.requests + (statsA.failures * 2);
      const loadB = statsB.requests + (statsB.failures * 2);
      
      return loadA - loadB;
    });
  }

  /**
   * Response time-based provider selection
   */
  private responseTimeSelection(providers: GenerationProvider[]): GenerationProvider[] {
    return providers.sort((a, b) => {
      const statsA = this.providerStats.get(a);
      const statsB = this.providerStats.get(b);
      
      if (!statsA || !statsB) return 0;
      
      return statsA.avgResponseTime - statsB.avgResponseTime;
    });
  }

  /**
   * Check provider health
   */
  private async checkProviderHealth(providerId: GenerationProvider): Promise<boolean> {
    try {
      const provider = this.providers.get(providerId);
      if (!provider || !provider.healthCheck) {
        return true; // Assume healthy if no health check
      }

      const result = await Promise.race([
        provider.healthCheck(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        ),
      ]);

      return result === true;
    } catch (error) {
      console.error(`Health check failed for provider ${providerId}:`, error);
      return false;
    }
  }

  /**
   * Update provider statistics
   */
  private updateProviderStats(
    providerId: GenerationProvider, 
    responseTime: number, 
    failed: boolean
  ): void {
    const stats = this.providerStats.get(providerId);
    if (!stats) return;

    stats.requests++;
    stats.lastUsed = Date.now();
    
    if (failed) {
      stats.failures++;
    }

    // Update rolling average response time
    stats.avgResponseTime = stats.avgResponseTime === 0 
      ? responseTime 
      : (stats.avgResponseTime * 0.8) + (responseTime * 0.2);

    this.providerStats.set(providerId, stats);
  }

  /**
   * Get status of all providers
   */
  async getProvidersStatus(): Promise<Record<GenerationProvider, ProviderStatus>> {
    const status: Record<string, ProviderStatus> = {};

    for (const [providerId, provider] of Array.from(this.providers.entries())) {
      const stats = this.providerStats.get(providerId);
      
      try {
        const isHealthy = await this.checkProviderHealth(providerId);
        const capabilities = await provider.getCapabilities?.() || {
          supportedAssetTypes: ['sprite', 'background', 'tile'] as AssetType[],
          supportedStyles: ['pixel-art', 'retro'] as AssetStyle[],
          supportedFormats: ['png', 'webp'],
          maxDimensions: { width: 1024, height: 1024 },
        };

        status[providerId] = {
          id: providerId,
          name: provider.name || providerId,
          status: isHealthy ? 'online' : 'offline',
          enabled: this.config.providers[providerId]?.enabled || false,
          
          // Performance metrics
          averageResponseTime: stats?.avgResponseTime || 0,
          successRate: stats ? 
            (stats.requests - stats.failures) / Math.max(stats.requests, 1) : 
            1,
          lastChecked: new Date().toISOString(),
          
          // Capabilities
          ...capabilities,
          
          // Current usage
          requestsToday: stats?.requests || 0,
          creditsUsed: 0, // Would be tracked elsewhere
        };
      } catch (error) {
        status[providerId] = {
          id: providerId,
          name: provider.name || providerId,
          status: 'offline',
          enabled: false,
          averageResponseTime: 0,
          successRate: 0,
          lastChecked: new Date().toISOString(),
          supportedAssetTypes: [],
          supportedStyles: [],
          supportedFormats: [],
          maxDimensions: { width: 0, height: 0 },
          requestsToday: 0,
          creditsUsed: 0,
        };
      }
    }

    return status as Record<GenerationProvider, ProviderStatus>;
  }

  /**
   * Generate multiple variants of an asset
   */
  async generateVariants(
    request: AssetGenerationRequest, 
    count: number = 3
  ): Promise<any[]> {
    const variants = await Promise.all(
      Array.from({ length: count }, async (_, index) => {
        const variantRequest = {
          ...request,
          seed: request.seed ? request.seed + index : undefined,
          prompt: request.prompt + (index > 0 ? ` (variation ${index + 1})` : ''),
        };
        
        try {
          return await this.generateAsset(variantRequest);
        } catch (error) {
          console.error(`Failed to generate variant ${index + 1}:`, error);
          return null;
        }
      })
    );

    return variants.filter(variant => variant !== null);
  }

  /**
   * Estimate generation time based on current load and provider performance
   */
  async estimateGenerationTime(request: AssetGenerationRequest): Promise<number> {
    const providers = this.getProvidersForRequest(request);
    if (providers.length === 0) {
      return 0;
    }

    const primaryProvider = providers[0];
    const stats = this.providerStats.get(primaryProvider);
    
    if (!stats || stats.requests === 0) {
      // Default estimate based on asset type
      const baseEstimates = {
        sprite: 15000,      // 15 seconds
        background: 25000,  // 25 seconds
        tile: 10000,        // 10 seconds
        animation: 45000,   // 45 seconds
        tileset: 20000,     // 20 seconds
        ui: 12000,          // 12 seconds
      };
      
      return baseEstimates[request.assetType] || 20000;
    }

    // Base estimate on historical performance
    let estimate = stats.avgResponseTime;
    
    // Adjust for asset complexity
    if (request.dimensions) {
      const pixels = request.dimensions.width * request.dimensions.height;
      if (pixels > 512 * 512) {
        estimate *= 1.5;
      } else if (pixels > 256 * 256) {
        estimate *= 1.2;
      }
    }

    // Adjust for animation frames
    if (request.animationFrames && request.animationFrames > 1) {
      estimate *= Math.min(request.animationFrames * 0.8, 3.0);
    }

    // Add buffer for processing and potential retries
    return Math.round(estimate * 1.3);
  }

  /**
   * Get provider recommendations for a specific request
   */
  getProviderRecommendations(request: AssetGenerationRequest): {
    recommended: GenerationProvider;
    alternatives: GenerationProvider[];
    reasoning: string;
  } {
    const availableProviders = Array.from(this.providers.keys());
    
    // Provider strengths for different asset types
    const providerStrengths: Partial<Record<GenerationProvider, any>> = {
      pixellab: {
        assetTypes: ['sprite', 'tile', 'ui'],
        styles: ['pixel-art', '8bit', '16bit'],
        score: 0.9,
      },
      retrodiffusion: {
        assetTypes: ['background', 'sprite'],
        styles: ['retro', 'pixel-art', 'modern'],
        score: 0.85,
      },
      dalle: {
        assetTypes: ['background', 'ui'],
        styles: ['modern', 'realistic', 'abstract'],
        score: 0.8,
      },
    };

    let bestProvider: GenerationProvider = this.config.defaultProvider;
    let bestScore = 0;
    let reasoning = 'Using default provider';

    for (const provider of availableProviders) {
      if (!providerStrengths[provider]) continue;
      
      const strength = providerStrengths[provider];
      let score = strength.score;

      // Bonus for asset type match
      if (strength.assetTypes.includes(request.assetType)) {
        score += 0.1;
      }

      // Bonus for style match
      if (request.style && strength.styles.includes(request.style)) {
        score += 0.1;
      }

      // Consider provider performance
      const stats = this.providerStats.get(provider);
      if (stats && stats.requests > 0) {
        const successRate = (stats.requests - stats.failures) / stats.requests;
        score *= successRate;
      }

      if (score > bestScore) {
        bestScore = score;
        bestProvider = provider;
        reasoning = `Best match for ${request.assetType} with ${request.style || 'default'} style`;
      }
    }

    const alternatives = availableProviders.filter(p => p !== bestProvider);

    return {
      recommended: bestProvider,
      alternatives,
      reasoning,
    };
  }
}