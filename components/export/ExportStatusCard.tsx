"use client";

import React, { useCallback } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { Badge } from "@heroui/badge";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { clsx } from "clsx";
import { motion } from "framer-motion";
import { format } from "date-fns";

import {
  useExportJob,
  useDownloadArtifact,
  useExportStatusColor,
  useExportStatusText,
  useExportPlatformIcon,
} from "@/hooks/useExport";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";

interface ExportStatusCardProps {
  jobId: string;
  compact?: boolean;
  showControls?: boolean;
  onJobComplete?: (jobId: string) => void;
  onJobCancel?: (jobId: string) => void;
}

export function ExportStatusCard({
  jobId,
  compact = false,
  showControls = true,
  onJobComplete,
  onJobCancel,
}: ExportStatusCardProps) {
  const {
    job,
    artifacts,
    analytics,
    queuePosition,
    estimatedCompletion,
    loading,
    error,
    refetch,
    cancelJob,
  } = useExportJob(jobId, {
    auto_refresh: true,
    refresh_interval_ms: 5000,
  });

  const { downloadArtifact, loading: downloading } = useDownloadArtifact();
  const getStatusColor = useExportStatusColor;
  const getStatusText = useExportStatusText;
  const getPlatformIcon = useExportPlatformIcon;

  const handleCancel = useCallback(async () => {
    const success = await cancelJob();

    if (success) {
      onJobCancel?.(jobId);
    }
  }, [cancelJob, jobId, onJobCancel]);

  const handleDownload = useCallback(
    async (artifactId: string) => {
      await downloadArtifact(artifactId);
    },
    [downloadArtifact],
  );

  const handleDownloadAll = useCallback(async () => {
    if (!artifacts?.length) return;

    // Download all artifacts sequentially to avoid overwhelming the browser
    for (const artifact of artifacts) {
      await downloadArtifact(artifact.id);
      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }, [artifacts, downloadArtifact]);

  // Trigger completion callback when job completes
  React.useEffect(() => {
    if (job?.status === "completed" && onJobComplete) {
      onJobComplete(jobId);
    }
  }, [job?.status, jobId, onJobComplete]);

  if (loading) {
    return (
      <GlassmorphicCard
        animated={true}
        blur="md"
        border="subtle"
        className="animate-pulse"
        hover={true}
        shadow="lg"
        variant="gradient"
      >
        <CardBody>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full" />
            <div className="flex-1">
              <div className="w-24 h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
              <div className="w-32 h-3 bg-gray-300 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </CardBody>
      </GlassmorphicCard>
    );
  }

  if (error || !job) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardBody>
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <div className="text-xl">⚠️</div>
            <div>
              <p className="font-medium">Export job not found</p>
              <p className="text-sm">{error || "Unable to load export job"}</p>
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  const statusColor = getStatusColor(job.status);
  const statusText = getStatusText(job.status);
  const platformIcon = getPlatformIcon(job.platform);
  const isActive = ["queued", "processing"].includes(job.status);
  const isCompleted = job.status === "completed";
  const isFailed = job.status === "failed";
  const canCancel = ["queued", "processing"].includes(job.status);

  if (compact) {
    return (
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
        initial={{ opacity: 0, y: 10 }}
      >
        <div className="text-lg">{platformIcon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Chip color={statusColor as any} size="sm" variant="flat">
              {statusText}
            </Chip>
            {queuePosition && queuePosition > 1 && (
              <Badge size="sm" variant="flat">
                #{queuePosition} in queue
              </Badge>
            )}
          </div>
          {isActive && (
            <Progress
              className="w-full"
              color={statusColor as any}
              size="sm"
              value={job.progress_percentage}
            />
          )}
        </div>
        {isCompleted && artifacts?.length && (
          <Button
            color="success"
            isLoading={downloading}
            size="sm"
            variant="flat"
            onPress={handleDownloadAll}
          >
            Download
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 20 }}
    >
      <GlassmorphicCard
        animated={true}
        blur="md"
        border="subtle"
        className={clsx(
          "transition-all duration-200",
          isCompleted && "border-green-200 dark:border-green-800",
          isFailed && "border-red-200 dark:border-red-800",
        )}
        hover={true}
        shadow="lg"
        variant="gradient"
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{platformIcon}</div>
              <div>
                <h4 className="font-medium capitalize">
                  {job.platform.replace("-", " ")} Export
                </h4>
                <p className="text-sm text-gray-500">
                  {format(new Date(job.created_at), "MMM d, HH:mm")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Chip
                className="animate-pulse-subtle"
                color={statusColor as any}
                variant="flat"
              >
                {statusText}
              </Chip>
              {showControls && (
                <Dropdown>
                  <DropdownTrigger>
                    <Button isIconOnly size="sm" variant="light">
                      ⋯
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    {[
                      <DropdownItem key="refresh" onAction={refetch}>
                        Refresh Status
                      </DropdownItem>,
                      ...(canCancel
                        ? [
                            <DropdownItem
                              key="cancel"
                              className="text-danger"
                              onAction={handleCancel}
                            >
                              Cancel Export
                            </DropdownItem>,
                          ]
                        : []),
                    ]}
                  </DropdownMenu>
                </Dropdown>
              )}
            </div>
          </div>
        </CardHeader>

        <CardBody className="pt-0">
          {/* Progress for active jobs */}
          {isActive && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{job.progress_percentage}%</span>
              </div>
              <Progress
                className="w-full"
                color={statusColor as any}
                value={job.progress_percentage}
              />
              {queuePosition && queuePosition > 1 && (
                <p className="text-xs text-gray-500">
                  Position #{queuePosition} in queue
                </p>
              )}
              {estimatedCompletion && (
                <p className="text-xs text-gray-500">
                  Estimated completion:{" "}
                  {format(new Date(estimatedCompletion), "HH:mm")}
                </p>
              )}
            </div>
          )}

          {/* Success state with artifacts */}
          {isCompleted && artifacts && artifacts.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium">
                  Export completed successfully!
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Download Files:</p>
                {artifacts.map((artifact) => (
                  <div
                    key={artifact.id}
                    className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {artifact.file_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round(
                          (artifact.file_size_bytes / 1024 / 1024) * 100,
                        ) / 100}{" "}
                        MB
                      </p>
                    </div>
                    <Button
                      isLoading={downloading}
                      size="sm"
                      variant="flat"
                      onPress={() => handleDownload(artifact.id)}
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed state */}
          {isFailed && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-sm font-medium">Export failed</span>
              </div>
              {job.error_message && (
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {job.error_message}
                </p>
              )}
            </div>
          )}

          {/* Build info */}
          {job.build_size_bytes && (
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
              <span>Build size:</span>
              <span>
                {Math.round((job.build_size_bytes / 1024 / 1024) * 100) / 100}{" "}
                MB
              </span>
            </div>
          )}
        </CardBody>

        {/* Quick actions footer */}
        {isCompleted && artifacts?.length && (
          <CardFooter className="pt-0">
            <div className="flex gap-2 w-full">
              <Button
                className="flex-1"
                color="success"
                isLoading={downloading}
                variant="flat"
                onPress={handleDownloadAll}
              >
                Download All
              </Button>
              <Button isIconOnly variant="light" onPress={refetch}>
                🔄
              </Button>
            </div>
          </CardFooter>
        )}
      </GlassmorphicCard>
    </motion.div>
  );
}

// List component for multiple export jobs
export function ExportStatusList({
  jobIds,
  title = "Recent Exports",
  compact = false,
}: {
  jobIds: string[];
  title?: string;
  compact?: boolean;
}) {
  if (!jobIds.length) {
    return (
      <GlassmorphicCard
        animated={true}
        blur="md"
        border="subtle"
        hover={true}
        shadow="lg"
        variant="gradient"
      >
        <CardBody>
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📦</div>
            <h4 className="font-medium mb-2">No exports yet</h4>
            <p className="text-sm text-gray-500">
              Your exported games will appear here
            </p>
          </div>
        </CardBody>
      </GlassmorphicCard>
    );
  }

  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-medium">{title}</h3>}
      <div className={clsx("space-y-3", compact && "space-y-2")}>
        {jobIds.map((jobId) => (
          <ExportStatusCard key={jobId} compact={compact} jobId={jobId} />
        ))}
      </div>
    </div>
  );
}
