# GameGen Platform: Security & Performance Considerations

**Version**: 1.0  
**Date**: 2025-09-05  
**Security Framework**: Zero-trust architecture with layered security  
**Performance Target**: Sub-3s page load, <30s game generation  
**Scale Target**: 10,000+ concurrent users  

## Security Architecture

### Security-First Design Principles

GameGen implements comprehensive security measures across all layers of the application stack, ensuring user data protection, content safety, and platform integrity while maintaining optimal performance.

#### Core Security Pillars
1. **Defense in Depth**: Multiple security layers with no single point of failure
2. **Zero Trust**: Never trust, always verify - every request authenticated
3. **Data Minimization**: Collect and store only necessary user data
4. **Encryption Everywhere**: Data encrypted at rest and in transit
5. **Continuous Monitoring**: Real-time threat detection and response

### Application Security Layer

#### Input Validation & Sanitization
```typescript
// lib/security/validation.ts
import DOMPurify from 'dompurify';
import { z } from 'zod';
import { rateLimit } from 'express-rate-limit';

class SecurityValidator {
  // Comprehensive input validation schemas
  private schemas = {
    gameTitle: z.string()
      .min(1, 'Title required')
      .max(100, 'Title too long')
      .regex(/^[a-zA-Z0-9\s\-_!?]+$/, 'Invalid characters in title'),
    
    gamePrompt: z.string()
      .min(10, 'Prompt too short')
      .max(2000, 'Prompt too long')
      .refine(this.checkForMaliciousContent, 'Content policy violation'),
    
    userEmail: z.string().email().max(254),
    
    fileName: z.string()
      .max(255)
      .regex(/^[a-zA-Z0-9\-_. ]+$/, 'Invalid file name characters')
      .refine(name => !name.includes('..'), 'Path traversal attempt')
  };

  validateAndSanitize<T>(schema: z.ZodSchema<T>, input: unknown): T {
    // Validate structure
    const validated = schema.parse(input);
    
    // Sanitize string content
    if (typeof validated === 'object' && validated !== null) {
      return this.deepSanitize(validated);
    }
    
    return validated;
  }
  
  private deepSanitize(obj: any): any {
    if (typeof obj === 'string') {
      // Remove potential XSS vectors
      return DOMPurify.sanitize(obj, { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [] 
      });
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepSanitize(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.deepSanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  }
  
  private checkForMaliciousContent(content: string): boolean {
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload/i,
      /onerror/i,
      /eval\(/i,
      /document\.cookie/i,
      /window\.location/i
    ];
    
    return !maliciousPatterns.some(pattern => pattern.test(content));
  }
}

export const securityValidator = new SecurityValidator();
```

