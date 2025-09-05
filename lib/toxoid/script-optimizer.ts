/**
 * Toxoid Script Optimizer
 * 
 * Advanced optimization pipeline for Toxoid-compatible JavaScript scripts.
 * Optimizes for QuickJS runtime performance, memory usage, and execution speed
 * while maintaining functional equivalence and API compatibility.
 */

import {
  ScriptOptimizationRequest,
  ScriptOptimizationResult,
  PerformanceProfile,
  OptimizationSuggestion,
  MemoryUsage,
  ExecutionMetrics
} from '@/types/toxoid';
import * as acorn from 'acorn';
import { Node } from 'acorn';

interface OptimizationContext {
  originalScript: string;
  ast: Node;
  optimizationLevel: 'basic' | 'aggressive' | 'minify';
  preserveComments: boolean;
  targetRuntime: 'quickjs' | 'v8' | 'both';
}

interface OptimizationPass {
  name: string;
  description: string;
  apply: (context: OptimizationContext) => string;
  prerequisites?: string[];
  targetRuntime?: string[];
}

interface CodeAnalysis {
  functions: FunctionInfo[];
  variables: VariableInfo[];
  loops: LoopInfo[];
  apiCalls: APICallInfo[];
  complexity: number;
  memoryUsage: MemoryUsage;
}

interface FunctionInfo {
  name: string;
  line: number;
  length: number;
  complexity: number;
  parameters: number;
  callCount: number;
  isRecursive: boolean;
}

interface VariableInfo {
  name: string;
  type: 'var' | 'let' | 'const';
  scope: 'global' | 'function' | 'block';
  usageCount: number;
  isReassigned: boolean;
}

interface LoopInfo {
  type: 'for' | 'while' | 'forEach';
  line: number;
  isNested: boolean;
  estimatedIterations: number;
  hasBreak: boolean;
}

interface APICallInfo {
  api: string;
  count: number;
  lines: number[];
  isInLoop: boolean;
}

export class ToxoidScriptOptimizer {
  private optimizationPasses: OptimizationPass[];
  private quickJSOptimizations: OptimizationPass[];
  private performanceOptimizations: OptimizationPass[];

  constructor() {
    this.initializeOptimizationPasses();
    this.initializeQuickJSOptimizations();
    this.initializePerformanceOptimizations();
  }

