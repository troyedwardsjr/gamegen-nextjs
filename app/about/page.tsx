"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardBody } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import Link from "next/link";

import { 
  SparklesIcon, 
  HeartIcon, 
  RocketIcon,
  UsersIcon,
  LightbulbIcon,
  ShieldCheckIcon,
  TwitterIcon,
  LinkedInIcon,
  GithubIcon
} from "@/components/icons";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  avatar: string;
  expertise: string[];
  socials?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

const teamMembers: TeamMember[] = [
  {
    name: "Alex Chen",
    role: "CEO & Co-founder",
    bio: "Former game developer at Unity with 10+ years in AI and game development. Passionate about democratizing game creation.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    expertise: ["AI/ML", "Game Design", "Product Strategy"],
    socials: {
      twitter: "@alexchen",
      linkedin: "alexchen-gamedev"
    }
  },
  {
    name: "Sarah Rodriguez",
    role: "CTO & Co-founder",
    bio: "AI researcher and former Principal Engineer at OpenAI. Expert in language models and creative AI applications.",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b77c?w=150&h=150&fit=crop&crop=face",
    expertise: ["AI Research", "Full-Stack Development", "Cloud Architecture"],
    socials: {
      twitter: "@sarahcodes",
      github: "sarah-rodriguez"
    }
  },
  {
    name: "Marcus Thompson",
    role: "Head of Design",
    bio: "Creative director with experience at Pixar and indie game studios. Believes in making complex tools simple and beautiful.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    expertise: ["UI/UX Design", "Visual Design", "Art Direction"],
    socials: {
      linkedin: "marcus-thompson-design"
    }
  },
  {
    name: "Dr. Emily Park",
    role: "AI Research Lead",
    bio: "PhD in Computer Science from Stanford. Published researcher in generative AI and human-computer interaction.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    expertise: ["Machine Learning", "Research", "AI Ethics"],
    socials: {
      twitter: "@emilypark_ai",
      linkedin: "emily-park-phd"
    }
  }
];

const values = [
  {
    icon: SparklesIcon,
    title: "Innovation First",
    description: "We push the boundaries of what's possible in AI-powered creativity."
  },
  {
    icon: UsersIcon,
    title: "Community Driven",
    description: "Our platform grows through the creativity and feedback of our users."
  },
  {
    icon: LightbulbIcon,
    title: "Accessibility",
    description: "Making game development accessible to creators of all skill levels."
  },
  {
    icon: ShieldCheckIcon,
    title: "Privacy & Security",
    description: "Your creative work and data are protected with industry-leading security."
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Hero Section */}
      <section className="relative py-20 sm:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                About
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                GameGen
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              We&apos;re on a mission to democratize game development by combining the power of AI 
              with intuitive creative tools. Our vision is a world where anyone can bring their 
              game ideas to life, regardless of technical expertise.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <RocketIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white">
                  Our Mission
                </h2>
              </div>
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                Game development has traditionally required years of learning programming languages, 
                game engines, and complex development workflows. We believe creativity shouldn&apos;t be 
                limited by technical barriers.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                GameGen combines cutting-edge AI with an intuitive interface that lets creators focus 
                on what matters most: their vision. Whether you&apos;re a complete beginner or an 
                experienced developer, our platform adapts to your skill level and helps you create 
                amazing games.
              </p>
            </div>
            <div className="relative">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
                    <HeartIcon className="w-8 h-8 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Built with Passion</h3>
                    <p className="text-purple-300">For creators, by creators</p>
                  </div>
                </div>
                <p className="text-gray-300">
                  Every feature in GameGen is designed with real creators in mind. We&apos;ve experienced 
                  the frustrations of complex game development tools, and we&apos;re building the platform 
                  we always wished existed.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Our Values
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              These principles guide everything we do at GameGen
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div
                  key={value.title}
                  animate={{ opacity: 1, y: 0 }}
                  initial={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                >
                  <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-purple-500/30 transition-all duration-300 h-full">
                    <CardBody className="p-6 text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                        <Icon className="w-8 h-8 text-purple-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-3">
                        {value.title}
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {value.description}
                      </p>
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Meet Our Team
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Passionate creators, engineers, and researchers dedicated to revolutionizing game development
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.name}
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              >
                <Card className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-purple-500/30 transition-all duration-300 h-full">
                  <CardBody className="p-6 text-center">
                    <Avatar
                      className="w-24 h-24 mx-auto mb-4"
                      name={member.name}
                      size="lg"
                      src={member.avatar}
                    />
                    
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {member.name}
                    </h3>
                    <p className="text-purple-400 font-medium mb-3">
                      {member.role}
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                      {member.bio}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      {member.expertise.map((skill) => (
                        <Chip
                          key={skill}
                          className="bg-purple-500/20 text-purple-300 text-xs border border-purple-500/30"
                          size="sm"
                        >
                          {skill}
                        </Chip>
                      ))}
                    </div>

                    {member.socials && (
                      <div className="flex justify-center gap-2">
                        {member.socials.twitter && (
                          <Button
                            isIconOnly
                            className="bg-white/10 border-white/20 text-gray-300 hover:text-white hover:bg-white/20"
                            size="sm"
                            variant="bordered"
                          >
                            <TwitterIcon className="w-4 h-4" />
                          </Button>
                        )}
                        {member.socials.linkedin && (
                          <Button
                            isIconOnly
                            className="bg-white/10 border-white/20 text-gray-300 hover:text-white hover:bg-white/20"
                            size="sm"
                            variant="bordered"
                          >
                            <LinkedInIcon className="w-4 h-4" />
                          </Button>
                        )}
                        {member.socials.github && (
                          <Button
                            isIconOnly
                            className="bg-white/10 border-white/20 text-gray-300 hover:text-white hover:bg-white/20"
                            size="sm"
                            variant="bordered"
                          >
                            <GithubIcon className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Join Our Mission
              </h2>
              <p className="text-lg text-gray-300 leading-relaxed">
                Ready to be part of the future of game development? Start creating today or get in touch to learn more.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300">
                  Start Creating Free
                </Button>
              </Link>
              <Link href="mailto:team@gamegen.ai">
                <Button 
                  variant="bordered"
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 px-8 py-3 rounded-xl"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}