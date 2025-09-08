import { env } from "./env";

/**
 * API endpoint configuration for GameGen application
 * Centralized management of all API routes and external service endpoints
 */

// Base URLs
export const BASE_URLS = {
  api: "/api",
  supabase: env.get("NEXT_PUBLIC_SUPABASE_URL"),
  toxoid: env.get("NEXT_PUBLIC_TOXOID_ENGINE_URL"),
  assets: env.get("NEXT_PUBLIC_ASSET_CDN_URL"),
} as const;

// Authentication endpoints
export const AUTH_ENDPOINTS = {
  login: `${BASE_URLS.api}/auth/login`,
  logout: `${BASE_URLS.api}/auth/logout`,
  signup: `${BASE_URLS.api}/auth/signup`,
  verify: `${BASE_URLS.api}/auth/verify`,
  resetPassword: `${BASE_URLS.api}/auth/reset-password`,
  updatePassword: `${BASE_URLS.api}/auth/update-password`,
  profile: `${BASE_URLS.api}/auth/profile`,
  refreshToken: `${BASE_URLS.api}/auth/refresh`,
} as const;

// User and profile endpoints
export const USER_ENDPOINTS = {
  profile: `${BASE_URLS.api}/user/profile`,
  update: `${BASE_URLS.api}/user/update`,
  avatar: `${BASE_URLS.api}/user/avatar`,
  preferences: `${BASE_URLS.api}/user/preferences`,
  subscription: `${BASE_URLS.api}/user/subscription`,
  billing: `${BASE_URLS.api}/user/billing`,
  usage: `${BASE_URLS.api}/user/usage`,
  apiKeys: `${BASE_URLS.api}/user/api-keys`,
} as const;

// Game project endpoints
export const PROJECT_ENDPOINTS = {
  list: `${BASE_URLS.api}/projects`,
  create: `${BASE_URLS.api}/projects`,
  get: (id: string) => `${BASE_URLS.api}/projects/${id}`,
  update: (id: string) => `${BASE_URLS.api}/projects/${id}`,
  delete: (id: string) => `${BASE_URLS.api}/projects/${id}`,
  duplicate: (id: string) => `${BASE_URLS.api}/projects/${id}/duplicate`,
  export: (id: string) => `${BASE_URLS.api}/projects/${id}/export`,
  publish: (id: string) => `${BASE_URLS.api}/projects/${id}/publish`,
  assets: (id: string) => `${BASE_URLS.api}/projects/${id}/assets`,
  versions: (id: string) => `${BASE_URLS.api}/projects/${id}/versions`,
} as const;

// Game content endpoints
export const GAME_ENDPOINTS = {
  play: (id: string) => `${BASE_URLS.api}/games/${id}/play`,
  embed: (id: string) => `${BASE_URLS.api}/games/${id}/embed`,
  stats: (id: string) => `${BASE_URLS.api}/games/${id}/stats`,
  comments: (id: string) => `${BASE_URLS.api}/games/${id}/comments`,
  rate: (id: string) => `${BASE_URLS.api}/games/${id}/rate`,
  featured: `${BASE_URLS.api}/games/featured`,
  search: `${BASE_URLS.api}/games/search`,
  categories: `${BASE_URLS.api}/games/categories`,
} as const;

// Asset management endpoints
export const ASSET_ENDPOINTS = {
  list: `${BASE_URLS.api}/assets`,
  upload: `${BASE_URLS.api}/assets/upload`,
  get: (id: string) => `${BASE_URLS.api}/assets/${id}`,
  update: (id: string) => `${BASE_URLS.api}/assets/${id}`,
  delete: (id: string) => `${BASE_URLS.api}/assets/${id}`,
  search: `${BASE_URLS.api}/assets/search`,
  categories: `${BASE_URLS.api}/assets/categories`,
  tags: `${BASE_URLS.api}/assets/tags`,
  public: `${BASE_URLS.api}/assets/public`,
  generate: `${BASE_URLS.api}/assets/generate`, // AI-generated assets
} as const;

// Template management endpoints
export const TEMPLATE_ENDPOINTS = {
  list: `${BASE_URLS.api}/templates`,
  get: (id: string) => `${BASE_URLS.api}/templates/${id}`,
  create: `${BASE_URLS.api}/templates`,
  use: (id: string) => `${BASE_URLS.api}/templates/${id}/use`,
  featured: `${BASE_URLS.api}/templates/featured`,
  categories: `${BASE_URLS.api}/templates/categories`,
  search: `${BASE_URLS.api}/templates/search`,
} as const;

// AI and LLM endpoints
export const AI_ENDPOINTS = {
  chat: `${BASE_URLS.api}/ai/chat`,
  complete: `${BASE_URLS.api}/ai/complete`,
  generate: `${BASE_URLS.api}/ai/generate`,
  analyze: `${BASE_URLS.api}/ai/analyze`,
  suggestions: `${BASE_URLS.api}/ai/suggestions`,
  codeReview: `${BASE_URLS.api}/ai/code-review`,
  optimize: `${BASE_URLS.api}/ai/optimize`,
  debug: `${BASE_URLS.api}/ai/debug`,
} as const;