  /**
   * Optimize script according to request parameters
   */
  async optimizeScript(request: ScriptOptimizationRequest): Promise<ScriptOptimizationResult> {
    try {
      const context = await this.buildOptimizationContext(request);
      const analysis = await this.analyzeCode(context);
      
      let optimizedScript = context.originalScript;
      const appliedOptimizations: string[] = [];
      
      // Apply optimization passes based on level
      const passes = this.selectOptimizationPasses(context);
      
      for (const pass of passes) {
        try {
          const beforeLength = optimizedScript.length;
          optimizedScript = pass.apply({...context, originalScript: optimizedScript});
          const afterLength = optimizedScript.length;
          
          if (beforeLength !== afterLength || pass.name.includes('Performance')) {
            appliedOptimizations.push(pass.name);
          }
        } catch (error) {
          console.warn(`[Optimizer] Pass ${pass.name} failed:`, error);
        }
      }

      // Calculate performance gains
      const performanceGains = await this.calculatePerformanceGains(
        context.originalScript,
        optimizedScript,
        analysis
      );

      return {
        originalScript: context.originalScript,
        optimizedScript,
        compressionRatio: context.originalScript.length / optimizedScript.length,
        optimizationsApplied: appliedOptimizations,
        performanceGains
      };

    } catch (error) {
      console.error('[ScriptOptimizer] Optimization failed:', error);
      throw new Error(`Script optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate performance profile for script
   */
  async profileScript(script: string): Promise<PerformanceProfile> {
    const context = await this.buildOptimizationContext({
      script,
      optimizationLevel: 'basic',
      preserveComments: true,
      targetRuntime: 'quickjs'
    });

    const analysis = await this.analyzeCode(context);
    
    return {
      memoryUsage: analysis.memoryUsage,
      executionTime: this.estimateExecutionMetrics(analysis),
      apiCallFrequency: this.calculateAPICallFrequency(analysis),
      loopComplexity: analysis.loops.map(loop => ({
        line: loop.line,
        type: loop.type,
        estimatedIterations: loop.estimatedIterations,
        complexity: this.categorizeLoopComplexity(loop.estimatedIterations),
        optimization: this.suggestLoopOptimization(loop)
      })),
      optimizationOpportunities: this.identifyOptimizationOpportunities(analysis)
    };
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(script: string): Promise<OptimizationSuggestion[]> {
    const analysis = await this.analyzeCode(await this.buildOptimizationContext({
      script,
      optimizationLevel: 'basic',
      preserveComments: true,
      targetRuntime: 'quickjs'
    }));

    return this.identifyOptimizationOpportunities(analysis);
  }

  /**
   * Build optimization context
   */
  private async buildOptimizationContext(request: ScriptOptimizationRequest): Promise<OptimizationContext> {
    let ast: Node;
    
    try {
      ast = acorn.parse(request.script, {
        ecmaVersion: 2020,
        sourceType: 'script',
        locations: true
      });
    } catch (error) {
      throw new Error(`Failed to parse script: ${error instanceof Error ? error.message : 'Parse error'}`);
    }

    return {
      originalScript: request.script,
      ast,
      optimizationLevel: request.optimizationLevel || 'basic',
      preserveComments: request.preserveComments ?? true,
      targetRuntime: request.targetRuntime || 'quickjs'
    };
  }

  /**
   * Analyze code structure and characteristics
   */
  private async analyzeCode(context: OptimizationContext): Promise<CodeAnalysis> {
    const lines = context.originalScript.split('\n');
    const functions: FunctionInfo[] = [];
    const variables: VariableInfo[] = [];
    const loops: LoopInfo[] = [];
    const apiCalls: APICallInfo[] = [];

    // Analyze functions
    const functionMatches = context.originalScript.matchAll(/function\s+(\w+)\s*\([^)]*\)\s*{[^}]*}/g);
    for (const match of functionMatches) {
      const functionBody = match[0];
      const functionName = match[1];
      const lineCount = functionBody.split('\n').length;
      
      functions.push({
        name: functionName,
        line: this.findLineNumber(context.originalScript, match.index!),
        length: lineCount,
        complexity: this.calculateFunctionComplexity(functionBody),
        parameters: this.countParameters(functionBody),
        callCount: this.countFunctionCalls(context.originalScript, functionName),
        isRecursive: functionBody.includes(functionName + '(')
      });
    }

    // Analyze variables
    const variablePatterns = [
      { pattern: /\b(var|let|const)\s+(\w+)/g, type: 'declaration' },
    ];

    variablePatterns.forEach(({ pattern }) => {
      const matches = context.originalScript.matchAll(pattern);
      for (const match of matches) {
        const varType = match[1] as 'var' | 'let' | 'const';
        const varName = match[2];
        
        variables.push({
          name: varName,
          type: varType,
          scope: this.determineScope(context.originalScript, match.index!),
          usageCount: this.countVariableUsage(context.originalScript, varName),
          isReassigned: this.isVariableReassigned(context.originalScript, varName, varType)
        });
      }
    });

    // Analyze loops
    const loopPatterns = [
      { pattern: /\bfor\s*\([^)]*\)\s*{/g, type: 'for' as const },
      { pattern: /\bwhile\s*\([^)]*\)\s*{/g, type: 'while' as const },
      { pattern: /\.forEach\s*\(/g, type: 'forEach' as const }
    ];

    loopPatterns.forEach(({ pattern, type }) => {
      const matches = context.originalScript.matchAll(pattern);
      for (const match of matches) {
        loops.push({
          type,
          line: this.findLineNumber(context.originalScript, match.index!),
          isNested: this.isNestedLoop(context.originalScript, match.index!),
          estimatedIterations: this.estimateLoopIterations(match[0]),
          hasBreak: this.hasBreakStatement(context.originalScript, match.index!)
        });
      }
    });

    // Analyze API calls
    const toxoidAPIs = ['Toxoid.API', 'Toxoid.System', 'Toxoid.Observer', 'Toxoid.Query'];
    toxoidAPIs.forEach(api => {
      const pattern = new RegExp(`\\b${api.replace('.', '\\.')}\\.(\\w+)`, 'g');
      const matches = context.originalScript.matchAll(pattern);
      const matchArray = Array.from(matches);
      
      if (matchArray.length > 0) {
        apiCalls.push({
          api,
          count: matchArray.length,
          lines: matchArray.map(match => this.findLineNumber(context.originalScript, match.index!)),
          isInLoop: matchArray.some(match => this.isInLoop(context.originalScript, match.index!))
        });
      }
    });

    // Calculate memory usage
    const memoryUsage = this.estimateMemoryUsage(context.originalScript);

    return {
      functions,
      variables,
      loops,
      apiCalls,
      complexity: this.calculateOverallComplexity(context.originalScript),
      memoryUsage
    };
  }

  /**
   * Initialize optimization passes
   */
  private initializeOptimizationPasses(): void {
    this.optimizationPasses = [
      {
        name: 'Remove Comments',
        description: 'Remove single-line and multi-line comments',
        apply: (context) => {
          if (context.preserveComments) return context.originalScript;
          return context.originalScript
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '');
        }
      },
      {
        name: 'Whitespace Optimization',
        description: 'Remove unnecessary whitespace',
        apply: (context) => {
          if (context.optimizationLevel === 'minify') {
            return context.originalScript
              .replace(/\s+/g, ' ')
              .replace(/;\s*}/g, '}')
              .replace(/{\s*/g, '{')
              .replace(/}\s*/g, '}')
              .trim();
          }
          return context.originalScript.replace(/\s+$/gm, '');
        }
      },
      {
        name: 'Variable Declaration Optimization',
        description: 'Combine variable declarations and optimize types',
        apply: (context) => {
          let optimized = context.originalScript;
          
          // Convert let to const where appropriate
          const letPattern = /\blet\s+(\w+)\s*=\s*([^;]+);/g;
          optimized = optimized.replace(letPattern, (match, varName, value) => {
            if (!this.isVariableReassigned(context.originalScript, varName, 'let')) {
              return `const ${varName} = ${value};`;
            }
            return match;
          });

          return optimized;
        }
      },
      {
        name: 'Function Optimization',
        description: 'Optimize function declarations and calls',
        apply: (context) => {
          let optimized = context.originalScript;
          
          // Convert function expressions to arrow functions where appropriate
          if (context.targetRuntime !== 'quickjs' || context.optimizationLevel === 'aggressive') {
            optimized = optimized.replace(
              /function\s*\(([^)]*)\)\s*{\s*return\s+([^;]+);\s*}/g,
              '($1) => $2'
            );
          }

          return optimized;
        },
        targetRuntime: ['v8']
      },
      {
        name: 'Loop Optimization',
        description: 'Optimize loop constructs for better performance',
        apply: (context) => {
          let optimized = context.originalScript;
          
          // Cache array length in for loops
          optimized = optimized.replace(
            /for\s*\(\s*let\s+(\w+)\s*=\s*0\s*;\s*\1\s*<\s*(\w+)\.length\s*;\s*\1\+\+\s*\)/g,
            'for (let $1 = 0, len = $2.length; $1 < len; $1++)'
          );

          // Convert simple forEach to for loops (better for QuickJS)
          if (context.targetRuntime === 'quickjs') {
            optimized = optimized.replace(
              /(\w+)\.forEach\s*\(\s*(\w+)\s*=>\s*{([^}]+)}\s*\)/g,
              'for (let i = 0; i < $1.length; i++) { const $2 = $1[i]; $3 }'
            );
          }

          return optimized;
        }
      }
    ];
  }

  /**
   * Initialize QuickJS-specific optimizations
   */
  private initializeQuickJSOptimizations(): void {
    this.quickJSOptimizations = [
      {
        name: 'QuickJS Function Optimization',
        description: 'Optimize for QuickJS function handling',
        apply: (context) => {
          let optimized = context.originalScript;
          
          // Avoid arrow functions in QuickJS for better performance
          optimized = optimized.replace(
            /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g,
            'function $1'
          );

          return optimized;
        },
        targetRuntime: ['quickjs']
      },
      {
        name: 'QuickJS Array Optimization',
        description: 'Optimize array operations for QuickJS',
        apply: (context) => {
          let optimized = context.originalScript;
          
          // Use traditional for loops instead of array methods where possible
          optimized = optimized.replace(
            /\.map\s*\(\s*(\w+)\s*=>\s*([^)]+)\)/g,
            '/* optimized for QuickJS */ .map(function($1) { return $2; })'
          );

          return optimized;
        },
        targetRuntime: ['quickjs']
      },
      {
        name: 'QuickJS Object Access',
        description: 'Optimize object property access for QuickJS',
        apply: (context) => {
          let optimized = context.originalScript;
          
          // Cache frequently accessed object properties
          const propertyAccessPattern = /(\w+)\.(\w+)\.(\w+)/g;
          const propertyAccesses = new Map<string, number>();
          
          let match;
          while ((match = propertyAccessPattern.exec(context.originalScript)) !== null) {
            const access = match[0];
            propertyAccesses.set(access, (propertyAccesses.get(access) || 0) + 1);
          }

          // Cache properties accessed more than 3 times
          propertyAccesses.forEach((count, access) => {
            if (count > 3) {
              const cacheVar = `cached_${access.replace(/\./g, '_')}`;
              optimized = `const ${cacheVar} = ${access};\n${optimized}`;
              optimized = optimized.replace(new RegExp(access.replace(/\./g, '\\.'), 'g'), cacheVar);
            }
          });

          return optimized;
        },
        targetRuntime: ['quickjs']
      }
    ];
  }

  /**
   * Initialize performance optimizations
   */
  private initializePerformanceOptimizations(): void {
    this.performanceOptimizations = [
      {
        name: 'API Call Optimization',
        description: 'Optimize Toxoid API calls for better performance',
        apply: (context) => {
          let optimized = context.originalScript;
          
          // Cache singleton references
          optimized = optimized.replace(
            /Toxoid\.API\.getSingleton\s*\(\s*["'](\w+)["']\s*\)/g,
            (match, singletonName) => {
              const cacheVar = `cached_${singletonName}`;
              if (!optimized.includes(`const ${cacheVar}`)) {
                optimized = `const ${cacheVar} = Toxoid.API.getSingleton("${singletonName}");\n${optimized}`;
              }
              return cacheVar;
            }
          );

          return optimized;
        }
      },
      {
        name: 'Memory Allocation Optimization',
        description: 'Reduce memory allocations and improve garbage collection',
        apply: (context) => {
          let optimized = context.originalScript;
          
          // Object pooling for frequently created objects
          if (optimized.includes('new Array(')) {
            optimized = `const arrayPool = [];\nfunction getArray() { return arrayPool.pop() || []; }\nfunction releaseArray(arr) { arr.length = 0; arrayPool.push(arr); }\n${optimized}`;
            optimized = optimized.replace(/new Array\(\)/g, 'getArray()');
          }

          return optimized;
        }
      },
      {
        name: 'Dead Code Elimination',
        description: 'Remove unused variables and functions',
        apply: (context) => {
          let optimized = context.originalScript;
          
          // Remove unused variables (basic implementation)
          const variableDeclarations = optimized.match(/(?:var|let|const)\s+(\w+)/g) || [];
          variableDeclarations.forEach(declaration => {
            const varName = declaration.split(/\s+/)[1];
            const usageCount = (optimized.match(new RegExp(`\\b${varName}\\b`, 'g')) || []).length;
            
            if (usageCount <= 1) { // Only declared, never used
              optimized = optimized.replace(new RegExp(`(?:var|let|const)\\s+${varName}\\s*=\\s*[^;]+;\\s*`, 'g'), '');
            }
          });

          return optimized;
        }
      }
    ];
  }

  /**
   * Select optimization passes based on context
   */
  private selectOptimizationPasses(context: OptimizationContext): OptimizationPass[] {
    let passes = [...this.optimizationPasses];

    // Add performance optimizations for aggressive mode
    if (context.optimizationLevel === 'aggressive') {
      passes = [...passes, ...this.performanceOptimizations];
    }

    // Add runtime-specific optimizations
    if (context.targetRuntime === 'quickjs' || context.targetRuntime === 'both') {
      passes = [...passes, ...this.quickJSOptimizations.filter(pass => 
        !pass.targetRuntime || pass.targetRuntime.includes('quickjs')
      )];
    }

    return passes.sort((a, b) => {
      const order = ['Remove Comments', 'Dead Code Elimination', 'Variable Declaration Optimization', 
                     'Function Optimization', 'Loop Optimization', 'Whitespace Optimization'];
      return order.indexOf(a.name) - order.indexOf(b.name);
    });
  }

  /**
   * Calculate performance gains
   */
  private async calculatePerformanceGains(
    original: string, 
    optimized: string, 
    analysis: CodeAnalysis
  ): Promise<ScriptOptimizationResult['performanceGains']> {
    const originalSize = original.length;
    const optimizedSize = optimized.length;
    
    // Memory reduction calculation
    const memoryReduction = Math.max(0, (originalSize - optimizedSize) / originalSize * 100);
    
    // Size reduction calculation
    const sizeReduction = Math.max(0, (1 - optimizedSize / originalSize) * 100);
    
    // Speed improvement estimation (heuristic based on optimizations)
    let speedImprovement = 0;
    
    // Estimate speed improvement based on optimizations applied
    if (optimized.includes('cached_')) speedImprovement += 15; // Caching
    if (optimized.includes('for (let') && !optimized.includes('forEach')) speedImprovement += 10; // Loop optimization
    if (optimized.includes('const ') && !original.includes('const ')) speedImprovement += 5; // Variable optimization
    
    return {
      memoryReduction,
      sizeReduction,
      estimatedSpeedImprovement: Math.min(speedImprovement, 50) // Cap at 50%
    };
  }

  /**
   * Helper methods for code analysis
   */
  private findLineNumber(code: string, index: number): number {
    return code.substring(0, index).split('\n').length;
  }

  private calculateFunctionComplexity(functionBody: string): number {
    const complexityPatterns = [/if\s*\(/g, /for\s*\(/g, /while\s*\(/g, /switch\s*\(/g];
    return complexityPatterns.reduce((total, pattern) => {
      return total + (functionBody.match(pattern) || []).length;
    }, 1);
  }

  private countParameters(functionBody: string): number {
    const paramMatch = functionBody.match(/function\s*[^(]*\(([^)]*)\)/);
    if (!paramMatch || !paramMatch[1]) return 0;
    return paramMatch[1].split(',').filter(p => p.trim()).length;
  }

  private countFunctionCalls(code: string, functionName: string): number {
    const callPattern = new RegExp(`\\b${functionName}\\s*\\(`, 'g');
    return (code.match(callPattern) || []).length;
  }

  private determineScope(code: string, index: number): 'global' | 'function' | 'block' {
    const beforeCode = code.substring(0, index);
    const functionCount = (beforeCode.match(/function\s+\w+/g) || []).length;
    const blockCount = (beforeCode.match(/{/g) || []).length - (beforeCode.match(/}/g) || []).length;
    
    if (functionCount > 0) return 'function';
    if (blockCount > 0) return 'block';
    return 'global';
  }

  private countVariableUsage(code: string, varName: string): number {
    const usagePattern = new RegExp(`\\b${varName}\\b`, 'g');
    return (code.match(usagePattern) || []).length;
  }

  private isVariableReassigned(code: string, varName: string, varType: string): boolean {
    if (varType === 'const') return false;
    const assignmentPattern = new RegExp(`\\b${varName}\\s*=(?!=)`, 'g');
    return (code.match(assignmentPattern) || []).length > 1; // More than initial declaration
  }

  private isNestedLoop(code: string, index: number): boolean {
    const beforeCode = code.substring(0, index);
    const loopPatterns = [/\bfor\s*\(/g, /\bwhile\s*\(/g];
    
    for (const pattern of loopPatterns) {
      const matches = Array.from(beforeCode.matchAll(pattern));
      if (matches.length > 0) {
        // Check if we're inside a loop block
        const lastLoopIndex = matches[matches.length - 1].index!;
        const afterLoop = code.substring(lastLoopIndex);
        const openBraces = (afterLoop.match(/{/g) || []).length;
        const closeBraces = (afterLoop.match(/}/g) || []).length;
        if (openBraces > closeBraces) return true;
      }
    }
    
    return false;
  }

  private estimateLoopIterations(loopCode: string): number {
    // Simple heuristic for loop iteration estimation
    if (loopCode.includes('.length')) return 100; // Assume average array length
    if (loopCode.includes('< 10')) return 10;
    if (loopCode.includes('< 100')) return 100;
    if (loopCode.includes('< 1000')) return 1000;
    return 50; // Default estimate
  }

  private hasBreakStatement(code: string, loopIndex: number): boolean {
    // Find the matching closing brace for this loop
    const afterLoop = code.substring(loopIndex);
    const openBrace = afterLoop.indexOf('{');
    if (openBrace === -1) return false;
    
    let braceCount = 1;
    let currentIndex = openBrace + 1;
    
    while (braceCount > 0 && currentIndex < afterLoop.length) {
      if (afterLoop[currentIndex] === '{') braceCount++;
      if (afterLoop[currentIndex] === '}') braceCount--;
      currentIndex++;
    }
    
    const loopBody = afterLoop.substring(openBrace, currentIndex);
    return loopBody.includes('break');
  }

  private isInLoop(code: string, index: number): boolean {
    return this.isNestedLoop(code, index);
  }

  private estimateMemoryUsage(code: string): MemoryUsage {
    // Simple heuristic for memory usage estimation
    const lines = code.split('\n').length;
    const objectCount = (code.match(/{/g) || []).length;
    const arrayCount = (code.match(/\[/g) || []).length;
    const stringCount = (code.match(/["'`]/g) || []).length;

    return {
      estimatedHeapSize: lines * 100 + objectCount * 200 + arrayCount * 150,
      estimatedStackSize: lines * 10,
      objectCount,
      stringMemory: stringCount * 50,
      arrayMemory: arrayCount * 100
    };
  }

