"use client";

import React, { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowRightIcon, SparklesIcon, ZapIcon } from "@/components/icons";

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  primaryButtonText?: string;
  secondaryButtonText?: string;
  primaryButtonHref?: string;
  secondaryButtonHref?: string;
  showStats?: boolean;
  className?: string;
}

const CTASection = memo(
  ({
    title = "Ready to Create Your Game?",
    subtitle = "Start Building Today",
    description = "Join thousands of game developers who are already creating amazing experiences with GameGen's AI-powered tools. No coding experience required.",
    primaryButtonText = "Start Creating Free",
    secondaryButtonText = "View Examples",
    primaryButtonHref = "/register",
    secondaryButtonHref = "/examples",
    showStats = true,
    className = "",
  }: CTASectionProps) => {
    const router = useRouter();
    const shouldReduceMotion = useReducedMotion();

    const handlePrimaryAction = () => {
      router.push(primaryButtonHref);
    };

    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          duration: shouldReduceMotion ? 0.2 : 0.8,
          staggerChildren: shouldReduceMotion ? 0 : 0.2,
        },
      },
    };

    const itemVariants = {
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

    return (
      <section
        aria-labelledby="cta-heading"
        className={`relative py-16 sm:py-20 md:py-24 lg:py-32 overflow-hidden ${className}`}
      >
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          {/* Central glowing orb */}
          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 0.7, 0.4],
                  }
            }
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 md:w-[500px] md:h-[500px] rounded-full bg-gradient-to-r from-purple-600/20 via-violet-600/15 to-indigo-600/20 blur-3xl"
            transition={
              shouldReduceMotion
                ? undefined
                : {
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          />
          {/* Side accent orbs */}
          <motion.div
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    x: [0, 30, 0],
                    y: [0, -20, 0],
                  }
            }
            className="absolute top-1/4 left-8 w-40 h-40 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-purple-500/15 to-violet-500/8 blur-2xl"
            transition={
              shouldReduceMotion
                ? undefined
                : {
                    duration: 20,
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
                    x: [0, -25, 0],
                    y: [0, 25, 0],
                  }
            }
            className="absolute bottom-1/4 right-8 w-48 h-48 md:w-72 md:h-72 rounded-full bg-gradient-to-tl from-indigo-500/12 to-purple-500/8 blur-2xl"
            transition={
              shouldReduceMotion
                ? undefined
                : {
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                  }
            }
          />
        </div>

        <motion.div
          className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
          initial="hidden"
          variants={containerVariants}
          viewport={{ once: true, margin: "-100px" }}
          whileInView="visible"
        >
          {/* Main Content Card */}
          <motion.div
            className="relative group p-8 sm:p-12 lg:p-16 rounded-3xl backdrop-blur-xl overflow-hidden text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(132,61,255,0.12) 20%, rgba(168,85,247,0.08) 50%, rgba(132,61,255,0.12) 80%, rgba(255,255,255,0.08) 100%)",
              border: "1px solid rgba(132,61,255,0.3)",
              boxShadow:
                "0 16px 64px rgba(132,61,255,0.2), inset 0 1px 2px rgba(255,255,255,0.1)",
            }}
            variants={itemVariants}
          >
            {/* Card background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-violet-500/10 to-purple-500/5 opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent opacity-40" />

            {/* Animated particles */}
            <div className="absolute top-8 right-8 w-2 h-2 bg-purple-400/40 rounded-full animate-pulse" />
            <div
              className="absolute top-16 right-16 w-1 h-1 bg-violet-400/30 rounded-full animate-pulse"
              style={{ animationDelay: "1s" }}
            />
            <div
              className="absolute bottom-8 left-8 w-1.5 h-1.5 bg-indigo-400/35 rounded-full animate-pulse"
              style={{ animationDelay: "2s" }}
            />

            <div className="relative z-10 max-w-4xl mx-auto">
              {/* Badge */}
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 sm:mb-8"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(132,61,255,0.2) 0%, rgba(168,85,247,0.15) 100%)",
                  border: "1px solid rgba(132,61,255,0.4)",
                  boxShadow: "0 4px 16px rgba(132,61,255,0.15)",
                }}
                variants={itemVariants}
              >
                <motion.div
                  animate={
                    shouldReduceMotion
                      ? undefined
                      : {
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.1, 1],
                        }
                  }
                  transition={
                    shouldReduceMotion
                      ? undefined
                      : {
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                  }
                >
                  <SparklesIcon className="w-4 h-4 text-purple-300" />
                </motion.div>
                <span className="text-sm font-semibold text-white/95">
                  Limited Time - Free Account Setup
                </span>
              </motion.div>

              {/* Heading */}
              <motion.h2
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white/95 mb-4 sm:mb-6"
                id="cta-heading"
                variants={itemVariants}
              >
                {title}
                <br />
                <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  {subtitle}
                </span>
              </motion.h2>

              {/* Description */}
              <motion.p
                className="text-base sm:text-lg md:text-xl text-white/70 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed"
                variants={itemVariants}
              >
                {description}
              </motion.p>

              {/* Action Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16"
                variants={itemVariants}
              >
                {/* Primary Button */}
                <motion.button
                  className="relative group px-8 py-4 sm:px-10 sm:py-5 rounded-2xl font-semibold text-base sm:text-lg text-white overflow-hidden backdrop-blur-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(132,61,255,0.9) 0%, rgba(168,85,247,0.8) 50%, rgba(139,92,246,0.9) 100%)",
                    border: "1px solid rgba(132,61,255,0.5)",
                    boxShadow:
                      "0 12px 48px rgba(132,61,255,0.4), inset 0 1px 2px rgba(255,255,255,0.2)",
                  }}
                  whileHover={
                    shouldReduceMotion
                      ? undefined
                      : {
                          scale: 1.05,
                          boxShadow:
                            "0 16px 64px rgba(132,61,255,0.6), inset 0 1px 2px rgba(255,255,255,0.3)",
                        }
                  }
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  onClick={handlePrimaryAction}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-violet-400/30 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-300" />

                  <div className="relative z-10 flex items-center justify-center gap-3">
                    <span>{primaryButtonText}</span>
                    <motion.div
                      animate={
                        shouldReduceMotion ? undefined : { x: [0, 3, 0] }
                      }
                      transition={
                        shouldReduceMotion
                          ? undefined
                          : { duration: 2, repeat: Infinity, ease: "easeInOut" }
                      }
                    >
                      <ArrowRightIcon className="w-5 h-5" />
                    </motion.div>
                  </div>
                </motion.button>

                {/* Secondary Button */}
                <motion.div
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                >
                  <Link
                    className="relative group px-8 py-4 sm:px-10 sm:py-5 rounded-2xl font-semibold text-base sm:text-lg text-white/90 hover:text-white overflow-hidden backdrop-blur-xl flex items-center justify-center transition-all duration-300"
                    href={secondaryButtonHref}
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(132,61,255,0.05) 50%, rgba(255,255,255,0.08) 100%)",
                      border: "1px solid rgba(132,61,255,0.3)",
                      boxShadow:
                        "0 8px 32px rgba(132,61,255,0.15), inset 0 1px 2px rgba(255,255,255,0.1)",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-violet-500/15 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                    <span className="relative z-10">{secondaryButtonText}</span>
                  </Link>
                </motion.div>
              </motion.div>

              {/* Quick Stats */}
              {showStats && (
                <motion.div
                  className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 max-w-2xl mx-auto"
                  variants={itemVariants}
                >
                  {[
                    { icon: ZapIcon, value: "5 min", label: "Setup Time" },
                    { icon: SparklesIcon, value: "Free", label: "To Start" },
                    {
                      icon: ArrowRightIcon,
                      value: "24/7",
                      label: "AI Support",
                    },
                  ].map(({ icon: Icon, value, label }, index) => (
                    <motion.div
                      key={label}
                      className="text-center"
                      initial={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileInView={{ opacity: 1, y: 0 }}
                    >
                      <div
                        className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(132,61,255,0.2) 0%, rgba(168,85,247,0.15) 100%)",
                          border: "1px solid rgba(132,61,255,0.3)",
                        }}
                      >
                        <Icon className="w-5 h-5 text-purple-300" />
                      </div>
                      <div className="font-bold text-white/95 text-lg">
                        {value}
                      </div>
                      <div className="text-sm text-white/60">{label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>
    );
  },
);

CTASection.displayName = "CTASection";

export default CTASection;
