/**
 * Data formatting utilities for GameGen platform
 * Migrated from unrest_app with enhancements for game development context
 */

// Currency formatting
export function formatCurrency(
  amount: number,
  currency: string = "USD",
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

// Date formatting
export function formatDate(dateString: string | Date): string {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(dateString: string | Date): string {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Time ago formatting
export function formatTimeAgo(dateString: string | Date): string {
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Duration formatting
export function formatDuration(seconds: number | null): string {
  if (!seconds) return "0m";

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  return `${minutes}m`;
}

// Number formatting with commas
export function formatNumber(num: number): string {
  return num.toLocaleString("en-US");
}

// Percentage formatting
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// File size formatting
export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

// Credit formatting (for AI usage)
export function formatCredits(credits: number): string {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M credits`;
  }
  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K credits`;
  }

  return `${credits} credits`;
}

// Phone number formatting
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  return phone;
}

// Status formatting
export function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Card number formatting (for display)
export function formatCardNumber(cardNumber: string): string {
  return cardNumber.replace(/(.{4})/g, "$1 ").trim();
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength - 3) + "...";
}

// Format operation type for display
export function formatOperationType(operationType: string): string {
  return operationType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

// Game-specific formatting utilities

// Format game asset size for display
export function formatAssetSize(bytes: number): string {
  return formatFileSize(bytes);
}

// Format pixel art dimensions
export function formatDimensions(width: number, height: number): string {
  return `${width}×${height}px`;
}

// Format game difficulty level
export function formatDifficulty(level: number, maxLevel: number = 10): string {
  const percentage = (level / maxLevel) * 100;

  if (percentage <= 25) return "Easy";
  if (percentage <= 50) return "Medium";
  if (percentage <= 75) return "Hard";

  return "Expert";
}

// Format score with appropriate magnitude
export function formatScore(score: number): string {
  if (score >= 1000000) {
    return `${(score / 1000000).toFixed(1)}M`;
  }
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}K`;
  }

  return score.toString();
}
