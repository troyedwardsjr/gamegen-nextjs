# GameGen Platform: LLM/RAG Integration Architecture

**Version**: 1.0  
**Date**: 2025-09-05  
**Primary LLM**: Claude 4 Sonnet  
**Backup LLMs**: Configurable multi-provider system  
**Vector Database**: Supabase pgvector  

## LLM Integration Overview

GameGen's AI-powered game creation relies on sophisticated Large Language Model integration combined with Retrieval-Augmented Generation (RAG) to provide contextual, accurate, and creative game generation capabilities. The system is designed to be LLM-agnostic with swappable providers while optimizing for Claude 4 Sonnet's capabilities.

### Core AI Capabilities
- **Natural Language Game Creation**: Convert descriptions into playable games
- **Server-side Script Generation**: Generate Toxoid-compatible JavaScript on server
- **ECS Pattern Generation**: Create Entity-Component-System logic with Toxoid API
- **Contextual Asset Generation**: Create sprites, audio, and textures that fit game themes
- **Smart Suggestions**: Provide creative enhancements and alternatives
- **Real-time Assistance**: Interactive chat-based game development

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    LLM/RAG Integration Layer                    │
├─────────────────────────────────────────────────────────────────┤
│  User Interface                                                │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────────── │
│  │ Chat Panel  │ │ AI Assistant │ │   Generation Controls     │ │
│  │ • Prompts   │ │ • Suggestions│ │ • Style Parameters       │ │
│  │ • History   │ │ • Help       │ │ • Quality Settings       │ │
│  └─────────────┘ └──────────────┘ └───────────────────────── │
├─────────────────────────────────────────────────────────────────┤
│  Server-Side Script Generation                                │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────────── │
│  │   Prompt    │ │     RAG      │ │   Toxoid Script Gen      │ │
│  │ Engineering │ │  Retrieval   │ │ • ECS Patterns          │ │
│  │ • Template  │ │ • Code       │ │ • API Integration       │ │
│  │ • Context   │ │   Examples   │ │ • Memory Optimization   │ │
│  └─────────────┘ └──────────────┘ └───────────────────────── │
├─────────────────────────────────────────────────────────────────┤
│  Provider Layer (Multi-LLM Support)                           │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────────── │
│  │   Claude    │ │   Fallback   │ │      Specialized         │ │
│  │ • Script    │ │   Models     │ │ • Image Gen (DALL-E)    │ │
│  │   Generation│ │ • GPT-4      │ │ • Audio (MusicLM)       │ │
│  │ • Chat      │ │ • Gemini     │ │ • Code Analysis         │ │
│  └─────────────┘ └──────────────┘ └───────────────────────── │
├─────────────────────────────────────────────────────────────────┤
│  Knowledge Base (Vector Database)                             │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────────── │
│  │   Toxoid    │ │    ECS       │ │    Script Examples       │ │
│  │  Patterns   │ │  Examples    │ │ • System Logic          │ │
│  │ • API Usage │ │ • Components │ │ • Observer Patterns     │ │
│  │ • Best      │ │ • Queries    │ │ • Performance Tips      │ │
│  │   Practices │ │ • Systems    │ │ • Memory Management     │ │
│  └─────────────┘ └──────────────┘ └───────────────────────── │
├─────────────────────────────────────────────────────────────────┤
│  Client-Side Execution (WASM + QuickJS)                      │
│  ┌─────────────┐ ┌──────────────┐ ┌─────────────────────────── │
│  │  Script     │ │   Runtime    │ │    Game Engine          │ │
│  │ Delivery    │ │  Execution   │ │ • Flecs ECS            │ │
│  │ • WebSocket │ │ • QuickJS    │ │ • Toxoid API           │ │
│  │ • HTTP      │ │ • Sandbox    │ │ • Real-time Updates    │ │
│  │ • Hot       │ │ • Memory     │ │ • Error Handling       │ │
│  │   Reload    │ │   Limits     │ │                        │ │
│  └─────────────┘ └──────────────┘ └───────────────────────── │
└─────────────────────────────────────────────────────────────────┘
```

## Provider Management System

### Multi-Provider Architecture
```typescript
interface LLMProvider {
  id: string;
  name: string;
  capabilities: LLMCapability[];
  config: ProviderConfig;
  healthCheck: () => Promise<boolean>;
  generate: (request: GenerationRequest) => Promise<GenerationResponse>;
}

