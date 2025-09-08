/**
 * GameGen Subscription & Billing Types
 *
 * TypeScript type definitions for subscription management, billing,
 * and payment processing in the GameGen pixel art game creation platform.
 */

import { Subscription as DBSubscription } from "./database";

// Basic Stripe type definitions (to avoid external dependency)
declare namespace Stripe {
  interface Event {
    id: string;
    type: string;
    data: {
      object: any;
    };
    created: number;
  }
}

// Re-export database subscription type
export type Subscription = DBSubscription;

/**
 * GameGen subscription plan tiers
 */
export type PlanTier = "free" | "pro" | "max" | "enterprise";

/**
 * Subscription status types
 */
export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "trialing"
  | "unpaid"
  | "paused";

/**
 * GameGen AI operation types for credit tracking
 */
export type AIOperationType =
  | "sprite_generation"
  | "background_generation"
  | "sound_generation"
  | "music_generation"
  | "code_generation"
  | "game_logic_generation"
  | "level_design_generation"
  | "story_generation"
  | "asset_enhancement"
  | "asset_variation";

/**
 * Billing cycle options
 */
export type BillingCycle = "monthly" | "yearly";

/**
 * GameGen plan configuration
 */
export interface PlanConfig {
  id: string;
  name: string;
  tier: PlanTier;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  savings_yearly?: number; // percentage saved with yearly billing

  // Feature limits
  game_limit: number; // -1 for unlimited
  ai_credits_monthly: number;
  storage_limit_gb: number;
  export_formats: string[]; // ['web', 'desktop', 'mobile', 'source']

  // Feature flags
  can_export: boolean;
  can_white_label: boolean;
  can_use_custom_domain: boolean;
  can_collaborate: boolean;
  priority_support: boolean;
  advanced_analytics: boolean;
  custom_branding: boolean;

  // Community features
  can_publish_templates: boolean;
  can_sell_assets: boolean;
  marketplace_commission: number; // percentage

  // Technical features
  api_access: boolean;
  webhook_support: boolean;
  custom_integrations: boolean;

  // Stripe configuration
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  stripe_product_id: string | null;

  // Display properties
  is_popular: boolean;
  is_featured: boolean;
  badge_text?: string; // "Most Popular", "Best Value", etc.
  color_scheme?: string;
  sort_order: number;

  // Enterprise features
  sso_enabled?: boolean;
  team_management?: boolean;
  advanced_permissions?: boolean;
  dedicated_support?: boolean;
  sla_guarantee?: boolean;
}

/**
 * Subscription with enriched plan details
 */
export interface SubscriptionWithDetails extends Subscription {
  plan_config: PlanConfig;

  // Computed fields
  credits_remaining: number;
  credits_usage_percentage: number;
  storage_used_percentage: number;
  games_used_count: number;
  games_remaining: number;

  // Billing information
  days_until_renewal: number;
  next_billing_amount: number;
  next_billing_date: string | null;

  // Status flags
  is_trial: boolean;
  is_active: boolean;
  is_past_due: boolean;
  is_canceled: boolean;
  can_upgrade: boolean;
  can_downgrade: boolean;

  // Usage warnings
  approaching_game_limit: boolean;
  approaching_storage_limit: boolean;
  low_credits_warning: boolean;
}

/**
 * AI usage tracking
 */
export interface AIUsage {
  id: string;
  user_id: string;
  subscription_id: string | null;
  operation_type: AIOperationType;
  credits_used: number;

  // Generation details
  prompt?: string;
  model_used: string;
  generation_time_ms: number;
  output_size_bytes?: number;
  quality_rating?: number; // 1-5 user rating

  // Context
  game_id?: string;
  asset_id?: string;
  session_id?: string;

  // Metadata
  metadata?: Record<string, any>;
  created_at: string;
}

/**
 * Usage statistics for dashboard
 */
export interface UsageStatistics {
  current_period: {
    start_date: string;
    end_date: string;

    // Credits usage
    total_credits_used: number;
    credits_by_operation: Record<AIOperationType, number>;
    average_credits_per_day: number;
    peak_usage_day: string;

    // Feature usage
    games_created: number;
    assets_uploaded: number;
    exports_generated: number;
    api_calls_made: number;

    // Performance metrics
    average_generation_time: number;
    success_rate: number;
    user_satisfaction_avg: number;
  };

