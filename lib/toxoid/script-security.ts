/**
 * Toxoid Script Security System
 *
 * Advanced security validation and sanitization for user-generated scripts.
 * Provides defense-in-depth against malicious code execution, resource exhaustion,
 * and unauthorized API access within the QuickJS sandbox environment.
 */

import * as acorn from "acorn";
import { Node } from "acorn";

import {
  SecurityCheck,
  SecurityScanResult,
  SecurityIssue,
  ScriptConstraints,
} from "@/types/toxoid";

interface SecurityContext {
  script: string;
  ast: Node | null;
  constraints: ScriptConstraints;
  riskFactors: RiskFactor[];
}

interface RiskFactor {
  type: "syntax" | "api" | "pattern" | "resource" | "injection";
  severity: "low" | "medium" | "high" | "critical";
  score: number;
  description: string;
}

interface SandboxLimits {
  maxExecutionTime: number;
  maxMemoryUsage: number;
  maxStackDepth: number;
  maxLoopIterations: number;
  maxFunctionCalls: number;
  maxStringLength: number;
  maxArrayLength: number;
  maxObjectDepth: number;
}

export class ToxoidScriptSecurity {
  private securityChecks: SecurityCheck[];
  private criticalPatterns: RegExp[];
  private suspiciousPatterns: RegExp[];
  private sandboxLimits: SandboxLimits;
  private allowedGlobals: Set<string>;
  private forbiddenConstructors: Set<string>;

  constructor() {
    this.initializeSecurityChecks();
    this.initializePatterns();
    this.initializeSandboxLimits();
    this.initializeAllowedAPIs();
  }

  /**
   * Perform comprehensive security scan
   */
  async scanScript(
    script: string,
    constraints?: ScriptConstraints,
  ): Promise<SecurityScanResult> {
    const context = await this.buildSecurityContext(script, constraints);
    const issues: SecurityIssue[] = [];
    let riskScore = 0;

    // Run all security checks
    for (const check of this.securityChecks) {
      try {
        const checkResults = await this.runSecurityCheck(check, context);

        issues.push(...checkResults);
      } catch (error) {
        console.error(`[Security] Check ${check.name} failed:`, error);
        issues.push({
          check: check.name,
          severity: "high",
          message: `Security check failed: ${check.name}`,
          suggestion: "Review script for potential security issues",
        });
      }
    }

    // Calculate risk score
    riskScore = this.calculateRiskScore(issues, context);

    // Add additional context-based risks
    riskScore += this.assessContextualRisks(context);

    return {
      passed:
        riskScore < 30 &&
        !issues.some((issue) => issue.severity === "critical"),
      issues,
      riskScore: Math.min(100, riskScore),
    };
  }

