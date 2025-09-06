"use client";

import React from "react";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { CheckIcon } from "@/components/icons";

export interface PricingTier {
  name: string;
  price: {
    monthly: number;
    yearly: number;
  };
  credits: string;
  features: string[];
  popular?: boolean;
  cta: string;
}

interface PricingCardProps {
  tier: PricingTier;
  isYearly: boolean;
  index: number;
  className?: string;
}

export function PricingCard({ tier, isYearly, index, className }: PricingCardProps) {
  const price = isYearly ? tier.price.yearly : tier.price.monthly;
  const savings = isYearly && tier.price.monthly > 0 
    ? Math.round(((tier.price.monthly * 12 - tier.price.yearly) / (tier.price.monthly * 12)) * 100)
    : 0;

  return (
    <div className={`animate-slide-in-from-bottom w-full max-w-md mx-auto ${className}`} style={{ animationDelay: `${index * 100}ms` }}>
      <GlassmorphicCard
        variant={tier.popular ? "gradient" : "default"}
        blur="lg"
        shadow={tier.popular ? "xl" : "md"}
        border={tier.popular ? "visible" : "subtle"}
        className={`relative h-full p-6 sm:p-8 lg:p-8 xl:p-10 w-full ${
          tier.popular 
            ? "ring-2 ring-primary/50 bg-gradient-to-br from-primary/10 to-purple-500/10" 
            : ""
        }`}
      >
        {/* Popular Badge */}
        {tier.popular && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <Badge
              color="primary"
              variant="flat"
              className="bg-gradient-to-r from-primary to-purple-500 text-white font-semibold px-4 py-1"
            >
              Most Popular
            </Badge>
          </div>
        )}

        <div className="space-y-6 sm:space-y-8 lg:space-y-6 xl:space-y-8">
          {/* Tier Name */}
          <div className="text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-glass-text mb-2">
              {tier.name}
            </h3>
            <p className="text-glass-text-muted">
              {tier.credits} game creation credits/month
            </p>
          </div>

          {/* Pricing */}
          <div className="text-center space-y-2">
            <div className="flex items-baseline justify-center space-x-1">
              <span className="text-3xl sm:text-4xl font-bold text-glass-text">
                ${price}
              </span>
              <span className="text-glass-text-muted">
                /{isYearly ? "year" : "month"}
              </span>
            </div>
            
            {/* Savings Badge */}
            {isYearly && savings > 0 && (
              <div className="animate-zoom-in" style={{ animationDelay: `${500 + index * 100}ms` }}>
                <Badge 
                  color="success" 
                  variant="flat"
                  size="sm"
                  className="bg-green-500/20 text-green-400 border border-green-500/30"
                >
                  Save {savings}%
                </Badge>
              </div>
            )}

            {/* Monthly equivalent for yearly */}
            {isYearly && tier.price.monthly > 0 && (
              <p className="text-sm text-glass-text-muted">
                ${Math.round(price / 12)}/month when billed annually
              </p>
            )}
          </div>

          {/* Features List */}
          <div className="space-y-3 animate-fade-in" style={{ animationDelay: `${300 + index * 100}ms` }}>
            {tier.features.map((feature, featureIndex) => (
              <div
                key={featureIndex}
                className="flex items-start space-x-3 animate-slide-in-from-left"
                style={{ animationDelay: `${400 + index * 100 + featureIndex * 50}ms` }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <CheckIcon className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-glass-text-muted leading-relaxed">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <GlassmorphicButton
              variant={tier.popular ? "glass-filled" : "glass-bordered"}
              intensity={tier.popular ? "strong" : "medium"}
              blur="md"
              className={`w-full py-2.5 sm:py-3 font-semibold text-sm sm:text-base ${
                tier.popular 
                  ? "bg-gradient-to-r from-primary to-purple-500 text-white border-0" 
                  : ""
              }`}
              size="lg"
            >
              {tier.cta}
            </GlassmorphicButton>
          </div>

          {/* Additional Info for Free Tier */}
          {tier.price.monthly === 0 && (
            <p className="text-center text-sm text-glass-text-muted">
              No credit card required
            </p>
          )}
        </div>
      </GlassmorphicCard>
    </div>
  );
}

export default PricingCard;