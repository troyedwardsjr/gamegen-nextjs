/**
 * String processing and manipulation utilities for GameGen platform
 * Common string operations with performance optimizations and edge case handling
 */

// Basic string operations
export const capitalize = (str: string): string => {
  if (!str) return "";

  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str: string): string => {
  if (!str) return "";

  return str
    .split(" ")
    .map((word) => capitalize(word))
    .join(" ");
};

export const camelCase = (str: string): string => {
  if (!str) return "";

  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase(),
    )
    .replace(/\s+/g, "");
};

export const kebabCase = (str: string): string => {
  if (!str) return "";

  return str
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
};

export const snakeCase = (str: string): string => {
  if (!str) return "";

  return str
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toLowerCase();
};

export const pascalCase = (str: string): string => {
  if (!str) return "";

  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
    .replace(/\s+/g, "");
};

// String cleaning and sanitization
export const removeExtraSpaces = (str: string): string => {
  if (!str) return "";

  return str.replace(/\s+/g, " ").trim();
};

export const removeSpecialChars = (str: string, keep: string = ""): string => {
  if (!str) return "";
  const pattern = new RegExp(
    `[^a-zA-Z0-9${keep.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`,
    "g",
  );

  return str.replace(pattern, "");
};

export const stripHtml = (str: string): string => {
  if (!str) return "";

  return str.replace(/<[^>]*>/g, "");
};

export const sanitizeForUrl = (str: string): string => {
  if (!str) return "";

  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

export const sanitizeForId = (str: string): string => {
  if (!str) return "";

  return str.replace(/[^a-zA-Z0-9_-]/g, "").replace(/^[0-9]/, "id$&"); // Ensure it doesn't start with a number
};

// String validation and checks
export const isEmpty = (str: string | null | undefined): boolean => {
  return !str || str.trim().length === 0;
};

export const isEmail = (str: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(str);
};

export const isUrl = (str: string): boolean => {
  try {
    new URL(str);

    return true;
  } catch {
    return false;
  }
};

export const isAlphaNumeric = (str: string): boolean => {
  return /^[a-zA-Z0-9]+$/.test(str);
};

export const containsUppercase = (str: string): boolean => {
  return /[A-Z]/.test(str);
};

export const containsLowercase = (str: string): boolean => {
  return /[a-z]/.test(str);
};

export const containsNumbers = (str: string): boolean => {
  return /\d/.test(str);
};

export const containsSpecialChars = (str: string): boolean => {
  return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(str);
};

// String formatting and truncation
export const truncate = (
  str: string,
  length: number,
  suffix: string = "...",
): string => {
  if (!str) return "";
  if (str.length <= length) return str;

  return str.slice(0, length - suffix.length) + suffix;
};

export const truncateWords = (
  str: string,
  wordCount: number,
  suffix: string = "...",
): string => {
  if (!str) return "";
  const words = str.split(/\s+/);

  if (words.length <= wordCount) return str;

  return words.slice(0, wordCount).join(" ") + suffix;
};

export const wordWrap = (str: string, width: number): string => {
  if (!str) return "";
  const regex = new RegExp(`(.{1,${width}})(\\s|$)`, "g");

  return str.replace(regex, "$1\n").trim();
};

export const padStart = (
  str: string,
  length: number,
  padString: string = " ",
): string => {
  return str.padStart(length, padString);
};

export const padEnd = (
  str: string,
  length: number,
  padString: string = " ",
): string => {
  return str.padEnd(length, padString);
};

// String search and manipulation
export const countOccurrences = (str: string, substring: string): number => {
  if (!str || !substring) return 0;

  return (str.match(new RegExp(escapeRegex(substring), "g")) || []).length;
};

export const replaceAll = (
  str: string,
  search: string,
  replace: string,
): string => {
  if (!str) return "";

  return str.replace(new RegExp(escapeRegex(search), "g"), replace);
};

export const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const reverse = (str: string): string => {
  return str.split("").reverse().join("");
};

export const shuffle = (str: string): string => {
  const chars = str.split("");

  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
};

// String generation utilities
export const randomString = (
  length: number = 10,
  chars: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
): string => {
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};

export const generateId = (
  prefix: string = "id",
  length: number = 8,
): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  return prefix + "_" + randomString(length, chars);
};

export const generateSlug = (str: string): string => {
  return sanitizeForUrl(str);
};

// Template string utilities
export const template = (str: string, vars: Record<string, any>): string => {
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars.hasOwnProperty(key) ? String(vars[key]) : match;
  });
};

export const interpolate = (str: string, vars: Record<string, any>): string => {
  return str.replace(/\$\{(\w+)\}/g, (match, key) => {
    return vars.hasOwnProperty(key) ? String(vars[key]) : match;
  });
};

// Game-specific string utilities
export const formatGameName = (name: string): string => {
  if (!name) return "";

  return capitalizeWords(name.trim());
};

export const generateGameId = (name: string): string => {
  const slug = sanitizeForUrl(name);
  const timestamp = Date.now().toString(36);

  return `game_${slug}_${timestamp}`;
};

export const validateGameName = (name: string): boolean => {
  if (!name || name.trim().length === 0) return false;
  if (name.length < 2 || name.length > 50) return false;

  return /^[a-zA-Z0-9\s\-_'".!]+$/.test(name);
};

// Color string utilities
export const hexToRgb = (
  hex: string,
): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);

        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
};

// Pluralization utility
export const pluralize = (
  count: number,
  singular: string,
  plural?: string,
): string => {
  if (count === 1) return `${count} ${singular}`;

  return `${count} ${plural || singular + "s"}`;
};

// String comparison utilities
export const similarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1;

  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1;

  const distance = levenshteinDistance(longer, shorter);

  return (longer.length - distance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};
