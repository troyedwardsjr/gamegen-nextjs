/**
 * Email verification system for GameGen platform
 * Simplified implementation using Supabase built-in email verification
 */

import { createAuthClient } from "./client";
import { createServerSupabaseClient } from "./auth-utils";

export interface EmailVerificationResult {
  success: boolean;
  error?: string;
  requiresVerification?: boolean;
}

export interface EmailVerificationStatus {
  isVerified: boolean;
  email: string;
  verificationSent?: Date;
  canResend: boolean;
  nextResendTime?: Date;
}

// In-memory cooldown tracking (in production, use Redis)
const verificationCooldowns = new Map<string, Date>();

export class EmailVerificationManager {
  private supabase =
    typeof window !== "undefined"
      ? createAuthClient()
      : createServerSupabaseClient();
  private readonly RESEND_COOLDOWN = 60000; // 1 minute cooldown between resends

  /**
   * Send email verification to the current user
   */
  async sendVerificationEmail(
    email?: string,
  ): Promise<EmailVerificationResult> {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: "User must be authenticated to send verification email",
        };
      }

      const targetEmail = email || user.email;

      if (!targetEmail) {
        return { success: false, error: "No email address found" };
      }

      // Check rate limiting
      const canSend = await this.canSendVerificationEmail(user.id);

      if (!canSend.allowed) {
        return {
          success: false,
          error: `Please wait ${Math.ceil(canSend.waitTime! / 1000)} seconds before requesting another verification email`,
          requiresVerification: true,
        };
      }

      // Use Supabase's built-in email verification
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail,
      });

      if (error) {
        console.error("Error sending verification email:", error);

        return {
          success: false,
          error: error.message || "Failed to send verification email",
        };
      }

      // Record attempt in memory
      verificationCooldowns.set(user.id, new Date());

      console.log(`[EMAIL] Verification email sent to ${targetEmail}`);

      return {
        success: true,
        requiresVerification: true,
      };
    } catch (error) {
      console.error("Unexpected error sending verification email:", error);

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unexpected error occurred",
      };
    }
  }

  /**
   * Resend verification email with rate limiting
   */
  async resendVerificationEmail(): Promise<EmailVerificationResult> {
    return this.sendVerificationEmail();
  }

  /**
   * Check if the current user's email is verified
   */
  async checkVerificationStatus(
    userId?: string,
  ): Promise<EmailVerificationStatus> {
    try {
      const supabase = await createServerSupabaseClient();

      let user;

      if (userId) {
        const { data, error } = await supabase.auth.admin.getUserById(userId);

        if (error) throw error;
        user = data.user;
      } else {
        const { data, error } = await supabase.auth.getUser();

        if (error) throw error;
        user = data.user;
      }

      if (!user || !user.email) {
        return {
          isVerified: false,
          email: "",
          canResend: false,
        };
      }

      // Supabase auth users have email_confirmed_at field
      const isVerified = !!user.email_confirmed_at;

      const lastSent = verificationCooldowns.get(user.id);
      const canResend =
        !lastSent || Date.now() - lastSent.getTime() > this.RESEND_COOLDOWN;

      const nextResendTime =
        lastSent && !canResend
          ? new Date(lastSent.getTime() + this.RESEND_COOLDOWN)
          : undefined;

      return {
        isVerified,
        email: user.email,
        verificationSent: lastSent,
        canResend,
        nextResendTime,
      };
    } catch (error) {
      console.error("Error checking verification status:", error);

      return {
        isVerified: false,
        email: "",
        canResend: true,
      };
    }
  }

  /**
   * Verify email with token (handled automatically by Supabase)
   */
  async verifyEmail(
    token: string,
    email: string,
  ): Promise<EmailVerificationResult> {
    try {
      const supabase = await createServerSupabaseClient();

      // Supabase handles verification automatically via URL callback
      // This method is mainly for compatibility
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "email",
      });

      if (error) {
        console.error("Error verifying email:", error);

        return {
          success: false,
          error: error.message || "Invalid or expired verification token",
        };
      }

      console.log(`[EMAIL] Email verified successfully for ${email}`);

      return { success: true };
    } catch (error) {
      console.error("Unexpected error verifying email:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }

  /**
   * Request email change with verification
   */
  async requestEmailChange(newEmail: string): Promise<EmailVerificationResult> {
    try {
      const supabase = await createServerSupabaseClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: "User must be authenticated to change email",
        };
      }

      // Use Supabase's built-in email change
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) {
        console.error("Error requesting email change:", error);

        return {
          success: false,
          error: error.message || "Failed to request email change",
        };
      }

      console.log(
        `[EMAIL] Email change requested for ${user.email} -> ${newEmail}`,
      );

      return {
        success: true,
        requiresVerification: true,
      };
    } catch (error) {
      console.error("Unexpected error requesting email change:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : "Email change failed",
      };
    }
  }

  /**
   * Cancel pending email change
   */
  async cancelEmailChange(): Promise<EmailVerificationResult> {
    // Supabase doesn't provide a direct cancel method
    // The user would need to verify their old email or let the change expire
    console.log(
      "[EMAIL] Email change cancellation requested (handled by Supabase expiry)",
    );

    return { success: true };
  }

  /**
   * Clean up expired verification attempts (simplified)
   */
  async cleanupExpiredAttempts(): Promise<void> {
    try {
      const now = new Date();
      const expiryCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours

      // Clean up in-memory cooldowns
      for (const [userId, timestamp] of verificationCooldowns.entries()) {
        if (timestamp < expiryCutoff) {
          verificationCooldowns.delete(userId);
        }
      }

      console.log("[EMAIL] Cleaned up expired verification attempts");
    } catch (error) {
      console.error("Error cleaning up expired attempts:", error);
    }
  }

  private async canSendVerificationEmail(
    userId: string,
  ): Promise<{ allowed: boolean; waitTime?: number }> {
    const lastSent = verificationCooldowns.get(userId);

    if (!lastSent) {
      return { allowed: true };
    }

    const timeSinceLastSent = Date.now() - lastSent.getTime();

    if (timeSinceLastSent >= this.RESEND_COOLDOWN) {
      return { allowed: true };
    }

    return {
      allowed: false,
      waitTime: this.RESEND_COOLDOWN - timeSinceLastSent,
    };
  }

  /**
   * Get verification statistics (simplified)
   */
  async getVerificationStats(): Promise<{
    totalAttempts: number;
    successfulVerifications: number;
    pendingVerifications: number;
  }> {
    // This would be implemented with proper logging/analytics in production
    return {
      totalAttempts: verificationCooldowns.size,
      successfulVerifications: 0,
      pendingVerifications: verificationCooldowns.size,
    };
  }
}
