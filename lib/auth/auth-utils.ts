/**
 * Authentication Utility Functions for GameGen platform
 * Combines validation, focus management, and other authentication utilities
 */

import type { Database } from "../supabase/database.types";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Type alias for better compatibility
export type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

// Email validation utility - improved to handle edge cases
export const isValidEmail = (email: string): boolean => {
  if (!email || email.length === 0) return false;

  // More comprehensive email regex that handles edge cases
  const emailRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

  // Additional checks for common edge cases
  if (email.includes("..")) return false; // No consecutive dots
  if (email.startsWith(".") || email.endsWith(".")) return false; // No leading/trailing dots
  if (email.length > 254) return false; // RFC 5321 limit

  return emailRegex.test(email);
};

// Basic password validation utility - more strict now
export const isValidPassword = (password: string): boolean => {
  if (password.length < 8) return false;

  // Reject common weak passwords
  const weakPasswords = [
    "password",
    "password123",
    "12345678",
    "qwerty123",
    "abc123456",
    "123456789",
    "password1",
    "welcome123",
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    return false;
  }

  // Must have ALL 4 criteria for stronger security:
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password);

  return hasLower && hasUpper && hasNumber && hasSpecial;
};

// Enhanced password validation with detailed rules
export const validatePassword = (password: string) => {
  const errors: string[] = [];
  let isValid = true;

  if (!password) {
    return { isValid: false, errors: ["Password is required"] };
  }

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
    isValid = false;
  }

  // Check for weak passwords
  const weakPasswords = [
    "password",
    "password123",
    "12345678",
    "qwerty123",
    "abc123456",
    "123456789",
    "password1",
    "welcome123",
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push("Password is too common. Please choose a more secure password");
    isValid = false;
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password);

  // Check that all criteria are met for stronger security
  if (!hasLower || !hasUpper || !hasNumber || !hasSpecialChar) {
    const missing = [];

    if (!hasLower) missing.push("lowercase letters");
    if (!hasUpper) missing.push("uppercase letters");
    if (!hasNumber) missing.push("numbers");
    if (!hasSpecialChar) missing.push("special characters");

    errors.push(
      `Password must contain all of these 4 types: lowercase letters, uppercase letters, numbers, special characters. Missing: ${missing.join(", ")}`,
    );
    isValid = false;
  }

  return {
    isValid,
    errors,
    hasSpecialChar,
  };
};

// Password strength calculation
export const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: "", color: "default" as const };

  let score = 0;
  const maxScore = 10;

  // Length scoring
  if (password.length >= 8) score += 2;
  else if (password.length >= 6) score += 1;

  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character type scoring
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) score += 1;

  // Bonus for variety
  const hasMultipleNumbers = (password.match(/\d/g) || []).length >= 2;
  const hasMultipleSpecial =
    (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/g) || []).length >= 2;

  if (hasMultipleNumbers) score += 1;
  if (hasMultipleSpecial) score += 1;

  // Penalty for weak patterns
  const weakPasswords = [
    "password",
    "password123",
    "12345678",
    "qwerty123",
    "abc123456",
    "123456789",
    "password1",
    "welcome123",
  ];

  if (weakPasswords.includes(password.toLowerCase())) {
    score = Math.max(0, score - 3);
  }

  const percentage = Math.min(100, (score / maxScore) * 100);

  let label: string;
  let color: "danger" | "warning" | "success" | "default";

  if (percentage >= 80) {
    label = "Very strong";
    color = "success";
  } else if (percentage >= 60) {
    label = "Strong";
    color = "success";
  } else if (percentage >= 40) {
    label = "Good";
    color = "warning";
  } else if (percentage >= 20) {
    label = "Fair";
    color = "warning";
  } else {
    label = "Weak";
    color = "danger";
  }

  return {
    score: percentage,
    label,
    color,
  };
};

// Focus management utility for accessibility
export const manageFocus = {
  // Trap focus within a container
  trapFocus: (container: HTMLElement) => {
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
  focusFirstError: (container: HTMLElement) => {
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
  focusFirstInput: (container: HTMLElement) => {
    const firstInput = container.querySelector(
      "input, textarea, select",
    ) as HTMLElement;

    if (firstInput) {
      firstInput.focus();

      return true;
    }

    return false;
  },
};

// Server-side Supabase client for middleware and server components
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
};

// Get current session server-side
export const getSession = async () => {
  const supabase = await createServerSupabaseClient();

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session;
  } catch (error) {
    console.error("Error:", error);

    return null;
  }
};

// Get current user server-side
export const getUser = async () => {
  const supabase = await createServerSupabaseClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user;
  } catch (error) {
    console.error("Error:", error);

    return null;
  }
};

// Get user profile
export const getProfile = async (userId: string) => {
  const supabase = await createServerSupabaseClient();

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error fetching profile:", error);

    return null;
  }
};

// Auth error handling utility
export const getAuthErrorMessage = (error: any): string => {
  if (!error) return "An unexpected error occurred";

  const message = error.message || error.error_description || error.toString();

  switch (message) {
    case "Invalid login credentials":
      return "Invalid email or password. Please check your credentials and try again.";
    case "Email not confirmed":
      return "Please check your email and click the confirmation link before signing in.";
    case "User not found":
      return "No account found with this email address.";
    case "Password should be at least 6 characters":
    case "Password should be at least 8 characters":
      return "Password must be at least 8 characters long.";
    case "Unable to validate email address: invalid format":
      return "Please enter a valid email address.";
    case "Email address is invalid":
      return "Please enter a valid email address.";
    case "User already registered":
      return "An account with this email address already exists.";
    case "Signup requires a valid password":
      return "Please enter a valid password.";
    case "Only an email address is required for signup":
      return "Please provide a valid email address.";
    case "Password is too weak":
      return "Password is too weak. Please choose a stronger password.";
    case "Email link is invalid or has expired":
      return "The email link is invalid or has expired. Please request a new one.";
    case "Token has expired or is invalid":
      return "Your session has expired. Please sign in again.";
    case "Database error saving new user":
      return "There was an error creating your account. Please try again.";
    case "Too many requests":
      return "Too many attempts. Please wait a moment before trying again.";
    default:
      return message || "An unexpected error occurred. Please try again.";
  }
};
