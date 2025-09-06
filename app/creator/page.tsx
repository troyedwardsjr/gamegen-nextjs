"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Tabs, Tab } from "@heroui/tabs";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { useDisclosure } from "@heroui/modal";
import Link from "next/link";
import {
  GameIcon,
  SparklesIcon,
  PlayIcon,
  PlusIcon,
  DocumentTextIcon,
  PhotoIcon,
  MusicalNoteIcon,
  CogIcon,
  ArrowRightIcon,
  RocketLaunchIcon,
  PaintBrushIcon,
  CodeBracketIcon,
} from "@/components/icons";

interface GameTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  complexity: "beginner" | "intermediate" | "advanced";
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
}

interface RecentProject {
  id: string;
  title: string;
  lastModified: string;
  status: "draft" | "in_review" | "published";
  thumbnail?: string;
  progress: number;
}

export default function CreatorStudioPage() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [projectDescription, setProjectDescription] = useState("");

  const gameTemplates: GameTemplate[] = [
    {
      id: "platformer",
      title: "2D Platformer",
      description: "Classic side-scrolling adventure with pixel-perfect physics",
      category: "Action",
      complexity: "intermediate",
      icon: GameIcon,
      features: ["Physics Engine", "Character Movement", "Level Editor", "Collectibles"],
    },
    {
      id: "puzzle",
      title: "Puzzle Game",
      description: "Mind-bending challenges with increasing difficulty",
      category: "Puzzle",
      complexity: "beginner",
      icon: SparklesIcon,
      features: ["Grid System", "Move Counter", "Hint System", "Level Progression"],
    },
    {
      id: "shooter",
      title: "Space Shooter",
      description: "Fast-paced action in the depths of space",
      category: "Action",
      complexity: "advanced",
      icon: RocketLaunchIcon,
      features: ["Projectile System", "Enemy AI", "Power-ups", "Boss Battles"],
    },
    {
      id: "rpg",
      title: "RPG Adventure",
      description: "Story-driven role-playing experience",
      category: "RPG",
      complexity: "advanced",
      icon: DocumentTextIcon,
      features: ["Character Stats", "Inventory", "Quest System", "Dialogue Trees"],
    },
    {
      id: "racing",
      title: "Racing Game",
      description: "High-speed thrills on various tracks",
      category: "Racing",
      complexity: "intermediate",
      icon: PlayIcon,
      features: ["Track Editor", "Car Customization", "Time Trials", "Multiplayer"],
    },
    {
      id: "custom",
      title: "Start From Scratch",
      description: "Build your game from the ground up",
      category: "Custom",
      complexity: "advanced",
      icon: CodeBracketIcon,
      features: ["Full Creative Control", "Custom Assets", "Scripting", "Advanced Tools"],
    },
  ];

  const recentProjects: RecentProject[] = [
    {
      id: "1",
      title: "Pixel Adventure Quest",
      lastModified: "2 hours ago",
      status: "published",
      progress: 100,
    },
    {
      id: "2", 
      title: "Space Invaders Remix",
      lastModified: "1 day ago",
      status: "draft",
      progress: 65,
    },
    {
      id: "3",
      title: "Puzzle Platformer",
      lastModified: "3 days ago",
      status: "in_review",
      progress: 85,
    },
  ];

  const handleCreateProject = () => {
    if (selectedTemplate && projectTitle.trim()) {
      // Here you would typically create the project and redirect to the editor
      console.log("Creating project:", {
        template: selectedTemplate.id,
        title: projectTitle,
        description: projectDescription,
      });
      
      // Redirect to game-creator with template
      window.location.href = `/game-creator?template=${selectedTemplate.id}&title=${encodeURIComponent(projectTitle)}`;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "beginner": return "text-green-400";
      case "intermediate": return "text-yellow-400";
      case "advanced": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "in_review": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "draft": return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <PaintBrushIcon className="w-6 h-6 text-white" />
                </div>
                Creator Studio
              </h1>
              <p className="text-gray-400 text-lg">
                Bring your game ideas to life with our powerful creation tools
              </p>
            </div>
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold hover:from-purple-400 hover:to-purple-500 shadow-lg shadow-purple-500/25"
              startContent={<PlusIcon className="w-5 h-5" />}
              onPress={onOpen}
            >
              New Project
            </Button>
          </div>
        </motion.div>

        <Tabs defaultSelectedKey="templates" className="w-full">
          <Tab key="templates" title="Templates">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Choose a Template</h2>
                <p className="text-gray-400">
                  Start with a pre-built template or create something entirely new
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gameTemplates.map((template, index) => {
                  const Icon = template.icon;
                  return (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Card
                        isPressable
                        className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all duration-300 h-full"
                        onPress={() => {
                          setSelectedTemplate(template);
                          onOpen();
                        }}
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-3 w-full">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-white">{template.title}</h3>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400">{template.category}</span>
                                <span className="text-gray-600">•</span>
                                <span className={getComplexityColor(template.complexity)}>
                                  {template.complexity}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardBody className="pt-0">
                          <p className="text-gray-300 text-sm mb-4">{template.description}</p>
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide">
                              Includes:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {template.features.map((feature) => (
                                <span
                                  key={feature}
                                  className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-md border border-purple-500/30"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </Tab>

          <Tab key="recent" title="Recent Projects">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Recent Projects</h2>
                <p className="text-gray-400">
                  Continue working on your existing games
                </p>
              </div>

              <div className="space-y-4">
                {recentProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="bg-gradient-to-r from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                      <CardBody className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                              <GameIcon className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-1">{project.title}</h3>
                              <p className="text-gray-400 text-sm mb-2">Last modified: {project.lastModified}</p>
                              <div className="flex items-center gap-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                                  {project.status}
                                </span>
                                <span className="text-sm text-gray-400">
                                  {project.progress}% complete
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link href={`/game-creator?project=${project.id}`}>
                              <Button
                                variant="bordered"
                                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                                startContent={<PaintBrushIcon className="w-4 h-4" />}
                              >
                                Edit
                              </Button>
                            </Link>
                            {project.status === "published" && (
                              <Button
                                variant="ghost"
                                className="text-green-400 hover:text-green-300"
                                startContent={<PlayIcon className="w-4 h-4" />}
                              >
                                Play
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </Tab>

          <Tab key="tools" title="Tools & Resources">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                <CardHeader>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <PhotoIcon className="w-5 h-5 text-purple-400" />
                    Sprite Editor
                  </h3>
                </CardHeader>
                <CardBody>
                  <p className="text-gray-400 text-sm mb-4">
                    Create and edit pixel art sprites for your games
                  </p>
                  <Button
                    variant="bordered"
                    className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                    startContent={<ArrowRightIcon className="w-4 h-4" />}
                  >
                    Open Editor
                  </Button>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                <CardHeader>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MusicalNoteIcon className="w-5 h-5 text-purple-400" />
                    Sound Studio
                  </h3>
                </CardHeader>
                <CardBody>
                  <p className="text-gray-400 text-sm mb-4">
                    Generate and edit sound effects and music
                  </p>
                  <Button
                    variant="bordered"
                    className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                    startContent={<ArrowRightIcon className="w-4 h-4" />}
                  >
                    Open Studio
                  </Button>
                </CardBody>
              </Card>

              <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                <CardHeader>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <DocumentTextIcon className="w-5 h-5 text-purple-400" />
                    Tutorials
                  </h3>
                </CardHeader>
                <CardBody>
                  <p className="text-gray-400 text-sm mb-4">
                    Learn game development with step-by-step guides
                  </p>
                  <Button
                    variant="bordered"
                    className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                    startContent={<ArrowRightIcon className="w-4 h-4" />}
                  >
                    Browse Tutorials
                  </Button>
                </CardBody>
              </Card>
            </motion.div>
          </Tab>
        </Tabs>

        {/* Create Project Modal */}
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold">
                    Create New Project
                    {selectedTemplate && ` - ${selectedTemplate.title}`}
                  </h2>
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    <Input
                      label="Project Title"
                      placeholder="Enter your game title"
                      value={projectTitle}
                      onValueChange={setProjectTitle}
                      variant="bordered"
                      classNames={{
                        input: "text-white",
                        label: "text-gray-400",
                        inputWrapper: "border-purple-500/30 hover:border-purple-500/50",
                      }}
                    />
                    <Textarea
                      label="Description (Optional)"
                      placeholder="Describe your game..."
                      value={projectDescription}
                      onValueChange={setProjectDescription}
                      variant="bordered"
                      classNames={{
                        input: "text-white",
                        label: "text-gray-400",
                        inputWrapper: "border-purple-500/30 hover:border-purple-500/50",
                      }}
                    />
                    {selectedTemplate && (
                      <div className="p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
                        <h3 className="font-semibold text-purple-400 mb-2">Template Features:</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.features.map((feature) => (
                            <span
                              key={feature}
                              className="px-2 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-md border border-purple-500/40"
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                    onPress={() => {
                      handleCreateProject();
                      onClose();
                    }}
                    isDisabled={!projectTitle.trim()}
                  >
                    Create Project
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}