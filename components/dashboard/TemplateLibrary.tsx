"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Chip } from '@heroui/chip';
import { Badge } from '@heroui/badge';
import { Spinner } from '@heroui/spinner';
import { Tooltip } from '@heroui/tooltip';
import { Tabs, Tab } from '@heroui/tabs';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Switch } from '@heroui/switch';
import { Progress } from '@heroui/progress';
import Link from 'next/link';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';

import {
  SearchIcon,
  FilterIcon,
  StarIcon,
  DownloadIcon,
  PlayIcon,
  HeartIcon,
  EyeIcon,
  ClockIcon,
  UserIcon,
  TagIcon,
  SparklesIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  ShareIcon,
  TrophyIcon,
  PlusIcon,
  CameraIcon,
  ArrowUpIcon,
  ChartBarIcon,
} from '@/components/icons';

import type { GameTemplate, TemplateCategory } from '@/types/dashboard';
import { getTemplates, getFeaturedTemplates, getTemplateCategories, useTemplate, rateTemplate } from '@/lib/api/templates';

interface TemplateLibraryProps {
  onCreateFromTemplate?: (templateId: string, projectData: { title: string; description: string }) => void;
  onPreviewTemplate?: (template: GameTemplate) => void;
  enableInfiniteScroll?: boolean;
  showCreateFromGame?: boolean;
  className?: string;
}

interface TemplateFilters {
  category?: TemplateCategory[];
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
  gameType?: string[];
  isOfficial?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  minRating?: number;
  maxPrice?: number;
}

type SortField = 'created_at' | 'updated_at' | 'usage_count' | 'rating' | 'price' | 'title';
type SortDirection = 'asc' | 'desc';

const TEMPLATE_CATEGORIES = [
  { key: 'official', label: 'Official Templates', icon: '🏢' },
  { key: 'community', label: 'Community', icon: '👥' },
  { key: 'premium', label: 'Premium', icon: '💎' },
  { key: 'educational', label: 'Educational', icon: '🎓' },
  { key: 'experimental', label: 'Experimental', icon: '🧪' },
];

const DIFFICULTY_LEVELS = [
  { key: 'beginner', label: 'Beginner', color: 'success' },
  { key: 'intermediate', label: 'Intermediate', color: 'warning' },
  { key: 'advanced', label: 'Advanced', color: 'danger' },
];

const GAME_TYPES = [
  { key: 'bullet_hell', label: 'Bullet Hell' },
  { key: 'rpg', label: 'RPG' },
  { key: 'action_adventure', label: 'Action Adventure' },
  { key: 'team_deathmatch', label: 'Team Deathmatch' },
  { key: 'platformer', label: 'Platformer' },
  { key: 'puzzle', label: 'Puzzle' },
  { key: 'racing', label: 'Racing' },
  { key: 'strategy', label: 'Strategy' },
  { key: 'simulation', label: 'Simulation' },
  { key: 'other', label: 'Other' },
];

const SORT_OPTIONS = [
  { key: 'featured', label: 'Featured First', field: 'rating' as SortField, direction: 'desc' as SortDirection },
  { key: 'newest', label: 'Newest First', field: 'created_at' as SortField, direction: 'desc' as SortDirection },
  { key: 'most_used', label: 'Most Popular', field: 'usage_count' as SortField, direction: 'desc' as SortDirection },
  { key: 'highest_rated', label: 'Highest Rated', field: 'rating' as SortField, direction: 'desc' as SortDirection },
  { key: 'title_asc', label: 'Title (A-Z)', field: 'title' as SortField, direction: 'asc' as SortDirection },
  { key: 'title_desc', label: 'Title (Z-A)', field: 'title' as SortField, direction: 'desc' as SortDirection },
];

