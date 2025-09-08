/**
 * Toxoid Script Validator
 *
 * Comprehensive validation system for Toxoid-compatible JavaScript scripts.
 * Validates API compliance, performance characteristics, security constraints,
 * and provides detailed feedback for script optimization.
 */

import * as acorn from "acorn";
import { Node } from "acorn";

import {
  ScriptValidationRequest,
  ScriptValidationResult,
  ScriptConstraints,
} from "@/types/toxoid";

interface ValidationContext {
  script: string;
  ast: Node;
  constraints: ScriptConstraints;
  performanceCheck: boolean;
}

interface APIUsage {
  [apiCall: string]: {
    count: number;
    lines: number[];
    severity: "info" | "warning" | "error";
  };
}

interface PerformanceMetrics {
  cyclomaticComplexity: number;
  estimatedMemoryUsage: number;
  loopComplexity: number;
  apiCallCount: number;
  functionCount: number;
  variableCount: number;
}

export class ToxoidScriptValidator {
  private defaultConstraints: ScriptConstraints;
  private toxoidAPIPatterns: RegExp[];
  private forbiddenPatterns: RegExp[];
  private performanceThresholds: Record<string, number>;

  constructor() {
    this.defaultConstraints = {
      maxMemoryMB: 50,
      maxStackMB: 1,
      allowedAPIs: [
        "Toxoid.API.*",
        "Toxoid.System.*",
        "Toxoid.Observer.*",
        "Toxoid.Query.*",
        "console.log",
        "Math.*",
        "Date.*",
      ],
      forbiddenPatterns: [
        "eval(",
        "Function(",
        "setTimeout(",
        "setInterval(",
        "XMLHttpRequest",
        "fetch(",
        "import(",
        "require(",
        "process.",
        "global.",
        "window.",
        "document.",
      ],
      maxExecutionTime: 100,
      maxLoops: 10000,
    };

    this.toxoidAPIPatterns = [
      /Toxoid\.API\./g,
      /Toxoid\.System\./g,
      /Toxoid\.Observer\./g,
      /Toxoid\.Query\./g,
      /Toxoid\.Phases\./g,
      /Toxoid\.ObserverEvents\./g,
    ];

    this.forbiddenPatterns = [
      /eval\s*\(/g,
      /Function\s*\(/g,
      /setTimeout\s*\(/g,
      /setInterval\s*\(/g,
      /XMLHttpRequest/g,
      /fetch\s*\(/g,
      /import\s*\(/g,
      /require\s*\(/g,
      /process\./g,
      /global\./g,
      /window\./g,
      /document\./g,
      /localStorage/g,
      /sessionStorage/g,
    ];

    this.performanceThresholds = {
      maxCyclomaticComplexity: 15,
      maxFunctionLength: 100,
      maxVariablesPerScope: 20,
      maxNestedLoops: 3,
      maxApiCallsPerFrame: 50,
    };
  }

  /**
   * Validate a Toxoid script comprehensively
   */
  async validateScript(
    request: ScriptValidationRequest,
  ): Promise<ScriptValidationResult> {
    try {
      const constraints = {
        ...this.defaultConstraints,
        ...request.constraints,
      };

      const context = await this.buildValidationContext(
        request.script,
        constraints,
        request.performanceCheck || false,
      );

      const result: ScriptValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        metrics: {
          estimatedMemoryUsage: 0,
          cyclomaticComplexity: 0,
          apiUsageCount: {},
          performanceScore: 100,
          securityScore: 100,
          maintainabilityScore: 100,
        },
        suggestions: [],
      };

      // Run all validation checks
      await this.validateSyntax(context, result);
      await this.validateToxoidAPI(context, result);
      await this.validateSecurity(context, result);
      await this.validatePerformance(context, result);
      await this.validateBestPractices(context, result);

      // Calculate overall scores
      this.calculateScores(result);

      // Set overall validity
      result.isValid = result.errors.length === 0;

      return result;
    } catch (error) {
      console.error("[ScriptValidator] Validation failed:", error);

      return {
        isValid: false,
        errors: [
          {
            line: 0,
            column: 0,
            message: `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
            severity: "critical",
            code: "VALIDATION_ERROR",
          },
        ],
        warnings: [],
        metrics: {
          estimatedMemoryUsage: 0,
          cyclomaticComplexity: 0,
          apiUsageCount: {},
          performanceScore: 0,
          securityScore: 0,
          maintainabilityScore: 0,
        },
        suggestions: ["Fix syntax errors and try validation again"],
      };
    }
  }

  /**
   * Build validation context
   */
  private async buildValidationContext(
    script: string,
    constraints: ScriptConstraints,
    performanceCheck: boolean,
  ): Promise<ValidationContext> {
    let ast: Node;

    try {
      ast = acorn.parse(script, {
        ecmaVersion: 2020,
        sourceType: "script",
        locations: true,
      });
    } catch (syntaxError) {
      // Create minimal AST for error reporting
      ast = { type: "Program", body: [] } as Node;
    }

    return {
      script,
      ast,
      constraints,
      performanceCheck,
    };
  }

  /**
   * Validate JavaScript syntax
   */
  private async validateSyntax(
    context: ValidationContext,
    result: ScriptValidationResult,
  ): Promise<void> {
    try {
      acorn.parse(context.script, {
        ecmaVersion: 2020,
        sourceType: "script",
        locations: true,
      });
    } catch (syntaxError: any) {
      const location = syntaxError.loc || { line: 1, column: 0 };

      result.errors.push({
        line: location.line,
        column: location.column,
        message: `Syntax error: ${syntaxError.message}`,
        severity: "critical",
        code: "SYNTAX_ERROR",
      });
    }
  }

  /**
   * Validate Toxoid API usage
   */
  private async validateToxoidAPI(
    context: ValidationContext,
    result: ScriptValidationResult,
  ): Promise<void> {
    const lines = context.script.split("\n");
    const apiUsage: APIUsage = {};

    // Track API usage
    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for Toxoid API calls
      this.toxoidAPIPatterns.forEach((pattern) => {
        const matches = line.matchAll(pattern);

        for (const match of matches) {
          const apiCall = match[0];

          if (!apiUsage[apiCall]) {
            apiUsage[apiCall] = { count: 0, lines: [], severity: "info" };
          }
          apiUsage[apiCall].count++;
          apiUsage[apiCall].lines.push(lineNumber);
        }
      });

      // Check for common Toxoid patterns
      if (line.includes("Toxoid.System.create")) {
        this.validateSystemCreation(line, lineNumber, result);
      }

      if (line.includes("Toxoid.Observer.create")) {
        this.validateObserverCreation(line, lineNumber, result);
      }

      if (line.includes("entity.getComponent")) {
        this.validateComponentAccess(line, lineNumber, result);
      }

      // Check for missing error handling
      if (line.includes(".getComponent(") && !this.hasNullCheck(lines, index)) {
        result.warnings.push({
          line: lineNumber,
          column: line.indexOf(".getComponent("),
          message:
            "Component access without null check may cause runtime errors",
          code: "MISSING_NULL_CHECK",
        });
      }
    });

    // Store API usage in metrics
    result.metrics.apiUsageCount = Object.keys(apiUsage).reduce(
      (acc, key) => {
        acc[key] = apiUsage[key].count;

        return acc;
      },
      {} as Record<string, number>,
    );

    // Validate minimum API usage
    if (!context.script.includes("Toxoid.")) {
      result.errors.push({
        line: 1,
        column: 0,
        message: "Script does not use any Toxoid APIs",
        severity: "error",
        code: "NO_TOXOID_API",
      });
    }
  }

  /**
   * Validate security constraints
   */
  private async validateSecurity(
    context: ValidationContext,
    result: ScriptValidationResult,
  ): Promise<void> {
    const lines = context.script.split("\n");
    let securityScore = 100;

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check forbidden patterns
      context.constraints.forbiddenPatterns.forEach((pattern) => {
        if (line.includes(pattern)) {
          const severity = this.getSecuritySeverity(pattern);

          result.errors.push({
            line: lineNumber,
            column: line.indexOf(pattern),
            message: `Forbidden pattern detected: ${pattern}`,
            severity,
            code: "FORBIDDEN_PATTERN",
          });
          securityScore -= severity === "critical" ? 30 : 15;
        }
      });

      // Check for suspicious patterns
      const suspiciousPatterns = [
        { pattern: "innerHTML", severity: "warning" as const, score: 10 },
        { pattern: "outerHTML", severity: "warning" as const, score: 10 },
        {
          pattern: "insertAdjacentHTML",
          severity: "warning" as const,
          score: 15,
        },
        { pattern: "document.write", severity: "error" as const, score: 25 },
        { pattern: "__proto__", severity: "warning" as const, score: 20 },
        {
          pattern: "constructor.constructor",
          severity: "error" as const,
          score: 30,
        },
      ];

      suspiciousPatterns.forEach(({ pattern, severity, score }) => {
        if (line.includes(pattern)) {
          if (severity === "error") {
            result.errors.push({
              line: lineNumber,
              column: line.indexOf(pattern),
              message: `Potentially dangerous pattern: ${pattern}`,
              severity,
              code: "SECURITY_RISK",
            });
          } else {
            result.warnings.push({
              line: lineNumber,
              column: line.indexOf(pattern),
              message: `Security warning: ${pattern} usage should be reviewed`,
              code: "SECURITY_WARNING",
            });
          }
          securityScore -= score;
        }
      });
    });

    result.metrics.securityScore = Math.max(0, securityScore);
  }

  /**
   * Validate performance characteristics
   */
  private async validatePerformance(
    context: ValidationContext,
    result: ScriptValidationResult,
  ): Promise<void> {
    if (!context.performanceCheck) return;

    const metrics = this.calculatePerformanceMetrics(context);
    let performanceScore = 100;

    // Check cyclomatic complexity
    if (
      metrics.cyclomaticComplexity >
      this.performanceThresholds.maxCyclomaticComplexity
    ) {
      result.warnings.push({
        line: 0,
        column: 0,
        message: `High cyclomatic complexity (${metrics.cyclomaticComplexity}). Consider refactoring.`,
        code: "HIGH_COMPLEXITY",
      });
      performanceScore -= 20;
    }

    // Check estimated memory usage
    result.metrics.estimatedMemoryUsage = metrics.estimatedMemoryUsage;
    if (metrics.estimatedMemoryUsage > context.constraints.maxMemoryMB * 0.8) {
      result.warnings.push({
        line: 0,
        column: 0,
        message: `High estimated memory usage (${metrics.estimatedMemoryUsage.toFixed(1)}MB)`,
        code: "HIGH_MEMORY_USAGE",
      });
      performanceScore -= 15;
    }

    // Check for performance anti-patterns
    this.checkPerformanceAntiPatterns(context, result);

    result.metrics.cyclomaticComplexity = metrics.cyclomaticComplexity;
    result.metrics.performanceScore = Math.max(0, performanceScore);
  }

  /**
   * Validate best practices
   */
  private async validateBestPractices(
    context: ValidationContext,
    result: ScriptValidationResult,
  ): Promise<void> {
    const lines = context.script.split("\n");
    let maintainabilityScore = 100;

    // Check for proper error handling
    const hasErrorHandling =
      context.script.includes("try") && context.script.includes("catch");

    if (!hasErrorHandling) {
      result.warnings.push({
        line: 0,
        column: 0,
        message: "Script lacks error handling (try-catch blocks)",
        code: "NO_ERROR_HANDLING",
      });
      maintainabilityScore -= 10;
    }

    // Check for console logging
    const hasLogging = context.script.includes("console.log");

    if (!hasLogging) {
      result.suggestions.push(
        "Consider adding console.log statements for debugging",
      );
    }

    // Check function length and complexity
    this.checkFunctionQuality(context, result, maintainabilityScore);

    // Check for ECS best practices
    this.checkECSBestPractices(context, result);

    result.metrics.maintainabilityScore = Math.max(0, maintainabilityScore);
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(
    context: ValidationContext,
  ): PerformanceMetrics {
    let cyclomaticComplexity = 1; // Base complexity
    let estimatedMemoryUsage = 0;
    let loopComplexity = 0;
    let apiCallCount = 0;
    let functionCount = 0;
    let variableCount = 0;

    const lines = context.script.split("\n");

    lines.forEach((line) => {
      // Count complexity-adding constructs
      if (
        line.includes("if") ||
        line.includes("else") ||
        line.includes("switch")
      ) {
        cyclomaticComplexity++;
      }
      if (
        line.includes("for") ||
        line.includes("while") ||
        line.includes("do")
      ) {
        cyclomaticComplexity++;
        loopComplexity++;
      }
      if (
        line.includes("catch") ||
        line.includes("&&") ||
        line.includes("||")
      ) {
        cyclomaticComplexity++;
      }

      // Count API calls
      if (line.includes("Toxoid.")) {
        apiCallCount += (line.match(/Toxoid\./g) || []).length;
      }

      // Count functions
      if (line.includes("function") || line.includes("=>")) {
        functionCount++;
      }

      // Count variables (rough estimate)
      if (
        line.includes("const") ||
        line.includes("let") ||
        line.includes("var")
      ) {
        variableCount++;
      }

      // Estimate memory usage
      // Basic heuristic: each line contributes to memory usage
      estimatedMemoryUsage += line.length * 0.002; // ~2KB per 1000 characters
    });

    // Additional memory for objects and arrays
    const objectCount = (context.script.match(/\{/g) || []).length;
    const arrayCount = (context.script.match(/\[/g) || []).length;

    estimatedMemoryUsage += objectCount * 0.5 + arrayCount * 0.2;

    return {
      cyclomaticComplexity,
      estimatedMemoryUsage,
      loopComplexity,
      apiCallCount,
      functionCount,
      variableCount,
    };
  }

  /**
   * Check for performance anti-patterns
   */
  private checkPerformanceAntiPatterns(
    context: ValidationContext,
    result: ScriptValidationResult,
  ): void {
    const lines = context.script.split("\n");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for inefficient patterns
      if (line.includes("Toxoid.Query.create") && this.isInLoop(lines, index)) {
        result.warnings.push({
          line: lineNumber,
          column: line.indexOf("Toxoid.Query.create"),
          message: "Query creation inside loop can impact performance",
          code: "QUERY_IN_LOOP",
        });
      }

      if (line.includes(".forEach") && line.includes(".forEach")) {
        result.warnings.push({
          line: lineNumber,
          column: 0,
          message: "Nested forEach loops may impact performance",
          code: "NESTED_FOREACH",
        });
      }

      // Check for string concatenation in loops
      if (
        line.includes("+=") &&
        line.includes('"') &&
        this.isInLoop(lines, index)
      ) {
        result.warnings.push({
          line: lineNumber,
          column: line.indexOf("+="),
          message: "String concatenation in loop can be inefficient",
          code: "STRING_CONCAT_IN_LOOP",
        });
      }
    });
  }

  /**
   * Validate system creation syntax
   */
  private validateSystemCreation(
    line: string,
    lineNumber: number,
    result: ScriptValidationResult,
  ): void {
    if (!line.includes('"') || !line.includes(",")) {
      result.errors.push({
        line: lineNumber,
        column: line.indexOf("Toxoid.System.create"),
        message:
          "System.create requires name, query, phase, and callback parameters",
        severity: "error",
        code: "INVALID_SYSTEM_CREATION",
      });
    }
  }

  /**
   * Validate observer creation syntax
   */
  private validateObserverCreation(
    line: string,
    lineNumber: number,
    result: ScriptValidationResult,
  ): void {
    if (
      !line.includes("{") ||
      !line.includes("name") ||
      !line.includes("query")
    ) {
      result.errors.push({
        line: lineNumber,
        column: line.indexOf("Toxoid.Observer.create"),
        message:
          "Observer.create requires configuration object with name, query, events, and callback",
        severity: "error",
        code: "INVALID_OBSERVER_CREATION",
      });
    }
  }

  /**
   * Validate component access patterns
   */
  private validateComponentAccess(
    line: string,
    lineNumber: number,
    result: ScriptValidationResult,
  ): void {
    if (line.includes(".getComponent(") && !line.includes('"')) {
      result.warnings.push({
        line: lineNumber,
        column: line.indexOf(".getComponent("),
        message: "Component name should be a string literal",
        code: "DYNAMIC_COMPONENT_NAME",
      });
    }
  }

  /**
   * Check ECS best practices
   */
  private checkECSBestPractices(
    context: ValidationContext,
    result: ScriptValidationResult,
  ): void {
    // Check if systems are properly scoped
    if (
      context.script.includes("Toxoid.System.create") &&
      !context.script.includes("iter.entities()")
    ) {
      result.warnings.push({
        line: 0,
        column: 0,
        message: "Systems should iterate over entities using iter.entities()",
        code: "NO_ENTITY_ITERATION",
      });
    }

    // Check for proper component lifecycle
    if (
      context.script.includes(".add(") &&
      !context.script.includes(".getComponent(")
    ) {
      result.suggestions.push(
        "Components should be accessed after being added",
      );
    }
  }

  /**
   * Helper functions
   */
  private hasNullCheck(lines: string[], lineIndex: number): boolean {
    const nextLines = lines.slice(lineIndex + 1, lineIndex + 3);

    return nextLines.some(
      (line) =>
        line.includes("if") &&
        (line.includes("!") ||
          line.includes("null") ||
          line.includes("undefined")),
    );
  }

  private isInLoop(lines: string[], lineIndex: number): boolean {
    for (let i = lineIndex - 1; i >= 0; i--) {
      if (
        lines[i].includes("for") ||
        lines[i].includes("while") ||
        lines[i].includes(".forEach")
      ) {
        return true;
      }
      if (lines[i].includes("}")) {
        break;
      }
    }

    return false;
  }

  private getSecuritySeverity(pattern: string): "error" | "critical" {
    const criticalPatterns = ["eval(", "Function(", "XMLHttpRequest", "fetch("];

    return criticalPatterns.includes(pattern) ? "critical" : "error";
  }

  private checkFunctionQuality(
    context: ValidationContext,
    result: ScriptValidationResult,
    maintainabilityScore: number,
  ): number {
    const functions = context.script.match(/function[^{]*{[^}]*}/g) || [];

    functions.forEach((func) => {
      const lineCount = func.split("\n").length;

      if (lineCount > this.performanceThresholds.maxFunctionLength) {
        result.warnings.push({
          line: 0,
          column: 0,
          message: `Function is too long (${lineCount} lines). Consider breaking it down.`,
          code: "LONG_FUNCTION",
        });
        maintainabilityScore -= 5;
      }
    });

    return maintainabilityScore;
  }

  /**
   * Calculate overall scores
   */
  private calculateScores(result: ScriptValidationResult): void {
    // Reduce scores based on errors and warnings
    let performanceReduction =
      result.errors.length * 10 + result.warnings.length * 5;
    let securityReduction =
      result.errors.filter((e) => e.code.includes("SECURITY")).length * 15;
    let maintainabilityReduction = result.warnings.length * 3;

    result.metrics.performanceScore = Math.max(
      0,
      result.metrics.performanceScore - performanceReduction,
    );
    result.metrics.securityScore = Math.max(
      0,
      result.metrics.securityScore - securityReduction,
    );
    result.metrics.maintainabilityScore = Math.max(
      0,
      result.metrics.maintainabilityScore - maintainabilityReduction,
    );

    // Generate suggestions based on scores
    if (result.metrics.performanceScore < 70) {
      result.suggestions.push(
        "Consider optimizing performance-critical code sections",
      );
    }
    if (result.metrics.securityScore < 80) {
      result.suggestions.push("Review and remove security-sensitive patterns");
    }
    if (result.metrics.maintainabilityScore < 75) {
      result.suggestions.push("Improve code structure and add error handling");
    }
  }
}

export default ToxoidScriptValidator;
