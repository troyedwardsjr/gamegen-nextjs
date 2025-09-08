"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

import PricingCard, { PricingTier } from "@/components/PricingCard";
import PricingToggle from "@/components/PricingToggle";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: {
      monthly: 0,
      yearly: 0,
    },
    credits: "1,000",
    features: [
      "AI game generation",
      "Platform publishing only",
      "Community support",
      "Basic templates",
      "GameGen splash screen",
    ],
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    price: {
      monthly: 20,
      yearly: 192, // 20% discount: $20 * 12 * 0.8
    },
    credits: "10,000",
    features: [
      "Advanced AI assistance",
      "Web & Desktop export",
      "Priority support",
      "No splash screen",
      "Advanced templates",
      "Team collaboration (5 members)",
      "Version control",
    ],
    popular: true,
    cta: "Start Pro Trial",
  },
  {
    name: "Max",
    price: {
      monthly: 100,
      yearly: 960, // 20% discount: $100 * 12 * 0.8
    },
    credits: "100,000",
    features: [
      "All Pro features",
      "White-label solutions",
      "API access",
      "Unlimited collaborators",
      "Dedicated support",
      "Custom integrations",
      "Advanced analytics",
    ],
    cta: "Contact Sales",
  },
];

export default function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Header */}
          <motion.div
            className="mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                Choose Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                Game Creation Plan
              </span>
            </h2>
            <p className="text-lg sm:text-xl text-white/70 leading-relaxed max-w-3xl mx-auto">
              Start creating amazing pixel art games today. Choose the plan that
              fits your creative needs.
            </p>
          </motion.div>

          {/* Pricing Toggle */}
          <motion.div
            className="flex justify-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <PricingToggle isYearly={isYearly} onToggle={setIsYearly} />
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-12">
            {pricingTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <PricingCard
                  className="h-full"
                  index={index}
                  isYearly={isYearly}
                  tier={tier}
                />
              </motion.div>
            ))}
          </div>

          {/* Additional Info */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <p className="text-white/70 mb-6">
              All plans include access to our AI-powered game creation platform
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
              <div className="flex items-center space-x-2 text-white/70">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    fillRule="evenodd"
                  />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2 text-white/70">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    clipRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    fillRule="evenodd"
                  />
                </svg>
                <span>Cancel anytime</span>
              </div>
            </div>

            {/* View All Plans Link */}
            <Link href="/pricing">
              <GlassmorphicButton
                blur="md"
                className="px-8 py-3"
                intensity="medium"
                size="lg"
                variant="glass-bordered"
              >
                View All Plans & Features
              </GlassmorphicButton>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
