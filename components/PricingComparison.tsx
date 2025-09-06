"use client";

import React from "react";
import { motion } from "framer-motion";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { CheckIcon, XMarkIcon } from "@/components/icons";

interface Feature {
  name: string;
  description?: string;
  free: boolean | string;
  pro: boolean | string;
  max: boolean | string;
}

const features: Feature[] = [
  {
    name: "Game Creation Credits per Month",
    free: "1,000",
    pro: "10,000",
    max: "100,000"
  },
  {
    name: "AI Game Generation",
    description: "Let AI create games based on your ideas and prompts",
    free: true,
    pro: true,
    max: true
  },
  {
    name: "Vibe Coding Chat Interface",
    description: "Natural language game development with AI assistance",
    free: true,
    pro: true,
    max: true
  },
  {
    name: "Game Export Options",
    free: "Platform only",
    pro: "Web, Desktop",
    max: "All platforms + White-label"
  },
  {
    name: "Toxoid Game Engine Access",
    description: "Full access to our Rust-powered WASM game engine",
    free: true,
    pro: true,
    max: true
  },
  {
    name: "Asset Library Access",
    description: "Pre-built sprites, sounds, and game components",
    free: "Basic library",
    pro: "Pro + Community",
    max: "All assets + Custom"
  },
  {
    name: "Map Editor",
    description: "Visual level and world design tools",
    free: true,
    pro: true,
    max: true
  },
  {
    name: "Code Editor with AI",
    description: "JavaScript editor with intelligent code completion",
    free: "Basic assistance",
    pro: "Advanced AI help",
    max: "Full AI pair programming"
  },
  {
    name: "Game Templates",
    description: "Pre-built game templates for quick starts",
    free: "5 templates",
    pro: "25 templates",
    max: "Unlimited + Custom"
  },
  {
    name: "Collaborative Development",
    description: "Team features and shared project access",
    free: false,
    pro: "Up to 5 collaborators",
    max: "Unlimited collaborators"
  },
  {
    name: "Version Control",
    description: "Project history and branch management",
    free: "Basic versioning",
    pro: "Advanced versioning",
    max: "Full Git integration"
  },
  {
    name: "Analytics & Metrics",
    description: "Player engagement and game performance data",
    free: false,
    pro: "Basic analytics",
    max: "Advanced analytics"
  },
  {
    name: "API Access",
    description: "Programmatic access to GameGen features",
    free: false,
    pro: false,
    max: true
  },
  {
    name: "Custom Branding",
    description: "Remove GameGen branding from exported games",
    free: false,
    pro: true,
    max: true
  },
  {
    name: "Support Level",
    free: "Community",
    pro: "Priority Email",
    max: "Dedicated Support"
  }
];

export function PricingComparison() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const renderFeatureValue = (value: boolean | string, tier: string) => {
    if (typeof value === "boolean") {
      return value ? (
        <CheckIcon className="w-5 h-5 text-green-400 mx-auto" />
      ) : (
        <XMarkIcon className="w-5 h-5 text-gray-500 mx-auto" />
      );
    }
    
    return (
      <span className={`text-sm font-medium ${
        tier === "max" ? "text-purple-300" : 
        tier === "pro" ? "text-blue-300" : 
        "text-glass-text-muted"
      }`}>
        {value}
      </span>
    );
  };

  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6">
            Compare Features
          </h2>
          <p className="text-glass-text-muted text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto">
            Choose the plan that fits your game development needs. All plans include access to our 
            core AI-powered game creation platform with different limits and capabilities.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <GlassmorphicCard
            variant="default"
            blur="lg"
            shadow="lg"
            border="subtle"
            hover={false}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Table Header */}
                <thead>
                  <tr className="border-b border-default-200/20">
                    <th className="text-left py-6 px-6 text-glass-text font-semibold">
                      Features
                    </th>
                    <th className="text-center py-6 px-4 min-w-[120px]">
                      <div className="text-glass-text font-semibold">Free</div>
                      <div className="text-glass-text-muted text-sm mt-1">$0/month</div>
                    </th>
                    <th className="text-center py-6 px-4 min-w-[120px] relative">
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <div className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">
                          Popular
                        </div>
                      </div>
                      <div className="text-glass-text font-semibold">Pro</div>
                      <div className="text-glass-text-muted text-sm mt-1">$20/month</div>
                    </th>
                    <th className="text-center py-6 px-4 min-w-[120px]">
                      <div className="text-glass-text font-semibold">Max</div>
                      <div className="text-glass-text-muted text-sm mt-1">$100/month</div>
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {features.map((feature, index) => (
                    <motion.tr
                      key={feature.name}
                      variants={itemVariants}
                      className="border-b border-default-200/10 hover:bg-white/5 transition-colors duration-200"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <div className="text-glass-text font-medium">
                            {feature.name}
                          </div>
                          {feature.description && (
                            <div className="text-glass-text-muted text-sm mt-1">
                              {feature.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        {renderFeatureValue(feature.free, "free")}
                      </td>
                      <td className="py-4 px-4 text-center bg-blue-500/5">
                        {renderFeatureValue(feature.pro, "pro")}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {renderFeatureValue(feature.max, "max")}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassmorphicCard>
        </motion.div>
      </div>
    </section>
  );
}

export default PricingComparison;