"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
// Virtual scrolling imports disabled due to import issues - will be fixed in next iteration
// import { FixedSizeGrid as Grid } from "react-window";
// import InfiniteLoader from "react-window-infinite-loader";
// import AutoSizer from "react-virtualized-auto-sizer";
import { motion, AnimatePresence } from "framer-motion";

import { AssetCard } from "./AssetCard";

import { Asset, AssetGridProps } from "@/types/assets";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";

// Grid item sizes based on item size prop
const ITEM_SIZES = {
  small: { width: 140, height: 140 },
  medium: { width: 200, height: 200 },
  large: { width: 280, height: 280 },
};

// Default grid configuration
const DEFAULT_GAP = 16;
const OVERSCAN_COUNT = 5;

// Loading skeleton component
const AssetCardSkeleton = ({
  size,
}: {
  size: "small" | "medium" | "large";
}) => {
  const itemSize = ITEM_SIZES[size];

  return (
    <div
      className="animate-pulse bg-white/5 rounded-lg border border-white/10"
      style={{ width: itemSize.width - 8, height: itemSize.height - 8 }}
    >
      <div className="p-3 space-y-3">
        <div className="h-20 bg-white/10 rounded" />
        <div className="space-y-2">
          <div className="h-3 bg-white/10 rounded w-3/4" />
          <div className="h-2 bg-white/10 rounded w-1/2" />
        </div>
        <div className="flex space-x-1">
          <div className="h-4 bg-white/10 rounded w-12" />
          <div className="h-4 bg-white/10 rounded w-8" />
        </div>
      </div>
    </div>
  );
};

// Empty state component
const EmptyState = ({ children }: { children?: React.ReactNode }) => (
  <div className="flex-1 flex items-center justify-center p-8">
    {children || (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a1 1 0 012-2h6a1 1 0 012 2v2M7 7h10"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white/80">
            No assets found
          </h3>
          <p className="text-sm text-white/60 max-w-sm">
            Try adjusting your search criteria or upload some assets to get
            started.
          </p>
        </div>
      </div>
    )}
  </div>
);

// Error state component
const ErrorState = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
          />
        </svg>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-white/80">
          Failed to load assets
        </h3>
        <p className="text-sm text-white/60 max-w-sm">{error}</p>
        {onRetry && (
          <button
            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  </div>
);

// Grid cell component for react-window
const GridCell = ({
  columnIndex,
  rowIndex,
  style,
  data,
}: {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    assets: Asset[];
    columnsPerRow: number;
    gap: number;
    itemSize: "small" | "medium" | "large";
    selectedIds: string[];
    highlightedId?: string;
    onAssetClick?: (asset: Asset) => void;
    onAssetDoubleClick?: (asset: Asset) => void;
    onSelectionChange?: (selectedIds: string[]) => void;
    onDragStart?: (asset: Asset) => void;
    enableSelection: boolean;
    enableDragDrop: boolean;
    isLoading: boolean;
  };
}) => {
  const {
    assets,
    columnsPerRow,
    gap,
    itemSize,
    selectedIds,
    highlightedId,
    onAssetClick,
    onAssetDoubleClick,
    onSelectionChange,
    onDragStart,
    enableSelection,
    enableDragDrop,
    isLoading,
  } = data;

  const assetIndex = rowIndex * columnsPerRow + columnIndex;
  const asset = assets[assetIndex];

  // Adjust style for gap
  const cellStyle = {
    ...style,
    left: (style.left as number) + gap / 2,
    top: (style.top as number) + gap / 2,
    width: (style.width as number) - gap,
    height: (style.height as number) - gap,
  };

  // Loading state
  if (isLoading && !asset) {
    return (
      <div style={cellStyle}>
        <AssetCardSkeleton size={itemSize} />
      </div>
    );
  }

  // No asset at this position
  if (!asset) {
    return <div style={cellStyle} />;
  }

  const isSelected = selectedIds.includes(asset.id);
  const isHighlighted = highlightedId === asset.id;

  const handleSelect = useCallback(
    (selectedAsset: Asset, selected: boolean) => {
      if (!onSelectionChange) return;

      const newSelectedIds = selected
        ? [...selectedIds, selectedAsset.id]
        : selectedIds.filter((id) => id !== selectedAsset.id);

      onSelectionChange(newSelectedIds);
    },
    [selectedIds, onSelectionChange],
  );

  return (
    <div style={cellStyle}>
      <AssetCard
        asset={asset}
        isHighlighted={isHighlighted}
        isSelected={isSelected}
        showActions={true}
        size={itemSize}
        onClick={onAssetClick}
        onDoubleClick={onAssetDoubleClick}
        onDragStart={enableDragDrop ? onDragStart : undefined}
        onSelect={enableSelection ? handleSelect : undefined}
      />
    </div>
  );
};