  historical: {
    last_30_days: number;
    last_90_days: number;
    all_time: number;
    monthly_trend: Array<{
      month: string;
      credits_used: number;
      games_created: number;
    }>;
  };

  projections: {
    estimated_monthly_usage: number;
    estimated_overage_cost: number;
    days_until_limit: number;
    recommended_tier?: PlanTier;
  };
}

/**
 * Invoice information
 */
export interface Invoice {
  id: string;
  subscription_id: string;
  stripe_invoice_id: string;

  // Amount details
  amount_due: number;
  amount_paid: number;
  amount_remaining: number;
  currency: string;

  // Status and dates
  status: "draft" | "open" | "paid" | "uncollectible" | "void";
  invoice_date: string;
  due_date: string | null;
  paid_date: string | null;

  // Period information
  period_start: string;
  period_end: string;

  // Line items
  line_items: InvoiceLineItem[];

  // URLs and files
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;

  // Additional info
  description: string | null;
  note: string | null;
  tax_amount: number;
  discount_amount: number;

  created_at: string;
  updated_at: string;
}

/**
 * Invoice line item
 */
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_amount: number;
  amount: number;
  currency: string;
  type: "subscription" | "usage" | "discount" | "tax";
  metadata?: Record<string, any>;
}

/**
 * Payment method information
 */
export interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;

  // Type and details
  type: "card" | "bank_account" | "wallet";
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    country: string;
    funding: string;
  };
  bank_account?: {
    bank_name: string;
    last4: string;
    account_type: string;
    country: string;
  };

  // Status
  is_default: boolean;
  is_verified: boolean;

  // Metadata
  billing_details?: {
    name?: string;
    email?: string;
    address?: Record<string, string>;
  };

  created_at: string;
  updated_at: string;
}

/**
 * Subscription creation request
 */
export interface CreateSubscriptionRequest {
  plan_id: string;
  billing_cycle: BillingCycle;
  payment_method_id?: string;

  // Optional configuration
  coupon_code?: string;
  trial_days?: number;
  proration_behavior?: "create_prorations" | "none";

  // Team/enterprise options
  team_size?: number;
  custom_features?: string[];

  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Subscription update request
 */
export interface UpdateSubscriptionRequest {
  plan_id?: string;
  billing_cycle?: BillingCycle;
  payment_method_id?: string;

  // Proration settings
  proration_behavior?: "create_prorations" | "none" | "always_invoice";
  proration_date?: number; // Unix timestamp

  // Pause/resume
  pause_collection?: boolean;
  resume_at?: number; // Unix timestamp

  // Trial extension
  trial_end?: number; // Unix timestamp

  // Metadata
  metadata?: Record<string, any>;
}

/**
 * Plan comparison for upgrades/downgrades
 */
export interface PlanComparison {
  current_plan: PlanConfig;
  target_plan: PlanConfig;

  // Cost difference
  price_difference_monthly: number;
  price_difference_yearly: number;
  proration_amount: number;
  next_invoice_amount: number;

  // Feature changes
  feature_changes: {
    added: Array<{
      name: string;
      description: string;
      category: "limit" | "feature" | "support";
    }>;
    removed: Array<{
      name: string;
      description: string;
      category: "limit" | "feature" | "support";
    }>;
    modified: Array<{
      name: string;
      from: string | number;
      to: string | number;
      category: "limit" | "feature" | "support";
    }>;
  };

  // Effective dates
  effective_date: string;
  next_billing_date: string;

  // Warnings
  data_migration_required: boolean;
  feature_loss_warnings: string[];
  billing_warnings: string[];
}

/**
 * Credit purchase options for pay-per-use
 */
export interface CreditPackage {
  id: string;
  name: string;
  description: string;
  credits: number;
  price: number;
  currency: string;
  bonus_credits: number; // extra credits for bulk purchases
  expiry_days: number; // -1 for no expiry
  stripe_price_id: string;
  is_popular: boolean;
  discount_percentage?: number;
}

/**
 * Team/organization billing
 */
export interface TeamSubscription extends SubscriptionWithDetails {
  team_id: string;
  team_name: string;

  // Team-specific limits
  max_team_members: number;
  current_team_members: number;

  // Shared resources
  shared_storage_gb: number;
  shared_ai_credits: number;
  team_game_limit: number;