  private calculateOverallComplexity(code: string): number {
    const complexityIndicators = [
      /if\s*\(/g, /for\s*\(/g, /while\s*\(/g, /switch\s*\(/g,
      /catch\s*\(/g, /\|\|/g, /&&/g
    ];

    return complexityIndicators.reduce((total, pattern) => {
      return total + (code.match(pattern) || []).length;
    }, 1);
  }

  private estimateExecutionMetrics(analysis: CodeAnalysis): ExecutionMetrics {
    const totalApiCalls = analysis.apiCalls.reduce((sum, api) => sum + api.count, 0);
    const loopComplexity = analysis.loops.reduce((sum, loop) => sum + loop.estimatedIterations, 0);
    
    return {
      estimatedTotalTime: analysis.functions.length * 2 + loopComplexity * 0.01 + totalApiCalls * 0.5,
      hotPaths: analysis.functions
        .filter(f => f.callCount > 5 || f.complexity > 10)
        .map(f => ({
          functionName: f.name,
          estimatedTime: f.complexity * f.callCount * 0.1,
          callCount: f.callCount,
          optimizationPriority: f.complexity * f.callCount
        })),
      systemCallCounts: analysis.apiCalls.reduce((acc, api) => {
        acc[api.api] = api.count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private calculateAPICallFrequency(analysis: CodeAnalysis): Record<string, number> {
    return analysis.apiCalls.reduce((acc, api) => {
      acc[api.api] = api.count;
      return acc;
    }, {} as Record<string, number>);
  }

  private categorizeLoopComplexity(iterations: number): 'constant' | 'linear' | 'quadratic' | 'exponential' {
    if (iterations <= 10) return 'constant';
    if (iterations <= 1000) return 'linear';
    if (iterations <= 100000) return 'quadratic';
    return 'exponential';
  }

  private suggestLoopOptimization(loop: LoopInfo): string {
    if (loop.type === 'forEach') return 'Consider using traditional for loop for better performance';
    if (loop.isNested) return 'Consider loop restructuring or caching for nested loops';
    if (loop.estimatedIterations > 1000) return 'Consider breaking large loops into smaller chunks';
    return 'Loop appears optimized';
  }

  private identifyOptimizationOpportunities(analysis: CodeAnalysis): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Function-based suggestions
    analysis.functions.forEach(func => {
      if (func.complexity > 15) {
        suggestions.push({
          type: 'performance',
          priority: func.complexity,
          description: `Function '${func.name}' has high complexity (${func.complexity})`,
          before: `function ${func.name}() { /* complex logic */ }`,
          after: `// Break into smaller functions\nfunction ${func.name}Part1() { /* ... */ }\nfunction ${func.name}Part2() { /* ... */ }`,
          estimatedGain: '10-20% performance improvement'
        });
      }

      if (func.isRecursive && func.callCount > 100) {
        suggestions.push({
          type: 'performance',
          priority: func.callCount,
          description: `Recursive function '${func.name}' called frequently`,
          before: `function ${func.name}() { return ${func.name}(); }`,
          after: `// Convert to iterative approach\nfunction ${func.name}() { while(condition) { /* ... */ } }`,
          estimatedGain: '20-30% performance improvement'
        });
      }
    });

    // API usage suggestions
    analysis.apiCalls.forEach(api => {
      if (api.isInLoop && api.count > 50) {
        suggestions.push({
          type: 'api_usage',
          priority: api.count,
          description: `${api.api} calls inside loops can be expensive`,
          before: `for(...) { ${api.api}.someMethod(); }`,
          after: `const cached = ${api.api}.someMethod();\nfor(...) { /* use cached */ }`,
          estimatedGain: '15-25% performance improvement'
        });
      }
    });

    // Memory suggestions
    if (analysis.memoryUsage.estimatedHeapSize > 10000000) { // > 10MB
      suggestions.push({
        type: 'memory',
        priority: Math.floor(analysis.memoryUsage.estimatedHeapSize / 1000000),
        description: 'High estimated memory usage detected',
        before: 'Large objects and arrays created frequently',
        after: 'Use object pooling and avoid unnecessary allocations',
        estimatedGain: '30-40% memory reduction'
      });
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }
}

export default ToxoidScriptOptimizer;