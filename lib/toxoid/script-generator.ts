/**
 * Toxoid Script Generator
 * 
 * Core logic for generating Toxoid-compatible JavaScript scripts using LLM
 * providers. Integrates with the existing GameGen LLM system to produce
 * game scripts that conform to the Toxoid ECS API.
 */

import {
  ScriptGenerationRequest,
  ScriptConstraints,
  ScriptTemplate,
  SystemTemplate,
  ComponentTemplate
} from '@/types/toxoid';
import { GenerationRequest, GenerationResponse, LLMMessage } from '@/lib/llm/types';
import { ProviderManager } from '@/lib/llm/providers/manager';
import ScriptTemplates from './script-templates';

interface ScriptGenerationContext {
  gameType: string;
  complexity: string;
  features: string[];
  constraints: ScriptConstraints;
  existingCode?: string;
  templates: ScriptTemplate[];
}

interface GenerationPrompt {
  systemPrompt: string;
  userPrompt: string;
  examples: string[];
}

export class ToxoidScriptGenerator {
  private providerManager: ProviderManager;
  private defaultConstraints: ScriptConstraints;

  constructor(providerManager: ProviderManager) {
    this.providerManager = providerManager;
    
    this.defaultConstraints = {
      maxMemoryMB: 50,
      maxStackMB: 1,
      allowedAPIs: [
        'Toxoid.API.*',
        'Toxoid.System.*',
        'Toxoid.Observer.*',
        'Toxoid.Query.*',
        'console.log',
        'Math.*',
        'Date.*'
      ],
      forbiddenPatterns: [
        'eval(',
        'Function(',
        'setTimeout(',
        'setInterval(',
        'XMLHttpRequest',
        'fetch(',
        'import(',
        'require(',
        'process.',
        'global.',
        'window.',
        'document.'
      ],
      maxExecutionTime: 100, // 100ms per frame
      maxLoops: 10000
    };
  }