#### WASM Script Sandboxing & Validation
```typescript
// lib/security/scriptValidation.ts
import { createHash } from 'crypto';

class ToxoidScriptValidator {
  // Dangerous patterns that should be blocked in user scripts
  private readonly DANGEROUS_PATTERNS = [
    /eval\s*\(/i,
    /Function\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
    /XMLHttpRequest/i,
    /fetch\s*\(/i,
    /WebSocket/i,
    /document\./i,
    /window\./i,
    /global\./i,
    /process\./i,
    /require\s*\(/i,
    /import\s*\(/i,
    /while\s*\(\s*true\s*\)/i, // Infinite loops
    /for\s*\(\s*;;\s*\)/i      // Infinite loops
  ];
  
  // Memory-intensive operations to limit
  private readonly MEMORY_INTENSIVE_PATTERNS = [
    /new\s+Array\s*\(\s*\d{6,}\s*\)/i, // Large arrays
    /\.repeat\s*\(\s*\d{4,}\s*\)/i,    // Large string repetitions
    /new\s+\w+Array\s*\(\s*\d{6,}\s*\)/i // Large typed arrays
  ];
  
  validateScript(code: string, context?: ScriptValidationContext): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const analysis = this.analyzeScript(code);
    
    // Security validation
    this.DANGEROUS_PATTERNS.forEach(pattern => {
      if (pattern.test(code)) {
        errors.push({
          type: 'security',
          message: `Potentially dangerous pattern detected: ${pattern.source}`,
          severity: 'critical'
        });
      }
    });
    
    // Memory usage validation
    if (analysis.estimatedMemory > 5 * 1024 * 1024) { // 5MB limit for single script
      warnings.push({
        type: 'memory',
        message: `Script may use significant memory (${Math.round(analysis.estimatedMemory / 1024 / 1024)}MB)`,
        severity: 'medium'
      });
    }
    
    // Performance validation
    this.MEMORY_INTENSIVE_PATTERNS.forEach(pattern => {
      if (pattern.test(code)) {
        warnings.push({
          type: 'performance',
          message: `Memory-intensive operation detected: ${pattern.source}`,
          severity: 'medium'
        });
      }
    });
    
    // Toxoid API compliance
    const apiValidation = this.validateToxoidAPI(code);
    errors.push(...apiValidation.errors);
    warnings.push(...apiValidation.warnings);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      analysis,
      securityScore: this.calculateSecurityScore(errors, warnings)
    };
  }
  
  private validateToxoidAPI(code: string): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Validate proper ECS patterns
    if (code.includes('entity.') && !code.includes('entity.get(') && !code.includes('entity.add(')) {
      warnings.push({
        type: 'best_practice',
        message: 'Consider using proper ECS methods (entity.get(), entity.add()) instead of direct property access',
        severity: 'low'
      });
    }
    
    // Check for missing error handling around entity operations
    const entityOperationMatches = code.match(/entity\.(get|add|has|remove)\s*\(/g);
    if (entityOperationMatches && !code.includes('try') && !code.includes('catch')) {
      warnings.push({
        type: 'best_practice',
        message: 'Entity operations should include error handling',
        severity: 'medium'
      });
    }
    
    // Validate system registration patterns
    if (code.includes('Toxoid.System.create') && !code.includes('Toxoid.Query.create')) {
      warnings.push({
        type: 'performance',
        message: 'Systems should typically use queries to filter entities',
        severity: 'low'
      });
    }
    
    return { errors, warnings };
  }
  
  private analyzeScript(code: string): ScriptAnalysis {
    const lines = code.split('\n').length;
    const estimatedMemory = Math.max(1024, lines * 100); // Rough estimate
    
    const toxoidAPIs = [
      'Toxoid.API.createEntity',
      'Toxoid.System.create',
      'Toxoid.Observer.create',
      'Toxoid.Query.create'
    ].filter(api => code.includes(api));
    
    return {
      linesOfCode: lines,
      estimatedMemory,
      toxoidAPIsUsed: toxoidAPIs,
      complexityScore: Math.min(10, Math.max(1, Math.floor(lines / 20))),
      hasLoops: /for\s*\(|while\s*\(/.test(code),
      hasRecursion: this.detectRecursion(code)
    };
  }
  
  private detectRecursion(code: string): boolean {
    // Simple heuristic to detect potential recursion
    const functionMatches = code.match(/function\s+(\w+)/g);
    if (!functionMatches) return false;
    
    return functionMatches.some(match => {
      const funcName = match.split(' ')[1];
      return code.includes(`${funcName}(`) && code.indexOf(`${funcName}(`) > code.indexOf(match);
    });
  }
  
  generateScriptHash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }
}

export const scriptValidator = new ToxoidScriptValidator();
```

#### Content Security Policy (CSP)
```typescript
// lib/security/csp.ts
const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Toxoid WASM
    "'wasm-unsafe-eval'", // Required for WebAssembly and QuickJS
    'https://js.stripe.com',
    'https://www.google-analytics.com'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for CSS-in-JS
    'https://fonts.googleapis.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://cdn.gamegen.com',
    'https://supabase.co'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'connect-src': [
    "'self'",
    'https://api.gamegen.com',
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://api.anthropic.com'
  ],
  'media-src': [
    "'self'",
    'blob:',
    'https://cdn.gamegen.com'
  ],
  'worker-src': [
    "'self'",
    'blob:' // Required for Toxoid workers
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': []
};

export function generateCSP(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => 
      `${directive} ${sources.join(' ')}`
    )
    .join('; ');
}
```

### API Security

#### Rate Limiting Strategy
```typescript
// lib/security/rateLimiting.ts
import Redis from 'ioredis';

interface RateLimitConfig {
  windowMs: number;
  max: number;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

class AdvancedRateLimiter {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  // Tier-based rate limiting
  private readonly limits = {
    // Authentication endpoints
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      skipSuccessfulRequests: false
    },
    
    // AI generation endpoints
    ai_free: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: 10,
      skipSuccessfulRequests: true
    },
    
    ai_pro: {
      windowMs: 24 * 60 * 60 * 1000,
      max: 100,
      skipSuccessfulRequests: true
    },
    
    ai_max: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 1000,
      skipSuccessfulRequests: true
    },
    
    // General API
    api: {
      windowMs: 60 * 1000, // 1 minute
      max: 100,
      skipSuccessfulRequests: true
    }
  };
  
  async checkLimit(
    identifier: string, 
    limitType: keyof typeof this.limits
  ): Promise<{ allowed: boolean; resetTime: number; remaining: number }> {
    const config = this.limits[limitType];
    const key = `rate_limit:${limitType}:${identifier}`;
    
    const current = await this.redis.get(key);
    const count = current ? parseInt(current) : 0;
    
    if (count >= config.max) {
      const ttl = await this.redis.ttl(key);
      return {
        allowed: false,
        resetTime: Date.now() + (ttl * 1000),
        remaining: 0
      };
    }
    
    // Increment counter
    const newCount = await this.redis.incr(key);
    if (newCount === 1) {
      await this.redis.expire(key, Math.floor(config.windowMs / 1000));
    }
    
    return {
      allowed: true,
      resetTime: Date.now() + config.windowMs,
      remaining: config.max - newCount
    };
  }
}

export const rateLimiter = new AdvancedRateLimiter();
```

#### Request Authentication
```typescript
// lib/security/auth.ts
import jwt from 'jsonwebtoken';
import { createHash, timingSafeEqual } from 'crypto';

class AuthenticationService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;
  private readonly JWT_ISSUER = 'gamegen-api';
  private readonly JWT_AUDIENCE = 'gamegen-users';
  
  async verifyRequest(request: Request): Promise<AuthResult> {
    // Extract token from Authorization header or cookie
    const token = this.extractToken(request);
    
    if (!token) {
      return { success: false, error: 'No authentication token provided' };
    }
    
    try {
      // Verify JWT token
      const payload = jwt.verify(token, this.JWT_SECRET, {
        issuer: this.JWT_ISSUER,
        audience: this.JWT_AUDIENCE,
        algorithms: ['HS256']
      }) as JWTPayload;
      
      // Check if token is blacklisted
      if (await this.isTokenBlacklisted(token)) {
        return { success: false, error: 'Token has been revoked' };
      }
      
      // Validate user session
      const sessionValid = await this.validateSession(payload.sub, payload.sessionId);
      if (!sessionValid) {
        return { success: false, error: 'Session expired or invalid' };
      }
      
      return {
        success: true,
        user: {
          id: payload.sub,
          email: payload.email,
          tier: payload.tier,
          permissions: payload.permissions
        }
      };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof jwt.JsonWebTokenError ? 'Invalid token' : 'Authentication failed' 
      };
    }
  }
  
  private extractToken(request: Request): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Fall back to cookie (for web app)
    const cookies = request.headers.get('cookie');
    if (cookies) {
      const tokenMatch = cookies.match(/auth-token=([^;]+)/);
      return tokenMatch?.[1] || null;
    }
    
    return null;
  }
  
  private async validateSession(userId: string, sessionId: string): Promise<boolean> {
    // Check session in database
    const { data, error } = await supabase
      .from('user_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .eq('active', true)
      .single();
    
    return !error && !!data;
  }
}

export const authService = new AuthenticationService();
```

### Data Protection

#### Encryption Implementation
```typescript
// lib/security/encryption.ts
import { randomBytes, createCipheriv, createDecipheriv, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

class EncryptionService {
  private readonly ALGORITHM = 'aes-256-gcm';
  private readonly KEY_LENGTH = 32;
  private readonly IV_LENGTH = 12;
  private readonly TAG_LENGTH = 16;
  
  async encryptSensitiveData(data: string, password: string): Promise<string> {
    const salt = randomBytes(16);
    const key = (await scryptAsync(password, salt, this.KEY_LENGTH)) as Buffer;
    const iv = randomBytes(this.IV_LENGTH);
    
    const cipher = createCipheriv(this.ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine salt + iv + tag + encrypted data
    const combined = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);
    return combined.toString('base64');
  }
  
  async decryptSensitiveData(encryptedData: string, password: string): Promise<string> {
    const combined = Buffer.from(encryptedData, 'base64');
    
    const salt = combined.subarray(0, 16);
    const iv = combined.subarray(16, 16 + this.IV_LENGTH);
    const tag = combined.subarray(16 + this.IV_LENGTH, 16 + this.IV_LENGTH + this.TAG_LENGTH);
    const encrypted = combined.subarray(16 + this.IV_LENGTH + this.TAG_LENGTH);
    
    const key = (await scryptAsync(password, salt, this.KEY_LENGTH)) as Buffer;
    
    const decipher = createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }
  
  verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  generateSecureToken(): string {
    return randomBytes(32).toString('base64url');
  }
}

export const encryption = new EncryptionService();
```

## Performance Architecture

### WASM Performance Optimization

#### QuickJS Runtime Management
```typescript
// lib/performance/wasmOptimization.ts
class ToxoidRuntimeOptimizer {
  private executionMetrics = new Map<string, PerformanceMetrics>();
  
  optimizeScriptExecution(script: ToxoidScript): OptimizedScript {
    // Pre-execution optimizations
    const optimizedCode = this.applyCodeOptimizations(script.code);
    
    // Memory pre-allocation based on script analysis
    const memoryRequirements = this.analyzeMemoryRequirements(optimizedCode);
    
    // Execution order optimization for systems
    const executionOrder = this.optimizeExecutionOrder(script.type, script.dependencies);
    
    return {
      ...script,
      code: optimizedCode,
      memoryRequirements,
      executionOrder,
      optimizations: this.getAppliedOptimizations(script.code, optimizedCode)
    };
  }
  
  private applyCodeOptimizations(code: string): string {
    let optimizedCode = code;
    
    // 1. Remove unnecessary console.log statements in production
    if (process.env.NODE_ENV === 'production') {
      optimizedCode = optimizedCode.replace(/console\.(log|warn|info)\([^)]*\);?/g, '');
    }
    
    // 2. Optimize query creation (cache commonly used queries)
    optimizedCode = this.optimizeQueryCreation(optimizedCode);
    
    // 3. Minimize entity lookups
    optimizedCode = this.optimizeEntityLookups(optimizedCode);
    
    // 4. Add performance markers
    optimizedCode = this.addPerformanceMarkers(optimizedCode);
    
    return optimizedCode;
  }
  
  private optimizeQueryCreation(code: string): string {
    // Cache query objects instead of creating new ones each frame
    const queryMatches = code.match(/Toxoid\.Query\.create\([^)]+\)/g);
    if (!queryMatches) return code;
    
    let optimizedCode = code;
    const queryCache = new Map<string, string>();
    
    queryMatches.forEach((queryCall, index) => {
      const cacheVar = `cachedQuery${index}`;
      if (!queryCache.has(queryCall)) {
        queryCache.set(queryCall, cacheVar);
        
        // Add query caching at the beginning of the script
        optimizedCode = `const ${cacheVar} = ${queryCall};\n${optimizedCode}`;
        
        // Replace all instances with cached version
        optimizedCode = optimizedCode.replace(new RegExp(queryCall.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), cacheVar);
      }
    });
    
    return optimizedCode;
  }
  
  private optimizeEntityLookups(code: string): string {
    // Batch entity operations where possible
    return code.replace(
      /entity\.get\((\w+)\)([^;]*);[\s]*entity\.get\(\1\)/g,
      'const $1Component = entity.get($1); $1Component$2; $1Component'
    );
  }
  
  private addPerformanceMarkers(code: string): string {
    // Add timing markers for performance monitoring
    if (code.includes('Toxoid.System.create')) {
      return code.replace(
        /(Toxoid\.System\.create\s*\(\s*"([^"]+)"\s*,\s*)(\([^{]*\{)/g,
        '$1$3\n  const startTime = performance.now();'
      ).replace(
        /(\}\s*,?\s*Toxoid\.System\.\w+\s*\)\s*;)/g,
        '  const endTime = performance.now();\n  if (endTime - startTime > 16.67) console.warn(`System $2 took ${endTime - startTime}ms`);\n$1'
      );
    }
    
    return code;
  }
  
  private analyzeMemoryRequirements(code: string): MemoryRequirements {
    let estimatedMemory = 1024; // Base memory for script
    
    // Estimate based on code patterns
    const entityCreations = (code.match(/createEntity/g) || []).length;
    const arrayCreations = (code.match(/new Array|new \w*Array|\[\]/g) || []).length;
    const stringOperations = (code.match(/\+.*"|concat|split|join/g) || []).length;
    
    estimatedMemory += entityCreations * 200; // ~200 bytes per entity
    estimatedMemory += arrayCreations * 1000; // ~1KB per array
    estimatedMemory += stringOperations * 100; // ~100 bytes per string op
    
    return {
      estimated: Math.min(estimatedMemory, 5 * 1024 * 1024), // Cap at 5MB
      peak: Math.min(estimatedMemory * 1.5, 10 * 1024 * 1024), // Cap at 10MB
      baseline: 1024
    };
  }
  
  trackExecutionPerformance(scriptId: string, metrics: PerformanceMetrics): void {
    const existing = this.executionMetrics.get(scriptId);
    
    if (existing) {
      // Update moving averages
      existing.averageExecutionTime = (existing.averageExecutionTime * 0.8) + (metrics.executionTime * 0.2);
      existing.peakMemory = Math.max(existing.peakMemory, metrics.memoryUsage);
      existing.executionCount += 1;
    } else {
      this.executionMetrics.set(scriptId, {
        ...metrics,
        averageExecutionTime: metrics.executionTime,
        executionCount: 1
      });
    }
    
    // Alert on performance degradation
    if (metrics.executionTime > 50) { // Over 50ms is concerning
      console.warn(`Script ${scriptId} execution time: ${metrics.executionTime}ms`);
    }
  }
}

export const runtimeOptimizer = new ToxoidRuntimeOptimizer();
```

#### Script Delivery Optimization
```typescript
// lib/performance/scriptDelivery.ts
class ScriptDeliveryManager {
  private scriptCache = new Map<string, CachedScript>();
  private deliveryQueue = new Map<string, ScriptDeliveryJob>();
  
  async deliverScript(gameId: string, scriptId: string, urgent = false): Promise<void> {
    // Check if script is already cached
    const cached = this.scriptCache.get(scriptId);
    if (cached && !this.isStale(cached)) {
      await this.sendToClient(gameId, cached.optimizedScript);
      return;
    }
    
    // Queue script for processing
    const job = this.deliveryQueue.get(scriptId);
    if (job) {
      // Script is already being processed
      await job.promise;
      return;
    }
    
    // Process and deliver script
    const deliveryPromise = this.processAndDeliverScript(gameId, scriptId, urgent);
    this.deliveryQueue.set(scriptId, { 
      scriptId, 
      promise: deliveryPromise, 
      startTime: Date.now() 
    });
    
    try {
      await deliveryPromise;
    } finally {
      this.deliveryQueue.delete(scriptId);
    }
  }
  
  private async processAndDeliverScript(
    gameId: string, 
    scriptId: string, 
    urgent: boolean
  ): Promise<void> {
    // Fetch raw script
    const script = await this.fetchScript(scriptId);
    
    // Apply optimizations
    const optimizedScript = await runtimeOptimizer.optimizeScriptExecution(script);
    
    // Validate security
    const validation = scriptValidator.validateScript(optimizedScript.code);
    if (!validation.isValid) {
      throw new Error(`Script validation failed: ${validation.errors[0]?.message}`);
    }
    
    // Cache optimized script
    this.scriptCache.set(scriptId, {
      optimizedScript,
      timestamp: Date.now(),
      deliveryCount: 1
    });
    
    // Deliver to client
    await this.sendToClient(gameId, optimizedScript, urgent);
  }
  
  private async sendToClient(
    gameId: string, 
    script: OptimizedScript, 
    urgent = false
  ): Promise<void> {
    const payload = {
      type: 'script_update',
      script_id: script.id,
      code: script.code,
      metadata: script.metadata,
      urgent
    };
    
    // Use WebSocket for immediate delivery or HTTP for bulk updates
    if (urgent || this.hasActiveWebSocket(gameId)) {
      await this.sendViaWebSocket(gameId, payload);
    } else {
      await this.sendViaHTTP(gameId, payload);
    }
  }
  
  private isStale(cached: CachedScript): boolean {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    return Date.now() - cached.timestamp > maxAge;
  }
}
```

### Frontend Performance Optimization

#### Code Splitting Strategy
```typescript
// lib/performance/codeSplitting.ts
import dynamic from 'next/dynamic';
import { ComponentType, lazy, Suspense } from 'react';

// Lazy load heavy components
export const LazyGameCreator = dynamic(
  () => import('../components/creator/GameCreatorLayout'),
  {
    loading: () => <GameCreatorSkeleton />,
    ssr: false // Game creator is client-side only
  }
);

export const LazyAssetLibrary = dynamic(
  () => import('../components/creator/AssetLibrary'),
  {
    loading: () => <AssetLibrarySkeleton />
  }
);

// Bundle splitting for Toxoid engine
export const ToxoidEngine = dynamic(
  () => import('../lib/toxoid/engine'),
  {
    loading: () => <div>Loading game engine...</div>,
    ssr: false
  }
);

// Preload critical components
export function preloadCriticalComponents(): void {
  if (typeof window !== 'undefined') {
    // Preload game creator when user is likely to use it
    const preloadCreator = () => {
      import('../components/creator/GameCreatorLayout');
      import('../lib/toxoid/engine');
    };
    
    // Preload on user interaction
    document.addEventListener('mouseenter', preloadCreator, { once: true });
    document.addEventListener('touchstart', preloadCreator, { once: true });
  }
}
```

#### Asset Optimization
```typescript
// lib/performance/assets.ts
class AssetOptimizer {
  // Image optimization with progressive loading
  optimizeImage(src: string, options: ImageOptions = {}): string {
    const { width, height, quality = 80, format = 'webp' } = options;
    
    const params = new URLSearchParams({
      url: src,
      w: width?.toString() || 'auto',
      h: height?.toString() || 'auto',
      q: quality.toString(),
      f: format
    });
    
    return `https://cdn.gamegen.com/optimize?${params.toString()}`;
  }
  
  // Preload critical assets
  preloadAssets(assets: string[]): void {
    assets.forEach(asset => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = asset;
      link.as = this.getAssetType(asset);
      document.head.appendChild(link);
    });
  }
  
  // Lazy load non-critical assets
  lazyLoadAsset(src: string, callback?: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        callback?.();
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }
  
  private getAssetType(url: string): string {
    if (url.includes('.woff') || url.includes('.woff2')) return 'font';
    if (url.includes('.css')) return 'style';
    if (url.includes('.js')) return 'script';
    return 'image';
  }
}

