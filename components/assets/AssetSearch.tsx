"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

import {
  AssetSearchQuery,
  AssetFilter,
  AssetType,
  AssetSource,
  AssetQuality,
  AssetSortField,
} from "@/types/assets";
import { GlassmorphicInput } from "@/components/ui/GlassmorphicInput";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";

// Default filters configuration
const DEFAULT_FILTERS: AssetFilter[] = [
  {
    id: "types",
    label: "Asset Types",
    type: "multiselect",
    options: [
      { value: "sprite", label: "Sprites", icon: "🎨" },
      { value: "tileset", label: "Tilesets", icon: "🧱" },
      { value: "sound", label: "Sounds", icon: "🔊" },
      { value: "music", label: "Music", icon: "🎵" },
      { value: "animation", label: "Animations", icon: "🎬" },
      { value: "font", label: "Fonts", icon: "🔤" },
      { value: "shader", label: "Shaders", icon: "✨" },
      { value: "texture", label: "Textures", icon: "🖼️" },
    ],
  },
  {
    id: "sources",
    label: "Source",
    type: "multiselect",
    options: [
      { value: "user", label: "User Created", icon: "👤" },
      { value: "ai_generated", label: "AI Generated", icon: "🤖" },
      { value: "template", label: "Templates", icon: "📄" },
      { value: "community", label: "Community", icon: "👥" },
      { value: "marketplace", label: "Marketplace", icon: "🛒" },
    ],
  },
  {
    id: "quality",
    label: "Quality",
    type: "multiselect",
    options: [
      { value: "ultra", label: "Ultra", color: "purple" },
      { value: "high", label: "High", color: "blue" },
      { value: "medium", label: "Medium", color: "green" },
      { value: "low", label: "Low", color: "orange" },
    ],
  },
  {
    id: "fileSize",
    label: "File Size (MB)",
    type: "range",
    min: 0,
    max: 100,
    step: 0.1,
    isAdvanced: true,
  },
  {
    id: "dimensions",
    label: "Dimensions",
    type: "range",
    min: 16,
    max: 4096,
    step: 16,
    isAdvanced: true,
  },
  {
    id: "usage",
    label: "Usage",
    type: "radio",
    options: [
      { value: "all", label: "All Assets" },
      { value: "used", label: "In Use" },
      { value: "unused", label: "Unused" },
    ],
    isAdvanced: true,
  },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "name", label: "Name" },
  { value: "createdAt", label: "Date Created" },
  { value: "updatedAt", label: "Date Modified" },
  { value: "size", label: "File Size" },
  { value: "usageCount", label: "Usage Count" },
  { value: "qualityScore", label: "Quality Score" },
];

interface AssetSearchProps {
  onSearch: (query: AssetSearchQuery) => void;
  onClear: () => void;
  suggestions?: string[];
  loading?: boolean;
  resultCount?: number;
  className?: string;
}

