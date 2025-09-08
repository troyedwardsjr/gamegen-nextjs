/**
 * Enhanced security middleware for GameGen platform
 * Implements CSRF protection, input sanitization, and comprehensive security headers
 */

import type { Database } from "../supabase/database.types";

import crypto from "crypto";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import DOMPurify from "isomorphic-dompurify";

import { AccountSecurityManager } from "./security";
import { rateLimitMiddleware } from "./rate-limit";

export interface SecurityMiddlewareOptions {
  enableCSRF?: boolean;
  enableRateLimit?: boolean;
  enableSanitization?: boolean;
  enableSecurityHeaders?: boolean;
  csrfSecret?: string;
  trustedOrigins?: string[];
}

export interface SecurityContext {
  user: any;
  session: any;
  csrfToken?: string;
  securityFlags: {
    isSecure: boolean;
    requiresMFA: boolean;
    suspiciousActivity: boolean;
    accountLocked: boolean;
  };
}

const DEFAULT_OPTIONS: SecurityMiddlewareOptions = {
  enableCSRF: true,
  enableRateLimit: true,
  enableSanitization: true,
  enableSecurityHeaders: true,
  trustedOrigins: [],
};

export class SecurityMiddleware {
  private options: SecurityMiddlewareOptions;
  private securityManager: AccountSecurityManager;

  constructor(options: Partial<SecurityMiddlewareOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.securityManager = new AccountSecurityManager();
  }

  /**
   * Main middleware function
   */
  async handle(request: NextRequest): Promise<NextResponse | null> {
    try {
      const response = NextResponse.next();

      // Apply security headers first
      if (this.options.enableSecurityHeaders) {
        this.applySecurityHeaders(response, request);
      }

      // Handle preflight requests
      if (request.method === "OPTIONS") {
        return this.handlePreflight(request, response);
      }

      // Create Supabase client
      const supabase = this.createSupabaseClient(request, response);

      // Get session and user
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      // Create security context
      const securityContext = await this.createSecurityContext(
        request,
        session,
        supabase,
      );

      // Apply rate limiting
      if (this.options.enableRateLimit) {
        const rateLimitResult = await this.applyRateLimit(
          request,
          session?.user?.id,
        );

        if (rateLimitResult) {
          return rateLimitResult;
        }
      }

      // Check account security
      if (session?.user) {
        const securityCheck = await this.checkAccountSecurity(
          session.user.id,
          request,
        );

        if (securityCheck.blocked) {
          return NextResponse.json(
            { error: securityCheck.reason },
            { status: 403 },
          );
        }
      }

      // CSRF protection for state-changing operations
      if (this.options.enableCSRF && this.isStateChangingRequest(request)) {
        const csrfResult = await this.validateCSRF(request, session?.user?.id);

        if (!csrfResult.valid) {
          return NextResponse.json(
            { error: "CSRF token validation failed" },
            { status: 403 },
          );
        }
      }

      // Input sanitization
      if (this.options.enableSanitization) {
        const sanitizationResult = await this.sanitizeRequest(request);

        if (!sanitizationResult.safe) {
          await this.securityManager.logSecurityEvent(
            "SUSPICIOUS_ACTIVITY",
            {
              reason: "malicious_input_detected",
              blocked_content: sanitizationResult.threats,
            },
            request,
            session?.user?.id,
          );

          return NextResponse.json(
            { error: "Invalid request content" },
            { status: 400 },
          );
        }
      }

      // Add security context to response headers (for client consumption)
      response.headers.set(
        "X-Security-Context",
        JSON.stringify({
          authenticated: !!session?.user,
          requiresMFA: securityContext.securityFlags.requiresMFA,
          csrfToken: securityContext.csrfToken,
        }),
      );

      return response;
    } catch (error) {
      console.error("Security middleware error:", error);

      return NextResponse.json(
        { error: "Internal security error" },
        { status: 500 },
      );
    }
  }

