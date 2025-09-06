"use client";

import React from "react";
// Progress component not available, using custom implementation
import { Badge } from "@heroui/badge";
import { Button } from "@heroui/button";
import {
  CreditCardIcon,
  StarIcon,
  ArrowUpIcon,
  CalendarDaysIcon,
  BoltIcon,
  CheckIcon,
  ExclamationTriangleIcon,
} from "@/components/icons";
import { StarIcon as StarIconSolid } from "@/components/icons";
import { motion } from "framer-motion";

import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";

interface SubscriptionPlan {
  name: string;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
}

interface SubscriptionStatusProps {
  currentPlan: SubscriptionPlan;
  billingCycle: "monthly" | "yearly";
  nextBillingDate: string;
  creditsUsed: number;
  creditsRemaining: number;
  className?: string;
  onUpgrade?: () => void;
  onManageBilling?: () => void;
  onViewPlans?: () => void;
}

const plans: SubscriptionPlan[] = [
  {
    name: "Free",
    price: 0,
    credits: 1000,
    features: ["Basic game generation", "Platform publishing", "Community support"],
  },
  {
    name: "Pro",
    price: 20,
    credits: 10000,
    features: ["Advanced AI assistance", "Export to all platforms", "Priority support", "No splash screen"],
    popular: true,
  },
  {
    name: "Max",
    price: 100,
    credits: 100000,
    features: ["All Pro features", "White-label solutions", "API access", "Dedicated support"],
  },
];

export function SubscriptionStatus({
  currentPlan,
  billingCycle,
  nextBillingDate,
  creditsUsed,
  creditsRemaining,
  className,
  onUpgrade,
  onManageBilling,
  onViewPlans,
}: SubscriptionStatusProps) {
  const totalCredits = creditsUsed + creditsRemaining;
  const usagePercentage = (creditsUsed / totalCredits) * 100;
  const isHighUsage = usagePercentage > 80;
  const isLowCredits = creditsRemaining < totalCredits * 0.2;

  const nextBillingFormatted = new Date(nextBillingDate).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  const daysUntilBilling = Math.ceil(
    (new Date(nextBillingDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const currentPlanIndex = plans.findIndex(plan => plan.name === currentPlan.name);
  const nextPlan = plans[currentPlanIndex + 1];
  const isMaxPlan = currentPlanIndex === plans.length - 1;

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={className}
    >
      <GlassmorphicCard
        variant="default"
        blur="lg"
        className="p-6 h-full"
        hover={false}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-success/20 backdrop-blur-sm">
              <CreditCardIcon className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Subscription</h3>
              <p className="text-sm text-foreground/70">Plan status and usage</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center space-x-2">
              {currentPlan.popular && <StarIconSolid className="w-4 h-4 text-warning" />}
              <span className="font-semibold text-foreground">{currentPlan.name}</span>
            </div>
            <p className="text-sm text-foreground/60">
              ${currentPlan.price}/{billingCycle === "yearly" ? "year" : "month"}
            </p>
          </div>
        </motion.div>

        {/* Current Plan Status */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="p-4 rounded-xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <BoltIcon className="w-5 h-5 text-success" />
                <span className="font-medium text-foreground">Current Plan Active</span>
              </div>
              <Badge 
                color="success" 
                variant="flat" 
                size="sm"
                className="backdrop-blur-sm bg-success/20"
              >
                Active
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-foreground/60">Next billing</p>
                <p className="font-medium text-foreground">{nextBillingFormatted}</p>
                <p className="text-xs text-foreground/40">{daysUntilBilling} days</p>
              </div>
              <div>
                <p className="text-foreground/60">Billing cycle</p>
                <p className="font-medium text-foreground capitalize">{billingCycle}</p>
                {billingCycle === "yearly" && (
                  <p className="text-xs text-success">20% savings</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Credits Usage */}
        <motion.div variants={itemVariants} className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-foreground">Game Credits Usage</span>
            <span className="text-sm text-foreground/60">
              {creditsUsed.toLocaleString()} / {totalCredits.toLocaleString()} used
            </span>
          </div>
          
          {/* Custom Progress Bar */}
          <div className="h-3 bg-default-300/30 backdrop-blur-sm rounded-full overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r shadow-lg shadow-primary/20 ${
                isLowCredits 
                  ? "bg-gradient-to-r from-red-500 to-red-600" 
                  : isHighUsage 
                  ? "bg-gradient-to-r from-yellow-500 to-orange-500" 
                  : "bg-gradient-to-r from-primary to-purple-500"
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, usagePercentage)}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-foreground/60">
              {creditsRemaining.toLocaleString()} remaining
            </span>
            <span className="text-xs text-foreground/60">
              {usagePercentage.toFixed(0)}% used
            </span>
          </div>

          {isLowCredits && (
            <div className="mt-3 p-3 rounded-lg bg-warning/10 backdrop-blur-sm border border-warning/20 flex items-start space-x-2">
              <ExclamationTriangleIcon className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-warning font-medium">Low on credits</p>
                <p className="text-xs text-warning/80">Consider upgrading before running out</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Plan Features */}
        <motion.div variants={itemVariants} className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-3">Plan Features</h4>
          <div className="space-y-2">
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckIcon className="w-4 h-4 text-success flex-shrink-0" />
                <span className="text-sm text-foreground/70">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upgrade Suggestion */}
        {!isMaxPlan && nextPlan && (
          <motion.div variants={itemVariants} className="mb-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 backdrop-blur-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <ArrowUpIcon className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">Upgrade to {nextPlan.name}</span>
                  </div>
                  <p className="text-sm text-foreground/60 mb-2">
                    Get {nextPlan.credits.toLocaleString()} credits and unlock premium features
                  </p>
                  <p className="text-xs text-primary">
                    Save up to 20% with yearly billing
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    ${nextPlan.price}/{billingCycle === "yearly" ? "yr" : "mo"}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex space-x-3">
            {!isMaxPlan && (
              <GlassmorphicButton
                variant="glass-filled"
                intensity="medium"
                className="flex-1"
                onClick={onUpgrade}
                startContent={<ArrowUpIcon className="w-4 h-4" />}
              >
                Upgrade Plan
              </GlassmorphicButton>
            )}
            
            <GlassmorphicButton
              variant="glass-bordered"
              intensity="subtle"
              className={isMaxPlan ? "flex-1" : "flex-none"}
              onClick={onManageBilling}
              startContent={<CreditCardIcon className="w-4 h-4" />}
            >
              Manage Billing
            </GlassmorphicButton>
          </div>

          {onViewPlans && (
            <GlassmorphicButton
              variant="glass-ghost"
              intensity="subtle"
              className="w-full"
              onClick={onViewPlans}
            >
              Compare All Plans
            </GlassmorphicButton>
          )}
        </motion.div>
      </GlassmorphicCard>
    </motion.div>
  );
}

export default SubscriptionStatus;