// Custom hook for debounced search
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Filter component
const FilterSection = ({
  filter,
  value,
  onChange,
}: {
  filter: AssetFilter;
  value: unknown;
  onChange: (value: unknown) => void;
}) => {
  switch (filter.type) {
    case "multiselect":
      const selectedValues = (value as string[]) || [];

      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">
            {filter.label}
          </label>
          <div className="grid grid-cols-2 gap-1">
            {filter.options?.map((option) => {
              const isSelected = selectedValues.includes(option.value);

              return (
                <button
                  key={option.value}
                  className={clsx(
                    "flex items-center space-x-2 p-2 rounded-lg text-sm transition-colors text-left",
                    isSelected
                      ? "bg-purple-500/30 text-purple-200 border border-purple-400/30"
                      : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10",
                  )}
                  onClick={() => {
                    const newValue = isSelected
                      ? selectedValues.filter((v) => v !== option.value)
                      : [...selectedValues, option.value];

                    onChange(newValue);
                  }}
                >
                  {option.icon && (
                    <span className="text-xs">{option.icon}</span>
                  )}
                  <span className="flex-1">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      );

    case "radio":
      const selectedValue = (value as string) || filter.options?.[0]?.value;

      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">
            {filter.label}
          </label>
          <div className="space-y-1">
            {filter.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  checked={selectedValue === option.value}
                  className="w-4 h-4 text-purple-400 bg-transparent border-white/30 focus:ring-purple-400"
                  name={filter.id}
                  type="radio"
                  value={option.value}
                  onChange={() => onChange(option.value)}
                />
                <span className="text-sm text-white/70">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case "range":
      const rangeValue = (value as { min?: number; max?: number }) || {};

      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">
            {filter.label}
          </label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white/90 placeholder-white/50"
                max={filter.max}
                min={filter.min}
                placeholder="Min"
                step={filter.step}
                type="number"
                value={rangeValue.min || ""}
                onChange={(e) =>
                  onChange({
                    ...rangeValue,
                    min: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
              />
              <span className="text-white/50">to</span>
              <input
                className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-sm text-white/90 placeholder-white/50"
                max={filter.max}
                min={filter.min}
                placeholder="Max"
                step={filter.step}
                type="number"
                value={rangeValue.max || ""}
                onChange={(e) =>
                  onChange({
                    ...rangeValue,
                    max: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

export function AssetSearch({
  onSearch,
  onClear,
  suggestions = [],
  loading = false,
  resultCount = 0,
  className,
}: AssetSearchProps) {
  const [searchText, setSearchText] = useState("");
  const [semanticSearch, setSemanticSearch] = useState(false);
  const [sortBy, setSortBy] = useState<AssetSortField>("relevance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, unknown>>(
    {},
  );
  const [showSuggestions, setShowSuggestions] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchText = useDebounce(searchText, 300);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    return Object.values(activeFilters).reduce((count: number, value) => {
      if (Array.isArray(value)) return count + (value.length > 0 ? 1 : 0);
      if (typeof value === "object" && value !== null) {
        const rangeValue = value as { min?: number; max?: number };

        return (
          count +
          (rangeValue.min !== undefined || rangeValue.max !== undefined ? 1 : 0)
        );
      }

      return count + (value ? 1 : 0);
    }, 0);
  }, [activeFilters]);

  // Build search query
  const buildSearchQuery = useCallback((): AssetSearchQuery => {
    const query: AssetSearchQuery = {
      text: debouncedSearchText || undefined,
      semanticSearch,
      sortBy,
      sortOrder,
    };

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (!value) return;

      switch (key) {
        case "types":
          if (Array.isArray(value) && value.length > 0) {
            query.types = value as AssetType[];
          }
          break;
        case "sources":
          if (Array.isArray(value) && value.length > 0) {
            query.sources = value as AssetSource[];
          }
          break;
        case "quality":
          if (Array.isArray(value) && value.length > 0) {
            query.quality = value as AssetQuality[];
          }
          break;
        case "fileSize":
          const sizeRange = value as { min?: number; max?: number };

          if (sizeRange.min !== undefined || sizeRange.max !== undefined) {
            query.sizeRange = {
              min: sizeRange.min ? sizeRange.min * 1024 * 1024 : undefined, // Convert to bytes
              max: sizeRange.max ? sizeRange.max * 1024 * 1024 : undefined,
            };
          }
          break;
        case "dimensions":
          const dimRange = value as { min?: number; max?: number };

          if (dimRange.min !== undefined || dimRange.max !== undefined) {
            query.dimensionRange = {
              minWidth: dimRange.min,
              maxWidth: dimRange.max,
              minHeight: dimRange.min,
              maxHeight: dimRange.max,
            };
          }
          break;
        case "usage":
          const usageValue = value as string;

          if (usageValue === "used") {
            query.usage = { inUse: true };
          } else if (usageValue === "unused") {
            query.usage = { inUse: false };
          }
          break;
      }
    });

    return query;
  }, [debouncedSearchText, semanticSearch, sortBy, sortOrder, activeFilters]);

  // Trigger search when query changes
  useEffect(() => {
    const query = buildSearchQuery();

    onSearch(query);
  }, [buildSearchQuery, onSearch]);

  // Handle filter changes
  const handleFilterChange = useCallback((filterId: string, value: unknown) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterId]: value,
    }));
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setActiveFilters({});
    setSearchText("");
    setSemanticSearch(false);
    setSortBy("relevance");
    setSortOrder("desc");
    onClear();
  }, [onClear]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setSearchText(suggestion);
    setShowSuggestions(false);
    searchInputRef.current?.focus();
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const basicFilters = DEFAULT_FILTERS.filter((f) => !f.isAdvanced);
  const advancedFilters = DEFAULT_FILTERS.filter((f) => f.isAdvanced);

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <GlassmorphicInput
          ref={searchInputRef}
          className="pr-24"
          placeholder="Search assets... (⌘+K)"
          value={searchText}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onChange={(e) => setSearchText(e.target.value)}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
        />

        {/* Search mode toggle */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          <button
            className={clsx(
              "px-2 py-1 text-xs rounded transition-colors",
              semanticSearch
                ? "bg-purple-500/30 text-purple-200"
                : "bg-white/10 text-white/60 hover:bg-white/20",
            )}
            title={
              semanticSearch ? "Using AI semantic search" : "Using text search"
            }
            onClick={() => setSemanticSearch(!semanticSearch)}
          >
            {semanticSearch ? "🧠" : "🔍"}
          </button>
        </div>

        {/* Search Suggestions */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-1 z-10"
              exit={{ opacity: 0, y: -10 }}
              initial={{ opacity: 0, y: -10 }}
            >
              <GlassmorphicCard className="p-2" variant="default">
                <div className="text-xs text-white/60 mb-2">Suggestions</div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-2 py-1 text-sm text-white/80 hover:bg-white/10 rounded"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </GlassmorphicCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Sort Controls */}
          {/* TODO: Fix GlassmorphicDropdown trigger type compatibility */}
          <div className="relative">
            <GlassmorphicButton size="sm" variant="glass">
              Sort: {SORT_OPTIONS.find((opt) => opt.value === sortBy)?.label}
            </GlassmorphicButton>
            {/* Dropdown items would go here in a real implementation */}
          </div>

          <GlassmorphicButton
            size="sm"
            variant="glass"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </GlassmorphicButton>

          {/* Advanced Filters Toggle */}
          <GlassmorphicButton
            size="sm"
            variant={showAdvanced ? "gaming" : "glass"}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            Advanced
            {activeFilterCount > 0 && (
              <GlassmorphicBadge className="ml-1" size="sm" variant="gaming">
                {activeFilterCount}
              </GlassmorphicBadge>
            )}
          </GlassmorphicButton>
        </div>

        <div className="flex items-center space-x-2">
          {/* Result Count */}
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent" />
              <span className="text-sm text-white/60">Searching...</span>
            </div>
          ) : (
            <span className="text-sm text-white/60">
              {resultCount} assets found
            </span>
          )}

          {/* Clear Filters */}
          {(activeFilterCount > 0 || searchText) && (
            <GlassmorphicButton
              size="sm"
              variant="danger"
              onClick={handleClearFilters}
            >
              Clear All
            </GlassmorphicButton>
          )}
        </div>
      </div>

      {/* Basic Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {basicFilters.map((filter) => (
          <FilterSection
            key={filter.id}
            filter={filter}
            value={activeFilters[filter.id]}
            onChange={(value) => handleFilterChange(filter.id, value)}
          />
        ))}
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
          >
            <GlassmorphicCard className="p-4" variant="subtle">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {advancedFilters.map((filter) => (
                  <FilterSection
                    key={filter.id}
                    filter={filter}
                    value={activeFilters[filter.id]}
                    onChange={(value) => handleFilterChange(filter.id, value)}
                  />
                ))}
              </div>
            </GlassmorphicCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value) return null;

            const filter = DEFAULT_FILTERS.find((f) => f.id === key);

            if (!filter) return null;

            let displayValue = "";

            if (Array.isArray(value)) {
              displayValue = `${value.length} selected`;
            } else if (typeof value === "object") {
              const rangeValue = value as { min?: number; max?: number };

              if (
                rangeValue.min !== undefined &&
                rangeValue.max !== undefined
              ) {
                displayValue = `${rangeValue.min} - ${rangeValue.max}`;
              } else if (rangeValue.min !== undefined) {
                displayValue = `≥ ${rangeValue.min}`;
              } else if (rangeValue.max !== undefined) {
                displayValue = `≤ ${rangeValue.max}`;
              }
            } else {
              displayValue = String(value);
            }

            return (
              <GlassmorphicBadge
                key={key}
                className="cursor-pointer"
                size="sm"
                variant="gaming"
                onClick={() => handleFilterChange(key, undefined)}
              >
                {filter.label}: {displayValue} ×
              </GlassmorphicBadge>
            );
          })}
        </div>
      )}
    </div>
  );
}
