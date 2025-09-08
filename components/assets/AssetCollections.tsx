"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";

import { AssetCollection } from "@/types/assets";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";
import { GlassmorphicInput } from "@/components/ui/GlassmorphicInput";

// Mock collections data
const mockCollections: AssetCollection[] = [
  {
    id: "system-all",
    name: "All Assets",
    description: "All assets in your library",
    isSystem: true,
    ownerId: "user-1",
    assetIds: ["1", "2", "3", "4", "5"],
    tags: [],
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    assetCount: 5,
  },
  {
    id: "system-recent",
    name: "Recently Added",
    description: "Assets added in the last 7 days",
    isSystem: true,
    ownerId: "user-1",
    assetIds: ["1", "2"],
    tags: [],
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    assetCount: 2,
  },
  {
    id: "system-favorites",
    name: "Favorites",
    description: "Your starred assets",
    isSystem: true,
    ownerId: "user-1",
    assetIds: ["1", "3"],
    tags: [],
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    assetCount: 2,
  },
  {
    id: "user-cyberpunk",
    name: "Cyberpunk Theme",
    description: "Assets for cyberpunk-style games",
    color: "#8b5cf6",
    icon: "🌆",
    isSystem: false,
    ownerId: "user-1",
    assetIds: ["2", "4"],
    tags: ["cyberpunk", "neon", "futuristic"],
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    assetCount: 2,
  },
  {
    id: "user-characters",
    name: "Character Sprites",
    description: "Player and NPC character sprites",
    color: "#10b981",
    icon: "👤",
    isSystem: false,
    ownerId: "user-1",
    assetIds: ["1", "5"],
    tags: ["character", "sprite", "player"],
    isPublic: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    assetCount: 2,
  },
];

// System collection icons
const SYSTEM_ICONS: Record<string, string> = {
  "system-all": "📁",
  "system-recent": "⏰",
  "system-favorites": "⭐",
  "system-trash": "🗑️",
  "system-shared": "👥",
};

// Color palette for collections
const COLLECTION_COLORS = [
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#6366f1", // Indigo
  "#84cc16", // Lime
];

interface CollectionItemProps {
  collection: AssetCollection;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
  showOptions?: boolean;
}

