"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Select, SelectItem } from '@heroui/select';
import { Input } from '@heroui/input';
// Using Input with multiple rows instead of Textarea
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { Badge } from '@heroui/badge';
import { Divider } from '@heroui/divider';
import Link from 'next/link';
import Image from 'next/image';

import {
  PlusIcon,
  SparklesIcon,
  GameIcon,
  CloudArrowUpIcon,
  FolderIcon,
  DocumentDuplicateIcon,
  RocketLaunchIcon,
  StarIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
} from '@/components/icons';

import type { GameTemplate, TemplateCategory } from '@/types/dashboard';

interface QuickActionsProps {
  templates: GameTemplate[];
  loading?: boolean;
  onCreateFromTemplate: (templateId: string, projectData: {
    title: string;
    description: string;
  }) => Promise<void>;
  onCreateBlank: () => void;
  onImportProject: (file: File) => void;
}

const TEMPLATE_CATEGORIES: { key: TemplateCategory; label: string; icon: React.ComponentType<any> }[] = [
  { key: 'official', label: 'Official Templates', icon: StarIcon },
  { key: 'popular', label: 'Popular', icon: RocketLaunchIcon },
  { key: 'beginner', label: 'Beginner Friendly', icon: UserIcon },
  { key: 'educational', label: 'Educational', icon: GameIcon },
  { key: 'game_jams', label: 'Game Jams', icon: SparklesIcon },
  { key: 'experimental', label: 'Experimental', icon: SparklesIcon },
  { key: 'community', label: 'Community', icon: UserIcon },
];

const QUICK_ACTIONS = [
  {
    id: 'blank-project',
    title: 'Blank Project',
    description: 'Start from scratch with a clean slate',
    icon: PlusIcon,
    color: 'from-purple-500 to-purple-600',
    action: 'create-blank',
  },
  {
    id: 'from-template',
    title: 'From Template',
    description: 'Choose from our curated templates',
    icon: SparklesIcon,
    color: 'from-blue-500 to-blue-600',
    action: 'show-templates',
  },
  {
    id: 'import-project',
    title: 'Import Project',
    description: 'Upload an existing project file',
    icon: CloudArrowUpIcon,
    color: 'from-green-500 to-green-600',
    action: 'import',
  },
  {
    id: 'duplicate-project',
    title: 'Duplicate Existing',
    description: 'Create a copy of your existing project',
    icon: DocumentDuplicateIcon,
    color: 'from-orange-500 to-orange-600',
    action: 'duplicate',
  },
];

