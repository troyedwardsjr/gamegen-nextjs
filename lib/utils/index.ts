/**
 * Utility libraries index - centralized exports for GameGen platform
 * All utility functions organized by category for easy importing
 */

// Re-export everything from individual utility modules
export * from "./general-utils";
export * from "./format-utils";
export * from "./validation-utils";
export * from "./storage-utils";
export * from "./string-utils";
export * from "./date-utils";

// Organized exports for better developer experience
import * as General from "./general-utils";
import * as Format from "./format-utils";
import * as Validation from "./validation-utils";
import * as Storage from "./storage-utils";
import * as String from "./string-utils";
import * as Date from "./date-utils";

export { General, Format, Validation, Storage, String, Date };

// Convenience exports for most commonly used functions
export {
  // General utilities
  deepClone,
  debounce,
  throttle,
  manageFocus,
  copyToClipboard,
  clamp,
  isFunction,
  isString,
  isNumber,
  isBrowser,
  isServer,
  generateGameId,
  safeExecute,
} from "./general-utils";

export {
  // Format utilities
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTimeAgo,
  formatNumber,
  formatFileSize,
  truncateText,
  formatScore,
  formatDimensions,
} from "./format-utils";

export {
  // Validation utilities
  isValidEmail,
  validatePassword,
  getPasswordStrength,
  isValidUrl,
  validateFile,
  validateImage,
  validateGameName,
  isValidHexColor,
  isRequired,
} from "./validation-utils";

export {
  // Storage utilities
  localStorage,
  sessionStorage,
  isStorageAvailable,
  onboardingStorage,
  preferencesStorage,
  editorStorage,
  recentGamesStorage,
  cleanupExpiredItems,
} from "./storage-utils";

export {
  // String utilities
  capitalize,
  camelCase,
  kebabCase,
  snakeCase,
  isEmpty,
  truncate,
  sanitizeForUrl,
  randomString,
  generateSlug,
  template,
  pluralize,
} from "./string-utils";

export {
  // Date utilities
  createDate,
  parseDate,
  isValid,
  isToday,
  addTime,
  subtractTime,
  formatRelativeTime,
  differenceInDays,
  startOfDay,
  endOfDay,
  formatGameSessionDuration,
  getNextMilestone,
} from "./date-utils";

// Type exports
export type {
  ValidationResult,
  PasswordValidationResult,
  PasswordStrength,
} from "./validation-utils";

export type { StorageOptions, StorageItem } from "./storage-utils";

export type {
  DateInput,
  TimeUnit,
  DateRange,
  TimeDifference,
} from "./date-utils";

export type { DebounceOptions, ThrottleOptions } from "./general-utils";

// Constants
export { STORAGE_KEYS } from "./storage-utils";
