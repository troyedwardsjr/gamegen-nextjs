/**
 * Input validation utilities for GameGen platform
 * Consolidated validation functions from various sources in unrest_app
 */

// Types for validation results
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordValidationResult extends ValidationResult {
  hasSpecialChar?: boolean;
}

export interface PasswordStrength {
  score: number;
  label: string;
  color: "danger" | "warning" | "success" | "default";
}

// Email validation utility
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
};

// Basic password validation utility
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// Enhanced password validation with rules
export const validatePassword = (
  password: string,
): PasswordValidationResult => {
  const errors: string[] = [];
  let isValid = true;

  if (!password) {
    return { isValid: false, errors: ["Password is required"] };
  }

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
    isValid = false;
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
    isValid = false;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
    isValid = false;
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
    isValid = false;
  }

  // Special characters are recommended but not required
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password);

  return {
    isValid,
    errors,
    hasSpecialChar,
  };
};

// Password strength calculation
export const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password) return { score: 0, label: "", color: "default" as const };

  let score = 0;

  if (password.length >= 6) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) score += 1;

  const strengthMap = {
    0: { label: "Very weak", color: "danger" as const },
    1: { label: "Weak", color: "danger" as const },
    2: { label: "Fair", color: "warning" as const },
    3: { label: "Good", color: "warning" as const },
    4: { label: "Strong", color: "success" as const },
    5: { label: "Very strong", color: "success" as const },
  };

  return {
    score: (score / 5) * 100,
    ...strengthMap[score as keyof typeof strengthMap],
  };
};

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);

    return true;
  } catch {
    return false;
  }
};

// Phone number validation (US format)
export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, "");

  return cleaned.length === 10;
};

// Username validation
export const isValidUsername = (username: string): ValidationResult => {
  const errors: string[] = [];

  if (!username) {
    return { isValid: false, errors: ["Username is required"] };
  }

  if (username.length < 3) {
    errors.push("Username must be at least 3 characters long");
  }

  if (username.length > 20) {
    errors.push("Username must be no more than 20 characters long");
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push(
      "Username can only contain letters, numbers, hyphens, and underscores",
    );
  }

  if (/^[_-]/.test(username) || /[_-]$/.test(username)) {
    errors.push("Username cannot start or end with hyphens or underscores");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// File validation
export const validateFile = (
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
    minSize?: number;
  } = {},
): ValidationResult => {
  const { maxSize = 10 * 1024 * 1024, allowedTypes, minSize = 0 } = options;
  const errors: string[] = [];

  if (file.size > maxSize) {
    errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
  }

  if (file.size < minSize) {
    errors.push(`File size must be at least ${minSize} bytes`);
  }

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    errors.push(
      `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Image file validation
export const validateImage = (
  file: File,
  maxSize: number = 5 * 1024 * 1024,
): ValidationResult => {
  return validateFile(file, {
    maxSize,
    allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  });
};

// Game asset validation
export const validateGameAsset = (file: File): ValidationResult => {
  const gameAssetTypes = [
    "image/png",
    "image/jpeg",
    "image/gif",
    "audio/wav",
    "audio/mp3",
    "audio/ogg",
    "application/json", // for game data/configs
    "text/plain", // for scripts or data files
  ];

  return validateFile(file, {
    maxSize: 50 * 1024 * 1024, // 50MB max for game assets
    allowedTypes: gameAssetTypes,
  });
};

// Game name validation
export const validateGameName = (name: string): ValidationResult => {
  const errors: string[] = [];

  if (!name || !name.trim()) {
    return { isValid: false, errors: ["Game name is required"] };
  }

  if (name.length < 2) {
    errors.push("Game name must be at least 2 characters long");
  }

  if (name.length > 50) {
    errors.push("Game name must be no more than 50 characters long");
  }

  // Allow letters, numbers, spaces, and some special characters
  if (!/^[a-zA-Z0-9\s\-_'".!]+$/.test(name)) {
    errors.push("Game name contains invalid characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Game description validation
export const validateGameDescription = (
  description: string,
): ValidationResult => {
  const errors: string[] = [];

  if (description && description.length > 500) {
    errors.push("Game description must be no more than 500 characters long");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Color hex validation
export const isValidHexColor = (color: string): boolean => {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color);
};

// Pixel art dimension validation
export const validatePixelArtDimensions = (
  width: number,
  height: number,
): ValidationResult => {
  const errors: string[] = [];
  const maxDimension = 1024; // Maximum pixels for performance
  const minDimension = 8; // Minimum for practical pixel art

  if (width < minDimension || height < minDimension) {
    errors.push(
      `Dimensions must be at least ${minDimension}x${minDimension} pixels`,
    );
  }

  if (width > maxDimension || height > maxDimension) {
    errors.push(
      `Dimensions must be no more than ${maxDimension}x${maxDimension} pixels`,
    );
  }

  if (width * height > 500000) {
    // 500k pixels max for performance
    errors.push("Total pixel count is too large for optimal performance");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// JSON validation utility
export const isValidJSON = (str: string): boolean => {
  try {
    JSON.parse(str);

    return true;
  } catch {
    return false;
  }
};

// Required field validation
export const isRequired = (value: any): ValidationResult => {
  const isEmpty =
    value === null ||
    value === undefined ||
    value === "" ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === "object" && Object.keys(value).length === 0);

  return {
    isValid: !isEmpty,
    errors: isEmpty ? ["This field is required"] : [],
  };
};

// Range validation for numbers
export const validateNumberRange = (
  value: number,
  min?: number,
  max?: number,
  fieldName: string = "Value",
): ValidationResult => {
  const errors: string[] = [];

  if (typeof value !== "number" || isNaN(value)) {
    return { isValid: false, errors: [`${fieldName} must be a valid number`] };
  }

  if (min !== undefined && value < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }

  if (max !== undefined && value > max) {
    errors.push(`${fieldName} must be no more than ${max}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