enum LLMCapability {
  TEXT_GENERATION = 'text_generation',
  CODE_GENERATION = 'code_generation',
  IMAGE_GENERATION = 'image_generation',
  AUDIO_GENERATION = 'audio_generation',
  FUNCTION_CALLING = 'function_calling',
  STREAMING = 'streaming'
}

interface ProviderConfig {
  api_key: string;
  endpoint: string;
  model: string;
  max_tokens: number;
  temperature: number;
  fallback_provider?: string;
  rate_limit: {
    requests_per_minute: number;
    tokens_per_minute: number;
  };
}
```

### Provider Implementation
```typescript
class ClaudeProvider implements LLMProvider {
  id = 'claude-4-sonnet';
  name = 'Claude 4 Sonnet';
  capabilities = [
    LLMCapability.TEXT_GENERATION,
    LLMCapability.CODE_GENERATION,
    LLMCapability.FUNCTION_CALLING,
    LLMCapability.STREAMING
  ];

  async generate(request: GenerationRequest): Promise<GenerationResponse> {
    const messages = this.formatMessages(request);
    
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: request.max_tokens || 4000,
        temperature: request.temperature || 0.7,
        messages: messages,
        tools: request.tools,
        system: request.system_prompt
      });

      return this.parseResponse(response);
    } catch (error) {
      if (this.shouldFallback(error)) {
        return this.fallbackProvider.generate(request);
      }
      throw error;
    }
  }
}

class ProviderManager {
  private providers = new Map<string, LLMProvider>();
  private loadBalancer: LoadBalancer;
  
  constructor() {
    this.registerProvider(new ClaudeProvider());
    this.registerProvider(new GPT4Provider());
    this.registerProvider(new GeminiProvider());
  }
  
  async selectProvider(capabilities: LLMCapability[]): Promise<LLMProvider> {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => capabilities.every(cap => p.capabilities.includes(cap)))
      .filter(p => this.loadBalancer.isHealthy(p.id));
    
    if (availableProviders.length === 0) {
      throw new Error('No available providers for required capabilities');
    }
    
    return this.loadBalancer.selectProvider(availableProviders);
  }
}
```

## RAG (Retrieval-Augmented Generation) System

### Vector Database Schema
```sql
-- Game knowledge base embeddings
CREATE TABLE knowledge_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN (
        'game_template', 'mechanic_pattern', 'asset_example', 
        'code_snippet', 'design_pattern', 'tutorial'
    )),
    content_id UUID, -- Reference to source content
    
    -- Content metadata
    title TEXT NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    genre TEXT,
    
    -- Vector embeddings
    content_embedding vector(1536), -- OpenAI/Claude embedding size
    title_embedding vector(1536),
    
    -- Usage metrics
    retrieval_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,4) DEFAULT 0, -- How often this context improves generation
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vector similarity indexes
CREATE INDEX idx_knowledge_content_embedding ON knowledge_embeddings 
    USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_title_embedding ON knowledge_embeddings 
    USING ivfflat (title_embedding vector_cosine_ops) WITH (lists = 100);
```

### RAG Processing Pipeline
```typescript
interface RAGRequest {
  query: string;
  context_type: 'game_creation' | 'asset_generation' | 'code_generation';
  user_context?: {
    user_id: string;
    preferences: UserPreferences;
    current_game?: GameContext;
  };
  max_results?: number;
}

class RAGProcessor {
  constructor(
    private vectorDb: VectorDatabase,
    private embeddingService: EmbeddingService
  ) {}

  async retrieveContext(request: RAGRequest): Promise<RetrievedContext[]> {
    // Generate query embedding
    const queryEmbedding = await this.embeddingService.embed(request.query);
    
    // Hybrid search: vector similarity + keyword matching
    const vectorResults = await this.vectorDb.similaritySearch({
      embedding: queryEmbedding,
      table: 'knowledge_embeddings',
      limit: request.max_results || 10,
      threshold: 0.7 // Cosine similarity threshold
    });
    
    // Re-rank results based on user context and success rates
    const rankedResults = await this.rerankResults(vectorResults, request);
    
    // Update retrieval metrics
    await this.updateRetrievalMetrics(rankedResults);
    
    return rankedResults;
  }
  
