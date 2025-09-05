"use client";

import React from "react";
import { motion } from "framer-motion";
import { GlassmorphicCard, GameGenCardPresets } from "@/components/ui/GlassmorphicCard";

interface GameCreatorLoadingProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
}

export function GameCreatorLoading({ 
  message = "Loading GameGen Creator...", 
  progress = 0,
  showProgress = false 
}: GameCreatorLoadingProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-purple-900/40 relative overflow-hidden flex items-center justify-center">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_#3b0764_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_#312e81_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_#1e1b4b_0%,_transparent_50%)]" />
      
      {/* Floating Orbs */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4]
        }}
        transition={{ 
          duration: 2.5, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />
      <motion.div 
        className="absolute top-3/4 left-3/4 w-20 h-20 bg-rose-500/10 rounded-full blur-2xl"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ 
          duration: 3.5, 
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5
        }}
      />
      
      {/* Loading Card */}
      <GlassmorphicCard {...GameGenCardPresets.modalCard} className="relative z-10 w-full max-w-md mx-4">
        <div className="p-8 text-center">
          {/* Animated Logo/Icon */}
          <motion.div
            className="text-6xl mb-6"
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            🎮
          </motion.div>
          
          {/* Loading Text */}
          <motion.h2 
            className="text-xl font-semibold text-white/90 mb-4"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {message}
          </motion.h2>
          
          {/* Loading Dots */}
          <div className="flex justify-center space-x-2 mb-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>
          
          {/* Progress Bar */}
          {showProgress && (
            <div className="space-y-2">
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-400 to-cyan-400"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-sm text-white/60">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}
          
          {/* Loading Steps */}
          <div className="mt-6 space-y-2 text-sm text-white/50">
            <motion.div
              className="flex items-center justify-center space-x-2"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
              <span>Initializing workspace</span>
            </motion.div>
            <motion.div
              className="flex items-center justify-center space-x-2"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
              <span>Loading assets</span>
            </motion.div>
            <motion.div
              className="flex items-center justify-center space-x-2"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              <span>Connecting to AI</span>
            </motion.div>
          </div>
        </div>
      </GlassmorphicCard>
    </div>
  );
}

export default GameCreatorLoading;