export default function QuickActions({
  templates,
  loading = false,
  onCreateFromTemplate,
  onCreateBlank,
  onImportProject,
}: QuickActionsProps) {
  const { isOpen: isTemplatesOpen, onOpen: onTemplatesOpen, onClose: onTemplatesClose } = useDisclosure();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('official');
  const [creating, setCreating] = useState(false);

  const filteredTemplates = templates.filter(template => 
    selectedCategory === 'official' ? template.isOfficial : template.category === selectedCategory
  );

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-blank':
        onCreateBlank();
        break;
      case 'show-templates':
        onTemplatesOpen();
        break;
      case 'import':
        // Trigger file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.zip';
        fileInput.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) onImportProject(file);
        };
        fileInput.click();
        break;
      case 'duplicate':
        // Navigate to project selection for duplication
        window.location.href = '/dashboard/projects?action=duplicate';
        break;
    }
  };

  const handleTemplateSelect = (template: GameTemplate) => {
    setSelectedTemplate(template);
    setProjectTitle(`${template.title} - Copy`);
    setProjectDescription(template.description);
    onTemplatesClose();
    onCreateOpen();
  };

  const handleCreateProject = async () => {
    if (!selectedTemplate) return;

    setCreating(true);
    try {
      await onCreateFromTemplate(selectedTemplate.id, {
        title: projectTitle,
        description: projectDescription,
      });
      onCreateClose();
      setSelectedTemplate(null);
      setProjectTitle('');
      setProjectDescription('');
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setCreating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'success';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatEstimatedTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <>
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
        <CardHeader>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <RocketLaunchIcon className="w-5 h-5 text-purple-400" />
            Quick Actions
          </h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card 
                    isPressable
                    className="h-full bg-gradient-to-br from-gray-800/50 to-gray-700/30 border-gray-600/30 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group"
                    onClick={() => handleQuickAction(action.action)}
                  >
                    <CardBody className="p-4 text-center">
                      <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                        {action.title}
                      </h4>
                      <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                        {action.description}
                      </p>
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Templates Modal */}
      <Modal 
        isOpen={isTemplatesOpen} 
        onClose={onTemplatesClose}
        size="5xl"
        scrollBehavior="inside"
        className="bg-gray-900"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-white">Choose a Template</h2>
                <p className="text-gray-400">Start your project with a pre-built template</p>
              </ModalHeader>
              <ModalBody>
                {/* Template Categories */}
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATE_CATEGORIES.map((category) => {
                      const IconComponent = category.icon;
                      return (
                        <Button
                          key={category.key}
                          variant={selectedCategory === category.key ? 'solid' : 'bordered'}
                          color={selectedCategory === category.key ? 'primary' : 'default'}
                          size="sm"
                          startContent={<IconComponent className="w-4 h-4" />}
                          onClick={() => setSelectedCategory(category.key)}
                        >
                          {category.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Templates Grid */}
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {filteredTemplates.map((template) => (
                      <Card
                        key={template.id}
                        isPressable
                        className="bg-gradient-to-br from-gray-800/50 to-gray-700/30 border-gray-600/30 hover:border-purple-500/50 transition-all duration-300 cursor-pointer"
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardHeader className="pb-2">
                          {template.thumbnailUrl && (
                            <div className="relative w-full h-32 mb-3 rounded-lg overflow-hidden">
                              <Image
                                src={template.thumbnailUrl}
                                alt={template.title}
                                fill
                                className="object-cover"
                              />
                              {template.isFeatured && (
                                <div className="absolute top-2 right-2">
                                  <Chip size="sm" color="warning" variant="flat">
                                    Featured
                                  </Chip>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-white truncate">{template.title}</h4>
                            {template.isOfficial && (
                              <Badge color="primary" size="sm">✓</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                            {template.description}
                          </p>
                        </CardHeader>
                        <CardBody className="pt-0">
                          <div className="flex items-center justify-between mb-3">
                            <Chip
                              size="sm"
                              color={getDifficultyColor(template.difficulty)}
                              variant="flat"
                            >
                              {template.difficulty}
                            </Chip>
                            <div className="flex items-center text-xs text-gray-500">
                              <ClockIcon className="w-3 h-3 mr-1" />
                              {formatEstimatedTime(template.estimatedTimeToComplete)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <StarIcon className="w-4 h-4 text-yellow-400" />
                              <span>{template.rating.toFixed(1)}</span>
                              <span>({template.ratingCount})</span>
                            </div>
                            <span>{template.usageCount} uses</span>
                          </div>

                          {template.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {template.tags.slice(0, 3).map((tag) => (
                                <Chip key={tag} size="sm" variant="flat" className="text-xs">
                                  {tag}
                                </Chip>
                              ))}
                              {template.tags.length > 3 && (
                                <Chip size="sm" variant="flat" className="text-xs">
                                  +{template.tags.length - 3}
                                </Chip>
                              )}
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}

                {!loading && filteredTemplates.length === 0 && (
                  <div className="text-center py-8">
                    <GameIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">No templates found</h4>
                    <p className="text-gray-400">
                      Try selecting a different category or check back later for new templates.
                    </p>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="bordered" onClick={onClose}>
                  Cancel
                </Button>
                <Link href="/templates">
                  <Button color="primary">
                    Browse All Templates
                  </Button>
                </Link>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Create Project Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <h2 className="text-xl font-bold text-white">
                  Create Project from Template
                </h2>
              </ModalHeader>
              <ModalBody>
                {selectedTemplate && (
                  <div className="space-y-4">
                    {/* Template Preview */}
                    <Card className="bg-gray-800/50">
                      <CardBody className="p-4">
                        <div className="flex items-center space-x-3">
                          {selectedTemplate.thumbnailUrl && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                              <Image
                                src={selectedTemplate.thumbnailUrl}
                                alt={selectedTemplate.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-white">
                              {selectedTemplate.title}
                            </h4>
                            <p className="text-sm text-gray-400">
                              {selectedTemplate.author.displayName}
                            </p>
                            <Chip
                              size="sm"
                              color={getDifficultyColor(selectedTemplate.difficulty)}
                              variant="flat"
                            >
                              {selectedTemplate.difficulty}
                            </Chip>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    <Divider />

                    {/* Project Configuration */}
                    <div className="space-y-4">
                      <Input
                        label="Project Title"
                        placeholder="Enter your project title"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        isRequired
                      />
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-200">
                          Project Description
                        </label>
                        <textarea
                          className="w-full min-h-24 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Describe what your project will be about"
                          value={projectDescription}
                          onChange={(e) => setProjectDescription(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="bordered" onClick={onClose} disabled={creating}>
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onClick={handleCreateProject}
                  disabled={!projectTitle.trim() || creating}
                  className="bg-gradient-to-r from-purple-500 to-purple-600"
                >
                  {creating ? (
                    <>
                      <Spinner size="sm" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <RocketLaunchIcon className="w-4 h-4" />
                      Create Project
                    </>
                  )}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}