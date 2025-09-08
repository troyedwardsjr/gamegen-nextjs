"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Tooltip } from "@heroui/tooltip";
import { clsx } from "clsx";

import { ExportModal } from "./ExportModal";

import {
  useExportJobs,
  useExportUsage,
  useExportPlatforms,
} from "@/hooks/useExport";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";

interface ExportButtonProps {
  gameId: string;
  gameTitle: string;
  variant?: "button" | "dropdown" | "fab";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
  onExportStart?: () => void;
  onExportSuccess?: (jobId: string) => void;
}

export function ExportButton({
  gameId,
  gameTitle,
  variant = "button",
  size = "md",
  disabled = false,
  className,
  onExportStart,
  onExportSuccess,
}: ExportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { jobs } = useExportJobs({
    limit: 5,
  });
  const { usage } = useExportUsage();
  const { subscriptionLimits, userTier } = useExportPlatforms();

  const activeExports =
    jobs?.filter((job) => ["queued", "processing"].includes(job.status))
      .length || 0;

  const canExport =
    usage &&
    subscriptionLimits &&
    usage.today.exports_used < subscriptionLimits.daily_export_limit;

  const handleExportClick = useCallback(() => {
    onExportStart?.();
    setIsModalOpen(true);
  }, [onExportStart]);

  const handleExportSuccess = useCallback(
    (jobId: string) => {
      onExportSuccess?.(jobId);
    },
    [onExportSuccess],
  );

  // Simple button variant
  if (variant === "button") {
    return (
      <>
        <div className="relative">
          <GlassmorphicButton
            className={clsx("relative", className)}
            color="primary"
            disabled={disabled || !canExport}
            size={size}
            startContent={<span>📦</span>}
            onPress={handleExportClick}
          >
            Export Game
          </GlassmorphicButton>

          {/* Active exports indicator */}
          {activeExports > 0 && (
            <Badge
              className="absolute -top-1 -right-1 animate-pulse"
              color="warning"
              size="sm"
            >
              {activeExports}
            </Badge>
          )}

          {/* Usage indicator for near-limit */}
          {usage &&
            subscriptionLimits &&
            usage.today.exports_used / subscriptionLimits.daily_export_limit >
              0.8 && (
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            )}
        </div>

        <ExportModal
          gameId={gameId}
          gameTitle={gameTitle}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onExportSuccess={handleExportSuccess}
        />
      </>
    );
  }

  // Dropdown variant with quick export options
  if (variant === "dropdown") {
    return (
      <>
        <div className="relative">
          <Dropdown>
            <DropdownTrigger>
              <Button
                className={clsx("relative", className)}
                disabled={disabled}
                endContent={<span className="text-xs">▼</span>}
                size={size}
                startContent={<span>📦</span>}
                variant="bordered"
              >
                Export
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem
                key="export-modal"
                description="Choose platform and options"
                startContent={<span>🚀</span>}
                onAction={handleExportClick}
              >
                Export Game...
              </DropdownItem>
              <DropdownItem
                key="quick-web"
                description="Quick HTML5 export"
                isDisabled={!canExport}
                startContent={<span>🌐</span>}
                onAction={() => {
                  // Quick web export could be implemented here
                  handleExportClick();
                }}
              >
                Quick Web Export
              </DropdownItem>
              <DropdownItem
                key="usage"
                description={`${usage?.today.exports_used || 0}/${subscriptionLimits?.daily_export_limit || 0} used today`}
                startContent={<span>📊</span>}
              >
                View Export Usage
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {activeExports > 0 && (
            <Badge
              className="absolute -top-1 -right-1 animate-pulse"
              color="warning"
              size="sm"
            >
              {activeExports}
            </Badge>
          )}
        </div>

        <ExportModal
          gameId={gameId}
          gameTitle={gameTitle}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onExportSuccess={handleExportSuccess}
        />
      </>
    );
  }

  // Floating Action Button variant
  if (variant === "fab") {
    const tooltipContent = !canExport
      ? `Daily limit reached (${usage?.today.exports_used}/${subscriptionLimits?.daily_export_limit})`
      : `Export ${gameTitle}`;

    return (
      <>
        <Tooltip content={tooltipContent} placement="left">
          <div className="relative">
            <Button
              isIconOnly
              className={clsx(
                "fixed bottom-6 right-6 z-50 shadow-lg hover:scale-110 transition-transform",
                "bg-gradient-to-br from-blue-500 to-purple-600",
                !canExport && "opacity-60 cursor-not-allowed",
                className,
              )}
              color="primary"
              disabled={disabled || !canExport}
              radius="full"
              size="lg"
              onPress={handleExportClick}
            >
              <span className="text-xl">📦</span>
            </Button>

            {activeExports > 0 && (
              <Badge
                className="absolute -top-1 -right-1 animate-bounce"
                color="danger"
                size="sm"
              >
                {activeExports.toString()}
              </Badge>
            )}
          </div>
        </Tooltip>

        <ExportModal
          gameId={gameId}
          gameTitle={gameTitle}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onExportSuccess={handleExportSuccess}
        />
      </>
    );
  }

  return null;
}