const CollectionItem = ({
  collection,
  isSelected,
  onClick,
  onEdit,
  onDelete,
  onShare,
  showOptions = true,
}: CollectionItemProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const getIcon = () => {
    if (collection.isSystem) {
      return SYSTEM_ICONS[collection.id] || "📁";
    }

    return collection.icon || "📂";
  };

  const getColor = () => {
    return collection.color || "#6b7280";
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <GlassmorphicCard
        className={clsx(
          "relative cursor-pointer transition-all duration-200 p-4",
          isSelected && "ring-2 ring-purple-400/60 bg-purple-500/10",
        )}
        hover={true}
        variant="subtle"
        onClick={onClick}
      >
        {/* Collection Icon and Info */}
        <div className="flex items-start space-x-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
            style={{
              backgroundColor: `${getColor()}20`,
              border: `1px solid ${getColor()}40`,
            }}
          >
            <span>{getIcon()}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white/90 truncate">
                  {collection.name}
                </h3>
                <p className="text-xs text-white/60 mt-1 line-clamp-2">
                  {collection.description}
                </p>
              </div>

              {/* Options Menu */}
              {showOptions && !collection.isSystem && isHovered && (
                <div className="flex items-center space-x-1 ml-2">
                  {onShare && (
                    <GlassmorphicButton
                      size="sm"
                      variant="glass-ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onShare();
                      }}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    </GlassmorphicButton>
                  )}
                  {onEdit && (
                    <GlassmorphicButton
                      size="sm"
                      variant="glass-ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    </GlassmorphicButton>
                  )}
                  {onDelete && (
                    <GlassmorphicButton
                      size="sm"
                      variant="glass-ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    </GlassmorphicButton>
                  )}
                </div>
              )}
            </div>

            {/* Asset Count and Status */}
            <div className="flex items-center justify-between mt-3">
              <GlassmorphicBadge size="sm" variant="default">
                {collection.assetCount} assets
              </GlassmorphicBadge>

              <div className="flex items-center space-x-2">
                {collection.isPublic && (
                  <GlassmorphicBadge size="sm" variant="success">
                    Public
                  </GlassmorphicBadge>
                )}
                {collection.isSystem && (
                  <GlassmorphicBadge size="sm" variant="default">
                    System
                  </GlassmorphicBadge>
                )}
              </div>
            </div>

            {/* Tags */}
            {collection.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {collection.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 bg-white/10 text-white/70 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {collection.tags.length > 3 && (
                  <span className="text-xs text-white/50">
                    +{collection.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </GlassmorphicCard>
    </motion.div>
  );
};

// Collection creation/editing modal
const CollectionModal = ({
  collection,
  isOpen,
  onClose,
  onSave,
}: {
  collection?: AssetCollection;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<AssetCollection>) => void;
}) => {
  const [formData, setFormData] = useState({
    name: collection?.name || "",
    description: collection?.description || "",
    color: collection?.color || COLLECTION_COLORS[0],
    icon: collection?.icon || "📂",
    isPublic: collection?.isPublic || false,
  });

  const handleSave = useCallback(() => {
    if (formData.name.trim()) {
      onSave(formData);
      onClose();
    }
  }, [formData, onSave, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
        exit={{ opacity: 0, scale: 0.9 }}
        initial={{ opacity: 0, scale: 0.9 }}
      >
        <GlassmorphicCard className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white/90">
                {collection ? "Edit Collection" : "Create Collection"}
              </h2>
              <GlassmorphicButton
                size="sm"
                variant="glass-ghost"
                onClick={onClose}
              >
                ×
              </GlassmorphicButton>
            </div>

            {/* Collection Name */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Collection Name
              </label>
              <GlassmorphicInput
                className="w-full"
                placeholder="Enter collection name..."
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Description
              </label>
              <textarea
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white/90 placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                placeholder="Describe your collection..."
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            {/* Icon Selector */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Icon
              </label>
              <div className="grid grid-cols-6 gap-2">
                {[
                  "📂",
                  "🎨",
                  "🧱",
                  "🔊",
                  "🎵",
                  "🎬",
                  "⭐",
                  "🔥",
                  "💎",
                  "🌟",
                  "🎯",
                  "🚀",
                ].map((emoji) => (
                  <button
                    key={emoji}
                    className={clsx(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors",
                      formData.icon === emoji
                        ? "bg-purple-500/30 border-2 border-purple-400"
                        : "bg-white/10 hover:bg-white/20 border border-white/20",
                    )}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, icon: emoji }))
                    }
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selector */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Color
              </label>
              <div className="flex space-x-2">
                {COLLECTION_COLORS.map((color) => (
                  <button
                    key={color}
                    className={clsx(
                      "w-8 h-8 rounded-full transition-transform",
                      formData.color === color &&
                        "ring-2 ring-white/50 scale-110",
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>

            {/* Public Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-white/80">
                  Make Public
                </label>
                <p className="text-xs text-white/60">
                  Allow others to discover this collection
                </p>
              </div>
              <button
                className={clsx(
                  "relative w-11 h-6 rounded-full transition-colors",
                  formData.isPublic ? "bg-purple-500" : "bg-white/20",
                )}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, isPublic: !prev.isPublic }))
                }
              >
                <div
                  className={clsx(
                    "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform",
                    formData.isPublic ? "translate-x-5" : "translate-x-0.5",
                  )}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <GlassmorphicButton
                className="flex-1"
                variant="glass"
                onClick={onClose}
              >
                Cancel
              </GlassmorphicButton>
              <GlassmorphicButton
                className="flex-1"
                disabled={!formData.name.trim()}
                variant="gaming"
                onClick={handleSave}
              >
                {collection ? "Save Changes" : "Create Collection"}
              </GlassmorphicButton>
            </div>
          </div>
        </GlassmorphicCard>
      </motion.div>
    </div>
  );
};

interface AssetCollectionsProps {
  selectedCollectionId?: string;
  onCollectionSelect: (collectionId: string) => void;
  onCollectionCreate?: (data: Partial<AssetCollection>) => void;
  onCollectionEdit?: (id: string, data: Partial<AssetCollection>) => void;
  onCollectionDelete?: (id: string) => void;
  onCollectionShare?: (id: string) => void;
  className?: string;
}

export function AssetCollections({
  selectedCollectionId,
  onCollectionSelect,
  onCollectionCreate,
  onCollectionEdit,
  onCollectionDelete,
  onCollectionShare,
  className,
}: AssetCollectionsProps) {
  const [collections, setCollections] =
    useState<AssetCollection[]>(mockCollections);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCollection, setEditingCollection] =
    useState<AssetCollection | null>(null);

  // Filter collections based on search
  const filteredCollections = useMemo(() => {
    if (!searchTerm.trim()) return collections;

    return collections.filter(
      (collection) =>
        collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        collection.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        collection.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    );
  }, [collections, searchTerm]);

  // Separate system and user collections
  const systemCollections = filteredCollections.filter((c) => c.isSystem);
  const userCollections = filteredCollections.filter((c) => !c.isSystem);

  const handleCreateCollection = useCallback(() => {
    setEditingCollection(null);
    setShowModal(true);
  }, []);

  const handleEditCollection = useCallback((collection: AssetCollection) => {
    setEditingCollection(collection);
    setShowModal(true);
  }, []);

  const handleSaveCollection = useCallback(
    (data: Partial<AssetCollection>) => {
      if (editingCollection) {
        // Edit existing collection
        const updated = {
          ...editingCollection,
          ...data,
          updatedAt: new Date(),
        };

        setCollections((prev) =>
          prev.map((c) => (c.id === editingCollection.id ? updated : c)),
        );
        onCollectionEdit?.(editingCollection.id, data);
      } else {
        // Create new collection
        const newCollection: AssetCollection = {
          id: `user-${Date.now()}`,
          ...data,
          isSystem: false,
          ownerId: "user-1",
          assetIds: [],
          tags: data.tags || [],
          isPublic: data.isPublic || false,
          createdAt: new Date(),
          updatedAt: new Date(),
          assetCount: 0,
        } as AssetCollection;

        setCollections((prev) => [...prev, newCollection]);
        onCollectionCreate?.(newCollection);
      }
    },
    [editingCollection, onCollectionCreate, onCollectionEdit],
  );

  const handleDeleteCollection = useCallback(
    (id: string) => {
      if (confirm("Are you sure you want to delete this collection?")) {
        setCollections((prev) => prev.filter((c) => c.id !== id));
        onCollectionDelete?.(id);

        // Select first available collection if deleted collection was selected
        if (selectedCollectionId === id) {
          const remaining = collections.filter((c) => c.id !== id);

          if (remaining.length > 0) {
            onCollectionSelect(remaining[0].id);
          }
        }
      }
    },
    [collections, selectedCollectionId, onCollectionSelect, onCollectionDelete],
  );

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white/90">Collections</h2>
        <GlassmorphicButton
          size="sm"
          variant="gaming"
          onClick={handleCreateCollection}
        >
          + New
        </GlassmorphicButton>
      </div>

      {/* Search */}
      <GlassmorphicInput
        placeholder="Search collections..."
        size="sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* System Collections */}
      {systemCollections.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white/70 px-2">
            Quick Access
          </h3>
          <div className="space-y-2">
            {systemCollections.map((collection) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                isSelected={selectedCollectionId === collection.id}
                showOptions={false}
                onClick={() => onCollectionSelect(collection.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* User Collections */}
      {userCollections.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-white/70 px-2">
            My Collections
          </h3>
          <div className="space-y-2">
            {userCollections.map((collection) => (
              <CollectionItem
                key={collection.id}
                collection={collection}
                isSelected={selectedCollectionId === collection.id}
                showOptions={true}
                onClick={() => onCollectionSelect(collection.id)}
                onDelete={() => handleDeleteCollection(collection.id)}
                onEdit={() => handleEditCollection(collection)}
                onShare={
                  onCollectionShare
                    ? () => onCollectionShare(collection.id)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredCollections.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-semibold text-white/80 mb-2">
            {searchTerm ? "No collections found" : "No collections yet"}
          </h3>
          <p className="text-sm text-white/60 mb-4">
            {searchTerm
              ? "Try adjusting your search terms"
              : "Create your first collection to organize your assets"}
          </p>
          {!searchTerm && (
            <GlassmorphicButton
              variant="gaming"
              onClick={handleCreateCollection}
            >
              Create Collection
            </GlassmorphicButton>
          )}
        </div>
      )}

      {/* Collection Modal */}
      <CollectionModal
        collection={editingCollection || undefined}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveCollection}
      />
    </div>
  );
}