export default function TemplateLibrary({
  onCreateFromTemplate,
  onPreviewTemplate,
  enableInfiniteScroll = false,
  showCreateFromGame = true,
  className = '',
}: TemplateLibraryProps) {
  // State management
  const [templates, setTemplates] = useState<GameTemplate[]>([]);
  const [featuredTemplates, setFeaturedTemplates] = useState<GameTemplate[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination & filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<TemplateFilters>({});
  const [sortField, setSortField] = useState<SortField>('rating');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // UI state
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  
  // Modals
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isRatingOpen, onOpen: onRatingOpen, onClose: onRatingClose } = useDisclosure();
  const [createProjectData, setCreateProjectData] = useState({ title: '', description: '' });
  const [ratingData, setRatingData] = useState({ rating: 5, review: '' });
  
  // Infinite scroll
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle search and filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadTemplates(true);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, filters, sortField, sortDirection]);

  // Infinite scroll trigger
  useEffect(() => {
    if (enableInfiniteScroll && inView && hasNextPage && !loading && !loadingMore) {
      loadMoreTemplates();
    }
  }, [inView, hasNextPage, loading, loadingMore, enableInfiniteScroll]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all initial data in parallel
      const [templatesResult, featuredResult, categoriesResult] = await Promise.all([
        getTemplates({ page: 1, limit: 12 }),
        getFeaturedTemplates(6),
        getTemplateCategories(),
      ]);

      setTemplates(templatesResult.templates);
      setFeaturedTemplates(featuredResult.templates);
      setCategories(categoriesResult.categories || []);
      setTotalCount(templatesResult.totalCount);
      setHasNextPage(templatesResult.hasNextPage);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      console.error('Template library error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const params = {
        page: reset ? 1 : currentPage,
        limit: 12,
        search: searchQuery || undefined,
        sortField,
        sortDirection,
        ...filters,
      };

      const result = await getTemplates(params);

      if (reset) {
        setTemplates(result.templates);
        setCurrentPage(2);
      } else {
        setTemplates(prev => [...prev, ...result.templates]);
        setCurrentPage(prev => prev + 1);
      }

      setTotalCount(result.totalCount);
      setHasNextPage(result.hasNextPage);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
      console.error('Load templates error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreTemplates = () => {
    if (!loadingMore && hasNextPage) {
      loadTemplates(false);
    }
  };

  const handleSortChange = (sortKey: string) => {
    const option = SORT_OPTIONS.find(opt => opt.key === sortKey);
    if (option) {
      setSortField(option.field);
      setSortDirection(option.direction);
    }
  };

  const handleFilterChange = (newFilters: Partial<TemplateFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleTemplateAction = (template: GameTemplate, action: string) => {
    setSelectedTemplate(template);
    
    switch (action) {
      case 'preview':
        onPreviewTemplate?.(template);
        onPreviewOpen();
        break;
      case 'create':
        setCreateProjectData({ title: `New ${template.title}`, description: template.description });
        onCreateOpen();
        break;
      case 'rate':
        onRatingOpen();
        break;
    }
  };

  const handleCreateProject = async () => {
    if (!selectedTemplate) return;
    
    try {
      await useTemplate(selectedTemplate.id, {
        usageType: 'create_project',
        metadata: createProjectData,
      });

      onCreateFromTemplate?.(selectedTemplate.id, createProjectData);
      onCreateClose();
    } catch (err) {
      console.error('Create project error:', err);
    }
  };

  const handleRateTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      await rateTemplate(selectedTemplate.id, {
        rating: ratingData.rating,
        reviewText: ratingData.review,
      });

      // Update local template rating
      setTemplates(prev => prev.map(t => 
        t.id === selectedTemplate.id 
          ? { ...t, rating: ratingData.rating, ratingCount: (t.ratingCount || 0) + 1 }
          : t
      ));

      onRatingClose();
    } catch (err) {
      console.error('Rate template error:', err);
    }
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.category?.length) count++;
    if (filters.difficulty?.length) count++;
    if (filters.gameType?.length) count++;
    if (filters.isOfficial !== undefined) count++;
    if (filters.isFeatured !== undefined) count++;
    if (filters.tags?.length) count++;
    if (filters.minRating) count++;
    if (filters.maxPrice !== undefined) count++;
    return count;
  }, [filters]);

  const TemplateCard = ({ template }: { template: GameTemplate }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all duration-300 group">
        <CardHeader className="pb-2">
          <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20">
            {template.thumbnailUrl ? (
              <Image
                src={template.thumbnailUrl}
                alt={template.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <SparklesIcon className="w-12 h-12 text-gray-500" />
              </div>
            )}
            
            {/* Template badges */}
            <div className="absolute top-2 left-2 flex gap-1">
              {template.isOfficial && (
                <Chip size="sm" color="primary" variant="flat">
                  Official
                </Chip>
              )}
              {template.isFeatured && (
                <Chip size="sm" color="warning" variant="flat" startContent={<StarIcon className="w-3 h-3" />}>
                  Featured
                </Chip>
              )}
            </div>
            
            {/* Quick actions overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="solid"
                color="primary"
                startContent={<EyeIcon className="w-4 h-4" />}
                onClick={() => handleTemplateAction(template, 'preview')}
              >
                Preview
              </Button>
              <Button
                size="sm"
                variant="solid"
                color="success"
                startContent={<PlusIcon className="w-4 h-4" />}
                onClick={() => handleTemplateAction(template, 'create')}
              >
                Use
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-1">
                {template.title}
              </h3>
              <div className="flex items-center space-x-1 text-yellow-400 flex-shrink-0 ml-2">
                <StarIcon className="w-4 h-4" />
                <span className="text-sm font-medium">{template.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-xs text-gray-400">({template.ratingCount || 0})</span>
              </div>
            </div>
            
            <p className="text-gray-400 text-sm line-clamp-2">
              {template.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <DownloadIcon className="w-3 h-3" />
                  <span>{template.usageCount?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ClockIcon className="w-3 h-3" />
                  <span>{template.estimatedTimeToComplete}min</span>
                </div>
              </div>
              
              <Chip
                size="sm"
                color={
                  template.difficulty === 'beginner' ? 'success' :
                  template.difficulty === 'intermediate' ? 'warning' : 'danger'
                }
                variant="flat"
              >
                {template.difficulty}
              </Chip>
            </div>
            
            {/* Author info */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                {template.author?.avatarUrl ? (
                  <Image
                    src={template.author.avatarUrl}
                    alt={template.author.displayName}
                    width={24}
                    height={24}
                    className="object-cover"
                  />
                ) : (
                  <UserIcon className="w-3 h-3 text-white" />
                )}
              </div>
              <span className="text-xs text-gray-400">by {template.author?.displayName || 'Anonymous'}</span>
            </div>
            
            {/* Tags */}
            {template.tags && template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
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
          </div>
        </CardHeader>
      </Card>
    </motion.div>
  );

  return (
    <>
      {/* Modals */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose}>
        <ModalContent>
          <ModalHeader>Create Project from Template</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <p className="text-gray-300 mb-4">
                  Create a new project using "{selectedTemplate?.title}":
                </p>
                <Input
                  label="Project Title"
                  value={createProjectData.title}
                  onChange={(e) => setCreateProjectData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter project title"
                />
              </div>
              <div>
                <Input
                  label="Project Description"
                  value={createProjectData.description}
                  onChange={(e) => setCreateProjectData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter project description"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onClick={onCreateClose}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onClick={handleCreateProject}
              isDisabled={!createProjectData.title.trim()}
            >
              Create Project
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isRatingOpen} onClose={onRatingClose}>
        <ModalContent>
          <ModalHeader>Rate Template</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <p className="text-gray-300 mb-4">
                  Rate "{selectedTemplate?.title}":
                </p>
                <div className="flex items-center space-x-1 mb-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Button
                      key={i}
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      onClick={() => setRatingData(prev => ({ ...prev, rating: i + 1 }))}
                      className={`${i < ratingData.rating ? 'text-yellow-400' : 'text-gray-500'} hover:text-yellow-400`}
                    >
                      <StarIcon className="w-5 h-5" />
                    </Button>
                  ))}
                  <span className="ml-2 text-white">{ratingData.rating} star{ratingData.rating !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div>
                <Input
                  label="Review (Optional)"
                  value={ratingData.review}
                  onChange={(e) => setRatingData(prev => ({ ...prev, review: e.target.value }))}
                  placeholder="Share your thoughts about this template..."
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="bordered" onClick={onRatingClose}>
              Cancel
            </Button>
            <Button color="primary" onClick={handleRateTemplate}>
              Submit Rating
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Template Library</h2>
            <p className="text-gray-400">
              Discover and use game templates to jumpstart your projects
            </p>
          </div>
          {showCreateFromGame && (
            <Button
              color="primary"
              startContent={<ArrowUpIcon className="w-4 h-4" />}
              className="bg-gradient-to-r from-purple-500 to-purple-600"
            >
              Create Template
            </Button>
          )}
        </div>

        {/* Featured Templates Section */}
        {activeTab === 'all' && featuredTemplates.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="w-5 h-5 text-yellow-400" />
              <h3 className="text-xl font-semibold text-white">Featured Templates</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTemplates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search templates by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<SearchIcon className="w-4 h-4 text-gray-400" />}
              isClearable
              onClear={() => setSearchQuery('')}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="bordered"
              startContent={<FilterIcon className="w-4 h-4" />}
              onClick={() => setShowFilters(!showFilters)}
              className={`${
                activeFiltersCount > 0 
                  ? 'border-purple-500 text-purple-400' 
                  : 'border-gray-600 text-gray-400'
              }`}
            >
              Filters
              {activeFiltersCount > 0 && (
                <Badge color="primary" size="sm">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            <Select
              placeholder="Sort by"
              className="w-48"
              selectedKeys={[`${sortField}_${sortDirection}`]}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                if (selected) handleSortChange(selected);
              }}
            >
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.key}>
                  {option.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 border border-purple-500/20 rounded-lg p-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select
                  placeholder="Filter by Category"
                  selectionMode="multiple"
                  selectedKeys={filters.category || []}
                  onSelectionChange={(keys) => handleFilterChange({ category: Array.from(keys) as TemplateCategory[] })}
                >
                  {TEMPLATE_CATEGORIES.map((category) => (
                    <SelectItem key={category.key}>
                      {category.icon} {category.label}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  placeholder="Filter by Difficulty"
                  selectionMode="multiple"
                  selectedKeys={filters.difficulty || []}
                  onSelectionChange={(keys) => handleFilterChange({ difficulty: Array.from(keys) as any[] })}
                >
                  {DIFFICULTY_LEVELS.map((level) => (
                    <SelectItem key={level.key}>
                      {level.label}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  placeholder="Filter by Game Type"
                  selectionMode="multiple"
                  selectedKeys={filters.gameType || []}
                  onSelectionChange={(keys) => handleFilterChange({ gameType: Array.from(keys) as string[] })}
                >
                  {GAME_TYPES.map((type) => (
                    <SelectItem key={type.key}>
                      {type.label}
                    </SelectItem>
                  ))}
                </Select>

                <div className="flex items-center space-x-2">
                  <Switch
                    isSelected={filters.isOfficial}
                    onValueChange={(checked) => handleFilterChange({ isOfficial: checked || undefined })}
                  >
                    Official Only
                  </Switch>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  color="danger"
                  onClick={() => setFilters({})}
                  disabled={activeFiltersCount === 0}
                >
                  Clear All Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {loading ? 'Loading...' : `Showing ${templates.length} of ${totalCount} templates`}
            </p>
            {loading && <Spinner size="sm" />}
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-400 font-medium">Error loading templates</p>
              <p className="text-red-300 text-sm">{error}</p>
              <Button
                size="sm"
                variant="bordered"
                className="mt-2 border-red-500/50 text-red-400"
                onClick={() => loadInitialData()}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Templates Grid */}
          {!loading || templates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {templates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array(8).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-40 bg-gray-700 rounded mb-4"></div>
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && templates.length === 0 && !error && (
            <div className="text-center py-12">
              <SparklesIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No templates found</h3>
              <p className="text-gray-400 mb-6">
                {searchQuery || activeFiltersCount > 0 
                  ? "Try adjusting your search or filters"
                  : "No templates are available at the moment"
                }
              </p>
              {(searchQuery || activeFiltersCount > 0) && (
                <Button
                  variant="bordered"
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({});
                  }}
                  className="border-purple-500/50 text-purple-400"
                >
                  Clear Search & Filters
                </Button>
              )}
            </div>
          )}

          {/* Load More / Infinite Scroll */}
          {enableInfiniteScroll ? (
            hasNextPage && (
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {loadingMore ? (
                  <div className="flex items-center space-x-2">
                    <Spinner size="sm" color="primary" />
                    <span className="text-gray-400">Loading more templates...</span>
                  </div>
                ) : (
                  <Button
                    variant="bordered"
                    onClick={loadMoreTemplates}
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                  >
                    Load More Templates
                  </Button>
                )}
              </div>
            )
          ) : (
            hasNextPage && (
              <div className="flex justify-center">
                <Button
                  variant="bordered"
                  onClick={loadMoreTemplates}
                  isLoading={loadingMore}
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  Load More Templates
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </>
  );
}