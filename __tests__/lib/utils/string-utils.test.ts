/**
 * String Utils Tests
 * Tests for string utility functions
 */

describe('String Utils', () => {
  describe('String Manipulation', () => {
    it('should create slugs from strings', () => {
      const createSlug = (str: string) => {
        return str
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      };

      expect(createSlug('Hello World')).toBe('hello-world');
      expect(createSlug('Game Title: The Adventure!')).toBe('game-title-the-adventure');
      expect(createSlug('  Spaced  Out  ')).toBe('spaced-out');
    });

    it('should capitalize strings correctly', () => {
      const capitalize = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };

      const capitalizeWords = (str: string) => {
        return str.split(' ').map(capitalize).join(' ');
      };

      expect(capitalize('hello')).toBe('Hello');
      expect(capitalizeWords('hello world')).toBe('Hello World');
      expect(capitalizeWords('game DEVELOPMENT tutorial')).toBe('Game Development Tutorial');
    });

    it('should truncate strings with ellipsis', () => {
      const truncate = (str: string, length: number, suffix = '...') => {
        if (str.length <= length) return str;
        return str.slice(0, length - suffix.length) + suffix;
      };

      expect(truncate('Short text', 20)).toBe('Short text');
      expect(truncate('This is a very long text that needs truncation', 20)).toBe('This is a very lo...');
      expect(truncate('Custom suffix', 8, '…')).toBe('Custom …');
    });
  });

  describe('Text Processing', () => {
    it('should extract words from text', () => {
      const extractWords = (text: string) => {
        return text.match(/\b\w+\b/g) || [];
      };

      const text = 'Hello, world! This is a test.';
      const words = extractWords(text);

      expect(words).toEqual(['Hello', 'world', 'This', 'is', 'a', 'test']);
    });

    it('should count character frequency', () => {
      const countChars = (str: string) => {
        const counts: Record<string, number> = {};
        for (const char of str.toLowerCase()) {
          if (char.match(/[a-z]/)) {
            counts[char] = (counts[char] || 0) + 1;
          }
        }
        return counts;
      };

      const counts = countChars('Hello World');
      expect(counts['l']).toBe(3);
      expect(counts['o']).toBe(2);
      expect(counts['h']).toBe(1);
    });

    it('should validate string patterns', () => {
      const isValidUsername = (username: string) => {
        return /^[a-zA-Z0-9_]{3,20}$/.test(username);
      };

      const isValidHexColor = (color: string) => {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
      };

      expect(isValidUsername('user123')).toBe(true);
      expect(isValidUsername('us')).toBe(false); // too short
      expect(isValidUsername('user@name')).toBe(false); // invalid chars

      expect(isValidHexColor('#FF0000')).toBe(true);
      expect(isValidHexColor('#F00')).toBe(true);
      expect(isValidHexColor('FF0000')).toBe(false); // missing #
      expect(isValidHexColor('#GG0000')).toBe(false); // invalid chars
    });
  });

  describe('Template Processing', () => {
    it('should replace template variables', () => {
      const template = (str: string, vars: Record<string, any>) => {
        return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return vars[key] !== undefined ? String(vars[key]) : match;
        });
      };

      const templateStr = 'Hello {{name}}, welcome to {{app}}!';
      const result = template(templateStr, { name: 'John', app: 'GameGen' });

      expect(result).toBe('Hello John, welcome to GameGen!');
    });

    it('should handle markdown-like formatting', () => {
      const formatText = (text: string) => {
        return text
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`(.*?)`/g, '<code>$1</code>');
      };

      const markdown = 'This is **bold** and *italic* and `code`.';
      const html = formatText(markdown);

      expect(html).toBe('This is <strong>bold</strong> and <em>italic</em> and <code>code</code>.');
    });
  });

  describe('URL and Path Utils', () => {
    it('should build query strings', () => {
      const buildQueryString = (params: Record<string, any>) => {
        return Object.entries(params)
          .filter(([, value]) => value != null)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          .join('&');
      };

      const params = { name: 'John Doe', age: 30, active: true };
      const queryString = buildQueryString(params);

      expect(queryString).toBe('name=John%20Doe&age=30&active=true');
    });

    it('should parse URLs', () => {
      const parseUrl = (url: string) => {
        try {
          const parsed = new URL(url);
          return {
            protocol: parsed.protocol,
            host: parsed.host,
            pathname: parsed.pathname,
            search: parsed.search,
            hash: parsed.hash,
          };
        } catch {
          return null;
        }
      };

      const parsed = parseUrl('https://example.com/path?query=value#section');
      
      expect(parsed).toEqual({
        protocol: 'https:',
        host: 'example.com',
        pathname: '/path',
        search: '?query=value',
        hash: '#section',
      });
    });
  });

  describe('Security Utils', () => {
    it('should escape HTML entities', () => {
      const escapeHtml = (str: string) => {
        const htmlEntities: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
        };

        return str.replace(/[&<>"']/g, char => htmlEntities[char]);
      };

      const unsafe = '<script>alert("xss")</script>';
      const safe = escapeHtml(unsafe);

      expect(safe).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });

    it('should generate random strings', () => {
      const generateId = (length = 8) => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const id1 = generateId();
      const id2 = generateId();
      const longId = generateId(16);

      expect(id1).toHaveLength(8);
      expect(id2).toHaveLength(8);
      expect(longId).toHaveLength(16);
      expect(id1).not.toBe(id2); // Should be different (very high probability)
    });
  });
});