  /**
   * Generate a complete script based on user requirements
   */
  async generateScript(request: ScriptGenerationRequest): Promise<string> {
    try {
      const context = await this.buildGenerationContext(request);
      const prompt = this.buildGenerationPrompt(context, request.prompt);
      
      const llmRequest: GenerationRequest = {
        messages: [
          {
            role: 'system',
            content: prompt.systemPrompt
          },
          {
            role: 'user',
            content: prompt.userPrompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.7,
        user_id: request.userId,
        session_id: request.sessionId,
        metadata: {
          gameType: request.gameType,
          complexity: request.complexity,
          features: request.features
        }
      };

      const response = await this.providerManager.generate(llmRequest);
      const generatedScript = this.postProcessGeneratedScript(response.content, context);
      
      return generatedScript;
      
    } catch (error) {
      console.error('[ScriptGenerator] Generation failed:', error);
      throw new Error(`Script generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build generation context from request
   */
  private async buildGenerationContext(request: ScriptGenerationRequest): Promise<ScriptGenerationContext> {
    const constraints = {
      ...this.defaultConstraints,
      ...request.constraints
    };

    // Get relevant templates based on game type and features
    const templates = this.selectRelevantTemplates(request.gameType, request.features);

    return {
      gameType: request.gameType,
      complexity: request.complexity,
      features: request.features,
      constraints,
      existingCode: request.existingCode,
      templates
    };
  }

  /**
   * Select relevant templates based on requirements
   */
  private selectRelevantTemplates(gameType: string, features: string[]): ScriptTemplate[] {
    const templates: ScriptTemplate[] = [];

    // Add game type specific templates
    const gameTypeTemplates = ScriptTemplates.getTemplatesByTags([gameType]);
    templates.push(...gameTypeTemplates);

    // Add feature specific templates
    const featureTemplates = ScriptTemplates.getTemplatesByTags(features);
    templates.push(...featureTemplates);

    // Always include basic templates for complexity levels
    const basicTemplates = ScriptTemplates.getTemplatesByCategory('system');
    templates.push(...basicTemplates.slice(0, 3)); // Limit to avoid too many examples

    // Remove duplicates
    const uniqueTemplates = templates.filter((template, index, self) =>
      self.findIndex(t => t.id === template.id) === index
    );

    return uniqueTemplates;
  }

  /**
   * Build the generation prompt with system instructions and examples
   */
  private buildGenerationPrompt(context: ScriptGenerationContext, userPrompt: string): GenerationPrompt {
    const systemPrompt = this.buildSystemPrompt(context);
    const examples = this.buildExamples(context);
    
    const formattedUserPrompt = this.buildUserPrompt(userPrompt, context);

    return {
      systemPrompt,
      userPrompt: formattedUserPrompt,
      examples
    };
  }

  /**
   * Build comprehensive system prompt
   */
  private buildSystemPrompt(context: ScriptGenerationContext): string {
    return `You are an expert game developer creating JavaScript scripts for the Toxoid game engine, which uses a Flecs-based ECS (Entity Component System) architecture. Your scripts will run in a QuickJS runtime with strict memory and performance constraints.

## CRITICAL REQUIREMENTS

### Runtime Constraints
- Memory limit: ${context.constraints.maxMemoryMB}MB total
- Stack limit: ${context.constraints.maxStackMB}MB
- Maximum execution time per frame: ${context.constraints.maxExecutionTime || 100}ms
- Maximum loop iterations: ${context.constraints.maxLoops || 10000}

### Toxoid API Usage
You MUST use only the Toxoid global API. Available namespaces:
- \`Toxoid.API\` - Entity creation, components, rendering, singletons
- \`Toxoid.System\` - System registration with phases
- \`Toxoid.Observer\` - Event-driven reactive patterns
- \`Toxoid.Query\` - Entity filtering and iteration
- \`Toxoid.Phases\` - System execution phases
- \`Toxoid.ObserverEvents\` - Observer event types

### ECS Patterns
1. **Entities**: Created with \`Toxoid.API.createEntity(name)\`
2. **Components**: Added with \`entity.add("ComponentName")\`, accessed with \`entity.getComponent("ComponentName")\`
3. **Systems**: Registered with \`Toxoid.System.create(name, query, phase, callback)\`
4. **Observers**: Created with \`Toxoid.Observer.create({name, query, events, callback})\`

### Performance Requirements
- Use deferred operations for bulk changes
- Batch component updates
- Avoid deep object nesting
- Cache frequently accessed singletons
- Limit entity queries per frame
- Use efficient collision detection algorithms

### Security Restrictions
FORBIDDEN APIs/Patterns:
${context.constraints.forbiddenPatterns.map(pattern => `- ${pattern}`).join('\n')}

ALLOWED APIs:
${context.constraints.allowedAPIs.map(api => `- ${api}`).join('\n')}

### Code Quality
- Write clean, readable JavaScript
- Use descriptive variable and function names
- Include helpful comments for complex logic
- Handle errors gracefully with try-catch blocks
- Follow ECS principles (composition over inheritance)
- Separate concerns between systems

### Game Type: ${context.gameType.toUpperCase()}
Generate scripts optimized for ${context.gameType} gameplay with these characteristics:
${this.getGameTypeCharacteristics(context.gameType)}

### Target Complexity: ${context.complexity.toUpperCase()}
${this.getComplexityGuidelines(context.complexity)}

Generate production-ready JavaScript code that implements the requested functionality using proper ECS patterns and Toxoid API calls.`;
  }

  /**
   * Build user-specific prompt
   */
  private buildUserPrompt(userPrompt: string, context: ScriptGenerationContext): string {
    let prompt = `Create a Toxoid-compatible JavaScript script for the following requirements:\n\n${userPrompt}\n\n`;

    if (context.features.length > 0) {
      prompt += `Required Features:\n${context.features.map(feature => `- ${feature}`).join('\n')}\n\n`;
    }

    if (context.existingCode) {
      prompt += `Existing Code to Build Upon:\n\`\`\`javascript\n${context.existingCode}\n\`\`\`\n\n`;
    }

    prompt += `Please provide a complete, working script that:
1. Follows Toxoid ECS patterns exactly
2. Stays within memory and performance constraints
3. Includes proper error handling
4. Has clear, documented code
5. Can be executed directly in the Toxoid runtime

Return only the JavaScript code, no explanations or markdown formatting.`;

    return prompt;
  }

  /**
   * Build code examples from templates
   */
  private buildExamples(context: ScriptGenerationContext): string[] {
    const examples: string[] = [];

    // Add relevant template examples
    context.templates.slice(0, 2).forEach(template => {
      if (template.code && template.code.length < 2000) { // Keep examples manageable
        examples.push(`// Example: ${template.name}\n${template.code}`);
      }
    });

    // Add basic ECS pattern examples
    examples.push(this.getBasicECSExamples());

    return examples;
  }

  /**
   * Get basic ECS pattern examples
   */
  private getBasicECSExamples(): string {
    return `// Basic ECS Patterns Example
// 1. Entity Creation and Component Management
const player = Toxoid.API.createEntity("Player");
player.add("Position");
player.add("Velocity");
player.add("Health");

const position = player.getComponent("Position");
position.x = 100;
position.y = 200;

// 2. System Registration
Toxoid.System.create("MovementSystem", "Position, Velocity", Toxoid.Phases.ON_UPDATE,
  function(iter) {
    iter.entities().forEach(entity => {
      const pos = entity.getComponent("Position");
      const vel = entity.getComponent("Velocity");
      
      pos.x += vel.x * iter.deltaTime;
      pos.y += vel.y * iter.deltaTime;
    });
  }
);

// 3. Observer Pattern
Toxoid.Observer.create({
  name: "HealthWatcher",
  query: "Health",
  events: [Toxoid.ObserverEvents.OnSet],
  callback: function(iter) {
    iter.entities().forEach(entity => {
      const health = entity.getComponent("Health");
      if (health.value <= 0) {
        console.log("Entity died:", entity.name);
      }
    });
  }
});

// 4. Input Handling
const keyboard = Toxoid.API.getSingleton("KeyboardInput");
if (keyboard && keyboard.space) {
  // Handle space key press
}`;
  }

  /**
   * Post-process generated script
   */
  private postProcessGeneratedScript(script: string, context: ScriptGenerationContext): string {
    let processed = script;

    // Remove markdown code blocks if present
    processed = processed.replace(/```javascript\n?/g, '').replace(/```\n?/g, '');

    // Ensure proper formatting
    processed = processed.trim();

    // Add context comment header
    const header = `/**
 * Generated Toxoid Script
 * Game Type: ${context.gameType}
 * Complexity: ${context.complexity}
 * Features: ${context.features.join(', ')}
 * Generated: ${new Date().toISOString()}
 */

`;

    processed = header + processed;

    // Add safety wrapper for error handling
    processed = this.wrapWithErrorHandling(processed);

    return processed;
  }

  /**
   * Wrap script with error handling
   */
  private wrapWithErrorHandling(script: string): string {
    return `(function() {
  "use strict";
  
  try {
    ${script}
  } catch (error) {
    console.error("[Script Error]", error.message);
    console.error("Stack:", error.stack);
  }
})();`;
  }

  /**
   * Get game type specific characteristics
   */
  private getGameTypeCharacteristics(gameType: string): string {
    const characteristics: Record<string, string> = {
      bullet_hell: `- Fast-paced projectile spawning and movement
- Collision detection between bullets and player/enemies
- Score tracking and enemy wave systems
- Precise movement controls with velocity-based physics`,
      
      rpg: `- Character stats and progression systems
- Turn-based or real-time combat mechanics
- Inventory and item management
- Dialog and quest systems with state tracking`,
      
      platformer: `- Gravity and jump physics
- Platform collision detection
- Character movement with animation states
- Level progression and checkpoint systems`,
      
      puzzle: `- Grid-based or tile-based game logic
- Move validation and puzzle state tracking
- Win/lose condition checking
- Undo/redo functionality for moves`,
      
      racing: `- Vehicle physics with acceleration and steering
- Track boundary collision detection
- Lap timing and position tracking
- AI opponents with pathfinding`,
      
      custom: `- Flexible system design for unique mechanics
- Modular component architecture
- Extensible behavior patterns
- Custom game logic implementation`
    };

    return characteristics[gameType] || characteristics.custom;
  }

  /**
   * Get complexity-specific guidelines
   */
  private getComplexityGuidelines(complexity: string): string {
    const guidelines: Record<string, string> = {
      simple: `- Use basic ECS patterns with 1-3 systems
- Minimal component complexity
- Straightforward game loops
- Focus on core functionality only`,
      
      intermediate: `- Implement 3-8 interconnected systems
- Use observers for event-driven behavior
- Include basic AI or procedural elements
- Add game state management`,
      
      advanced: `- Complex system interactions and dependencies
- Advanced AI with state machines
- Performance optimizations and memory management
- Sophisticated game mechanics and features`
    };

    return guidelines[complexity] || guidelines.simple;
  }

  /**
   * Generate system-specific code
   */
  async generateSystem(
    systemName: string,
    query: string,
    phase: string,
    description: string,
    userId?: string
  ): Promise<string> {
    const template = ScriptTemplates.getSystemTemplate(systemName);
    
    if (template) {
      return ScriptTemplates.processTemplateParameters(template.codeTemplate, {});
    }

    // Generate custom system using LLM
    const prompt = `Generate a Toxoid ECS system with the following specifications:

Name: ${systemName}
Query: ${query}
Phase: ${phase}
Description: ${description}

The system should use proper Toxoid.System.create() syntax and follow ECS best practices.`;

    const llmRequest: GenerationRequest = {
      messages: [
        {
          role: 'system',
          content: 'You are a Toxoid ECS system generator. Create clean, efficient systems that follow proper ECS patterns.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.5,
      user_id: userId
    };

    const response = await this.providerManager.generate(llmRequest);
    return this.postProcessGeneratedScript(response.content, {
      gameType: 'custom',
      complexity: 'intermediate',
      features: [],
      constraints: this.defaultConstraints,
      templates: []
    });
  }

  /**
   * Generate observer code
   */
  async generateObserver(
    observerName: string,
    query: string,
    events: string[],
    description: string,
    userId?: string
  ): Promise<string> {
    const prompt = `Generate a Toxoid ECS observer with the following specifications:

Name: ${observerName}
Query: ${query}
Events: ${events.join(', ')}
Description: ${description}

The observer should use proper Toxoid.Observer.create() syntax and handle the specified events appropriately.`;

    const llmRequest: GenerationRequest = {
      messages: [
        {
          role: 'system',
          content: 'You are a Toxoid ECS observer generator. Create reactive patterns that respond to ECS events efficiently.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.5,
      user_id: userId
    };

    const response = await this.providerManager.generate(llmRequest);
    return this.postProcessGeneratedScript(response.content, {
      gameType: 'custom',
      complexity: 'intermediate',
      features: [],
      constraints: this.defaultConstraints,
      templates: []
    });
  }

  /**
   * Enhance existing script with new functionality
   */
  async enhanceScript(
    existingScript: string,
    enhancement: string,
    userId?: string
  ): Promise<string> {
    const prompt = `Enhance the following Toxoid script by adding this functionality: ${enhancement}

Existing Script:
\`\`\`javascript
${existingScript}
\`\`\`

Please modify or extend the script to include the requested enhancement while maintaining all existing functionality. Ensure the enhanced script follows proper ECS patterns and Toxoid API usage.`;

    const llmRequest: GenerationRequest = {
      messages: [
        {
          role: 'system',
          content: 'You are a Toxoid script enhancement specialist. Modify existing scripts while preserving functionality and following ECS best practices.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.6,
      user_id: userId
    };

    const response = await this.providerManager.generate(llmRequest);
    return this.postProcessGeneratedScript(response.content, {
      gameType: 'custom',
      complexity: 'intermediate',
      features: [],
      constraints: this.defaultConstraints,
      templates: []
    });
  }
}

export default ToxoidScriptGenerator;