export const assetOptimizer = new AssetOptimizer();
```

### Backend Performance

#### Database Optimization
```sql
-- Performance indexes for common queries
CREATE INDEX CONCURRENTLY idx_games_creator_published 
ON games(creator_id, published_at DESC) 
WHERE visibility = 'public';

CREATE INDEX CONCURRENTLY idx_games_genre_trending 
ON games(genre, play_count DESC, created_at DESC) 
WHERE visibility = 'public';

CREATE INDEX CONCURRENTLY idx_user_sessions_active 
ON user_sessions(user_id, last_activity) 
WHERE ended_at IS NULL;

-- Partial indexes for specific queries
CREATE INDEX CONCURRENTLY idx_ai_generations_recent 
ON ai_generations(created_at DESC, user_id) 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Optimize vector similarity searches
CREATE INDEX CONCURRENTLY idx_game_embeddings_similarity 
ON game_embeddings USING ivfflat (title_embedding vector_cosine_ops) 
WITH (lists = 100);

-- Database query optimization
CREATE OR REPLACE FUNCTION get_user_dashboard_data(user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'games', (
            SELECT json_agg(
                json_build_object(
                    'id', g.id,
                    'title', g.title,
                    'updated_at', g.updated_at,
                    'play_count', g.play_count
                )
            )
            FROM games g 
            WHERE g.creator_id = user_id 
            ORDER BY g.updated_at DESC 
            LIMIT 10
        ),
        'stats', (
            SELECT json_build_object(
                'total_games', COUNT(*),
                'total_plays', SUM(play_count)
            )
            FROM games g 
            WHERE g.creator_id = user_id
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
```

#### Caching Strategy
```typescript
// lib/performance/cache.ts
import Redis from 'ioredis';

class CacheManager {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  // Multi-layer caching strategy
  async getCachedData<T>(
    key: string,
    fetchData: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    // Try cache first
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Fetch fresh data
    const data = await fetchData();
    
    // Cache with expiration
    await this.redis.setex(key, ttl, JSON.stringify(data));
    
    return data;
  }
  
  // Cache invalidation patterns
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
  
  // Smart cache warming for popular content
  async warmCache(): Promise<void> {
    const popularGames = await this.getPopularGames();
    
    for (const game of popularGames) {
      await this.cacheGameData(game.id);
    }
  }
  
  private async cacheGameData(gameId: string): Promise<void> {
    const cacheKey = `game:${gameId}`;
    
    // Cache game details
    const gameData = await this.fetchGameFromDB(gameId);
    await this.redis.setex(cacheKey, 3600, JSON.stringify(gameData));
    
    // Cache related assets
    const assets = await this.fetchGameAssets(gameId);
    await this.redis.setex(`${cacheKey}:assets`, 7200, JSON.stringify(assets));
  }
}

export const cache = new CacheManager();
```

### Real-time Performance

#### WebSocket Optimization
```typescript
// lib/performance/websockets.ts
import WebSocket from 'ws';

class WebSocketManager {
  private connections = new Map<string, WebSocket>();
  private rooms = new Map<string, Set<string>>();
  
  // Connection pooling and cleanup
  addConnection(userId: string, ws: WebSocket): void {
    // Close existing connection if any
    const existing = this.connections.get(userId);
    if (existing && existing.readyState === WebSocket.OPEN) {
      existing.close();
    }
    
    this.connections.set(userId, ws);
    
    // Set up heartbeat
    const heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(heartbeat);
        this.connections.delete(userId);
      }
    }, 30000);
    
    ws.on('close', () => {
      clearInterval(heartbeat);
      this.connections.delete(userId);
      this.leaveAllRooms(userId);
    });
  }
  
  // Efficient room-based broadcasting
  joinRoom(userId: string, roomId: string): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(userId);
  }
  
  broadcastToRoom(roomId: string, message: any, excludeUser?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    
    const messageStr = JSON.stringify(message);
    
    room.forEach(userId => {
      if (userId === excludeUser) return;
      
      const ws = this.connections.get(userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }
  
  // Message queuing for offline users
  async queueMessage(userId: string, message: any): Promise<void> {
    const key = `ws_queue:${userId}`;
    await this.redis.lpush(key, JSON.stringify(message));
    await this.redis.expire(key, 24 * 3600); // 24 hour expiry
  }
  
  private leaveAllRooms(userId: string): void {
    this.rooms.forEach(room => room.delete(userId));
  }
}
```

## Monitoring & Alerting

### Performance Monitoring
```typescript
// lib/monitoring/performance.ts
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  // Track key performance metrics
  trackMetric(name: string, value: number, tags?: Record<string, string>): void {
    // Store locally for analysis
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
    
    // Send to monitoring service
    this.sendToMonitoring(name, value, tags);
  }
  
  // AI generation performance
  trackAIGeneration(
    type: string, 
    duration: number, 
    success: boolean, 
    creditsUsed: number
  ): void {
    this.trackMetric('ai.generation.duration', duration, { 
      type, 
      success: success.toString() 
    });
    
    this.trackMetric('ai.generation.credits', creditsUsed, { type });
    
    if (duration > 30000) { // Over 30 seconds
      this.alertSlowGeneration(type, duration);
    }
  }
  
  // Database query performance
  trackDatabaseQuery(query: string, duration: number): void {
    this.trackMetric('db.query.duration', duration, { 
      query: this.hashQuery(query) 
    });
    
    if (duration > 1000) { // Over 1 second
      console.warn(`Slow query detected: ${query} (${duration}ms)`);
    }
  }
  
  // Client-side performance
  trackClientMetrics(): void {
    if (typeof window === 'undefined') return;
    
    // Core Web Vitals
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          this.trackMetric('web.lcp', entry.startTime);
        }
        if (entry.entryType === 'first-input') {
          this.trackMetric('web.fid', entry.processingStart - entry.startTime);
        }
      }
    }).observe({
      entryTypes: ['largest-contentful-paint', 'first-input']
    });
    
    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          this.trackMetric('web.cls', entry.value);
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }
  
  private async alertSlowGeneration(type: string, duration: number): Promise<void> {
    // Send alert to monitoring system
    console.error(`Slow AI generation detected: ${type} took ${duration}ms`);
    
    // Could integrate with PagerDuty, Slack, etc.
    if (process.env.NODE_ENV === 'production') {
      // await this.sendSlackAlert(`Slow AI generation: ${type} (${duration}ms)`);
    }
  }
  
  private hashQuery(query: string): string {
    // Simple query normalization for monitoring
    return query
      .replace(/\$\d+/g, '$?') // Replace parameters
      .replace(/\d+/g, 'N')    // Replace numbers
      .substring(0, 100);      // Limit length
  }
}

