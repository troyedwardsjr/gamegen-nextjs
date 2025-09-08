"use client";

import React, { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { FeatureCard } from "./FeatureCard";

import {
  MessageSquareIcon,
  CodeIcon,
  PaletteIcon,
  SparklesIcon,
  ZapIcon,
  GamepadIcon,
} from "@/components/icons";

const FeaturesSection = memo(() => {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.8,
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
      },
    },
  };

  const titleVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.6,
        ease: "easeOut",
      },
    },
  };

  const features = [
    {
      icon: <MessageSquareIcon className="w-6 h-6" />,
      title: "Vibe Coding Chat",
      description:
        "Natural language game development with AI assistance. Describe your game idea and watch as the AI helps you build bullet hell, RPG, action-adventure games and more.",
    },
    {
      icon: <CodeIcon className="w-6 h-6" />,
      title: "Visual Script Editor",
      description:
        "Powerful scripting interface with JavaScript support for the Toxoid game engine. Create complex game mechanics with both visual tools and code.",
    },
    {
      icon: <PaletteIcon className="w-6 h-6" />,
      title: "Pixel Art Tools",
      description:
        "Built-in pixel art editor with sprite animation tools, asset management, and seamless integration with the game development workflow.",
    },
    {
      icon: <SparklesIcon className="w-6 h-6" />,
      title: "AI-Powered Generation",
      description:
        "Intelligent game mechanics generation, procedural content creation, and smart asset suggestions powered by advanced AI models.",
    },
    {
      icon: <ZapIcon className="w-6 h-6" />,
      title: "Live Preview",
      description:
        "Real-time game testing and iteration with instant feedback. See your changes immediately as you build and modify your game.",
    },
    {
      icon: <GamepadIcon className="w-6 h-6" />,
      title: "Multi-Platform Export",
      description:
        "Export to web, desktop (via Tauri), and mobile platforms. Publish to the GameGen marketplace or export for external distribution.",
    },
  ];

  return (
    <section
      aria-labelledby="features-heading"
      className="relative py-12 sm:py-20 md:py-24 lg:py-32 overflow-hidden"
      role="region"
    >
      {/* Background Elements - responsive positioning and sizes */}
      <div className="absolute inset-0 z-0">
        {/* Subtle gradient orbs for depth */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3],
                }
          }
          className="absolute top-10 left-4 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 sm:top-20 sm:left-10 rounded-full bg-gradient-to-r from-purple-600/10 to-violet-600/5 blur-3xl"
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        />
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1.1, 1, 1.1],
                  opacity: [0.4, 0.7, 0.4],
                }
          }
          className="absolute bottom-10 right-4 w-40 h-40 sm:w-60 sm:h-60 md:w-80 md:h-80 sm:bottom-20 sm:right-10 rounded-full bg-gradient-to-l from-indigo-600/8 to-purple-500/5 blur-3xl"
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 2,
                }
          }
        />
      </div>

      {/* Content Container */}
      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        initial="hidden"
        variants={containerVariants}
        viewport={{ once: true, margin: "-100px" }}
        whileInView="visible"
      >
        {/* Section Header */}
        <motion.div
          className="text-center max-w-4xl mx-auto mb-8 sm:mb-12 md:mb-16 lg:mb-20 px-4 sm:px-0"
          variants={titleVariants}
        >
          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white/95 mb-4 sm:mb-6 leading-tight"
            id="features-heading"
          >
            Powerful Features for
            <span className="block bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Game Creation
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto">
            Transform your game ideas into reality with cutting-edge AI
            technology designed for indie developers, artists, and creative
            minds.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          aria-label="GameGen platform features"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 px-4 sm:px-0"
          role="group"
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              className="h-full"
              description={feature.description}
              icon={feature.icon}
              index={index}
              title={feature.title}
            />
          ))}
        </motion.div>

        {/* Bottom CTA Section */}
        <motion.div
          className="text-center mt-12 sm:mt-16 md:mt-20 lg:mt-24 px-4 sm:px-0"
          variants={titleVariants}
        >
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-white/95">
              Ready to create your first game?
            </h3>
            <p className="text-sm sm:text-base text-white/70">
              Join thousands of creators who are already building amazing games
              with AI-powered tools.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
});

FeaturesSection.displayName = "FeaturesSection";

export default FeaturesSection;
