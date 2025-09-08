/**
 * Password validation utilities for GameGen platform
 * Implements security requirements from auth-security.md
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "fair" | "good" | "strong";
  score: number;
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxLength: number;
}

const DEFAULT_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxLength: 128,
};

// Common weak passwords to reject
const WEAK_PASSWORDS = new Set([
  "password",
  "password123",
  "123456",
  "123456789",
  "qwerty",
  "abc123",
  "password1",
  "admin",
  "letmein",
  "welcome",
  "1234567890",
  "qwertyuiop",
  "password!",
  "Password123",
  "welcome123",
  "admin123",
]);

export function validatePassword(
  password: string,
  requirements: Partial<PasswordRequirements> = {},
): PasswordValidationResult {
  const reqs = { ...DEFAULT_REQUIREMENTS, ...requirements };
  const errors: string[] = [];
  let score = 0;

  // Check length
  if (password.length < reqs.minLength) {
    errors.push(`Password must be at least ${reqs.minLength} characters long`);
  } else {
    score += Math.min(password.length * 2, 20); // Up to 20 points for length
  }

  if (password.length > reqs.maxLength) {
    errors.push(`Password must be less than ${reqs.maxLength} characters long`);
  }

  // Check uppercase letters
  if (reqs.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else if (/[A-Z]/.test(password)) {
    score += 10;
  }

  // Check lowercase letters
  if (reqs.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else if (/[a-z]/.test(password)) {
    score += 10;
  }

  // Check numbers
  if (reqs.requireNumbers && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  } else if (/[0-9]/.test(password)) {
    score += 10;
  }

  // Check special characters
  if (
    reqs.requireSpecialChars &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  ) {
    errors.push(
      "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)",
    );
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 15;
  }

  // Check for common weak passwords
  if (WEAK_PASSWORDS.has(password.toLowerCase())) {
    errors.push(
      "This password is too common. Please choose a more unique password",
    );
    score = Math.min(score, 20); // Cap score for common passwords
  }

  // Check for patterns that reduce strength
  if (/(.)\1{2,}/.test(password)) {
    errors.push("Avoid repeating the same character multiple times");
    score -= 10;
  }

  if (/123456|abcdef|qwerty/i.test(password)) {
    errors.push("Avoid common patterns and sequences");
    score -= 15;
  }

  // Bonus points for variety
  const uniqueChars = new Set(password).size;

  if (uniqueChars > password.length * 0.6) {
    score += 10; // Bonus for character variety
  }

  // Determine strength based on score
  let strength: PasswordValidationResult["strength"];

  if (score >= 70) strength = "strong";
  else if (score >= 50) strength = "good";
  else if (score >= 30) strength = "fair";
  else strength = "weak";

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.max(0, Math.min(100, score)),
  };
}

export function getPasswordStrengthColor(strength: string): string {
  switch (strength) {
    case "strong":
      return "text-green-600";
    case "good":
      return "text-blue-600";
    case "fair":
      return "text-yellow-600";
    case "weak":
      return "text-red-600";
    default:
      return "text-gray-600";
  }
}

export function getPasswordStrengthProgress(score: number): number {
  return Math.min(100, Math.max(0, score));
}

export function generateSecurePassword(length: number = 16): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  const allChars = lowercase + uppercase + numbers + symbols;
  let password = "";

  // Ensure at least one character from each required set
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}