  // Per-member allocations
  individual_game_limit: number;
  individual_ai_credits: number;
  individual_storage_gb: number;

  // Team features
  team_analytics: boolean;
  centralized_billing: boolean;
  role_based_permissions: boolean;
  audit_logging: boolean;
}

/**
 * Billing error types
 */
export type BillingErrorType =
  | "insufficient_credits"
  | "subscription_expired"
  | "payment_failed"
  | "payment_method_invalid"
  | "card_declined"
  | "invoice_payment_failed"
  | "plan_not_found"
  | "upgrade_not_allowed"
  | "downgrade_not_allowed"
  | "rate_limited"
  | "stripe_error"
  | "database_error"
  | "validation_error"
  | "subscription_conflict";

/**
 * Billing error with context
 */
export interface BillingError extends Error {
  type: BillingErrorType;
  code: string;
  stripe_code?: string;
  details?: Record<string, any>;
  retryable: boolean;
  user_message: string;
  action_required?:
    | "update_payment_method"
    | "contact_support"
    | "upgrade_plan";
}

/**
 * Webhook event types for Stripe integration
 */
export type StripeWebhookEventType =
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "customer.subscription.trial_will_end"
  | "invoice.payment_succeeded"
  | "invoice.payment_failed"
  | "invoice.upcoming"
  | "payment_method.attached"
  | "payment_method.detached"
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "customer.created"
  | "customer.updated"
  | "customer.deleted";

/**
 * Billing dashboard data
 */
export interface BillingDashboardData {
  subscription: SubscriptionWithDetails | null;
  usage_stats: UsageStatistics;
  recent_invoices: Invoice[];
  payment_methods: PaymentMethod[];
  available_plans: PlanConfig[];
  credit_packages: CreditPackage[];
  upcoming_invoice?: {
    amount: number;
    date: string;
    line_items: InvoiceLineItem[];
  };
}

/**
 * API response types
 */
export interface BillingApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: BillingError;
  message?: string;
  timestamp: string;
}

export interface CreateSubscriptionResponse extends BillingApiResponse {
  data?: {
    subscription: SubscriptionWithDetails;
    client_secret?: string;
    requires_action?: boolean;
    payment_intent_status?: string;
  };
}

export interface UpdateSubscriptionResponse extends BillingApiResponse {
  data?: {
    subscription: SubscriptionWithDetails;
    proration_amount: number;
    effective_date: string;
    requires_payment?: boolean;
    client_secret?: string;
  };
}

export interface PurchaseCreditsResponse extends BillingApiResponse {
  data?: {
    payment_intent_id: string;
    client_secret: string;
    credits_purchased: number;
    new_credit_balance: number;
  };
}

/**
 * Utility functions and type guards
 */
export const isActiveSubscription = (
  subscription: Subscription | null,
): boolean => {
  return (
    subscription?.status === "active" || subscription?.status === "trialing"
  );
};

export const hasFeature = (
  subscription: SubscriptionWithDetails | null,
  feature: keyof PlanConfig,
): boolean => {
  if (!subscription?.plan_config) return false;

  return Boolean(subscription.plan_config[feature]);
};

export const canUpgradeTo = (
  currentTier: PlanTier,
  targetTier: PlanTier,
): boolean => {
  const tierOrder: PlanTier[] = ["free", "pro", "max", "enterprise"];
  const currentIndex = tierOrder.indexOf(currentTier);
  const targetIndex = tierOrder.indexOf(targetTier);

  return targetIndex > currentIndex;
};

export const calculateUsagePercentage = (
  used: number,
  limit: number,
): number => {
  if (limit === -1) return 0; // unlimited

  return Math.min(100, Math.round((used / limit) * 100));
};

export const getNextBillingDate = (
  subscription: Subscription,
  billingCycle: BillingCycle,
): Date | null => {
  if (!subscription.current_period_end) return null;
  const currentEnd = new Date(subscription.current_period_end);

  if (billingCycle === "monthly") {
    return new Date(
      currentEnd.getFullYear(),
      currentEnd.getMonth() + 1,
      currentEnd.getDate(),
    );
  } else {
    return new Date(
      currentEnd.getFullYear() + 1,
      currentEnd.getMonth(),
      currentEnd.getDate(),
    );
  }
};

export const formatCurrency = (amount: number, currency = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100); // Stripe amounts are in cents
};
