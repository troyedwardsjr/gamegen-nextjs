"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { ChevronDownIcon } from "@/components/icons";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What are Game Creation Credits and how do they work?",
    answer: "Game Creation Credits are our usage-based units that power all AI features including code generation, art asset creation, game logic assistance, and AI-powered playtesting. Each action consumes credits based on complexity. Simple code suggestions use 1-5 credits, while complex game generation can use 50-200 credits per request."
  },
  {
    question: "Can I upgrade or downgrade my plan anytime?",
    answer: "Yes! You can upgrade your plan instantly and start using the new features right away. When downgrading, the changes will take effect at the end of your current billing cycle. You'll keep access to premium features until your subscription period ends."
  },
  {
    question: "What happens if I exceed my credit limit?",
    answer: "If you reach your monthly credit limit, you can purchase additional credit packs or upgrade to a higher tier. Free users will need to wait until the next month for credits to reset, while paid users can add credits instantly without interruption."
  },
  {
    question: "Do credits roll over to the next month?",
    answer: "Credits expire at the end of each billing cycle and don't roll over. This ensures you always have access to the latest AI models and features. We recommend choosing a plan that matches your typical monthly game development usage."
  },
  {
    question: "What export options are available?",
    answer: "Free users can publish games on the GameGen platform with our splash screen. Pro users can export to web (HTML5) and desktop (Windows, Mac, Linux) without splash screens. Max users get all export options plus white-label solutions for commercial distribution."
  },
  {
    question: "Is there a free trial for paid plans?",
    answer: "All new users start with our Free plan which includes 1,000 game creation credits to explore the platform. You can upgrade anytime to unlock advanced features like unlimited exports and enhanced AI assistance. We also offer a 14-day money-back guarantee on all paid plans."
  },
  {
    question: "What game types can I create?",
    answer: "GameGen supports creating various pixel art game genres including bullet hell shooters, RPGs, action-adventure games, platformers, puzzle games, and team deathmatch multiplayer games. Our AI can suggest game mechanics, generate code, and help with asset creation for any 2D pixel art style."
  },
  {
    question: "Can I use GameGen for commercial projects?",
    answer: "Yes! All plans include commercial usage rights for games you create. Pro and Max plans are specifically designed for indie developers and studios. Max plans include additional licensing options for enterprise use cases and revenue sharing agreements."
  }
];

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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

  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-glass-text-muted text-lg sm:text-xl leading-relaxed">
            Everything you need to know about GameGen pricing and features
          </p>
        </motion.div>

        {/* FAQ List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
            >
              <GlassmorphicCard
                variant="default"
                blur="md"
                shadow="sm"
                border="subtle"
                hover={true}
                className="overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left p-6 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-glass-text pr-8">
                      {faq.question}
                    </h3>
                    <motion.div
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDownIcon className="w-5 h-5 text-glass-text-muted" />
                    </motion.div>
                  </div>
                </button>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ 
                        height: "auto", 
                        opacity: 1,
                        transition: {
                          height: { duration: 0.3 },
                          opacity: { duration: 0.3, delay: 0.1 }
                        }
                      }}
                      exit={{ 
                        height: 0, 
                        opacity: 0,
                        transition: {
                          height: { duration: 0.3, delay: 0.1 },
                          opacity: { duration: 0.1 }
                        }
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6">
                        <div className="h-px bg-gradient-to-r from-transparent via-default-200/30 to-transparent mb-4" />
                        <p className="text-glass-text-muted leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassmorphicCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-12"
        >
          <p className="text-glass-text-muted mb-4">
            Still have questions? We're here to help.
          </p>
          <a
            href="mailto:support@gamegen.ai"
            className="inline-flex items-center space-x-2 text-primary hover:text-primary-300 transition-colors duration-200"
          >
            <span>Contact our support team</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

export default PricingFAQ;