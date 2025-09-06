"use client";

import React from "react";
import { motion } from "framer-motion";
import { Switch } from "@heroui/switch";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";

interface PricingToggleProps {
  isYearly: boolean;
  onToggle: (isYearly: boolean) => void;
  className?: string;
}

export function PricingToggle({ isYearly, onToggle, className }: PricingToggleProps) {
  const handleToggle = (value: boolean) => {
    onToggle(value);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={className}
    >
      <GlassmorphicCard
        variant="subtle"
        blur="md"
        shadow="sm"
        border="subtle"
        hover={false}
        className="inline-flex items-center space-x-4 p-4"
      >
        <span className={`font-medium transition-colors duration-200 ${
          !isYearly ? "text-glass-text" : "text-glass-text-muted"
        }`}>
          Monthly
        </span>
        
        {/* Custom Switch - HeroUI Switch had event handling issues */}
        <div 
          className={`relative inline-flex h-6 w-12 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
            isYearly 
              ? 'bg-gradient-to-r from-primary to-purple-500' 
              : 'bg-gray-300'
          }`}
          onClick={() => handleToggle(!isYearly)}
        >
          <span
            className={`inline-block h-5 w-5 mt-0.5 ml-0.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isYearly ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`font-medium transition-colors duration-200 ${
            isYearly ? "text-glass-text" : "text-glass-text-muted"
          }`}>
            Yearly
          </span>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
              Save 20%
            </div>
          </motion.div>
        </div>
      </GlassmorphicCard>
    </motion.div>
  );
}

export default PricingToggle;