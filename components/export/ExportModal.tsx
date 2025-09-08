"use client";

import type {
  ExportPlatform,
  CreateExportJobRequest,
  ExportOptions,
} from "@/types/export";

import React, { useState, useCallback, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Divider } from "@heroui/divider";
import { Badge } from "@heroui/badge";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  useCreateExportJob,
  useExportPlatforms,
  useExportUsage,
  useExportPlatformIcon,
} from "@/hooks/useExport";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  onExportSuccess?: (jobId: string) => void;
}

export function ExportModal({
  isOpen,
  onClose,
  gameId,
  gameTitle,
  onExportSuccess,
}: ExportModalProps) {
  const [selectedPlatform, setSelectedPlatform] =
    useState<ExportPlatform | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({});
  const [step, setStep] = useState<"platform" | "options" | "confirm">(
    "platform",
  );

  const { createExportJob, loading: creating } = useCreateExportJob();
  const {
    platforms,
    unavailablePlatforms,
    subscriptionLimits,
    userTier,
    loading: platformsLoading,
  } = useExportPlatforms();
  const { usage, loading: usageLoading } = useExportUsage();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPlatform(null);
      setExportOptions({});
      setStep("platform");
    }
  }, [isOpen]);

  const handlePlatformSelect = useCallback((platform: ExportPlatform) => {
    setSelectedPlatform(platform);
    setStep("options");
  }, []);

  const handleOptionsNext = useCallback(() => {
    setStep("confirm");
  }, []);

  const handleExport = useCallback(async () => {
    if (!selectedPlatform) return;

    const request: CreateExportJobRequest = {
      game_id: gameId,
      platform: selectedPlatform,
      export_options: exportOptions,
      priority: "normal",
    };

    const result = await createExportJob(request);

    if (result) {
      onExportSuccess?.(result.job.id);
      onClose();
    }
  }, [
    selectedPlatform,
    gameId,
    exportOptions,
    createExportJob,
    onExportSuccess,
    onClose,
  ]);

  const canExport =
    subscriptionLimits &&
    usage &&
    usage.today.exports_used < subscriptionLimits.daily_export_limit;

  if (platformsLoading || usageLoading) {
    return (
      <Modal isOpen={isOpen} size="lg" onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            <h3>Export {gameTitle}</h3>
          </ModalHeader>
          <ModalBody>
            <div className="flex items-center justify-center py-8">
              <Progress
                isIndeterminate
                className="max-w-md"
                label="Loading export options..."
              />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal
      classNames={{
        backdrop: "bg-black/50",
        base: "border-gray-200 dark:border-gray-800",
      }}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Export {gameTitle}</h3>
            <div className="flex items-center gap-2">
              <Badge color="primary" variant="flat">
                {userTier.toUpperCase()} Tier
              </Badge>
            </div>
          </div>

          {/* Usage indicator */}
          {subscriptionLimits && usage && (
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span>
                Daily exports: {usage.today.exports_used}/
                {subscriptionLimits.daily_export_limit}
              </span>
              <Progress
                className="flex-1 max-w-48"
                color={
                  usage.today.exports_used >=
                  subscriptionLimits.daily_export_limit
                    ? "danger"
                    : "success"
                }
                value={
                  (usage.today.exports_used /
                    subscriptionLimits.daily_export_limit) *
                  100
                }
              />
            </div>
          )}
        </ModalHeader>

        <ModalBody>
          <AnimatePresence mode="wait">
            {step === "platform" && (
              <PlatformSelectionStep
                canExport={canExport}
                platforms={platforms}
                unavailablePlatforms={unavailablePlatforms}
                userTier={userTier}
                onPlatformSelect={handlePlatformSelect}
              />
            )}

            {step === "options" && selectedPlatform && (
              <ExportOptionsStep
                options={exportOptions}
                platform={selectedPlatform}
                subscriptionLimits={subscriptionLimits}
                onBack={() => setStep("platform")}
                onNext={handleOptionsNext}
                onOptionsChange={setExportOptions}
              />
            )}

            {step === "confirm" && selectedPlatform && (
              <ExportConfirmStep
                gameTitle={gameTitle}
                loading={creating}
                options={exportOptions}
                platform={selectedPlatform}
                onBack={() => setStep("options")}
                onConfirm={handleExport}
              />
            )}
          </AnimatePresence>
        </ModalBody>

        <ModalFooter>
          <Button
            color="danger"
            disabled={creating}
            variant="light"
            onPress={onClose}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

// Platform selection step
function PlatformSelectionStep({
  platforms,
  unavailablePlatforms,
  userTier,
  onPlatformSelect,
  canExport,
}: {
  platforms: any[];
  unavailablePlatforms: any[];
  userTier: string;
  onPlatformSelect: (platform: ExportPlatform) => void;
  canExport?: boolean;
}) {
  const getPlatformIcon = useExportPlatformIcon;

  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
      exit={{ opacity: 0, x: -20 }}
      initial={{ opacity: 0, x: 20 }}
    >
      <div>
        <h4 className="text-lg font-medium mb-2">Choose Export Platform</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select the platform you want to export your game to
        </p>
      </div>

      {!canExport && (
        <GlassmorphicCard
          blur="md"
          border="visible"
          className="border-orange-200 dark:border-orange-800"
          shadow="md"
          variant="accent-rose"
        >
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <p className="text-orange-600 dark:text-orange-400">
                Daily export limit reached. Upgrade your plan or wait until
                tomorrow.
              </p>
            </div>
          </CardBody>
        </GlassmorphicCard>
      )}

      {/* Available platforms */}
      <div className="space-y-3">
        <h5 className="font-medium text-green-600 dark:text-green-400">
          Available Platforms
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {platforms.map((platform) => (
            <PlatformCard
              key={platform.platform}
              available={true}
              canExport={canExport}
              icon={getPlatformIcon(platform.platform)}
              platform={platform}
              onClick={() => canExport && onPlatformSelect(platform.platform)}
            />
          ))}
        </div>
      </div>

      {/* Unavailable platforms */}
      {unavailablePlatforms.length > 0 && (
        <div className="space-y-3">
          <h5 className="font-medium text-gray-500 dark:text-gray-400">
            Upgrade Required
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {unavailablePlatforms.map((platform) => (
              <PlatformCard
                key={platform.platform}
                available={false}
                canExport={false}
                icon={getPlatformIcon(platform.platform)}
                platform={platform}
                requiredTier={platform.required_tier}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Platform card component
function PlatformCard({
  platform,
  icon,
  available,
  canExport,
  requiredTier,
  onClick,
}: {
  platform: any;
  icon: string;
  available: boolean;
  canExport?: boolean;
  requiredTier?: string;
  onClick?: () => void;
}) {
  const isClickable = available && canExport;

  return (
    <Card
      className={clsx(
        "transition-all duration-200",
        isClickable
          ? "hover:scale-105 cursor-pointer"
          : "opacity-60 cursor-not-allowed",
        available
          ? "border-green-200 dark:border-green-800"
          : "border-orange-200 dark:border-orange-800",
      )}
      isPressable={isClickable}
      onPress={onClick}
    >
      <CardBody className="p-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{icon}</div>
          <div className="flex-1">
            <h6 className="font-medium capitalize">
              {platform.platform.replace("-", " ")}
            </h6>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">
                ~{platform.build_time_minutes}min • {platform.typical_size_mb}MB
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {available ? (
              <Chip color="success" size="sm" variant="flat">
                Available
              </Chip>
            ) : (
              <Chip color="warning" size="sm" variant="flat">
                {requiredTier?.toUpperCase()} Required
              </Chip>
            )}
          </div>
        </div>

        {/* Platform features */}
        <div className="mt-3 flex flex-wrap gap-1">
          {platform.features?.slice(0, 3).map((feature: string) => (
            <Badge key={feature} className="text-xs" size="sm" variant="flat">
              {feature.replace("-", " ")}
            </Badge>
          ))}
          {platform.features?.length > 3 && (
            <Badge className="text-xs" size="sm" variant="flat">
              +{platform.features.length - 3} more
            </Badge>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

// Export options configuration step
function ExportOptionsStep({
  platform,
  options,
  onOptionsChange,
  onNext,
  onBack,
  subscriptionLimits,
}: {
  platform: ExportPlatform;
  options: ExportOptions;
  onOptionsChange: (options: ExportOptions) => void;
  onNext: () => void;
  onBack: () => void;
  subscriptionLimits: any;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
      exit={{ opacity: 0, x: -20 }}
      initial={{ opacity: 0, x: 20 }}
    >
      <div>
        <h4 className="text-lg font-medium mb-2">Export Options</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Configure export settings for {platform.replace("-", " ")}
        </p>
      </div>

      {/* Platform-specific options would go here */}
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Platform-specific options will be implemented based on the selected
          platform. For now, default settings will be used.
        </p>
      </div>

      <div className="flex justify-between">
        <Button variant="flat" onPress={onBack}>
          Back
        </Button>
        <Button color="primary" onPress={onNext}>
          Continue
        </Button>
      </div>
    </motion.div>
  );
}

// Final confirmation step
function ExportConfirmStep({
  platform,
  options,
  gameTitle,
  onConfirm,
  onBack,
  loading,
}: {
  platform: ExportPlatform;
  options: ExportOptions;
  gameTitle: string;
  onConfirm: () => void;
  onBack: () => void;
  loading: boolean;
}) {
  const getPlatformIcon = useExportPlatformIcon;

  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
      exit={{ opacity: 0, x: -20 }}
      initial={{ opacity: 0, x: 20 }}
    >
      <div>
        <h4 className="text-lg font-medium mb-2">Confirm Export</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review your export settings before starting the build
        </p>
      </div>

      <GlassmorphicCard
        animated={true}
        blur="3xl"
        border="visible"
        hover={false}
        shadow="xl"
        variant="strong"
      >
        <CardBody className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl">{getPlatformIcon(platform)}</div>
            <div>
              <h5 className="font-medium">{gameTitle}</h5>
              <p className="text-sm text-gray-500">
                Export to {platform.replace("-", " ")}
              </p>
            </div>
          </div>

          <Divider />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Platform:</span>
              <span className="font-medium capitalize">
                {platform.replace("-", " ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estimated build time:</span>
              <span className="font-medium">~5-10 minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated file size:</span>
              <span className="font-medium">~10-50 MB</span>
            </div>
          </div>
        </CardBody>
      </GlassmorphicCard>

      <div className="flex justify-between">
        <Button disabled={loading} variant="flat" onPress={onBack}>
          Back
        </Button>
        <Button color="primary" isLoading={loading} onPress={onConfirm}>
          Start Export
        </Button>
      </div>
    </motion.div>
  );
}