export function AssetGrid({
  assets,
  selectedIds = [],
  highlightedId,
  loading = false,
  error,
  emptyState,
  columns,
  gap = DEFAULT_GAP,
  itemSize = "medium",
  virtualScrolling = true,
  enableSelection = true,
  enableDragDrop = true,
  onAssetClick,
  onAssetDoubleClick,
  onSelectionChange,
  onDragStart,
  onLoadMore,
  hasMore = false,
}: AssetGridProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const gridRef = useRef<any>(null);

  // Calculate grid dimensions
  const itemDimensions = ITEM_SIZES[itemSize];
  const columnsPerRow = useMemo(() => {
    if (columns) return columns;
    if (containerWidth === 0) return 1;

    return Math.max(
      1,
      Math.floor((containerWidth + gap) / (itemDimensions.width + gap)),
    );
  }, [containerWidth, columns, gap, itemDimensions.width]);

  const rowCount = Math.ceil(assets.length / columnsPerRow);
  const itemCount = hasMore ? assets.length + columnsPerRow : assets.length; // Add extra row for loading

  // Infinite loading handler
  const isItemLoaded = useCallback(
    (index: number) => {
      return index < assets.length;
    },
    [assets.length],
  );

  const loadMoreItems = useCallback(async () => {
    if (onLoadMore && hasMore && !loading) {
      onLoadMore();
    }
  }, [onLoadMore, hasMore, loading]);

  // Grid data for react-window
  const gridData = useMemo(
    () => ({
      assets,
      columnsPerRow,
      gap,
      itemSize,
      selectedIds,
      highlightedId,
      onAssetClick,
      onAssetDoubleClick,
      onSelectionChange,
      onDragStart,
      enableSelection,
      enableDragDrop,
      isLoading: loading,
    }),
    [
      assets,
      columnsPerRow,
      gap,
      itemSize,
      selectedIds,
      highlightedId,
      onAssetClick,
      onAssetDoubleClick,
      onSelectionChange,
      onDragStart,
      enableSelection,
      enableDragDrop,
      loading,
    ],
  );

  // Handle container resize
  const handleResize = useCallback(
    ({ width }: { width: number; height: number }) => {
      setContainerWidth(width);
    },
    [],
  );

  // Scroll to asset
  const scrollToAsset = useCallback(
    (assetId: string) => {
      const assetIndex = assets.findIndex((asset) => asset.id === assetId);

      if (assetIndex === -1 || !gridRef.current) return;

      const rowIndex = Math.floor(assetIndex / columnsPerRow);

      gridRef.current.scrollToItem({
        rowIndex,
        align: "center",
      });
    },
    [assets, columnsPerRow],
  );

  // Expose scroll method
  useEffect(() => {
    if (highlightedId) {
      scrollToAsset(highlightedId);
    }
  }, [highlightedId, scrollToAsset]);

  // Error state
  if (error && !loading) {
    return (
      <GlassmorphicCard className="h-full flex items-center justify-center">
        <ErrorState error={error} onRetry={() => window.location.reload()} />
      </GlassmorphicCard>
    );
  }

  // Empty state
  if (assets.length === 0 && !loading) {
    return (
      <GlassmorphicCard className="h-full flex items-center justify-center">
        <EmptyState>{emptyState}</EmptyState>
      </GlassmorphicCard>
    );
  }

  // Regular grid (non-virtual) - temporarily disabled virtual scrolling due to import issues
  if (true) {
    // !virtualScrolling || assets.length < 50
    return (
      <div className="h-full overflow-y-auto">
        <div
          className="grid gap-4 p-4"
          style={{
            gridTemplateColumns: `repeat(${columnsPerRow}, 1fr)`,
            gap: `${gap}px`,
          }}
        >
          <AnimatePresence>
            {assets.map((asset, index) => {
              const isSelected = selectedIds.includes(asset.id);
              const isHighlighted = highlightedId === asset.id;

              const handleSelect = (
                selectedAsset: Asset,
                selected: boolean,
              ) => {
                if (!onSelectionChange) return;

                const newSelectedIds = selected
                  ? [...selectedIds, selectedAsset.id]
                  : selectedIds.filter((id) => id !== selectedAsset.id);

                onSelectionChange(newSelectedIds);
              };

              return (
                <motion.div
                  key={asset.id}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AssetCard
                    asset={asset}
                    isHighlighted={isHighlighted}
                    isSelected={isSelected}
                    showActions={true}
                    size={itemSize}
                    onClick={onAssetClick}
                    onDoubleClick={onAssetDoubleClick}
                    onDragStart={enableDragDrop ? onDragStart : undefined}
                    onSelect={enableSelection ? handleSelect : undefined}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Loading skeletons */}
          {loading && (
            <>
              {Array.from({ length: columnsPerRow * 2 }).map((_, index) => (
                <AssetCardSkeleton key={`skeleton-${index}`} size={itemSize} />
              ))}
            </>
          )}
        </div>

        {/* Load more button */}
        {hasMore && !loading && (
          <div className="p-4 text-center">
            <button
              className="px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors"
              onClick={loadMoreItems}
            >
              Load More
            </button>
          </div>
        )}
      </div>
    );
  }

  // Virtual scrolling grid - temporarily disabled due to react-window import issues
  // TODO: Re-enable once react-window imports are resolved
  /*
  return (
    <div className="h-full">
      <AutoSizer onResize={handleResize}>
        {({ width, height }) => {
          if (!hasMore) {
            return (
              <Grid
                ref={gridRef}
                width={width}
                height={height}
                columnCount={columnsPerRow}
                columnWidth={itemDimensions.width + gap}
                rowCount={rowCount}
                rowHeight={itemDimensions.height + gap}
                itemData={gridData}
                overscanRowCount={OVERSCAN_COUNT}
                overscanColumnCount={OVERSCAN_COUNT}
                style={{ padding: `${gap / 2}px` }}
              >
                {GridCell}
              </Grid>
            );
          }

          return (
            <InfiniteLoader
              isItemLoaded={isItemLoaded}
              itemCount={itemCount}
              loadMoreItems={loadMoreItems}
              threshold={columnsPerRow * 3}
            >
              {({ onItemsRendered, ref }) => (
                <Grid
                  ref={(grid) => {
                    ref(grid);
                    gridRef.current = grid;
                  }}
                  width={width}
                  height={height}
                  columnCount={columnsPerRow}
                  columnWidth={itemDimensions.width + gap}
                  rowCount={Math.ceil(itemCount / columnsPerRow)}
                  rowHeight={itemDimensions.height + gap}
                  itemData={gridData}
                  overscanRowCount={OVERSCAN_COUNT}
                  overscanColumnCount={OVERSCAN_COUNT}
                  onItemsRendered={({
                    visibleRowStartIndex,
                    visibleRowStopIndex,
                    overscanRowStartIndex,
                    overscanRowStopIndex,
                  }) => {
                    onItemsRendered({
                      overscanStartIndex: overscanRowStartIndex * columnsPerRow,
                      overscanStopIndex: overscanRowStopIndex * columnsPerRow,
                      visibleStartIndex: visibleRowStartIndex * columnsPerRow,
                      visibleStopIndex: visibleRowStopIndex * columnsPerRow,
                    });
                  }}
                  style={{ padding: `${gap / 2}px` }}
                >
                  {GridCell}
                </Grid>
              )}
            </InfiniteLoader>
          );
        }}
      </AutoSizer>
    </div>
  );
  */

  // Fallback to regular grid since virtual scrolling is disabled
  return (
    <div className="h-full overflow-y-auto">
      <div
        className="grid gap-4 p-4"
        style={{
          gridTemplateColumns: `repeat(${columnsPerRow}, 1fr)`,
          gap: `${gap}px`,
        }}
      >
        {assets.map((asset, index) => {
          const isSelected = selectedIds.includes(asset.id);
          const isHighlighted = highlightedId === asset.id;

          const handleSelect = (selectedAsset: Asset, selected: boolean) => {
            if (!onSelectionChange) return;

            const newSelectedIds = selected
              ? [...selectedIds, selectedAsset.id]
              : selectedIds.filter((id) => id !== selectedAsset.id);

            onSelectionChange(newSelectedIds);
          };

          return (
            <AssetCard
              key={asset.id}
              asset={asset}
              isHighlighted={isHighlighted}
              isSelected={isSelected}
              showActions={true}
              size={itemSize}
              onClick={onAssetClick}
              onDoubleClick={onAssetDoubleClick}
              onDragStart={enableDragDrop ? onDragStart : undefined}
              onSelect={enableSelection ? handleSelect : undefined}
            />
          );
        })}

        {/* Loading skeletons */}
        {loading && (
          <>
            {Array.from({ length: columnsPerRow * 2 }).map((_, index) => (
              <AssetCardSkeleton key={`skeleton-${index}`} size={itemSize} />
            ))}
          </>
        )}
      </div>

      {/* Load more button */}
      {hasMore && !loading && (
        <div className="p-4 text-center">
          <button
            className="px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors"
            onClick={loadMoreItems}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