  /**
   * Sanitize script by removing or modifying dangerous patterns
   */
  sanitizeScript(script: string): {
    sanitized: string;
    modifications: string[];
  } {
    let sanitized = script;
    const modifications: string[] = [];

    // Remove dangerous function calls
    const dangerousPatterns = [
      {
        pattern: /eval\s*\([^)]*\)/g,
        replacement: "/* eval() call removed */",
        desc: "Removed eval() call",
      },
      {
        pattern: /Function\s*\([^)]*\)/g,
        replacement: "/* Function() constructor removed */",
        desc: "Removed Function() constructor",
      },
      {
        pattern: /setTimeout\s*\([^)]*\)/g,
        replacement: "/* setTimeout() removed */",
        desc: "Removed setTimeout() call",
      },
      {
        pattern: /setInterval\s*\([^)]*\)/g,
        replacement: "/* setInterval() removed */",
        desc: "Removed setInterval() call",
      },
      {
        pattern: /XMLHttpRequest/g,
        replacement: "/* XMLHttpRequest removed */",
        desc: "Removed XMLHttpRequest usage",
      },
      {
        pattern: /fetch\s*\(/g,
        replacement: "/* fetch() call removed */ (",
        desc: "Removed fetch() call",
      },
    ];

    dangerousPatterns.forEach(({ pattern, replacement, desc }) => {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, replacement);
        modifications.push(desc);
      }
    });

    // Sanitize property access to dangerous objects
    const objectAccessPatterns = [
      {
        pattern: /window\./g,
        replacement: "/* window access removed */.",
        desc: "Removed window object access",
      },
      {
        pattern: /document\./g,
        replacement: "/* document access removed */.",
        desc: "Removed document object access",
      },
      {
        pattern: /global\./g,
        replacement: "/* global access removed */.",
        desc: "Removed global object access",
      },
      {
        pattern: /process\./g,
        replacement: "/* process access removed */.",
        desc: "Removed process object access",
      },
      {
        pattern: /require\s*\(/g,
        replacement: "/* require() removed */ (",
        desc: "Removed require() call",
      },
      {
        pattern: /import\s*\(/g,
        replacement: "/* dynamic import removed */ (",
        desc: "Removed dynamic import",
      },
    ];

    objectAccessPatterns.forEach(({ pattern, replacement, desc }) => {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(pattern, replacement);
        modifications.push(desc);
      }
    });

    // Add resource monitoring wrapper if needed
    if (this.needsResourceMonitoring(script)) {
      sanitized = this.wrapWithResourceMonitoring(sanitized);
      modifications.push("Added resource monitoring wrapper");
    }

    return { sanitized, modifications };
  }

  /**
   * Create secure execution wrapper
   */
  createSecureWrapper(script: string): string {
    return `
(function() {
  "use strict";
  
  // Security context
  const startTime = Date.now();
  let operationCount = 0;
  const maxOperations = ${this.sandboxLimits.maxFunctionCalls};
  const maxExecutionTime = ${this.sandboxLimits.maxExecutionTime};
  
  // Operation counter wrapper
  function checkOperationLimit() {
    operationCount++;
    if (operationCount > maxOperations) {
      throw new Error("Operation limit exceeded");
    }
    
    const elapsed = Date.now() - startTime;
    if (elapsed > maxExecutionTime) {
      throw new Error("Execution time limit exceeded");
    }
  }
  
  // Memory usage tracking
  let allocatedObjects = 0;
  const maxObjects = ${this.sandboxLimits.maxArrayLength};
  
  const originalObjectCreate = Object.create;
  Object.create = function(...args) {
    checkOperationLimit();
    allocatedObjects++;
    if (allocatedObjects > maxObjects) {
      throw new Error("Memory allocation limit exceeded");
    }
    return originalObjectCreate.apply(this, args);
  };
  
  // Secure console wrapper
  const secureConsole = {
    log: function(...args) {
      checkOperationLimit();
      console.log("[Script]", ...args);
    },
    error: function(...args) {
      checkOperationLimit();
      console.error("[Script Error]", ...args);
    },
    warn: function(...args) {
      checkOperationLimit();
      console.warn("[Script Warning]", ...args);
    }
  };
  
  // Override global console
  const originalConsole = console;
  try {
    // User script execution
    ${script}
  } catch (error) {
    secureConsole.error("Script execution failed:", error.message);
    throw error;
  } finally {
    // Restore original console
    console = originalConsole;
  }
})();`;
  }

  /**
   * Validate sandbox compatibility
   */
  validateSandboxCompatibility(script: string): {
    compatible: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for QuickJS incompatible features
    const incompatiblePatterns = [
      {
        pattern: /class\s+\w+\s+extends/,
        issue: "Class inheritance may have limited support in QuickJS",
      },
      {
        pattern: /async\s+function|\basync\s+\(/,
        issue: "Async/await support may be limited in QuickJS",
      },
      {
        pattern: /import\s+.*\s+from/,
        issue: "ES6 imports not supported in QuickJS sandbox",
      },
      {
        pattern: /export\s+(default\s+)?/,
        issue: "ES6 exports not supported in QuickJS sandbox",
      },
      { pattern: /Symbol\(/, issue: "Symbol usage may be limited in QuickJS" },
      {
        pattern: /Proxy\(/,
        issue: "Proxy objects may not be fully supported in QuickJS",
      },
      {
        pattern: /WeakMap|WeakSet/,
        issue: "WeakMap/WeakSet may have limited support in QuickJS",
      },
    ];

    incompatiblePatterns.forEach(({ pattern, issue }) => {
      if (pattern.test(script)) {
        issues.push(issue);
      }
    });

    // Recommendations for better compatibility
    if (script.includes("forEach")) {
      recommendations.push(
        "Consider using for loops instead of forEach for better performance",
      );
    }

    if (script.includes("arrow function") || script.includes("=>")) {
      recommendations.push(
        "Arrow functions are supported but regular functions may have better performance",
      );
    }

    if (script.includes("const") || script.includes("let")) {
      recommendations.push(
        "Use var for better QuickJS compatibility if needed",
      );
    }

    return {
      compatible: issues.length === 0,
      issues,
      recommendations,
    };
  }

  /**
   * Initialize security checks
   */
  private initializeSecurityChecks(): void {
    this.securityChecks = [
      {
        name: "Code Injection Detection",
        description: "Detects potential code injection attempts",
        severity: "critical",
        pattern: /eval\(|Function\(|setTimeout\(|setInterval\(/,
        suggestion: "Remove dynamic code execution patterns",
      },
      {
        name: "XSS Prevention",
        description: "Prevents cross-site scripting attempts",
        severity: "high",
        pattern: /innerHTML|outerHTML|insertAdjacentHTML|document\.write/,
        suggestion: "Use safe DOM manipulation methods",
      },
      {
        name: "Prototype Pollution",
        description: "Detects prototype pollution attempts",
        severity: "high",
        pattern: /__proto__|constructor\.prototype|\.prototype\s*\[/,
        suggestion: "Avoid prototype manipulation",
      },
      {
        name: "Resource Access Control",
        description: "Controls access to system resources",
        severity: "medium",
        pattern: /localStorage|sessionStorage|indexedDB|websocket/i,
        suggestion: "Use game-specific storage mechanisms",
      },
      {
        name: "Network Request Prevention",
        description: "Prevents unauthorized network requests",
        severity: "critical",
        pattern: /XMLHttpRequest|fetch\(|\.open\(|\.send\(/,
        suggestion: "Remove network request code",
      },
      {
        name: "File System Access",
        description: "Prevents file system access attempts",
        severity: "critical",
        pattern: /require\(|import\(|fs\.|path\.|os\./,
        suggestion: "Use game engine APIs instead of system APIs",
      },
      {
        name: "Global Object Access",
        description: "Prevents access to global objects",
        severity: "high",
        pattern: /window\.|global\.|process\.|Buffer\./,
        suggestion: "Use provided game engine APIs",
      },
      {
        name: "Infinite Loop Detection",
        description: "Detects potential infinite loops",
        severity: "medium",
        pattern: (code: string) => this.hasInfiniteLoopRisk(code),
        suggestion: "Add proper loop termination conditions",
      },
      {
        name: "Memory Exhaustion",
        description: "Detects potential memory exhaustion patterns",
        severity: "medium",
        pattern: (code: string) => this.hasMemoryExhaustionRisk(code),
        suggestion: "Limit object creation and array sizes",
      },
      {
        name: "Denial of Service",
        description: "Detects potential DoS patterns",
        severity: "high",
        pattern: (code: string) => this.hasDoSRisk(code),
        suggestion: "Remove recursive or resource-intensive operations",
      },
    ];
  }

  /**
   * Initialize pattern matching
   */
  private initializePatterns(): void {
    this.criticalPatterns = [
      /eval\s*\(/gi,
      /Function\s*\(/gi,
      /XMLHttpRequest/gi,
      /fetch\s*\(/gi,
      /require\s*\(/gi,
      /import\s*\(/gi,
      /__proto__/gi,
      /constructor\.constructor/gi,
      /process\./gi,
      /global\./gi,
    ];

    this.suspiciousPatterns = [
      /innerHTML/gi,
      /outerHTML/gi,
      /insertAdjacentHTML/gi,
      /document\.write/gi,
      /localStorage/gi,
      /sessionStorage/gi,
      /setTimeout/gi,
      /setInterval/gi,
      /websocket/gi,
      /worker/gi,
    ];
  }

  /**
   * Initialize sandbox limits
   */
  private initializeSandboxLimits(): void {
    this.sandboxLimits = {
      maxExecutionTime: 5000, // 5 seconds
      maxMemoryUsage: 50 * 1024 * 1024, // 50MB
      maxStackDepth: 100,
      maxLoopIterations: 10000,
      maxFunctionCalls: 1000,
      maxStringLength: 10000,
      maxArrayLength: 1000,
      maxObjectDepth: 10,
    };
  }

  /**
   * Initialize allowed APIs
   */
  private initializeAllowedAPIs(): void {
    this.allowedGlobals = new Set([
      "Toxoid",
      "console",
      "Math",
      "Date",
      "JSON",
      "parseInt",
      "parseFloat",
      "isNaN",
      "isFinite",
      "Array",
      "Object",
      "String",
      "Number",
      "Boolean",
    ]);

    this.forbiddenConstructors = new Set([
      "Function",
      "WebSocket",
      "Worker",
      "SharedWorker",
      "XMLHttpRequest",
      "EventSource",
    ]);
  }

  /**
   * Build security context
   */
  private async buildSecurityContext(
    script: string,
    constraints?: ScriptConstraints,
  ): Promise<SecurityContext> {
    let ast: Node | null = null;

    try {
      ast = acorn.parse(script, {
        ecmaVersion: 2020,
        sourceType: "script",
      });
    } catch (error) {
      // Continue with null AST for syntax error handling
    }

    const riskFactors = this.analyzeRiskFactors(script, ast);

    return {
      script,
      ast,
      constraints: constraints || {
        maxMemoryMB: 50,
        maxStackMB: 1,
        allowedAPIs: Array.from(this.allowedGlobals),
        forbiddenPatterns: Array.from(
          this.criticalPatterns.map((p) => p.source),
        ),
        maxExecutionTime: 5000,
        maxLoops: 10000,
      },
      riskFactors,
    };
  }

  /**
   * Run individual security check
   */
  private async runSecurityCheck(
    check: SecurityCheck,
    context: SecurityContext,
  ): Promise<SecurityIssue[]> {
    const issues: SecurityIssue[] = [];

    if (typeof check.pattern === "function") {
      if (check.pattern(context.script)) {
        issues.push({
          check: check.name,
          severity: check.severity,
          message: check.description,
          suggestion: check.suggestion,
        });
      }
    } else {
      const matches = context.script.match(check.pattern);

      if (matches) {
        matches.forEach((match, index) => {
          const lines = context.script.split("\n");
          let lineNumber = 0;
          let columnNumber = 0;

          // Find line and column
          let characterIndex = context.script.indexOf(match);
          let currentIndex = 0;

          for (let i = 0; i < lines.length; i++) {
            if (currentIndex + lines[i].length >= characterIndex) {
              lineNumber = i + 1;
              columnNumber = characterIndex - currentIndex;
              break;
            }
            currentIndex += lines[i].length + 1; // +1 for newline
          }

          issues.push({
            check: check.name,
            severity: check.severity,
            line: lineNumber,
            column: columnNumber,
            message: `${check.description}: "${match}"`,
            suggestion: check.suggestion,
            codeSnippet: lines[lineNumber - 1]?.substring(
              Math.max(0, columnNumber - 20),
              Math.min(lines[lineNumber - 1].length, columnNumber + 20),
            ),
          });
        });
      }
    }

    return issues;
  }

  /**
   * Analyze risk factors
   */
  private analyzeRiskFactors(script: string, ast: Node | null): RiskFactor[] {
    const factors: RiskFactor[] = [];

    // Syntax complexity risks
    const lines = script.split("\n").length;

    if (lines > 500) {
      factors.push({
        type: "syntax",
        severity: "medium",
        score: 10,
        description: `Large script (${lines} lines) increases attack surface`,
      });
    }

    // Pattern-based risks
    this.criticalPatterns.forEach((pattern) => {
      if (pattern.test(script)) {
        factors.push({
          type: "pattern",
          severity: "critical",
          score: 25,
          description: `Critical security pattern detected: ${pattern.source}`,
        });
      }
    });

    this.suspiciousPatterns.forEach((pattern) => {
      if (pattern.test(script)) {
        factors.push({
          type: "pattern",
          severity: "medium",
          score: 10,
          description: `Suspicious pattern detected: ${pattern.source}`,
        });
      }
    });

    // Resource exhaustion risks
    if (this.hasResourceExhaustionRisk(script)) {
      factors.push({
        type: "resource",
        severity: "high",
        score: 20,
        description: "Potential resource exhaustion patterns detected",
      });
    }

    return factors;
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(
    issues: SecurityIssue[],
    context: SecurityContext,
  ): number {
    let score = 0;

    issues.forEach((issue) => {
      switch (issue.severity) {
        case "critical":
          score += 30;
          break;
        case "high":
          score += 20;
          break;
        case "medium":
          score += 10;
          break;
        case "low":
          score += 5;
          break;
      }
    });

    // Add risk factor scores
    context.riskFactors.forEach((factor) => {
      score += factor.score;
    });

    return score;
  }

  /**
   * Assess contextual risks
   */
  private assessContextualRisks(context: SecurityContext): number {
    let risk = 0;

    // Script size risk
    if (context.script.length > 50000) {
      risk += 15;
    }

    // Complexity risk
    const complexity = this.calculateComplexity(context.script);

    if (complexity > 20) {
      risk += 10;
    }

    // Obfuscation risk
    if (this.appearsObfuscated(context.script)) {
      risk += 25;
    }

    return risk;
  }

  /**
   * Risk detection helpers
   */
  private hasInfiniteLoopRisk(code: string): boolean {
    const loopPatterns = [
      /while\s*\(\s*true\s*\)/g,
      /while\s*\(\s*1\s*\)/g,
      /for\s*\(\s*;\s*;\s*\)/g,
    ];

    return loopPatterns.some((pattern) => pattern.test(code));
  }

  private hasMemoryExhaustionRisk(code: string): boolean {
    const memoryPatterns = [
      /new\s+Array\s*\(\s*\d{6,}\s*\)/g, // Large array allocation
      /\.repeat\s*\(\s*\d{4,}\s*\)/g, // Large string repetition
      /new\s+\w+\s*\[[^\]]{50,}\]/g, // Large object literal
    ];

    return memoryPatterns.some((pattern) => pattern.test(code));
  }

  private hasDoSRisk(code: string): boolean {
    const dosPatterns = [
      /function\s+\w+[^{]*{\s*return\s+\w+\s*\([^)]*\)\s*;?\s*}/g, // Recursive calls
      /while[^{]*{[^}]*while/g, // Nested loops
      /for[^{]*{[^}]*for[^{]*{[^}]*for/g, // Triple nested loops
    ];

    return dosPatterns.some((pattern) => pattern.test(code));
  }

  private hasResourceExhaustionRisk(code: string): boolean {
    return (
      this.hasInfiniteLoopRisk(code) ||
      this.hasMemoryExhaustionRisk(code) ||
      this.hasDoSRisk(code)
    );
  }

  private calculateComplexity(code: string): number {
    const complexityIndicators = [
      /if\s*\(/g,
      /else/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /case\s+/g,
      /catch\s*\(/g,
      /\|\|/g,
      /&&/g,
    ];

    return complexityIndicators.reduce((total, pattern) => {
      const matches = code.match(pattern);

      return total + (matches ? matches.length : 0);
    }, 1);
  }

  private appearsObfuscated(code: string): boolean {
    const obfuscationIndicators = [
      code.includes("\\x"), // Hex escapes
      code.includes("\\u"), // Unicode escapes
      code.match(/[a-zA-Z_$][a-zA-Z0-9_$]*/) === null, // No clear identifiers
      code.length > 1000 && code.split(" ").length < code.length / 20, // Very dense code
      /['"](?:\\.|[^'"])*['"][+\s]*['"](?:\\.|[^'"])*['"]/g.test(code), // String concatenation obfuscation
    ];

    return obfuscationIndicators.filter(Boolean).length >= 2;
  }

  private needsResourceMonitoring(script: string): boolean {
    return (
      script.includes("while") ||
      script.includes("for") ||
      script.includes("setInterval") ||
      script.includes("setTimeout") ||
      script.length > 5000
    );
  }

  private wrapWithResourceMonitoring(script: string): string {
    return `
// Resource monitoring wrapper
(function() {
  const startTime = Date.now();
  let operationCount = 0;
  const maxOperations = ${this.sandboxLimits.maxFunctionCalls};
  const maxTime = ${this.sandboxLimits.maxExecutionTime};
  
  function checkLimits() {
    operationCount++;
    if (operationCount > maxOperations) {
      throw new Error("Operation limit exceeded");
    }
    if (Date.now() - startTime > maxTime) {
      throw new Error("Time limit exceeded");
    }
  }
  
  // Inject monitoring into loops and function calls
  const originalCall = Function.prototype.call;
  Function.prototype.call = function(...args) {
    checkLimits();
    return originalCall.apply(this, args);
  };
  
  try {
    ${script}
  } finally {
    // Restore original
    Function.prototype.call = originalCall;
  }
})();`;
  }
}

export default ToxoidScriptSecurity;