  private async rerankResults(
    results: VectorSearchResult[], 
    request: RAGRequest
  ): Promise<RetrievedContext[]> {
    return results
      .map(result => ({
        ...result,
        relevance_score: this.calculateRelevanceScore(result, request)
      }))
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 5); // Top 5 most relevant
  }
  
  private calculateRelevanceScore(
    result: VectorSearchResult, 
    request: RAGRequest
  ): number {
    let score = result.similarity;
    
    // Boost based on success rate
    score *= (1 + result.success_rate);
    
    // Boost based on user context matching
    if (request.user_context?.preferences) {
      const prefMatch = this.calculatePreferenceMatch(
        result.tags, 
        request.user_context.preferences
      );
      score *= (1 + prefMatch * 0.5);
    }
    
    // Boost based on content freshness
    const daysSinceCreated = (Date.now() - result.created_at.getTime()) / (1000 * 60 * 60 * 24);
    const freshnessBoost = Math.max(0, 1 - daysSinceCreated / 365);
    score *= (1 + freshnessBoost * 0.2);
    
    return score;
  }
}
```

### Toxoid Script Generation System

```typescript
interface ToxoidScriptRequest {
  description: string;
  script_type: 'system' | 'component' | 'observer' | 'behavior';
  context: {
    existing_entities?: string[];
    available_components?: string[];
    game_state?: any;
    performance_requirements?: 'low' | 'medium' | 'high';
  };
}

class ToxoidScriptGenerator {
  async generateScript(request: ToxoidScriptRequest): Promise<string> {
    const context = await this.retrieveToxoidContext(request);
    const prompt = this.buildToxoidPrompt(request, context);
    
    const provider = await this.providerManager.selectProvider([
      LLMCapability.CODE_GENERATION
    ]);
    
    const response = await provider.generate({
      messages: [
        { role: 'system', content: prompt.system_prompt },
        { role: 'user', content: prompt.user_message }
      ],
      tools: this.getToxoidGenerationTools(),
      temperature: 0.3, // Lower temperature for code generation
      max_tokens: 2000
    });
    
    return this.postProcessToxoidScript(response.content);
  }
  
  private buildToxoidPrompt(
    request: ToxoidScriptRequest,
    context: RetrievedContext[]
  ): ContextualPrompt {
    const systemPrompt = `You are a Toxoid game engine expert specializing in ECS-based JavaScript game development. Generate production-ready scripts that follow Toxoid best practices.

Toxoid Engine Architecture:
- Entity-Component-System (Flecs ECS)
- QuickJS JavaScript runtime (50MB memory limit, 1MB stack)
- Component-based architecture with type safety
- System-based game logic execution
- Observer pattern for entity state changes

Available Toxoid APIs:
${this.formatToxoidAPIs()}

Key Requirements:
- Use proper ECS patterns (avoid direct entity manipulation)
- Memory-efficient code (respect 50MB limit)
- Performance-conscious implementations
- Proper error handling and validation
- Clear component relationships

Context Examples:
${this.formatContext(context)}

Generate valid JavaScript that integrates seamlessly with Toxoid's architecture.`;

    const userMessage = this.buildUserMessage(request);
    
    return {
      system_prompt: systemPrompt,
      user_message: userMessage,
      retrieved_context: context,
      examples: await this.getToxoidExamples(request.script_type),
      constraints: {
        memory_limit: 50 * 1024 * 1024, // 50MB
        performance_priority: true,
        api_compliance: true
      }
    };
  }
  
  private formatToxoidAPIs(): string {
    return `
Core APIs:
- Toxoid.API.createEntity(): Create new entities
- entity.add(Component, data): Add components to entities
- entity.get(Component): Retrieve component data
- entity.has(Component): Check component existence

System Creation:
- Toxoid.System.create(name, callback, phase?): Register systems
- Phases: ON_UPDATE, PRE_UPDATE, POST_UPDATE

Observer Pattern:
- Toxoid.Observer.create(event, callback): Watch entity changes
- Events: OnAdd, OnSet, OnRemove

Query System:
- Toxoid.Query.create(...components): Filter entities by components
- query.each((entity) => { ... }): Iterate over matching entities

Rendering:
- loadSprite(path): Load sprite assets
- filledRect(x, y, width, height, color): Draw rectangles
- Spine animation support for complex animations

Input Handling:
- KeyboardInput singleton for input state
- Touch and gamepad input support`;
  }
  
