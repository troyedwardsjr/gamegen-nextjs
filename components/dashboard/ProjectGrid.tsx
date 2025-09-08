"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { Chip } from '@heroui/chip';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';
// Pagination will be implemented with simple buttons
import { Badge } from '@heroui/badge';
import { Spinner } from '@heroui/spinner';
import { Tooltip } from '@heroui/tooltip';
import Link from 'next/link';
import Image from 'next/image';

import {
  SearchIcon,
  FilterIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  GridIcon,
  ListIcon,
  PlayIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  EyeIcon,
  EllipsisHorizontalIcon,
  CalendarDaysIcon,
  UserGroupIcon,
} from '@/components/icons';

import type {
  ProjectGridItem,
  ProjectFilter,
  ProjectSort,
  ProjectSearchResult,
} from '@/types/dashboard';

interface ProjectGridProps {
  projects: ProjectGridItem[];
  totalCount: number;
  loading?: boolean;
  onSearch: (query: string) => void;
  onFilter: (filters: ProjectFilter) => void;
  onSort: (sort: ProjectSort) => void;
  onPageChange: (page: number) => void;
  currentPage: number;
  pageSize: number;
  searchQuery?: string;
  currentFilters?: ProjectFilter;
  currentSort?: ProjectSort;
}

type ViewMode = 'grid' | 'list';

const PROJECT_STATUSES = [
  { key: 'draft', label: 'Draft', color: 'default' },
  { key: 'in_development', label: 'In Development', color: 'warning' },
  { key: 'testing', label: 'Testing', color: 'primary' },
  { key: 'published', label: 'Published', color: 'success' },
  { key: 'archived', label: 'Archived', color: 'danger' },
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
  { key: 'title_asc', label: 'Title (A-Z)', field: 'title', direction: 'asc' },
  { key: 'title_desc', label: 'Title (Z-A)', field: 'title', direction: 'desc' },
  { key: 'created_at_desc', label: 'Newest First', field: 'created_at', direction: 'desc' },
  { key: 'created_at_asc', label: 'Oldest First', field: 'created_at', direction: 'asc' },
  { key: 'updated_at_desc', label: 'Recently Modified', field: 'updated_at', direction: 'desc' },
  { key: 'play_count_desc', label: 'Most Played', field: 'play_count', direction: 'desc' },
  { key: 'like_count_desc', label: 'Most Liked', field: 'like_count', direction: 'desc' },
];

