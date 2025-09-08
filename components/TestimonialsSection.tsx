"use client";

import React, { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { StarIcon } from "@/components/icons";

const TestimonialsSection = memo(() => {
  const shouldReduceMotion = useReducedMotion();

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

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 50,
      scale: shouldReduceMotion ? 1 : 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.2 : 0.6,
        ease: "easeOut",
      },
    },
  };

  const testimonials = [
    {
      name: "Alex Chen",
      role: "Indie Game Developer",
      avatar: "AC",
      quote:
        "GameGen transformed my workflow completely. I went from concept to playable game in just 3 days. The AI assistance is incredibly intuitive and the pixel art tools are exactly what I needed.",
      rating: 5,
    },
    {
      name: "Sarah Rodriguez",
      role: "Digital Artist",
      avatar: "SR",
      quote:
        "The vibe coding chat is a game-changer. I can describe complex mechanics in plain English and watch them come to life. It's like having a coding partner who never gets tired.",
      rating: 5,
    },
    {
      name: "Marcus Thompson",
      role: "Creative Director",
      avatar: "MT",
      quote:
        "Our studio has adopted GameGen for rapid prototyping. We've created over 20 game demos this month alone. The export options make it perfect for client presentations.",
      rating: 5,
    },
  ];

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

  return (
    <section
      aria-labelledby="testimonials-heading"
      className="relative py-12 sm:py-20 md:py-24 lg:py-32 overflow-hidden"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }
          }
          className="absolute top-1/4 left-8 w-48 h-48 md:w-72 md:h-72 rounded-full bg-gradient-to-br from-purple-600/8 to-violet-600/4 blur-3xl"
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 12,
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
                  opacity: [0.4, 0.6, 0.4],
                }
          }
          className="absolute top-3/4 right-8 w-64 h-64 md:w-96 md:h-96 rounded-full bg-gradient-to-tl from-indigo-600/6 to-purple-500/4 blur-3xl"
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 15,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 3,
                }
          }
        />
      </div>

      <motion.div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        initial="hidden"
        variants={containerVariants}
        viewport={{ once: true, margin: "-100px" }}
        whileInView="visible"
      >
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 md:mb-20"
          variants={titleVariants}
        >
          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white/95 mb-4 sm:mb-6"
            id="testimonials-heading"
          >
            Loved by
            <span className="block bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Game Creators
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-white/70 leading-relaxed">
            Join thousands of developers who are creating amazing games with
            GameGen
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              className="group relative p-6 sm:p-8 rounded-2xl backdrop-blur-xl overflow-hidden h-full"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(132,61,255,0.08) 20%, rgba(168,85,247,0.05) 50%, rgba(132,61,255,0.08) 80%, rgba(255,255,255,0.06) 100%)",
                border: "1px solid rgba(132,61,255,0.25)",
                boxShadow:
                  "0 8px 32px rgba(132,61,255,0.15), inset 0 1px 2px rgba(255,255,255,0.08)",
              }}
              variants={cardVariants}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 1.02,
                      y: -5,
                      boxShadow:
                        "0 16px 48px rgba(132,61,255,0.25), inset 0 1px 2px rgba(255,255,255,0.12)",
                    }
              }
            >
              {/* Hover effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-violet-500/8 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-30 group-hover:opacity-50 transition-opacity duration-300" />

              <div className="relative z-10 flex flex-col h-full">
                {/* Rating Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="flex-1 mb-6">
                  <p className="text-sm sm:text-base text-white/80 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-white/90 text-sm"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(132,61,255,0.4) 0%, rgba(168,85,247,0.3) 100%)",
                      border: "1px solid rgba(132,61,255,0.5)",
                    }}
                  >
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-white/95 text-sm sm:text-base">
                      {testimonial.name}
                    </div>
                    <div className="text-xs sm:text-sm text-white/60">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-4 right-4 w-1 h-1 bg-purple-400/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute bottom-4 left-4 w-0.5 h-0.5 bg-violet-400/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </motion.div>
          ))}
        </div>

        {/* Bottom stats */}
        <motion.div
          className="text-center mt-12 sm:mt-16 md:mt-20"
          variants={titleVariants}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {[
              { value: "5K+", label: "Happy Developers" },
              { value: "15K+", label: "Games Created" },
              { value: "4.9/5", label: "Average Rating" },
              { value: "98%", label: "Would Recommend" },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="text-2xl sm:text-3xl font-bold text-white/95 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-white/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
});

TestimonialsSection.displayName = "TestimonialsSection";

export default TestimonialsSection;