  private buildUserMessage(request: ToxoidScriptRequest): string {
    const typeInstructions = {
      system: "Create a system that runs each frame and processes entities with specific components.",
      component: "Define a component structure with proper data fields and initialization.",
      observer: "Create an observer that reacts to component changes on entities.",
      behavior: "Implement game behavior logic that can be applied to entities."
    };
    
    return `Generate a ${request.script_type} for: "${request.description}"

Requirements:
${typeInstructions[request.script_type]}

Context:
${request.context.existing_entities ? `Available entities: ${request.context.existing_entities.join(', ')}` : ''}
${request.context.available_components ? `Available components: ${request.context.available_components.join(', ')}` : ''}

Performance target: ${request.context.performance_requirements || 'medium'}

Please provide:
1. Complete, runnable JavaScript code
2. Clear comments explaining the logic
3. Proper error handling
4. Memory-efficient implementation`;
  }
  
  private async getToxoidExamples(scriptType: string): Promise<CodeExample[]> {
    const examples = {
      system: [
        {
          name: "Movement System",
          code: `
Toxoid.System.create("MovementSystem", (dt) => {
  const query = Toxoid.Query.create(Position, Velocity);
  query.each((entity) => {
    const pos = entity.get(Position);
    const vel = entity.get(Velocity);
    
    pos.x += vel.x * dt;
    pos.y += vel.y * dt;
    
    entity.set(Position, pos);
  });
}, Toxoid.System.ON_UPDATE);`
        }
      ],
      component: [
        {
          name: "Health Component",
          code: `
const Health = {
  max: 100,
  current: 100,
  regeneration: 0
};`
        }
      ],
      observer: [
        {
          name: "Death Observer",
          code: `
Toxoid.Observer.create(Toxoid.Observer.OnSet, Health, (entity) => {
  const health = entity.get(Health);
  if (health.current <= 0) {
    entity.add(Dead);
    console.log("Entity died:", entity.id);
  }
});`
        }
      ]
    };
    
    return examples[scriptType] || [];
  }
  
  private postProcessToxoidScript(rawScript: string): string {
    // Validate script syntax
    try {
      new Function(rawScript); // Basic syntax check
    } catch (error) {
      throw new Error(`Generated script has syntax errors: ${error.message}`);
    }
    
    // Add safety checks and optimizations
    let processedScript = rawScript;
    
    // Add memory usage tracking if not present
    if (!processedScript.includes('// Memory:')) {
      processedScript = `// Memory: Estimated < 1MB\n${processedScript}`;
    }
    
    // Ensure proper error handling
    if (!processedScript.includes('try') && processedScript.includes('entity.get(')) {
      console.warn('Script may benefit from error handling around entity operations');
    }
    
    return processedScript;
  }
}
```

### Context Injection System
```typescript
interface ContextualPrompt {
  system_prompt: string;
  user_message: string;
  retrieved_context: RetrievedContext[];
  examples: CodeExample[];
  constraints: GenerationConstraints;
}

class PromptEngineer {
  async buildGameCreationPrompt(
    userRequest: string,
    context: RetrievedContext[]
  ): Promise<ContextualPrompt> {
    const systemPrompt = `You are GameGen AI, an expert game designer and developer specializing in Toxoid engine and ECS-based pixel art games. You help users create engaging, playable games through natural language descriptions.

Key Capabilities:
- Convert natural language descriptions into Toxoid-compatible game logic
- Generate ECS-based systems, components, and observers
- Create balanced game mechanics with proper performance considerations
- Ensure games utilize Toxoid API patterns effectively

Context Knowledge:
${this.formatContext(context)}

Always generate valid Toxoid JavaScript following ECS best practices.`;

    const userMessage = `Create game functionality for: "${userRequest}"

Please provide:
1. Toxoid script implementation using ECS patterns
2. Proper component definitions and relationships
3. System logic with performance considerations
4. Observer patterns for state management
5. Memory-efficient code (50MB limit)

Ensure the implementation:
- Uses Toxoid.API, Toxoid.System, Toxoid.Observer appropriately
- Follows ECS architecture principles
- Is performance-optimized for real-time execution
- Includes proper error handling`;

    return {
      system_prompt: systemPrompt,
      user_message: userMessage,
      retrieved_context: context,
      examples: await this.getRelevantExamples(userRequest),
      constraints: {
        max_complexity: 'moderate',
        target_audience: 'general',
        platform_compatibility: ['web', 'mobile'],
        memory_limit: 50 * 1024 * 1024
      }
    };
  }
  