// Quick export buttons for specific platforms
export function QuickExportButtons({
  gameId,
  gameTitle,
  platforms = ["web", "pwa"],
  size = "sm",
  className,
}: {
  gameId: string;
  gameTitle: string;
  platforms?: string[];
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

  const { usage } = useExportUsage();
  const { subscriptionLimits } = useExportPlatforms();

  const canExport =
    usage &&
    subscriptionLimits &&
    usage.today.exports_used < subscriptionLimits.daily_export_limit;

  const platformIcons = {
    web: "🌐",
    pwa: "📱",
    "desktop-windows": "🪟",
    "desktop-macos": "🍎",
    "desktop-linux": "🐧",
    "mobile-android": "🤖",
    "mobile-ios": "📱",
    "source-code": "💻",
  };

  const handleQuickExport = useCallback((platform: string) => {
    setSelectedPlatform(platform);
    setIsModalOpen(true);
  }, []);

  return (
    <>
      <div className={clsx("flex gap-2", className)}>
        {platforms.map((platform) => (
          <Tooltip
            key={platform}
            content={`Quick export to ${platform.replace("-", " ")}`}
          >
            <Button
              isIconOnly
              className="hover:scale-105 transition-transform"
              disabled={!canExport}
              size={size}
              variant="flat"
              onPress={() => handleQuickExport(platform)}
            >
              {platformIcons[platform as keyof typeof platformIcons] || "📦"}
            </Button>
          </Tooltip>
        ))}
      </div>

      <ExportModal
        gameId={gameId}
        gameTitle={gameTitle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

// Export status indicator for toolbar/header
export function ExportStatusIndicator({
  gameId,
  compact = true,
}: {
  gameId?: string;
  compact?: boolean;
}) {
  const { jobs } = useExportJobs({
    limit: 10,
  });

  const activeExports =
    jobs?.filter((job) =>
      gameId
        ? job.game_id === gameId &&
          ["queued", "processing"].includes(job.status)
        : ["queued", "processing"].includes(job.status),
    ).length || 0;

  const recentCompleted =
    jobs?.filter(
      (job) =>
        job.status === "completed" &&
        new Date(job.completed_at!).getTime() > Date.now() - 5 * 60 * 1000, // Last 5 minutes
    ).length || 0;

  if (!activeExports && !recentCompleted) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {activeExports > 0 && (
          <Badge
            className="animate-pulse"
            color="primary"
            size="sm"
            variant="flat"
          >
            {activeExports} exporting
          </Badge>
        )}
        {recentCompleted > 0 && (
          <Badge color="success" size="sm" variant="flat">
            {recentCompleted} completed
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      <span className="text-sm font-medium">
        {activeExports > 0 &&
          `${activeExports} export${activeExports > 1 ? "s" : ""} in progress`}
        {activeExports > 0 && recentCompleted > 0 && " • "}
        {recentCompleted > 0 && `${recentCompleted} completed recently`}
      </span>
    </div>
  );
}
