import {
  isValidEmail,
  isValidPassword,
  validatePassword,
  getPasswordStrength,
  manageFocus,
  getAuthErrorMessage,
} from '@/lib/auth/auth-utils';

// Mock DOM for focus management tests
const mockElement = (tag: string, attributes: Record<string, string> = {}) => {
  const element = document.createElement(tag);
  Object.keys(attributes).forEach(key => {
    element.setAttribute(key, attributes[key]);
  });
  return element;
};

describe('Auth Utils', () => {
  describe('isValidEmail', () => {
    it('validates correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'firstname+lastname@company.org',
        'user_123@test-domain.net',
        'a@b.co',
        'valid.email.with.dots@example.com',
      ];

      validEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('rejects invalid email formats', () => {
      const invalidEmails = [
        '',
        'invalid-email',
        '@example.com',
        'test@',
        'test..user@example.com', // Consecutive dots
        '.test@example.com', // Leading dot
        'test.@example.com', // Trailing dot before @
        'test@example.', // Trailing dot in domain
        'test@.example.com', // Leading dot in domain
        'test@example', // No TLD
        'test@example.c', // TLD too short
        'a'.repeat(250) + '@example.com', // Too long
      ];

      invalidEmails.forEach(email => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it('handles edge cases', () => {
      expect(isValidEmail('test@ex-ample.com')).toBe(true);
      expect(isValidEmail('test123@123domain.com')).toBe(true);
      expect(isValidEmail('TEST@EXAMPLE.COM')).toBe(true);
    });
  });

  describe('isValidPassword', () => {
    it('accepts strong passwords', () => {
      const strongPasswords = [
        'MyStr0ngP@ss',
        'SuperSecure123!',
        'C0mplex&Pass',
        'Abcdef12!',
        'Test123@password',
      ];

      strongPasswords.forEach(password => {
        expect(isValidPassword(password)).toBe(true);
      });
    });

    it('rejects weak passwords', () => {
      const weakPasswords = [
        'short', // Too short
        'password', // Too common
        'password123', // Too common
        '12345678', // Too common
        'alllowercase', // Only lowercase
        'ALLUPPERCASE', // Only uppercase
        '123456789', // Only numbers
        'qwerty123', // Too common
        'NoNumbers!', // Missing numbers
        'nonumbers123', // Missing uppercase
        'NONUMBERS123', // Missing lowercase
        'NoSpecial123', // Missing special chars
      ];

      weakPasswords.forEach(password => {
        expect(isValidPassword(password)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('returns detailed validation for strong passwords', () => {
      const result = validatePassword('MyStr0ng@Pass');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.hasSpecialChar).toBe(true);
    });

    it('returns detailed validation errors for weak passwords', () => {
      const result = validatePassword('weak');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors.some(error => 
        error.includes('must contain all of these 4 types')
      )).toBe(true);
    });

    it('identifies common passwords', () => {
      const result = validatePassword('password123');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password is too common. Please choose a more secure password'
      );
    });

    it('handles empty password', () => {
      const result = validatePassword('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(['Password is required']);
    });

    it('provides specific missing criteria', () => {
      const result = validatePassword('onlylowercase123');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => 
        error.includes('Missing: uppercase letters, special characters')
      )).toBe(true);
    });
  });

  describe('getPasswordStrength', () => {
    it('returns zero strength for empty password', () => {
      const result = getPasswordStrength('');
      
      expect(result.score).toBe(0);
      expect(result.label).toBe('');
      expect(result.color).toBe('default');
    });

    it('calculates strength for weak password', () => {
      const result = getPasswordStrength('password');
      
      expect(result.score).toBeLessThan(40);
      expect(result.label).toBe('Weak');
      expect(result.color).toBe('danger');
    });

    it('calculates strength for fair password', () => {
      const result = getPasswordStrength('Password1');
      
      expect(result.score).toBeGreaterThanOrEqual(20);
      expect(result.score).toBeLessThan(40);
      expect(['Fair', 'Weak']).toContain(result.label);
    });

    it('calculates strength for good password', () => {
      const result = getPasswordStrength('MyGoodPass123');
      
      expect(result.score).toBeGreaterThanOrEqual(40);
      expect(['Good', 'Strong']).toContain(result.label);
    });

    it('calculates strength for strong password', () => {
      const result = getPasswordStrength('MyStr0ng@Password!123');
      
      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(['Strong', 'Very strong']).toContain(result.label);
      expect(result.color).toBe('success');
    });

    it('penalizes common weak passwords', () => {
      const commonResult = getPasswordStrength('password123');
      const uniqueResult = getPasswordStrength('MyUnique123@Pass');
      
      expect(commonResult.score).toBeLessThan(uniqueResult.score);
    });

    it('rewards longer passwords', () => {
      const shortResult = getPasswordStrength('Pass123@');
      const longResult = getPasswordStrength('MyVeryLongPassword123@');
      
      expect(longResult.score).toBeGreaterThan(shortResult.score);
    });

    it('rewards character variety', () => {
      const basicResult = getPasswordStrength('Password1@');
      const variedResult = getPasswordStrength('P@ssw0rd!@#123');
      
      expect(variedResult.score).toBeGreaterThanOrEqual(basicResult.score);
    });
  });

  describe('manageFocus', () => {
    let container: HTMLElement;

    beforeEach(() => {
      document.body.innerHTML = '';
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    describe('focusFirstError', () => {
      it('focuses first invalid element', () => {
        const input1 = mockElement('input');
        const input2 = mockElement('input', { 'aria-invalid': 'true' });
        const input3 = mockElement('input');
        
        container.appendChild(input1);
        container.appendChild(input2);
        container.appendChild(input3);
        
        const focusSpy = jest.spyOn(input2, 'focus');
        const result = manageFocus.focusFirstError(container);
        
        expect(result).toBe(true);
        expect(focusSpy).toHaveBeenCalled();
      });

      it('focuses element with is-invalid class', () => {
        const input = mockElement('input', { class: 'is-invalid' });
        container.appendChild(input);
        
        const focusSpy = jest.spyOn(input, 'focus');
        const result = manageFocus.focusFirstError(container);
        
        expect(result).toBe(true);
        expect(focusSpy).toHaveBeenCalled();
      });

      it('focuses element with data-invalid attribute', () => {
        const input = mockElement('input', { 'data-invalid': 'true' });
        container.appendChild(input);
        
        const focusSpy = jest.spyOn(input, 'focus');
        const result = manageFocus.focusFirstError(container);
        
        expect(result).toBe(true);
        expect(focusSpy).toHaveBeenCalled();
      });

      it('returns false when no error element found', () => {
        const input = mockElement('input');
        container.appendChild(input);
        
        const result = manageFocus.focusFirstError(container);
        
        expect(result).toBe(false);
      });
    });

    describe('focusFirstInput', () => {
      it('focuses first input element', () => {
        const button = mockElement('button');
        const input = mockElement('input');
        const textarea = mockElement('textarea');
        
        container.appendChild(button);
        container.appendChild(input);
        container.appendChild(textarea);
        
        const focusSpy = jest.spyOn(input, 'focus');
        const result = manageFocus.focusFirstInput(container);
        
        expect(result).toBe(true);
        expect(focusSpy).toHaveBeenCalled();
      });

      it('focuses textarea if no input', () => {
        const button = mockElement('button');
        const textarea = mockElement('textarea');
        
        container.appendChild(button);
        container.appendChild(textarea);
        
        const focusSpy = jest.spyOn(textarea, 'focus');
        const result = manageFocus.focusFirstInput(container);
        
        expect(result).toBe(true);
        expect(focusSpy).toHaveBeenCalled();
      });

      it('focuses select if no input or textarea', () => {
        const button = mockElement('button');
        const select = mockElement('select');
        
        container.appendChild(button);
        container.appendChild(select);
        
        const focusSpy = jest.spyOn(select, 'focus');
        const result = manageFocus.focusFirstInput(container);
        
        expect(result).toBe(true);
        expect(focusSpy).toHaveBeenCalled();
      });

      it('returns false when no input elements found', () => {
        const button = mockElement('button');
        const div = mockElement('div');
        
        container.appendChild(button);
        container.appendChild(div);
        
        const result = manageFocus.focusFirstInput(container);
        
        expect(result).toBe(false);
      });
    });

    describe('trapFocus', () => {
      it('sets up focus trap and focuses first element', () => {
        const input1 = mockElement('input');
        const input2 = mockElement('input');
        const button = mockElement('button');
        
        container.appendChild(input1);
        container.appendChild(input2);
        container.appendChild(button);
        
        const focusSpy = jest.spyOn(input1, 'focus');
        const cleanup = manageFocus.trapFocus(container);
        
        expect(focusSpy).toHaveBeenCalled();
        expect(typeof cleanup).toBe('function');
      });

      it('handles tab key to wrap focus', () => {
        const input1 = mockElement('input');
        const input2 = mockElement('input');
        
        container.appendChild(input1);
        container.appendChild(input2);
        
        // Set up focus trap
        manageFocus.trapFocus(container);
        
        // Simulate being on last element
        input2.focus();
        
        // Create and dispatch tab event
        const tabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: false,
          bubbles: true,
        });
        
        const preventDefaultSpy = jest.spyOn(tabEvent, 'preventDefault');
        const focusSpy = jest.spyOn(input1, 'focus');
        
        // Make input2 the active element
        Object.defineProperty(document, 'activeElement', {
          value: input2,
          configurable: true,
        });
        
        container.dispatchEvent(tabEvent);
        
        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(focusSpy).toHaveBeenCalled();
      });

      it('handles shift+tab to wrap focus backwards', () => {
        const input1 = mockElement('input');
        const input2 = mockElement('input');
        
        container.appendChild(input1);
        container.appendChild(input2);
        
        // Set up focus trap
        manageFocus.trapFocus(container);
        
        // Create and dispatch shift+tab event
        const shiftTabEvent = new KeyboardEvent('keydown', {
          key: 'Tab',
          shiftKey: true,
          bubbles: true,
        });
        
        const preventDefaultSpy = jest.spyOn(shiftTabEvent, 'preventDefault');
        const focusSpy = jest.spyOn(input2, 'focus');
        
        // Make input1 the active element
        Object.defineProperty(document, 'activeElement', {
          value: input1,
          configurable: true,
        });
        
        container.dispatchEvent(shiftTabEvent);
        
        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(focusSpy).toHaveBeenCalled();
      });

      it('cleanup function removes event listener', () => {
        const input = mockElement('input');
        container.appendChild(input);
        
        const addEventListenerSpy = jest.spyOn(container, 'addEventListener');
        const removeEventListenerSpy = jest.spyOn(container, 'removeEventListener');
        
        const cleanup = manageFocus.trapFocus(container);
        expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
        
        cleanup();
        expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      });
    });
  });

  describe('getAuthErrorMessage', () => {
    it('handles null/undefined errors', () => {
      expect(getAuthErrorMessage(null)).toBe('An unexpected error occurred');
      expect(getAuthErrorMessage(undefined)).toBe('An unexpected error occurred');
    });

    it('maps common error messages', () => {
      const errorMappings = [
        {
          input: { message: 'Invalid login credentials' },
          expected: 'Invalid email or password. Please check your credentials and try again.',
        },
        {
          input: { message: 'Email not confirmed' },
          expected: 'Please check your email and click the confirmation link before signing in.',
        },
        {
          input: { message: 'User not found' },
          expected: 'No account found with this email address.',
        },
        {
          input: { message: 'Password should be at least 6 characters' },
          expected: 'Password must be at least 8 characters long.',
        },
        {
          input: { message: 'Password should be at least 8 characters' },
          expected: 'Password must be at least 8 characters long.',
        },
        {
          input: { message: 'Unable to validate email address: invalid format' },
          expected: 'Please enter a valid email address.',
        },
        {
          input: { message: 'Email address is invalid' },
          expected: 'Please enter a valid email address.',
        },
        {
          input: { message: 'User already registered' },
          expected: 'An account with this email address already exists.',
        },
        {
          input: { message: 'Too many requests' },
          expected: 'Too many attempts. Please wait a moment before trying again.',
        },
      ];

      errorMappings.forEach(({ input, expected }) => {
        expect(getAuthErrorMessage(input)).toBe(expected);
      });
    });

    it('handles error_description property', () => {
      const error = { error_description: 'Invalid login credentials' };
      expect(getAuthErrorMessage(error)).toBe(
        'Invalid email or password. Please check your credentials and try again.'
      );
    });

    it('handles toString() method', () => {
      const error = {
        toString: () => 'Custom error string',
      };
      expect(getAuthErrorMessage(error)).toBe('Custom error string');
    });

    it('returns generic message for unknown errors', () => {
      const unknownError = { message: 'Some unknown error occurred' };
      expect(getAuthErrorMessage(unknownError)).toBe('Some unknown error occurred');
    });

    it('handles errors with both message and error_description', () => {
      const error = {
        message: 'Primary message',
        error_description: 'Detailed description',
      };
      // Should prioritize message over error_description
      expect(getAuthErrorMessage(error)).toBe('Primary message');
    });
  });
});