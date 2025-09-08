/**
 * General utility functions for GameGen platform
 * Common helper functions for various operations including focus management,
 * object manipulation, array operations, and more
 */

// Types
export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
}

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

// Object utilities
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as T;
  if (obj instanceof Array) return obj.map((item) => deepClone(item)) as T;
  if (typeof obj === "object") {
    const cloned = {} as T;

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }

    return cloned;
  }

  return obj;
};

export const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return obj1 === obj2;

  if (typeof obj1 !== typeof obj2) return false;

  if (typeof obj1 !== "object") return obj1 === obj2;

  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
};

export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> => {
  const result = {} as Pick<T, K>;

  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });

  return result;
};

export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> => {
  const result = { ...obj } as Omit<T, K>;

  keys.forEach((key) => {
    delete (result as any)[key];
  });

  return result;
};

export const merge = <T extends object, U extends object>(
  obj1: T,
  obj2: U,
): T & U => {
  return { ...obj1, ...obj2 };
};

export const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  if (typeof value === "string") return value.trim().length === 0;

  return false;
};

// Array utilities
export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const uniqueBy = <T>(array: T[], keyFn: (item: T) => any): T[] => {
  const seen = new Set();

  return array.filter((item) => {
    const key = keyFn(item);

    if (seen.has(key)) return false;
    seen.add(key);

    return true;
  });
};

export const groupBy = <T>(
  array: T[],
  keyFn: (item: T) => string,
): Record<string, T[]> => {
  return array.reduce(
    (groups, item) => {
      const key = keyFn(item);

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);

      return groups;
    },
    {} as Record<string, T[]>,
  );
};

export const sortBy = <T>(
  array: T[],
  keyFn: (item: T) => any,
  direction: "asc" | "desc" = "asc",
): T[] => {
  return [...array].sort((a, b) => {
    const aKey = keyFn(a);
    const bKey = keyFn(b);

    if (aKey < bKey) return direction === "asc" ? -1 : 1;
    if (aKey > bKey) return direction === "asc" ? 1 : -1;

    return 0;
  });
};

export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];

  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }

  return chunks;
};

export const flatten = <T>(arrays: T[][]): T[] => {
  return arrays.reduce((flat, array) => flat.concat(array), []);
};

export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

// Function utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: DebounceOptions = {},
): T => {
  const { leading = false, trailing = true } = options;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let result: ReturnType<T>;

  const debounced = function (this: any, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (leading && timeoutId === null) {
      result = func.apply(this, args);
    }

    timeoutId = setTimeout(() => {
      if (trailing && lastArgs) {
        result = func.apply(lastThis, lastArgs);
      }
      timeoutId = null;
      lastArgs = null;
      lastThis = null;
    }, wait);

    return result;
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
      lastThis = null;
    }
  };

  return debounced as T;
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: ThrottleOptions = {},
): T => {
  const { leading = true, trailing = true } = options;
  let lastCallTime = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let result: ReturnType<T>;

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    lastArgs = args;
    lastThis = this;

    if (leading && timeSinceLastCall >= wait) {
      lastCallTime = now;
      result = func.apply(this, args);
    } else if (trailing && !timeoutId) {
      timeoutId = setTimeout(() => {
        lastCallTime = Date.now();
        timeoutId = null;
        if (lastArgs) {
          result = func.apply(lastThis, lastArgs);
        }
      }, wait - timeSinceLastCall);
    }

    return result;
  };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
      lastThis = null;
    }
  };

  return throttled as T;
};

export const memoize = <T extends (...args: any[]) => any>(func: T): T => {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...args);

    cache.set(key, result);

    return result;
  }) as T;
};

// Focus management utilities (migrated from auth utils)
export const manageFocus = {
  // Trap focus within a container
  trapFocus: (container: HTMLElement): (() => void) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);
    firstElement?.focus();

    return () => container.removeEventListener("keydown", handleTabKey);
  },

  // Focus first error or invalid input
  focusFirstError: (container: HTMLElement): boolean => {
    const errorElement = container.querySelector(
      '[aria-invalid="true"], .is-invalid, [data-invalid]',
    ) as HTMLElement;

    if (errorElement) {
      errorElement.focus();

      return true;
    }

    return false;
  },

  // Focus first input in form
  focusFirstInput: (container: HTMLElement): boolean => {
    const firstInput = container.querySelector(
      "input, textarea, select",
    ) as HTMLElement;

    if (firstInput) {
      firstInput.focus();

      return true;
    }

    return false;
  },

  // Restore focus to a previously focused element
  restoreFocus: (element: HTMLElement | null) => {
    if (element && document.contains(element)) {
      element.focus();
    }
  },

  // Get currently focused element
  getCurrentlyFocused: (): Element | null => {
    return document.activeElement;
  },
};

// DOM utilities
export const getElementPosition = (
  element: HTMLElement,
): { top: number; left: number; width: number; height: number } => {
  const rect = element.getBoundingClientRect();

  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
  };
};

export const isElementInViewport = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

export const scrollToElement = (
  element: HTMLElement,
  options: ScrollIntoViewOptions = {},
): void => {
  element.scrollIntoView({ behavior: "smooth", block: "center", ...options });
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);

    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");

    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand("copy");
      document.body.removeChild(textArea);

      return true;
    } catch (err) {
      document.body.removeChild(textArea);

      return false;
    }
  }
};

// Number utilities
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

export const randomBetween = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(randomBetween(min, max + 1));
};

export const roundToDecimalPlaces = (
  value: number,
  decimals: number,
): number => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

// Type guards and checks
export const isFunction = (value: any): value is Function => {
  return typeof value === "function";
};

export const isString = (value: any): value is string => {
  return typeof value === "string";
};

export const isNumber = (value: any): value is number => {
  return typeof value === "number" && !isNaN(value);
};

export const isBoolean = (value: any): value is boolean => {
  return typeof value === "boolean";
};

export const isObject = (value: any): value is object => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

export const isArray = <T = any>(value: any): value is T[] => {
  return Array.isArray(value);
};

export const isDate = (value: any): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

export const isPromise = <T = any>(value: any): value is Promise<T> => {
  return value && typeof value.then === "function";
};

// Environment utilities
export const isBrowser = (): boolean => {
  return typeof window !== "undefined";
};

export const isServer = (): boolean => {
  return typeof window === "undefined";
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === "production";
};

export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === "development";
};

// Game-specific utilities
export const generateGameId = (): string => {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatGameState = (state: any): string => {
  try {
    return JSON.stringify(state, null, 2);
  } catch {
    return String(state);
  }
};

export const parseGameState = <T = any>(stateString: string): T | null => {
  try {
    return JSON.parse(stateString);
  } catch {
    return null;
  }
};

export const calculateDistance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

export const calculateAngle = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number => {
  return Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
};

// Performance utilities
export const measurePerformance = <T>(
  fn: () => T,
  label?: string,
): { result: T; duration: number } => {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  if (label && isDevelopment()) {
    console.log(`${label}: ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Error handling utilities
export const safeExecute = <T>(fn: () => T, fallback?: T): T | undefined => {
  try {
    return fn();
  } catch (error) {
    if (isDevelopment()) {
      console.error("Safe execute error:", error);
    }

    return fallback;
  }
};

export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000,
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt === maxAttempts) break;
      await sleep(delay * attempt); // Exponential backoff
    }
  }

  throw lastError!;
};