export const performanceMonitor = new PerformanceMonitor();
```

### Security Monitoring
```typescript
// lib/monitoring/security.ts
class SecurityMonitor {
  private suspiciousActivity = new Map<string, number>();
  private alertThreshold = 5; // Suspicious events before alert
  
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    // Log to secure audit trail
    await this.logToAuditTrail(event);
    
    // Check for suspicious patterns
    await this.checkSuspiciousActivity(event);
    
    // Real-time alerting for critical events
    if (event.severity === 'critical') {
      await this.sendImmediateAlert(event);
    }
  }
  
  private async checkSuspiciousActivity(event: SecurityEvent): Promise<void> {
    const key = `${event.ip_address}:${event.type}`;
    const count = (this.suspiciousActivity.get(key) || 0) + 1;
    this.suspiciousActivity.set(key, count);
    
    if (count >= this.alertThreshold) {
      await this.handleSuspiciousActivity(event.ip_address, event.type, count);
    }
    
    // Clean up old entries
    setTimeout(() => {
      this.suspiciousActivity.delete(key);
    }, 60 * 60 * 1000); // 1 hour
  }
  
  private async handleSuspiciousActivity(
    ipAddress: string, 
    eventType: string, 
    count: number
  ): Promise<void> {
    console.warn(`Suspicious activity detected: ${ipAddress} - ${eventType} (${count} times)`);
    
    // Temporary IP blocking
    if (count >= 10) {
      await this.blockIP(ipAddress, '1h');
    }
    
    // Send security alert
    await this.sendSecurityAlert({
      type: 'suspicious_activity',
      ip_address: ipAddress,
      event_type: eventType,
      count
    });
  }
}

export const securityMonitor = new SecurityMonitor();
```

This comprehensive security and performance architecture ensures GameGen can handle enterprise-scale usage while maintaining the highest security standards and optimal user experience.