/**
 * LLM Billing and Usage Tracker
 *
 * Comprehensive billing system for LLM usage with credit management,
 * usage tracking, cost calculation, and subscription integration.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  BillingRecord,
  CreditBalance,
  TokenUsage,
  GenerationResponse,
  InsufficientCreditsError,
} from "../types";

import { createClient } from "@/lib/supabase/server";

export interface BillingConfig {
  enabled: boolean;
  credit_system_enabled: boolean;
  auto_deduct_credits: boolean;
  minimum_balance: number;
  low_balance_threshold: number;
  billing_cycle: "monthly" | "weekly" | "daily";
  cost_per_token: Record<string, { input: number; output: number }>;
  user_tier_discounts: Record<string, number>;
  free_tier_limits: {
    monthly_tokens: number;
    monthly_requests: number;
  };
}

export interface SubscriptionTier {
  id: string;
  name: string;
  monthly_token_limit: number;
  cost_multiplier: number;
  features: string[];
  price_per_month: number;
}

export interface UsageSummary {
  user_id: string;
  period_start: Date;
  period_end: Date;
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  credits_used: number;
  remaining_credits: number;
  provider_usage: Record<
    string,
    {
      requests: number;
      tokens: number;
      cost: number;
    }
  >;
  tier_limits?: {
    token_limit: number;
    tokens_used: number;
    requests_limit: number;
    requests_used: number;
  };
}

export class BillingTracker {
  private config: BillingConfig;
  private supabase: Promise<SupabaseClient>;
  private creditReservations = new Map<string, number>(); // user_id -> reserved_credits

  constructor(config: BillingConfig) {
    this.config = config;
    this.supabase = createClient();

    console.info("[BillingTracker] Billing tracker initialized", {
      enabled: config.enabled,
    });
  }

  /**
   * Check if user has sufficient credits for a request
   */
  async checkCredits(
    userId: string,
    estimatedTokens: number,
    providerId: string,
  ): Promise<boolean> {
    if (!this.config.enabled || !this.config.credit_system_enabled) {
      return true;
    }

    const estimatedCost = this.calculateCost(
      {
        prompt_tokens: estimatedTokens,
        completion_tokens: estimatedTokens,
        total_tokens: estimatedTokens * 2,
      },
      providerId,
      userId,
    );

    const balance = await this.getCreditBalance(userId);
    const availableCredits =
      balance.available - (this.creditReservations.get(userId) || 0);

    return availableCredits >= estimatedCost;
  }

  /**
   * Reserve credits for a pending request
   */
  async reserveCredits(
    userId: string,
    estimatedTokens: number,
    providerId: string,
  ): Promise<string> {
    if (!this.config.enabled || !this.config.credit_system_enabled) {
      return "no-reservation-needed";
    }

    const estimatedCost = this.calculateCost(
      {
        prompt_tokens: estimatedTokens,
        completion_tokens: estimatedTokens,
        total_tokens: estimatedTokens * 2,
      },
      providerId,
      userId,
    );

    const balance = await this.getCreditBalance(userId);
    const currentReservation = this.creditReservations.get(userId) || 0;
    const availableCredits = balance.available - currentReservation;

    if (availableCredits < estimatedCost) {
      throw new InsufficientCreditsError(
        userId,
        estimatedCost,
        availableCredits,
      );
    }

    // Reserve credits
    this.creditReservations.set(userId, currentReservation + estimatedCost);

    // Update database reservation
    await this.updateCreditReservation(userId, estimatedCost);

    const reservationId = this.generateReservationId();

    console.info("[BillingTracker] Credits reserved", {
      userId,
      reservationId,
      amount: estimatedCost,
      totalReserved: currentReservation + estimatedCost,
    });

    return reservationId;
  }

  /**
   * Record actual usage and finalize billing
   */
  async recordUsage(
    userId: string,
    response: GenerationResponse,
    requestType: string = "generation",
    reservationId?: string,
  ): Promise<BillingRecord> {
    const actualCost = this.calculateCost(
      response.usage,
      response.provider_id,
      userId,
    );

    // Create billing record
    const billingRecord: BillingRecord = {
      id: this.generateBillingId(),
      user_id: userId,
      provider_id: response.provider_id,
      request_id: response.id,
      tokens_used: response.usage.total_tokens,
      cost: actualCost,
      request_type: requestType,
      created_at: new Date(),
      metadata: {
        model: response.model,
        finish_reason: response.finish_reason,
        response_time: response.response_time,
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        reservation_id: reservationId,
      },
    };

    // Store billing record
    await this.storeBillingRecord(billingRecord);

    // Deduct credits if enabled
    if (
      this.config.enabled &&
      this.config.credit_system_enabled &&
      this.config.auto_deduct_credits
    ) {
      await this.deductCredits(userId, actualCost, reservationId);
    }

    // Check for low balance warning
    await this.checkLowBalanceWarning(userId);

    console.info("[BillingTracker] Usage recorded", {
      userId,
      requestId: response.id,
      tokensUsed: response.usage.total_tokens,
      cost: actualCost,
    });

    return billingRecord;
  }

  /**
   * Release reserved credits (for failed requests)
   */
  async releaseReservation(
    userId: string,
    reservationId: string,
  ): Promise<void> {
    if (!this.config.enabled || !this.config.credit_system_enabled) {
      return;
    }

    // Find and release reservation
    // In a real implementation, you'd track reservations by ID
    const currentReservation = this.creditReservations.get(userId) || 0;

    if (currentReservation > 0) {
      this.creditReservations.set(userId, Math.max(0, currentReservation - 0)); // Placeholder logic

      // Update database
      await this.updateCreditReservation(userId, -0); // Placeholder

      console.info("[BillingTracker] Reservation released", {
        userId,
        reservationId,
      });
    }
  }

  /**
   * Get user's current credit balance
   */
  async getCreditBalance(userId: string): Promise<CreditBalance> {
    const { data, error } = await (await this.supabase)
      .from("user_credit_balances")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // No record found, create default balance
      return this.createDefaultBalance(userId);
    }

    if (error) {
      throw new Error(`Failed to get credit balance: ${error.message}`);
    }

    return {
      user_id: data.user_id,
      balance: data.balance,
      reserved: data.reserved,
      available: data.balance - data.reserved,
      last_updated: new Date(data.last_updated),
    };
  }

  /**
   * Add credits to user's balance
   */
  async addCredits(
    userId: string,
    amount: number,
    source: string = "manual",
  ): Promise<CreditBalance> {
    const currentBalance = await this.getCreditBalance(userId);
    const newBalance = currentBalance.balance + amount;

    const { data, error } = await (await this.supabase)
      .from("user_credit_balances")
      .upsert({
        user_id: userId,
        balance: newBalance,
        reserved: currentBalance.reserved,
        last_updated: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add credits: ${error.message}`);
    }

    // Log credit transaction
    await this.logCreditTransaction(userId, amount, "credit", source);

    console.info("[BillingTracker] Credits added", {
      userId,
      amount,
      newBalance,
    });

    return {
      user_id: data.user_id,
      balance: data.balance,
      reserved: data.reserved,
      available: data.balance - data.reserved,
      last_updated: new Date(data.last_updated),
    };
  }

  /**
   * Get usage report for a user
   */
  async getUsageReport(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<UsageSummary> {
    // Get billing records for the period
    const { data: billingRecords, error } = await (await this.supabase)
      .from("llm_billing_records")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to get usage report: ${error.message}`);
    }

    const records = billingRecords || [];

    // Calculate totals
    const totalRequests = records.length;
    const totalTokens = records.reduce((sum, r) => sum + r.tokens_used, 0);
    const totalCost = records.reduce((sum, r) => sum + r.cost, 0);

    // Group by provider
    const providerUsage: Record<
      string,
      { requests: number; tokens: number; cost: number }
    > = {};

    for (const record of records) {
      if (!providerUsage[record.provider_id]) {
        providerUsage[record.provider_id] = { requests: 0, tokens: 0, cost: 0 };
      }

      providerUsage[record.provider_id].requests++;
      providerUsage[record.provider_id].tokens += record.tokens_used;
      providerUsage[record.provider_id].cost += record.cost;
    }

    // Get current balance
    const balance = await this.getCreditBalance(userId);

    // Get user tier limits if applicable
    const tierLimits = await this.getUserTierLimits(userId);

    return {
      user_id: userId,
      period_start: startDate,
      period_end: endDate,
      total_requests: totalRequests,
      total_tokens: totalTokens,
      total_cost: totalCost,
      credits_used: totalCost, // Assuming 1:1 credit to cost ratio
      remaining_credits: balance.available,
      provider_usage: providerUsage,
      tier_limits: tierLimits,
    };
  }

  /**
   * Get billing history for a user
   */
  async getBillingHistory(
    userId: string,
    limit: number = 100,
    offset: number = 0,
  ): Promise<{ records: BillingRecord[]; total_count: number }> {
    const { data, error, count } = await (await this.supabase)
      .from("llm_billing_records")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get billing history: ${error.message}`);
    }

    return {
      records: data || [],
      total_count: count || 0,
    };
  }

  /**
   * Calculate cost for token usage
   */
  private calculateCost(
    usage: TokenUsage,
    providerId: string,
    userId?: string,
  ): number {
    if (!this.config.enabled) {
      return 0;
    }

    const providerRates = this.config.cost_per_token[providerId] || {
      input: 0.000003,
      output: 0.000015,
    };

    const inputCost = (usage.prompt_tokens / 1_000_000) * providerRates.input;
    const outputCost =
      (usage.completion_tokens / 1_000_000) * providerRates.output;

    let totalCost = inputCost + outputCost;

    // Apply user tier discount if available
    if (userId) {
      const userTier = this.getUserTier(userId); // Placeholder
      const discount = this.config.user_tier_discounts[userTier] || 0;

      totalCost = totalCost * (1 - discount);
    }

    return Math.round(totalCost * 1000000) / 1000000; // Round to 6 decimal places
  }

  /**
   * Deduct credits from user balance
   */
  private async deductCredits(
    userId: string,
    amount: number,
    reservationId?: string,
  ): Promise<void> {
    const currentBalance = await this.getCreditBalance(userId);

    if (currentBalance.available < amount) {
      throw new InsufficientCreditsError(
        userId,
        amount,
        currentBalance.available,
      );
    }

    const newBalance = currentBalance.balance - amount;
    const newReserved = Math.max(0, currentBalance.reserved - amount);

    const { error } = await (await this.supabase)
      .from("user_credit_balances")
      .update({
        balance: newBalance,
        reserved: newReserved,
        last_updated: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      throw new Error(`Failed to deduct credits: ${error.message}`);
    }

    // Update local reservation tracking
    const currentReservation = this.creditReservations.get(userId) || 0;

    this.creditReservations.set(
      userId,
      Math.max(0, currentReservation - amount),
    );

    // Log credit transaction
    await this.logCreditTransaction(
      userId,
      -amount,
      "debit",
      reservationId || "usage",
    );
  }

  /**
   * Update credit reservation in database
   */
  private async updateCreditReservation(
    userId: string,
    amount: number,
  ): Promise<void> {
    const currentBalance = await this.getCreditBalance(userId);
    const newReserved = Math.max(0, currentBalance.reserved + amount);

    const { error } = await (await this.supabase)
      .from("user_credit_balances")
      .update({
        reserved: newReserved,
        last_updated: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("[BillingTracker] Failed to update reservation:", error);
    }
  }

  /**
   * Store billing record in database
   */
  private async storeBillingRecord(record: BillingRecord): Promise<void> {
    const { error } = await (await this.supabase)
      .from("llm_billing_records")
      .insert(record);

    if (error) {
      throw new Error(`Failed to store billing record: ${error.message}`);
    }
  }

  /**
   * Log credit transaction
   */
  private async logCreditTransaction(
    userId: string,
    amount: number,
    type: "credit" | "debit",
    source: string,
  ): Promise<void> {
    const { error } = await (await this.supabase).from("credit_transactions").insert({
      id: this.generateTransactionId(),
      user_id: userId,
      amount,
      type,
      source,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error(
        "[BillingTracker] Failed to log credit transaction:",
        error,
      );
    }
  }

  /**
   * Create default credit balance for new user
   */
  private async createDefaultBalance(userId: string): Promise<CreditBalance> {
    const defaultBalance = {
      user_id: userId,
      balance: 10.0, // $10 free credits for new users
      reserved: 0,
      last_updated: new Date().toISOString(),
    };

    const { error } = await (await this.supabase)
      .from("user_credit_balances")
      .insert(defaultBalance);

    if (error) {
      console.error(
        "[BillingTracker] Failed to create default balance:",
        error,
      );
    }

    return {
      user_id: userId,
      balance: defaultBalance.balance,
      reserved: defaultBalance.reserved,
      available: defaultBalance.balance,
      last_updated: new Date(defaultBalance.last_updated),
    };
  }

  /**
   * Check for low balance and send warnings
   */
  private async checkLowBalanceWarning(userId: string): Promise<void> {
    const balance = await this.getCreditBalance(userId);

    if (balance.available <= this.config.low_balance_threshold) {
      // Send low balance notification
      console.warn("[BillingTracker] Low balance warning", {
        userId,
        balance: balance.available,
        threshold: this.config.low_balance_threshold,
      });

      // In a real implementation, this would:
      // - Send email notification
      // - Update UI notifications
      // - Log to user activity feed
    }
  }

  /**
   * Get user tier limits (placeholder)
   */
  private async getUserTierLimits(userId: string): Promise<
    | {
        token_limit: number;
        tokens_used: number;
        requests_limit: number;
        requests_used: number;
      }
    | undefined
  > {
    // Placeholder - would integrate with subscription system
    return undefined;
  }

  /**
   * Get user tier (placeholder)
   */
  private getUserTier(userId: string): string {
    // Placeholder - would query user's subscription tier
    return "free";
  }

  /**
   * Generate unique billing ID
   */
  private generateBillingId(): string {
    return `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique reservation ID
   */
  private generateReservationId(): string {
    return `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique transaction ID
   */
  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