  private createSupabaseClient(request: NextRequest, response: NextResponse) {
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );
  }

  private async createSecurityContext(
    request: NextRequest,
    session: any,
    supabase: any,
  ): Promise<SecurityContext> {
    const securityFlags = {
      isSecure: request.nextUrl.protocol === "https:",
      requiresMFA: false,
      suspiciousActivity: false,
      accountLocked: false,
    };

    if (session?.user) {
      // Check if account is locked
      const lockStatus = await this.securityManager.isAccountLocked(
        session.user.id,
      );

      securityFlags.accountLocked = lockStatus.locked;

      // Analyze suspicious activity
      const activityAnalysis =
        await this.securityManager.analyzeSuspiciousActivity(
          session.user.id,
          request,
        );

      securityFlags.suspiciousActivity = activityAnalysis.riskScore > 60;

      // Check MFA requirements
      try {
        const { data: mfaConfig } = await supabase
          .from("mfa_configurations")
          .select("enabled, requires_reverification")
          .eq("user_id", session.user.id)
          .single();

        securityFlags.requiresMFA = mfaConfig?.requires_reverification || false;
      } catch (error) {
        // MFA config doesn't exist, assume no MFA required
      }
    }

    return {
      user: session?.user || null,
      session,
      csrfToken: session?.user
        ? this.generateCSRFToken(session.user.id)
        : undefined,
      securityFlags,
    };
  }

  private async applyRateLimit(
    request: NextRequest,
    userId?: string,
  ): Promise<NextResponse | null> {
    const pathname = request.nextUrl.pathname;

    // Determine appropriate rate limit based on endpoint
    let rateLimitType: string;

    if (pathname.startsWith("/api/auth")) {
      rateLimitType = "auth";
    } else if (pathname.startsWith("/api/ai")) {
      // Determine AI rate limit based on user tier
      rateLimitType = userId
        ? await this.getAIRateLimitType(userId)
        : "ai_generation_free";
    } else if (pathname.includes("upload")) {
      rateLimitType = "api_upload";
    } else if (pathname.includes("export")) {
      rateLimitType = "api_export";
    } else {
      rateLimitType = userId ? "authenticated" : "anonymous";
    }

    return await rateLimitMiddleware(request, rateLimitType as any, userId);
  }

  private async getAIRateLimitType(userId: string): Promise<string> {
    // This would typically query the user's subscription tier
    // For now, return a default
    return "ai_generation_free";
  }

  private async checkAccountSecurity(
    userId: string,
    request: NextRequest,
  ): Promise<{ blocked: boolean; reason?: string }> {
    // Check if account is locked
    const lockStatus = await this.securityManager.isAccountLocked(userId);

    if (lockStatus.locked) {
      return {
        blocked: true,
        reason: `Account is locked until ${lockStatus.lockedUntil?.toISOString()}. Reason: ${lockStatus.reason}`,
      };
    }

    return { blocked: false };
  }

  private async validateCSRF(
    request: NextRequest,
    userId?: string,
  ): Promise<{ valid: boolean; token?: string }> {
    const token =
      request.headers.get("x-csrf-token") ||
      request.nextUrl.searchParams.get("csrf_token");

    if (!token) {
      return { valid: false };
    }

    if (!userId) {
      return { valid: false };
    }

    const expectedToken = this.generateCSRFToken(userId);
    const valid = token === expectedToken;

    return { valid, token: expectedToken };
  }

  private generateCSRFToken(userId: string): string {
    const secret =
      this.options.csrfSecret || process.env.CSRF_SECRET || "default-secret";
    const timestamp = Math.floor(Date.now() / 3600000); // 1-hour windows

    return crypto
      .createHmac("sha256", secret)
      .update(`${userId}:${timestamp}`)
      .digest("hex");
  }

  private isStateChangingRequest(request: NextRequest): boolean {
    const method = request.method;
    const pathname = request.nextUrl.pathname;

    // Non-GET requests are typically state-changing
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      return true;
    }

    // Some GET requests can also change state (logout, etc.)
    const stateChangingPaths = ["/api/auth/logout", "/api/user/delete"];

    return stateChangingPaths.some((path) => pathname.startsWith(path));
  }

  private async sanitizeRequest(
    request: NextRequest,
  ): Promise<{ safe: boolean; threats?: string[] }> {
    try {
      const threats: string[] = [];

      // Check URL parameters
      const searchParams = request.nextUrl.searchParams;

      for (const [key, value] of searchParams.entries()) {
        const sanitized = DOMPurify.sanitize(value, {
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
        });

        if (sanitized !== value) {
          threats.push(
            `URL parameter '${key}' contains potentially malicious content`,
          );
        }
      }

      // Check request body for POST/PUT/PATCH requests
      if (["POST", "PUT", "PATCH"].includes(request.method)) {
        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          try {
            const body = await request.clone().json();
            const sanitizationResult = this.sanitizeObject(body);

            if (sanitizationResult.modified) {
              threats.push(
                "Request body contains potentially malicious content",
              );
            }
          } catch (error) {
            // Invalid JSON is also suspicious
            threats.push("Invalid JSON in request body");
          }
        }
      }

      // Check headers for common attack patterns
      const suspiciousHeaders = ["x-forwarded-host", "host"];

      for (const headerName of suspiciousHeaders) {
        const headerValue = request.headers.get(headerName);

        if (headerValue && this.containsSuspiciousContent(headerValue)) {
          threats.push(`Header '${headerName}' contains suspicious content`);
        }
      }

      return { safe: threats.length === 0, threats };
    } catch (error) {
      console.error("Error during request sanitization:", error);

      return { safe: false, threats: ["Sanitization process failed"] };
    }
  }

  private sanitizeObject(
    obj: any,
    depth = 0,
  ): { sanitized: any; modified: boolean } {
    if (depth > 10) {
      return { sanitized: obj, modified: false };
    }

    if (typeof obj === "string") {
      const sanitized = DOMPurify.sanitize(obj, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });

      return { sanitized, modified: sanitized !== obj };
    }

    if (Array.isArray(obj)) {
      let modified = false;
      const sanitized = obj.map((item) => {
        const result = this.sanitizeObject(item, depth + 1);

        if (result.modified) modified = true;

        return result.sanitized;
      });

      return { sanitized, modified };
    }

    if (typeof obj === "object" && obj !== null) {
      let modified = false;
      const sanitized: any = {};

      for (const [key, value] of Object.entries(obj)) {
        const keyResult = this.sanitizeObject(key, depth + 1);
        const valueResult = this.sanitizeObject(value, depth + 1);

        if (keyResult.modified || valueResult.modified) {
          modified = true;
        }

        sanitized[keyResult.sanitized] = valueResult.sanitized;
      }

      return { sanitized, modified };
    }

    return { sanitized: obj, modified: false };
  }

  private containsSuspiciousContent(content: string): boolean {
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /onclick=/i,
      /eval\(/i,
      /alert\(/i,
      /document\.cookie/i,
      /window\.location/i,
      /(union|select|insert|delete|update|drop|create|alter)\s/i,
      /\.\.\//,
      /%2e%2e%2f/i,
      /%252e%252e%252f/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(content));
  }

  private applySecurityHeaders(
    response: NextResponse,
    request: NextRequest,
  ): void {
    // Basic security headers
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("X-DNS-Prefetch-Control", "off");

    // Permissions Policy
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
    );

    // Strict Transport Security (only in production)
    if (process.env.NODE_ENV === "production") {
      response.headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload",
      );
    }

    // Content Security Policy
    const cspPolicy = this.generateCSPPolicy(request);

    response.headers.set("Content-Security-Policy", cspPolicy);

    // Additional security headers
    response.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  }

  private generateCSPPolicy(request: NextRequest): string {
    const isDevelopment = process.env.NODE_ENV === "development";
    const baseUrl = request.nextUrl.origin;

    const directives = [
      `default-src 'self'`,
      `script-src 'self' ${isDevelopment ? "'unsafe-inline' 'unsafe-eval'" : ""} https://js.stripe.com https://www.google-analytics.com`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `img-src 'self' data: blob: https: ${baseUrl}`,
      `font-src 'self' https://fonts.gstatic.com`,
      `connect-src 'self' https://api.gamegen.com https://*.supabase.co wss://*.supabase.co`,
      `media-src 'self' blob:`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `frame-ancestors 'none'`,
      `upgrade-insecure-requests`,
    ];

    return directives.join("; ");
  }

  private handlePreflight(
    request: NextRequest,
    response: NextResponse,
  ): NextResponse {
    const origin = request.headers.get("origin");
    const trustedOrigins = this.options.trustedOrigins || [];

    // Allow requests from trusted origins
    if (
      origin &&
      (trustedOrigins.includes(origin) || this.isLocalhost(origin))
    ) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }

    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, X-CSRF-Token, X-Requested-With",
    );
    response.headers.set("Access-Control-Max-Age", "86400");

    return new Response(null, { status: 200, headers: response.headers });
  }

  private isLocalhost(origin: string): boolean {
    return origin.includes("localhost") || origin.includes("127.0.0.1");
  }
}

// Export convenience function for Next.js middleware
export function createSecurityMiddleware(
  options?: Partial<SecurityMiddlewareOptions>,
) {
  const middleware = new SecurityMiddleware(options);

  return (request: NextRequest) => middleware.handle(request);
}
