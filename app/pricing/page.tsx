"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import PricingCard, { PricingTier } from "@/components/PricingCard";
import PricingToggle from "@/components/PricingToggle";
import PricingComparison from "@/components/PricingComparison";
import PricingFAQ from "@/components/PricingFAQ";
import SubscriptionStatus from "@/components/SubscriptionStatus";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: {
      monthly: 0,
      yearly: 0
    },
    credits: "1,000",
    features: [
      "AI game generation",
      "Platform publishing only",
      "Community support",
      "Basic templates",
      "GameGen splash screen"
    ],
    cta: "Get Started Free"
  },
  {
    name: "Pro",
    price: {
      monthly: 20,
      yearly: 192 // 20% discount: $20 * 12 * 0.8
    },
    credits: "10,000",
    features: [
      "Advanced AI assistance",
      "Web & Desktop export",
      "Priority support",
      "No splash screen",
      "Advanced templates",
      "Team collaboration (5 members)",
      "Version control"
    ],
    popular: true,
    cta: "Start Pro Trial"
  },
  {
    name: "Max",
    price: {
      monthly: 100,
      yearly: 960 // 20% discount: $100 * 12 * 0.8
    },
    credits: "100,000",
    features: [
      "All Pro features",
      "White-label solutions",
      "API access",
      "Unlimited collaborators",
      "Dedicated support",
      "Custom integrations",
      "Advanced analytics"
    ],
    cta: "Contact Sales"
  }
];

// Mock subscription data for testing SubscriptionStatus
const mockCurrentPlan = {
  name: "Pro",
  price: 20,
  credits: 10000,
  features: ["Advanced AI assistance", "Web & Desktop export", "Priority support"],
  popular: true
};

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="relative max-w-none mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center">
            {/* Header */}
            <div className="mb-8 sm:mb-12 animate-slide-in-from-top">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                  GameGen
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                  Pricing Plans
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-glass-text-muted leading-relaxed max-w-3xl mx-auto">
                Create pixel art games with AI-powered tools. Choose the plan that fits your needs and start building amazing games today.
              </p>
            </div>

            {/* Pricing Toggle */}
            <div className="flex justify-center mb-12 sm:mb-16">
              <PricingToggle
                isYearly={isYearly}
                onToggle={setIsYearly}
              />
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 xl:gap-12 2xl:gap-16 max-w-7xl mx-auto">
              {pricingTiers.map((tier, index) => (
                <PricingCard
                  key={tier.name}
                  tier={tier}
                  isYearly={isYearly}
                  index={index}
                  className="h-full"
                />
              ))}
            </div>

            {/* Additional Info */}
            <div className="mt-12 sm:mt-16 text-center animate-fade-in" style={{ animationDelay: "300ms" }}>
              <p className="text-glass-text-muted mb-6">
                All plans include access to our AI-powered game creation platform
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="flex items-center space-x-2 text-glass-text-muted">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2 text-glass-text-muted">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Status Demo */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Subscription Status Widget
          </h2>
          <div className="max-w-md mx-auto">
            <SubscriptionStatus
              currentPlan={mockCurrentPlan}
              billingCycle="monthly"
              nextBillingDate="2025-10-06"
              creditsUsed={3500}
              creditsRemaining={6500}
              onUpgrade={() => alert('Upgrade clicked!')}
              onManageBilling={() => alert('Manage billing clicked!')}
              onViewPlans={() => alert('View plans clicked!')}
            />
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <PricingComparison />

      {/* FAQ Section */}
      <PricingFAQ />

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 text-center">
          <div className="space-y-8 animate-fade-in">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
                Ready to Create Amazing Games?
              </h2>
              <p className="text-glass-text-muted text-lg sm:text-xl leading-relaxed">
                Join thousands of creators who are already building pixel art games with GameGen AI
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <GlassmorphicButton
                variant="glass-filled"
                intensity="strong"
                blur="md"
                className="bg-gradient-to-r from-primary to-purple-500 text-white border-0 px-8 py-3"
                size="lg"
              >
                Start Creating Free
              </GlassmorphicButton>
              <GlassmorphicButton
                variant="glass-bordered"
                intensity="medium"
                blur="md"
                className="px-8 py-3"
                size="lg"
              >
                View Demo Games
              </GlassmorphicButton>
            </div>

            <p className="text-glass-text-muted text-sm">
              No credit card required for free plan • Upgrade anytime
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