  private formatContext(context: RetrievedContext[]): string {
    return context.map(c => 
      `${c.title}: ${c.description}\nTags: ${c.tags.join(', ')}\nCode: ${c.code_snippet || 'N/A'}`
    ).join('\n\n');
  }
}
```

## Generation Processing

### Game Generation Pipeline
```typescript
interface GameGenerationRequest {
  prompt: string;
  style_preferences: StylePreferences;
  complexity: 'simple' | 'moderate' | 'complex';
  genre?: GameGenre;
  user_context: UserContext;
}

class GameGenerator {
  constructor(
    private providerManager: ProviderManager,
    private ragProcessor: RAGProcessor,
    private promptEngineer: PromptEngineer
  ) {}

  async generateGame(request: GameGenerationRequest): Promise<GenerationJob> {
    // Create generation job for tracking
    const job = await this.createGenerationJob(request);
    
    try {
      // Phase 1: Retrieve relevant context
      await this.updateJobStatus(job.id, 'retrieving_context');
      const context = await this.ragProcessor.retrieveContext({
        query: request.prompt,
        context_type: 'game_creation',
        user_context: request.user_context
      });
      
      // Phase 2: Generate game specification
      await this.updateJobStatus(job.id, 'generating_specification');
      const specification = await this.generateGameSpecification(request, context);
      
      // Phase 3: Generate assets
      await this.updateJobStatus(job.id, 'generating_assets');
      const assets = await this.generateGameAssets(specification);
      
      // Phase 4: Generate code
      await this.updateJobStatus(job.id, 'generating_code');
      const code = await this.generateGameCode(specification, assets);
      
      // Phase 5: Assembly and validation
      await this.updateJobStatus(job.id, 'assembling_game');
      const game = await this.assembleGame(specification, assets, code);
      
      // Phase 6: Quality assurance
      await this.updateJobStatus(job.id, 'quality_check');
      await this.validateGame(game);
      
      await this.completeGenerationJob(job.id, game);
      return job;
      
    } catch (error) {
      await this.failGenerationJob(job.id, error);
      throw error;
    }
  }
  
  private async generateGameSpecification(
    request: GameGenerationRequest,
    context: RetrievedContext[]
  ): Promise<GameSpecification> {
    const provider = await this.providerManager.selectProvider([
      LLMCapability.TEXT_GENERATION,
      LLMCapability.FUNCTION_CALLING
    ]);
    
    const prompt = await this.promptEngineer.buildGameCreationPrompt(
      request.prompt, 
      context
    );
    
    const response = await provider.generate({
      messages: [
        { role: 'system', content: prompt.system_prompt },
        { role: 'user', content: prompt.user_message }
      ],
      tools: this.getGameGenerationTools(),
      temperature: 0.7,
      max_tokens: 4000
    });
    
    return this.parseGameSpecification(response);
  }
  
  private getGameGenerationTools(): Tool[] {
    return [
      {
        name: 'create_game_specification',
        description: 'Create a complete game specification',
        parameters: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            genre: { type: 'string', enum: ['platformer', 'shooter', 'puzzle', 'rpg'] },
            mechanics: { 
              type: 'array', 
              items: { type: 'string' } 
            },
            levels: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  objectives: { type: 'array', items: { type: 'string' } },
                  difficulty: { type: 'number', minimum: 1, maximum: 10 }
                }
              }
            },
            assets_needed: {
              type: 'object',
              properties: {
                sprites: { type: 'array', items: { type: 'string' } },
                backgrounds: { type: 'array', items: { type: 'string' } },
                audio: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          required: ['title', 'genre', 'mechanics', 'levels']
        }
      }
    ];
  }
}
```

### Asset Generation Integration
```typescript
class AssetGenerator {
  async generateSprite(specification: SpriteSpecification): Promise<GeneratedAsset> {
    // Use specialized image generation model
    const provider = await this.providerManager.selectProvider([
      LLMCapability.IMAGE_GENERATION
    ]);
    
    const prompt = this.buildSpritePrompt(specification);
    
    const response = await provider.generate({
      prompt: prompt,
      negative_prompt: 'blurry, low quality, distorted',
      width: specification.dimensions.width,
      height: specification.dimensions.height,
      style: 'pixel-art',
      guidance_scale: 7.5,
      steps: 50
    });
    
    // Post-process for pixel art optimization
    const optimizedSprite = await this.optimizePixelArt(response.image);
    
    return {
      type: 'sprite',
      data: optimizedSprite,
      metadata: {
        dimensions: specification.dimensions,
        format: 'png',
        optimization: 'pixel-perfect'
      }
    };
  }
  