// Chat and conversation endpoints
export const CHAT_ENDPOINTS = {
  sessions: `${BASE_URLS.api}/chat/sessions`,
  messages: `${BASE_URLS.api}/chat/messages`,
  session: (id: string) => `${BASE_URLS.api}/chat/sessions/${id}`,
  message: (sessionId: string, messageId: string) =>
    `${BASE_URLS.api}/chat/sessions/${sessionId}/messages/${messageId}`,
  templates: `${BASE_URLS.api}/chat/templates`,
  useTemplate: (id: string) => `${BASE_URLS.api}/chat/templates/${id}/use`,
} as const;

// Billing and subscription endpoints
export const BILLING_ENDPOINTS = {
  plans: `${BASE_URLS.api}/billing/plans`,
  subscribe: `${BASE_URLS.api}/billing/subscribe`,
  cancel: `${BASE_URLS.api}/billing/cancel`,
  update: `${BASE_URLS.api}/billing/update`,
  invoice: `${BASE_URLS.api}/billing/invoice`,
  usage: `${BASE_URLS.api}/billing/usage`,
  credits: `${BASE_URLS.api}/billing/credits`,
  webhook: `${BASE_URLS.api}/billing/webhook`,
} as const;

// Team collaboration endpoints
export const TEAM_ENDPOINTS = {
  list: `${BASE_URLS.api}/teams`,
  create: `${BASE_URLS.api}/teams`,
  get: (id: string) => `${BASE_URLS.api}/teams/${id}`,
  update: (id: string) => `${BASE_URLS.api}/teams/${id}`,
  delete: (id: string) => `${BASE_URLS.api}/teams/${id}`,
  members: (id: string) => `${BASE_URLS.api}/teams/${id}/members`,
  invite: (id: string) => `${BASE_URLS.api}/teams/${id}/invite`,
  join: (token: string) => `${BASE_URLS.api}/teams/join/${token}`,
} as const;

// Analytics and monitoring endpoints
export const ANALYTICS_ENDPOINTS = {
  events: `${BASE_URLS.api}/analytics/events`,
  pageview: `${BASE_URLS.api}/analytics/pageview`,
  dashboard: `${BASE_URLS.api}/analytics/dashboard`,
  report: (type: string) => `${BASE_URLS.api}/analytics/report/${type}`,
  export: `${BASE_URLS.api}/analytics/export`,
} as const;

// External service endpoints
export const EXTERNAL_ENDPOINTS = {
  stripe: {
    createSession: "https://api.stripe.com/v1/checkout/sessions",
    webhook: "https://api.stripe.com/v1/webhooks",
  },
  anthropic: {
    messages: "https://api.anthropic.com/v1/messages",
    complete: "https://api.anthropic.com/v1/complete",
  },
  toxoid: {
    compile: `${BASE_URLS.toxoid}/compile`,
    run: `${BASE_URLS.toxoid}/run`,
    debug: `${BASE_URLS.toxoid}/debug`,
    assets: `${BASE_URLS.toxoid}/assets`,
  },
} as const;

// Utility functions for building dynamic endpoints
export const buildEndpoint = (
  template: string,
  params: Record<string, string>,
): string => {
  let endpoint = template;

  Object.entries(params).forEach(([key, value]) => {
    endpoint = endpoint.replace(`{${key}}`, encodeURIComponent(value));
  });

  return endpoint;
};

export const withQueryParams = (
  endpoint: string,
  params: Record<string, any>,
): string => {
  const url = new URL(
    endpoint,
    window?.location?.origin || "http://localhost:3000",
  );

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

// API configuration constants
export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  maxFileSize: 10 * 1024 * 1024, // 10MB
  supportedImageTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
  supportedAudioTypes: ["audio/mpeg", "audio/wav", "audio/ogg"],
  rateLimits: {
    aiRequests: 100, // per hour
    uploads: 50, // per hour
    apiCalls: 1000, // per hour
  },
} as const;

// Endpoint groups for easy access
export const ENDPOINTS = {
  auth: AUTH_ENDPOINTS,
  user: USER_ENDPOINTS,
  projects: PROJECT_ENDPOINTS,
  games: GAME_ENDPOINTS,
  assets: ASSET_ENDPOINTS,
  templates: TEMPLATE_ENDPOINTS,
  ai: AI_ENDPOINTS,
  chat: CHAT_ENDPOINTS,
  billing: BILLING_ENDPOINTS,
  teams: TEAM_ENDPOINTS,
  analytics: ANALYTICS_ENDPOINTS,
  external: EXTERNAL_ENDPOINTS,
} as const;
