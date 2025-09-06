'use client';

import { Button } from '@heroui/button';
import { motion } from 'framer-motion';
import { ArrowRightIcon, SparklesIcon, UsersIcon, GamepadIcon, CodeIcon } from '@/components/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HeroSection() {
  const router = useRouter();

  const handleStartCreating = () => {
    router.push('/register');
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
      
      {/* Floating elements - responsive sizes */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-10 left-4 w-32 h-32 sm:w-48 sm:h-48 md:w-72 md:h-72 sm:top-20 sm:left-10 bg-primary/30 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-10 right-4 w-40 h-40 sm:w-64 sm:h-64 md:w-96 md:h-96 sm:bottom-20 sm:right-10 bg-secondary/30 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container mx-auto px-4 z-10">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-3 rounded-full mb-6 sm:mb-8 relative overflow-hidden group backdrop-blur-xl opacity-100"
            style={{
              background: 'linear-gradient(135deg, rgba(132,61,255,0.15) 0%, rgba(168,85,247,0.12) 50%, rgba(139,92,246,0.15) 100%)',
              border: '1px solid rgba(132,61,255,0.3)',
              boxShadow: '0 8px 32px rgba(132,61,255,0.2), inset 0 1px 2px rgba(255,255,255,0.1)',
            }}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 12px 48px rgba(132,61,255,0.3), inset 0 1px 2px rgba(255,255,255,0.2)',
            }}
          >
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-violet-500/15 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Glass shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
            
            {/* Content */}
            <div className="relative z-10 flex items-center gap-2">
              <motion.div
                animate={{ 
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <SparklesIcon className="w-3 h-3 sm:w-4 sm:h-4 text-purple-300 drop-shadow-lg" />
              </motion.div>
              <span className="text-xs sm:text-sm font-semibold text-white/95 drop-shadow-sm">
                AI-Powered Game Creation Platform
              </span>
            </div>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent leading-tight opacity-100"
            style={{ opacity: 1 }}
          >
            Create Pixel Art Games
            <br />
            with AI-Powered Tools
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto px-4 sm:px-0 opacity-100"
            style={{ opacity: 1 }}
          >
            Transform your game ideas into reality with our vibe coding chat interface, visual scripting tools, and AI-powered game generation. Create bullet hell, RPG, action-adventure games and more.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 px-4 sm:px-0 opacity-100"
            style={{ opacity: 1 }}
          >
            {/* Primary CTA Button */}
            <motion.button
              onClick={handleStartCreating}
              className="relative group px-8 py-4 sm:px-10 sm:py-5 rounded-2xl font-semibold text-base sm:text-lg text-white overflow-hidden backdrop-blur-xl min-h-[56px] w-full sm:w-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(132,61,255,0.9) 0%, rgba(168,85,247,0.8) 50%, rgba(139,92,246,0.9) 100%)',
                border: '1px solid rgba(132,61,255,0.5)',
                boxShadow: '0 12px 48px rgba(132,61,255,0.4), inset 0 1px 2px rgba(255,255,255,0.2)',
              }}
              whileHover={{
                scale: 1.05,
                boxShadow: '0 16px 64px rgba(132,61,255,0.6), inset 0 1px 2px rgba(255,255,255,0.3)',
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-violet-400/30 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Glass shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-purple-400/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Content */}
              <div className="relative z-10 flex items-center justify-center gap-3">
                <span>Start Creating Free</span>
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </motion.div>
              </div>
            </motion.button>

            {/* Secondary CTA Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/features"
                className="relative group px-8 py-4 sm:px-10 sm:py-5 rounded-2xl font-semibold text-base sm:text-lg text-white/90 hover:text-white overflow-hidden backdrop-blur-xl min-h-[56px] w-full sm:w-auto flex items-center justify-center transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(132,61,255,0.05) 50%, rgba(255,255,255,0.08) 100%)',
                  border: '1px solid rgba(132,61,255,0.3)',
                  boxShadow: '0 8px 32px rgba(132,61,255,0.15), inset 0 1px 2px rgba(255,255,255,0.1)',
                }}
              >
                {/* Hover background */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-violet-500/15 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Glass shine effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                
                {/* Content */}
                <span className="relative z-10">Explore Features</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto px-4 sm:px-0"
          >
            {[
              { icon: UsersIcon, value: "5K+", label: "Game Creators", delay: 0.1 },
              { icon: GamepadIcon, value: "15K+", label: "Games Created", delay: 0.2 },
              { icon: CodeIcon, value: "50+", label: "Script Templates", delay: 0.3 },
            ].map(({ icon: Icon, value, label, delay }, index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4 + delay, ease: "easeOut" }}
                className="relative group p-6 rounded-2xl backdrop-blur-xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(132,61,255,0.08) 50%, rgba(255,255,255,0.08) 100%)',
                  border: '1px solid rgba(132,61,255,0.2)',
                  boxShadow: '0 8px 32px rgba(132,61,255,0.15), inset 0 1px 2px rgba(255,255,255,0.1)',
                }}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 12px 48px rgba(132,61,255,0.25), inset 0 1px 2px rgba(255,255,255,0.15)',
                }}
              >
                {/* Hover glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Glass shine effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
                
                {/* Content */}
                <div className="relative z-10 text-center">
                  <div className="flex items-center justify-center mb-3">
                    <motion.div
                      className="p-3 rounded-xl mr-3"
                      style={{
                        background: 'linear-gradient(135deg, rgba(132,61,255,0.2) 0%, rgba(168,85,247,0.15) 100%)',
                        border: '1px solid rgba(132,61,255,0.3)',
                      }}
                      whileHover={{ rotate: 5, scale: 1.1 }}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-300" />
                    </motion.div>
                    <motion.span 
                      className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 1, delay: 0.6 + delay }}
                    >
                      {value}
                    </motion.span>
                  </div>
                  <p className="text-sm sm:text-base text-white/70 font-medium">{label}</p>
                </div>

                {/* Subtle particle effect */}
                <div className="absolute top-2 right-2 w-2 h-2 bg-purple-400/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-violet-400/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}