export default function ProjectGrid({
  projects,
  totalCount,
  loading = false,
  onSearch,
  onFilter,
  onSort,
  onPageChange,
  currentPage,
  pageSize,
  searchQuery = '',
  currentFilters = {},
  currentSort,
}: ProjectGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        onSearch(searchInput);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, onSearch]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (currentFilters.status?.length) count++;
    if (currentFilters.gameType?.length) count++;
    if (currentFilters.visibility?.length) count++;
    if (currentFilters.tags?.length) count++;
    if (currentFilters.dateRange) count++;
    return count;
  }, [currentFilters]);

  const handleStatusFilter = (statuses: string[]) => {
    onFilter({
      ...currentFilters,
      status: statuses.length > 0 ? statuses as any[] : undefined,
    });
  };

  const handleGameTypeFilter = (gameTypes: string[]) => {
    onFilter({
      ...currentFilters,
      gameType: gameTypes.length > 0 ? gameTypes as any[] : undefined,
    });
  };

  const handleSortChange = (sortKey: string) => {
    const sortOption = SORT_OPTIONS.find(option => option.key === sortKey);
    if (sortOption) {
      onSort({
        field: sortOption.field as any,
        direction: sortOption.direction as 'asc' | 'desc',
      });
    }
  };

  const getStatusColor = (status: string) => {
    const statusConfig = PROJECT_STATUSES.find(s => s.key === status);
    return statusConfig?.color || 'default';
  };

  const getStatusLabel = (status: string) => {
    const statusConfig = PROJECT_STATUSES.find(s => s.key === status);
    return statusConfig?.label || status;
  };

  const formatLastModified = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const ProjectCard = ({ project }: { project: ProjectGridItem }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all duration-300 group">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Link 
                href={`/creator/${project.slug}`}
                className="hover:text-purple-400 transition-colors"
              >
                <h3 className="text-lg font-semibold text-white truncate group-hover:text-purple-400">
                  {project.title}
                </h3>
              </Link>
              <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                {project.description || 'No description available'}
              </p>
            </div>
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                >
                  <EllipsisHorizontalIcon className="w-4 h-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key="edit">Edit Project</DropdownItem>
                <DropdownItem key="duplicate">Duplicate</DropdownItem>
                <DropdownItem key="export">Export</DropdownItem>
                <DropdownItem key="analytics">View Analytics</DropdownItem>
                <DropdownItem key="settings">Settings</DropdownItem>
                <DropdownItem key="delete" className="text-danger">Delete</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </CardHeader>
        
        <CardBody className="pt-0">
          {/* Project Thumbnail */}
          <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20">
            {project.thumbnail_url ? (
              <Image
                src={project.thumbnail_url}
                alt={project.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <GridIcon className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Chip
                size="sm"
                color={getStatusColor(project.status || 'draft') as any}
                variant="flat"
              >
                {getStatusLabel(project.status || 'draft')}
              </Chip>
            </div>
          </div>

          {/* Project Stats */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              {project.analyticsPreview && (
                <>
                  <div className="flex items-center space-x-1">
                    <PlayIcon className="w-4 h-4" />
                    <span>{project.analyticsPreview.plays}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HeartIcon className="w-4 h-4" />
                    <span>{project.analyticsPreview.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ChatBubbleLeftIcon className="w-4 h-4" />
                    <span>{project.analyticsPreview.comments}</span>
                  </div>
                </>
              )}
            </div>
            {project.collaborators && project.collaborators.length > 0 && (
              <Tooltip content={`${project.collaborators.length} collaborator(s)`}>
                <div className="flex items-center text-sm text-gray-400">
                  <UserGroupIcon className="w-4 h-4 mr-1" />
                  <span>{project.collaborators.length}</span>
                </div>
              </Tooltip>
            )}
          </div>

          {/* Project Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {project.tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  size="sm"
                  variant="flat"
                  className="text-xs"
                >
                  {tag}
                </Chip>
              ))}
              {project.tags.length > 3 && (
                <Chip size="sm" variant="flat" className="text-xs">
                  +{project.tags.length - 3}
                </Chip>
              )}
            </div>
          )}

          {/* Last Modified */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <CalendarDaysIcon className="w-4 h-4" />
              <span>{formatLastModified(project.lastModified)}</span>
            </div>
            <span className="capitalize">{project.game_type?.replace('_', ' ')}</span>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );

  const ProjectListItem = ({ project }: { project: ProjectGridItem }) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      layout
    >
      <Card className="bg-gradient-to-r from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all duration-300">
        <CardBody className="p-4">
          <div className="flex items-center space-x-4">
            {/* Thumbnail */}
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex-shrink-0">
              {project.thumbnail_url ? (
                <Image
                  src={project.thumbnail_url}
                  alt={project.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <GridIcon className="w-6 h-6 text-gray-500" />
                </div>
              )}
            </div>

            {/* Project Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Link 
                  href={`/creator/${project.slug}`}
                  className="hover:text-purple-400 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-white truncate">
                    {project.title}
                  </h3>
                </Link>
                <Chip
                  size="sm"
                  color={getStatusColor(project.status || 'draft') as any}
                  variant="flat"
                >
                  {getStatusLabel(project.status || 'draft')}
                </Chip>
              </div>
              <p className="text-gray-400 text-sm mb-2 line-clamp-1">
                {project.description || 'No description available'}
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span className="capitalize">{project.game_type?.replace('_', ' ')}</span>
                <span>{formatLastModified(project.lastModified)}</span>
                {project.collaborators && project.collaborators.length > 0 && (
                  <span>{project.collaborators.length} collaborator(s)</span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-400">
              {project.analyticsPreview && (
                <>
                  <div className="flex items-center space-x-1">
                    <PlayIcon className="w-4 h-4" />
                    <span>{project.analyticsPreview.plays}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HeartIcon className="w-4 h-4" />
                    <span>{project.analyticsPreview.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ChatBubbleLeftIcon className="w-4 h-4" />
                    <span>{project.analyticsPreview.comments}</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                >
                  <EllipsisHorizontalIcon className="w-4 h-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key="edit">Edit Project</DropdownItem>
                <DropdownItem key="duplicate">Duplicate</DropdownItem>
                <DropdownItem key="export">Export</DropdownItem>
                <DropdownItem key="analytics">View Analytics</DropdownItem>
                <DropdownItem key="settings">Settings</DropdownItem>
                <DropdownItem key="delete" className="text-danger">Delete</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            placeholder="Search projects..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            startContent={<SearchIcon className="w-4 h-4 text-gray-400" />}
            className="max-w-md"
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Filters */}
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

          {/* Sort */}
          <Select
            placeholder="Sort by"
            className="w-48"
            selectedKeys={currentSort ? [`${currentSort.field}_${currentSort.direction}`] : []}
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

          {/* View Mode */}
          <div className="flex border border-gray-600 rounded-lg overflow-hidden">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'solid' : 'ghost'}
              color={viewMode === 'grid' ? 'primary' : 'default'}
              onClick={() => setViewMode('grid')}
              isIconOnly
            >
              <GridIcon className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'solid' : 'ghost'}
              color={viewMode === 'list' ? 'primary' : 'default'}
              onClick={() => setViewMode('list')}
              isIconOnly
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 border border-purple-500/20 rounded-lg p-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <Select
              placeholder="Filter by Status"
              selectionMode="multiple"
              selectedKeys={(currentFilters.status || []).filter(s => s !== null)}
              onSelectionChange={(keys) => handleStatusFilter(Array.from(keys) as string[])}
            >
              {PROJECT_STATUSES.map((status) => (
                <SelectItem key={status.key}>
                  {status.label}
                </SelectItem>
              ))}
            </Select>

            {/* Game Type Filter */}
            <Select
              placeholder="Filter by Game Type"
              selectionMode="multiple"
              selectedKeys={currentFilters.gameType || []}
              onSelectionChange={(keys) => handleGameTypeFilter(Array.from(keys) as string[])}
            >
              {GAME_TYPES.map((type) => (
                <SelectItem key={type.key}>
                  {type.label}
                </SelectItem>
              ))}
            </Select>

            {/* Clear Filters */}
            <div className="flex items-center">
              <Button
                variant="ghost"
                color="danger"
                onClick={() => onFilter({})}
                disabled={activeFiltersCount === 0}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing {projects.length} of {totalCount} projects
        </p>
        {loading && <Spinner size="sm" />}
      </div>

      {/* Projects Grid/List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              </CardHeader>
              <CardBody>
                <div className="h-32 bg-gray-700 rounded mb-4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/3"></div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }>
          {projects.map((project) => (
            viewMode === 'grid' 
              ? <ProjectCard key={project.id} project={project} />
              : <ProjectListItem key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-12">
          <GridIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
          <p className="text-gray-400 mb-6">
            {searchQuery || activeFiltersCount > 0 
              ? "Try adjusting your search or filters"
              : "Create your first project to get started"
            }
          </p>
          <Link href="/creator">
            <Button
              color="primary"
              className="bg-gradient-to-r from-purple-500 to-purple-600"
            >
              Create New Project
            </Button>
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <Button
            size="sm"
            variant="bordered"
            isDisabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="bordered"
            isDisabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}