  private buildSpritePrompt(spec: SpriteSpecification): string {
    return `Create a ${spec.style} pixel art sprite of ${spec.description}. 
    Style: ${spec.art_style}
    Colors: ${spec.color_palette}
    Size: ${spec.dimensions.width}x${spec.dimensions.height} pixels
    Animation: ${spec.animated ? `${spec.frames} frames` : 'static'}
    
    Requirements:
    - Clean pixel art style
    - Consistent color palette
    - Game-ready sprite
    - Transparent background`;
  }
}
```

## Performance Optimization

### Caching Strategy
```typescript
class LLMCacheManager {
  private cache: Map<string, CachedResponse> = new Map();
  private vectorCache: Map<string, RetrievedContext[]> = new Map();
  
  async getCachedResponse(
    prompt: string, 
    context: RetrievedContext[]
  ): Promise<CachedResponse | null> {
    const cacheKey = this.generateCacheKey(prompt, context);
    const cached = this.cache.get(cacheKey);
    
    if (cached && !this.isExpired(cached)) {
      // Update cache hit metrics
      this.metrics.increment('llm.cache.hit');
      return cached;
    }
    
    this.metrics.increment('llm.cache.miss');
    return null;
  }
  
  async setCachedResponse(
    prompt: string,
    context: RetrievedContext[],
    response: GenerationResponse
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(prompt, context);
    
    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now(),
      usage_count: 0,
      expires_at: Date.now() + (60 * 60 * 1000) // 1 hour
    });
  }
  
  private generateCacheKey(prompt: string, context: RetrievedContext[]): string {
    const contextHash = this.hashContext(context);
    return `${this.hashString(prompt)}_${contextHash}`;
  }
}
```

### Request Optimization
```typescript
class RequestOptimizer {
  async optimizeRequest(request: GenerationRequest): Promise<OptimizedRequest> {
    // Compress long prompts while maintaining meaning
    const optimizedPrompt = await this.compressPrompt(request.prompt);
    
    // Select minimal context needed
    const essentialContext = this.selectEssentialContext(request.context);
    
    // Adjust parameters based on request complexity
    const optimizedParams = this.optimizeParameters(request);
    
    return {
      ...request,
      prompt: optimizedPrompt,
      context: essentialContext,
      parameters: optimizedParams
    };
  }
  
  private async compressPrompt(prompt: string): Promise<string> {
    if (prompt.length < 500) return prompt;
    
    // Use Claude to summarize long prompts while preserving key requirements
    const compressed = await this.providerManager.selectProvider([
      LLMCapability.TEXT_GENERATION
    ]).then(provider => provider.generate({
      messages: [{
        role: 'user',
        content: `Compress this game creation prompt while preserving all key requirements and creative details: "${prompt}"`
      }],
      max_tokens: 200,
      temperature: 0.3
    }));
    
    return compressed.content;
  }
}
```

## Monitoring & Analytics

### LLM Performance Tracking
```typescript
interface LLMMetrics {
  provider_id: string;
  request_type: string;
  response_time: number;
  tokens_used: number;
  success: boolean;
  error_type?: string;
  user_satisfaction?: number; // 1-5 rating
  context_relevance?: number; // 0-1 score
}

class LLMAnalytics {
  async trackRequest(metrics: LLMMetrics): Promise<void> {
    // Store metrics in database
    await this.database.llm_metrics.create(metrics);
    
    // Update real-time dashboards
    this.metricsCollector.record('llm.requests.total', 1, {
      provider: metrics.provider_id,
      type: metrics.request_type,
      success: metrics.success.toString()
    });
    
    this.metricsCollector.histogram('llm.response_time', metrics.response_time, {
      provider: metrics.provider_id
    });
    
    // Trigger alerts if performance degrades
    if (metrics.response_time > 30000 || !metrics.success) {
      await this.alertingService.checkThresholds(metrics);
    }
  }
  
  async generateProviderReport(): Promise<ProviderPerformanceReport> {
    const metrics = await this.database.llm_metrics.aggregate([
      { $group: { _id: '$provider_id', avg_response_time: { $avg: '$response_time' } } },
      { $sort: { avg_response_time: 1 } }
    ]);
    
    return {
      generated_at: new Date(),
      providers: metrics,
      recommendations: await this.generateOptimizationRecommendations(metrics)
    };
  }
}
```

This comprehensive LLM/RAG integration provides GameGen with powerful AI capabilities while maintaining flexibility, performance, and cost efficiency through intelligent provider management and contextual knowledge retrieval.