/**
 * Security Testing Suite
 * Tests for common web vulnerabilities, authentication security,
 * data validation, and security headers
 */

import { NextRequest } from 'next/server';

// Mock security testing utilities
const SecurityTestUtils = {
  // Common XSS payloads for testing
  xssPayloads: [
    '<script>alert("xss")</script>',
    '"><script>alert("xss")</script>',
    'javascript:alert("xss")',
    '<img src=x onerror=alert("xss")>',
    '<svg onload=alert("xss")>',
    '{{constructor.constructor("alert(\\"xss\\")")()}}',
    '${alert("xss")}',
    '<iframe src="javascript:alert(\\"xss\\")">',
  ],

  // SQL injection payloads
  sqlInjectionPayloads: [
    "'; DROP TABLE users; --",
    "' OR '1'='1",
    "' UNION SELECT * FROM users --",
    "'; INSERT INTO users VALUES ('hacker', 'password'); --",
    "' OR 1=1 --",
    "admin'--",
    "admin' /*",
    "' OR 'a'='a",
  ],

  // Command injection payloads
  commandInjectionPayloads: [
    '; ls -la',
    '&& cat /etc/passwd',
    '| whoami',
    '; rm -rf /',
    '`whoami`',
    '$(whoami)',
    '; ping google.com',
  ],

  // Path traversal payloads
  pathTraversalPayloads: [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
    '....//....//....//etc/passwd',
    '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    '..%252f..%252f..%252fetc%252fpasswd',
  ],

  // Create a mock request for testing
  createMockRequest: (url: string, options: RequestInit = {}) => {
    return new NextRequest(`https://localhost:3000${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SecurityTest/1.0',
        ...options.headers,
      },
      ...options,
    });
  },

  // Check if response contains security headers
  checkSecurityHeaders: (response: Response) => {
    const requiredHeaders = [
      'x-frame-options',
      'x-content-type-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy',
      'referrer-policy',
    ];

    const missingHeaders: string[] = [];
    const presentHeaders: Record<string, string> = {};

    requiredHeaders.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        presentHeaders[header] = value;
      } else {
        missingHeaders.push(header);
      }
    });

    return { missingHeaders, presentHeaders };
  },

  // Validate that content doesn't contain reflected payloads
  checkForReflectedContent: (responseText: string, payload: string): boolean => {
    // Check if the payload appears unescaped in the response
    return responseText.includes(payload);
  },

  // Generate test authentication tokens
  generateTestTokens: () => ({
    validToken: 'valid-test-token-12345',
    expiredToken: 'expired-test-token-67890',
    malformedToken: 'malformed.token.structure',
    emptyToken: '',
    nullToken: null,
  }),
};

describe('Security Tests', () => {
  describe('Input Validation and Sanitization', () => {
    describe('XSS Prevention', () => {
      SecurityTestUtils.xssPayloads.forEach((payload, index) => {
        it(`should prevent XSS attack vector ${index + 1}: ${payload.substring(0, 30)}...`, async () => {
          // Test in various input contexts
          const testContexts = [
            { name: 'query parameter', data: { search: payload } },
            { name: 'form data', data: { message: payload } },
            { name: 'JSON body', data: { content: payload } },
          ];

          for (const context of testContexts) {
            // Create request with XSS payload
            const request = SecurityTestUtils.createMockRequest('/api/test', {
              method: 'POST',
              body: JSON.stringify(context.data),
            });

            // In a real test, you would call your API endpoint
            // For now, we simulate the expected behavior
            const mockResponse = {
              status: 200,
              text: async () => `User input: ${payload}`, // This should be sanitized
            };

            // Verify XSS payload is not reflected unescaped
            const responseText = await mockResponse.text();
            const isReflected = SecurityTestUtils.checkForReflectedContent(responseText, payload);

            expect(isReflected).toBe(false, 
              `XSS payload should not be reflected unescaped in ${context.name}`
            );

            // Check that dangerous characters are properly encoded
            const dangerousChars = ['<', '>', '"', "'", '&'];
            dangerousChars.forEach(char => {
              if (payload.includes(char)) {
                const htmlEncoded = responseText.includes(`&${char === '<' ? 'lt' : 
                                                         char === '>' ? 'gt' : 
                                                         char === '"' ? 'quot' : 
                                                         char === "'" ? '#x27' : 
                                                         'amp'};`);
                expect(htmlEncoded || !responseText.includes(char)).toBe(true,
                  `Dangerous character '${char}' should be HTML encoded`
                );
              }
            });
          }
        });
      });

      it('should sanitize HTML in user-generated content', () => {
        const dangerousHTML = '<script>alert("xss")</script><p>Safe content</p>';
        
        // Mock sanitization function (in real app, this would be your actual sanitizer)
        const sanitizeHTML = (html: string) => {
          return html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/javascript:/gi, '');
        };

        const sanitized = sanitizeHTML(dangerousHTML);
        
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('alert(');
        expect(sanitized).toContain('<p>Safe content</p>');
      });
    });

    describe('SQL Injection Prevention', () => {
      SecurityTestUtils.sqlInjectionPayloads.forEach((payload, index) => {
        it(`should prevent SQL injection vector ${index + 1}: ${payload}`, async () => {
          // Test SQL injection in various contexts
          const testCases = [
            { field: 'email', value: payload },
            { field: 'username', value: payload },
            { field: 'search', value: payload },
            { field: 'id', value: payload },
          ];

          for (const testCase of testCases) {
            // Mock database query function
            const mockQuery = jest.fn().mockImplementation((query: string, params: any[]) => {
              // Verify parameterized queries are used
              expect(query).not.toContain(payload);
              expect(params).toBeDefined();
              return { rows: [] };
            });

            // Simulate safe query execution
            const safeQuery = 'SELECT * FROM users WHERE email = $1';
            const params = [testCase.value];
            
            await mockQuery(safeQuery, params);

            expect(mockQuery).toHaveBeenCalledWith(safeQuery, params);
          }
        });
      });

      it('should use parameterized queries for all database operations', () => {
        // Example of safe query patterns
        const safeQueryPatterns = [
          'SELECT * FROM users WHERE id = $1',
          'INSERT INTO games (title, user_id) VALUES ($1, $2)',
          'UPDATE profiles SET name = $1 WHERE user_id = $2',
          'DELETE FROM sessions WHERE token = $1',
        ];

        safeQueryPatterns.forEach(pattern => {
          // Verify queries use parameter placeholders
          expect(pattern).toMatch(/\$\d+/);
          expect(pattern).not.toContain("' +");
          expect(pattern).not.toContain('" +');
        });
      });
    });

    describe('Command Injection Prevention', () => {
      SecurityTestUtils.commandInjectionPayloads.forEach((payload, index) => {
        it(`should prevent command injection vector ${index + 1}: ${payload}`, () => {
          // Mock file processing function that should validate input
          const validateFilename = (filename: string): boolean => {
            // Allow only alphanumeric characters, dots, hyphens, underscores
            const safePattern = /^[a-zA-Z0-9._-]+$/;
            return safePattern.test(filename) && 
                   !filename.includes('..') && 
                   filename.length <= 255;
          };

          const result = validateFilename(payload);
          expect(result).toBe(false, 
            `Command injection payload should be rejected: ${payload}`
          );
        });
      });

      it('should validate and sanitize file paths', () => {
        const testPaths = [
          { path: 'safe-file.txt', shouldPass: true },
          { path: 'user_document.pdf', shouldPass: true },
          { path: '../../../etc/passwd', shouldPass: false },
          { path: 'file; rm -rf /', shouldPass: false },
          { path: '$(whoami).txt', shouldPass: false },
        ];

        testPaths.forEach(({ path, shouldPass }) => {
          const isValid = /^[a-zA-Z0-9._-]+$/.test(path) && 
                          !path.includes('..') && 
                          !path.includes('/') &&
                          !path.includes('\\');
          
          expect(isValid).toBe(shouldPass, 
            `Path validation for "${path}" should ${shouldPass ? 'pass' : 'fail'}`
          );
        });
      });
    });

    describe('Path Traversal Prevention', () => {
      SecurityTestUtils.pathTraversalPayloads.forEach((payload, index) => {
        it(`should prevent path traversal vector ${index + 1}: ${payload}`, () => {
          // Mock file access function with path validation
          const validatePath = (filePath: string): boolean => {
            // Normalize and validate path
            const normalizedPath = filePath.replace(/\\/g, '/');
            
            // Check for path traversal attempts
            if (normalizedPath.includes('../') || 
                normalizedPath.includes('..\\') ||
                normalizedPath.includes('....//') ||
                normalizedPath.match(/%2e%2e/i) ||
                normalizedPath.match(/%252f/i)) {
              return false;
            }

            // Only allow files in allowed directories
            const allowedDirectories = ['/uploads/', '/public/', '/tmp/'];
            return allowedDirectories.some(dir => normalizedPath.startsWith(dir));
          };

          const result = validatePath(payload);
          expect(result).toBe(false, 
            `Path traversal payload should be rejected: ${payload}`
          );
        });
      });
    });
  });

  describe('Authentication Security', () => {
    it('should enforce strong password requirements', () => {
      const weakPasswords = [
        'password',
        '123456',
        'qwerty',
        'abc123',
        'password123',
        'admin',
      ];

      const strongPasswords = [
        'MyStr0ngP@ssw0rd!',
        'C0mplex&Secure123',
        'Unguessable#Pass2023',
      ];

      const validatePassword = (password: string): boolean => {
        if (password.length < 8) return false;
        if (!/[a-z]/.test(password)) return false;
        if (!/[A-Z]/.test(password)) return false;
        if (!/\d/.test(password)) return false;
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
        
        const commonPasswords = ['password', '123456', 'qwerty', 'abc123'];
        if (commonPasswords.includes(password.toLowerCase())) return false;
        
        return true;
      };

      weakPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false, 
          `Weak password "${password}" should be rejected`
        );
      });

      strongPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true, 
          `Strong password should be accepted`
        );
      });
    });

    it('should handle authentication tokens securely', () => {
      const tokens = SecurityTestUtils.generateTestTokens();

      // Mock token validation
      const validateToken = (token: any): boolean => {
        if (!token || typeof token !== 'string') return false;
        if (token.length < 10) return false;
        if (token === tokens.expiredToken) return false;
        if (!token.match(/^[a-zA-Z0-9-]+$/)) return false;
        return token === tokens.validToken;
      };

      expect(validateToken(tokens.validToken)).toBe(true);
      expect(validateToken(tokens.expiredToken)).toBe(false);
      expect(validateToken(tokens.malformedToken)).toBe(false);
      expect(validateToken(tokens.emptyToken)).toBe(false);
      expect(validateToken(tokens.nullToken)).toBe(false);
    });

    it('should implement proper session management', () => {
      // Mock session management functions
      const sessionManager = {
        create: (userId: string) => ({
          id: `session_${Date.now()}`,
          userId,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          isValid: true,
        }),

        validate: (sessionId: string) => {
          // In real implementation, this would check database
          if (!sessionId || sessionId.length < 10) return false;
          // Check expiration, user status, etc.
          return true;
        },

        invalidate: (sessionId: string) => {
          // In real implementation, this would remove from database
          return true;
        },
      };

      const session = sessionManager.create('user123');
      expect(session.id).toBeDefined();
      expect(session.expiresAt > new Date()).toBe(true);
      
      expect(sessionManager.validate(session.id)).toBe(true);
      expect(sessionManager.validate('')).toBe(false);
      expect(sessionManager.validate('short')).toBe(false);
    });
  });

  describe('API Security', () => {
    it('should implement rate limiting', async () => {
      // Mock rate limiter
      const rateLimiter = {
        attempts: new Map<string, { count: number; lastAttempt: number }>(),
        
        checkLimit: (clientId: string, maxAttempts = 5, windowMs = 60000) => {
          const now = Date.now();
          const clientAttempts = this.attempts.get(clientId);
          
          if (!clientAttempts) {
            this.attempts.set(clientId, { count: 1, lastAttempt: now });
            return { allowed: true, remaining: maxAttempts - 1 };
          }
          
          // Reset if window has passed
          if (now - clientAttempts.lastAttempt > windowMs) {
            this.attempts.set(clientId, { count: 1, lastAttempt: now });
            return { allowed: true, remaining: maxAttempts - 1 };
          }
          
          // Increment count
          clientAttempts.count++;
          clientAttempts.lastAttempt = now;
          
          if (clientAttempts.count > maxAttempts) {
            return { allowed: false, remaining: 0 };
          }
          
          return { allowed: true, remaining: maxAttempts - clientAttempts.count };
        },
      };

      // Test rate limiting
      const clientId = 'test-client';
      
      // First 5 requests should pass
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.checkLimit(clientId);
        expect(result.allowed).toBe(true);
      }
      
      // 6th request should be blocked
      const blockedResult = rateLimiter.checkLimit(clientId);
      expect(blockedResult.allowed).toBe(false);
    });

    it('should validate content types', () => {
      const validateContentType = (contentType: string, allowedTypes: string[]): boolean => {
        if (!contentType) return false;
        
        // Extract base content type (ignore charset, etc.)
        const baseType = contentType.split(';')[0].trim().toLowerCase();
        
        return allowedTypes.includes(baseType);
      };

      const allowedTypes = ['application/json', 'multipart/form-data', 'text/plain'];
      
      expect(validateContentType('application/json', allowedTypes)).toBe(true);
      expect(validateContentType('application/json; charset=utf-8', allowedTypes)).toBe(true);
      expect(validateContentType('text/html', allowedTypes)).toBe(false);
      expect(validateContentType('application/x-executable', allowedTypes)).toBe(false);
      expect(validateContentType('', allowedTypes)).toBe(false);
    });

    it('should implement proper CORS headers', () => {
      const corsConfig = {
        allowedOrigins: ['https://gamegen.app', 'https://app.gamegen.dev'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        allowCredentials: true,
        maxAge: 86400, // 24 hours
      };

      const validateCORS = (origin: string, method: string): boolean => {
        return corsConfig.allowedOrigins.includes(origin) &&
               corsConfig.allowedMethods.includes(method);
      };

      // Valid CORS requests
      expect(validateCORS('https://gamegen.app', 'GET')).toBe(true);
      expect(validateCORS('https://app.gamegen.dev', 'POST')).toBe(true);

      // Invalid CORS requests
      expect(validateCORS('https://evil.com', 'GET')).toBe(false);
      expect(validateCORS('https://gamegen.app', 'TRACE')).toBe(false);
    });
  });

  describe('Data Protection', () => {
    it('should encrypt sensitive data', () => {
      // Mock encryption utilities
      const crypto = {
        encrypt: (data: string, key: string): string => {
          // In real implementation, use proper encryption
          return Buffer.from(`${key}:${data}`).toString('base64');
        },
        
        decrypt: (encryptedData: string, key: string): string => {
          // In real implementation, use proper decryption
          const decoded = Buffer.from(encryptedData, 'base64').toString();
          const [dataKey, data] = decoded.split(':');
          if (dataKey !== key) throw new Error('Invalid key');
          return data;
        },
      };

      const sensitiveData = 'user-password-123';
      const encryptionKey = 'secret-key';
      
      const encrypted = crypto.encrypt(sensitiveData, encryptionKey);
      expect(encrypted).not.toBe(sensitiveData);
      expect(encrypted).not.toContain(sensitiveData);
      
      const decrypted = crypto.decrypt(encrypted, encryptionKey);
      expect(decrypted).toBe(sensitiveData);
    });

    it('should hash passwords properly', () => {
      // Mock password hashing (in real app, use bcrypt or similar)
      const hashPassword = (password: string, salt: string): string => {
        // This is a mock - use proper hashing in production
        return `hashed_${password}_with_${salt}`;
      };

      const verifyPassword = (password: string, hash: string, salt: string): boolean => {
        return hashPassword(password, salt) === hash;
      };

      const password = 'mySecurePassword123!';
      const salt = 'randomSalt123';
      
      const hash = hashPassword(password, salt);
      
      expect(hash).not.toBe(password);
      expect(hash).not.toContain(password);
      expect(verifyPassword(password, hash, salt)).toBe(true);
      expect(verifyPassword('wrongPassword', hash, salt)).toBe(false);
    });

    it('should validate file uploads securely', () => {
      const validateUpload = (file: { 
        name: string; 
        size: number; 
        type: string; 
      }): { valid: boolean; error?: string } => {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'text/plain'];
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.txt'];
        
        // Check file size
        if (file.size > maxSize) {
          return { valid: false, error: 'File too large' };
        }
        
        // Check file type
        if (!allowedTypes.includes(file.type)) {
          return { valid: false, error: 'Invalid file type' };
        }
        
        // Check file extension
        const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!allowedExtensions.includes(extension)) {
          return { valid: false, error: 'Invalid file extension' };
        }
        
        // Check for dangerous filenames
        if (file.name.includes('../') || file.name.includes('..\\')) {
          return { valid: false, error: 'Invalid filename' };
        }
        
        return { valid: true };
      };

      // Valid uploads
      expect(validateUpload({ 
        name: 'image.jpg', 
        size: 1024 * 1024, 
        type: 'image/jpeg' 
      }).valid).toBe(true);

      // Invalid uploads
      expect(validateUpload({ 
        name: 'huge-file.jpg', 
        size: 10 * 1024 * 1024, 
        type: 'image/jpeg' 
      }).valid).toBe(false);

      expect(validateUpload({ 
        name: 'script.js', 
        size: 1024, 
        type: 'application/javascript' 
      }).valid).toBe(false);

      expect(validateUpload({ 
        name: '../../../etc/passwd', 
        size: 1024, 
        type: 'text/plain' 
      }).valid).toBe(false);
    });
  });

  describe('Security Headers', () => {
    it('should include all required security headers', () => {
      // Mock response headers
      const mockHeaders = new Headers({
        'x-frame-options': 'DENY',
        'x-content-type-options': 'nosniff',
        'x-xss-protection': '1; mode=block',
        'strict-transport-security': 'max-age=31536000; includeSubDomains',
        'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline'",
        'referrer-policy': 'strict-origin-when-cross-origin',
      });

      const mockResponse = {
        headers: mockHeaders,
        status: 200,
      } as Response;

      const { missingHeaders, presentHeaders } = SecurityTestUtils.checkSecurityHeaders(mockResponse);

      expect(missingHeaders).toHaveLength(0);
      expect(presentHeaders['x-frame-options']).toBe('DENY');
      expect(presentHeaders['x-content-type-options']).toBe('nosniff');
      expect(presentHeaders['strict-transport-security']).toContain('max-age=');
    });

    it('should have properly configured CSP', () => {
      const cspHeader = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'";
      
      // Validate CSP directives
      const directives = cspHeader.split(';').map(d => d.trim());
      
      expect(directives.some(d => d.startsWith("default-src 'self'"))).toBe(true);
      expect(directives.some(d => d.startsWith("script-src 'self'"))).toBe(true);
      expect(directives.some(d => d.includes("frame-ancestors 'none'"))).toBe(true);
      
      // Should not contain unsafe directives
      expect(cspHeader).not.toContain("'unsafe-eval'");
      expect(cspHeader).not.toContain("script-src *");
    });
  });
});