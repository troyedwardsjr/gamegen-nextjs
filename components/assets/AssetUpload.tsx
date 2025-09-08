"use client";

import React, { useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

import {
  AssetUploadConfig,
  AssetUploadProgress,
  AssetUploadStage,
  AssetType,
  AssetFormat,
} from "@/types/assets";
import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";

// Default upload configuration
const DEFAULT_CONFIG: AssetUploadConfig = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedFormats: [
    "png",
    "jpg",
    "webp",
    "gif",
    "wav",
    "mp3",
    "ogg",
    "json",
    "glsl",
  ],
  allowedTypes: [
    "sprite",
    "tileset",
    "sound",
    "music",
    "animation",
    "texture",
    "shader",
    "data",
  ],
  autoOptimize: true,
  generateThumbnail: true,
  extractMetadata: true,
  runAIAnalysis: true,
  virusScan: true,
};

// Stage descriptions for user feedback
const STAGE_DESCRIPTIONS: Record<AssetUploadStage, string> = {
  queued: "Waiting to start...",
  uploading: "Uploading file...",
  processing: "Processing file...",
  optimizing: "Optimizing for web...",
  analyzing: "Running AI analysis...",
  generating_thumbnail: "Generating thumbnail...",
  extracting_metadata: "Extracting metadata...",
  virus_scanning: "Scanning for security...",
  finalizing: "Finalizing upload...",
  completed: "Upload complete!",
  failed: "Upload failed",
};

// File type detection helpers
const getFileType = (file: File): AssetType | null => {
  const ext = file.name.split(".").pop()?.toLowerCase();
  const mimeType = file.type;

  if (
    mimeType.startsWith("image/") ||
    ["png", "jpg", "jpeg", "webp", "gif"].includes(ext || "")
  ) {
    if (file.name.includes("tileset") || file.name.includes("tile")) {
      return "tileset";
    }

    return "sprite";
  }

  if (
    mimeType.startsWith("audio/") ||
    ["wav", "mp3", "ogg", "flac"].includes(ext || "")
  ) {
    return file.size > 1024 * 1024 ? "music" : "sound"; // >1MB = music
  }

  if (ext === "json") return "data";
  if (["glsl", "hlsl"].includes(ext || "")) return "shader";
  if (["ttf", "otf", "woff"].includes(ext || "")) return "font";

  return null;
};

const getFileFormat = (file: File): AssetFormat | null => {
  const ext = file.name.split(".").pop()?.toLowerCase() as AssetFormat;

  return ext || null;
};

const validateFile = (file: File, config: AssetUploadConfig) => {
  const errors: string[] = [];

  // Size check
  if (file.size > config.maxFileSize) {
    errors.push(
      `File size (${formatFileSize(file.size)}) exceeds limit (${formatFileSize(config.maxFileSize)})`,
    );
  }

  // Format check
  const format = getFileFormat(file);

  if (!format || !config.allowedFormats.includes(format)) {
    errors.push(`File format '.${format}' is not supported`);
  }

  // Type check
  const type = getFileType(file);

  if (!type || !config.allowedTypes.includes(type)) {
    errors.push(`File type '${type}' is not allowed`);
  }

  return { isValid: errors.length === 0, errors, type, format };
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

// Individual file upload item component
const UploadFileItem = ({
  progress,
  onCancel,
  onRetry,
}: {
  progress: AssetUploadProgress;
  onCancel: () => void;
  onRetry: () => void;
}) => {
  const getStageIcon = (stage: AssetUploadStage) => {
    switch (stage) {
      case "completed":
        return "✅";
      case "failed":
        return "❌";
      case "uploading":
        return "⬆️";
      case "processing":
        return "⚙️";
      case "analyzing":
        return "🧠";
      case "optimizing":
        return "🔧";
      default:
        return "⏳";
    }
  };

  const getProgressColor = () => {
    if (progress.stage === "failed") return "bg-red-500";
    if (progress.stage === "completed") return "bg-green-500";

    return "bg-gradient-to-r from-purple-500 to-cyan-500";
  };

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-lg p-4 border border-white/10"
      exit={{ opacity: 0, y: -10 }}
      initial={{ opacity: 0, y: 10 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <span className="text-lg">{getStageIcon(progress.stage)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/90 truncate">
              {progress.fileName}
            </p>
            <p className="text-xs text-white/60">
              {STAGE_DESCRIPTIONS[progress.stage]}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {progress.stage === "failed" && (
            <GlassmorphicButton size="sm" variant="gaming" onClick={onRetry}>
              Retry
            </GlassmorphicButton>
          )}
          {progress.stage !== "completed" && progress.stage !== "failed" && (
            <GlassmorphicButton size="sm" variant="danger" onClick={onCancel}>
              Cancel
            </GlassmorphicButton>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/10 rounded-full h-2 mb-2">
        <div
          className={clsx(
            "h-2 rounded-full transition-all duration-300",
            getProgressColor(),
          )}
          style={{ width: `${progress.progress}%` }}
        />
      </div>

      {/* Progress details */}
      <div className="flex items-center justify-between text-xs text-white/60">
        <span>{Math.round(progress.progress)}%</span>
        {progress.estimatedTimeRemaining && (
          <span>~{Math.round(progress.estimatedTimeRemaining)}s remaining</span>
        )}
      </div>

      {/* Error message */}
      {progress.error && (
        <div className="mt-2 p-2 bg-red-500/20 border border-red-500/30 rounded text-xs text-red-300">
          {progress.error}
        </div>
      )}
    </motion.div>
  );
};

interface AssetUploadProps {
  config?: Partial<AssetUploadConfig>;
  onUploadComplete?: (results: any[]) => void;
  onUploadProgress?: (progress: AssetUploadProgress[]) => void;
  className?: string;
  multiple?: boolean;
  disabled?: boolean;
}

export function AssetUpload({
  config: customConfig,
  onUploadComplete,
  onUploadProgress,
  className,
  multiple = true,
  disabled = false,
}: AssetUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploads, setUploads] = useState<AssetUploadProgress[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...customConfig }),
    [customConfig],
  );

  // Mock upload function (replace with real implementation)
  const simulateUpload = useCallback(
    async (file: File): Promise<AssetUploadProgress> => {
      const fileId = Math.random().toString(36).substring(7);
      const stages: AssetUploadStage[] = [
        "queued",
        "uploading",
        "processing",
        "optimizing",
        "analyzing",
        "generating_thumbnail",
        "extracting_metadata",
        "virus_scanning",
        "finalizing",
        "completed",
      ];

      let currentStage = 0;
      let progress = 0;

      const updateProgress = (newProgress: AssetUploadProgress) => {
        setUploads((prev) =>
          prev.map((upload) =>
            upload.fileId === fileId ? newProgress : upload,
          ),
        );
      };

      const initialProgress: AssetUploadProgress = {
        fileId,
        fileName: file.name,
        progress: 0,
        stage: "queued",
      };

      // Add to uploads list
      setUploads((prev) => [...prev, initialProgress]);

      // Simulate upload stages
      for (let i = 0; i < stages.length; i++) {
        await new Promise((resolve) =>
          setTimeout(resolve, 500 + Math.random() * 1000),
        );

        currentStage = i;
        progress = ((i + 1) / stages.length) * 100;

        const updatedProgress: AssetUploadProgress = {
          ...initialProgress,
          progress,
          stage: stages[i],
          estimatedTimeRemaining: Math.max(0, (stages.length - i - 1) * 0.8),
        };

        updateProgress(updatedProgress);
      }

      return {
        ...initialProgress,
        progress: 100,
        stage: "completed",
      };
    },
    [],
  );

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const errors: string[] = [];
      const validFiles: File[] = [];

      // Validate each file
      fileArray.forEach((file) => {
        const validation = validateFile(file, config);

        if (validation.isValid) {
          validFiles.push(file);
        } else {
          errors.push(`${file.name}: ${validation.errors.join(", ")}`);
        }
      });

      setValidationErrors(errors);

      // Start uploads for valid files
      const uploadPromises = validFiles.map((file) => simulateUpload(file));

      try {
        const results = await Promise.all(uploadPromises);

        onUploadComplete?.(results);
      } catch (error) {
        console.error("Upload failed:", error);
      }
    },
    [config, simulateUpload, onUploadComplete],
  );

  // File input change handler
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles],
  );

  // Drag and drop handlers
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);

      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [disabled, handleFiles],
  );

  // Cancel upload
  const handleCancel = useCallback((fileId: string) => {
    setUploads((prev) => prev.filter((upload) => upload.fileId !== fileId));
  }, []);

  // Retry upload
  const handleRetry = useCallback(
    (fileId: string) => {
      const upload = uploads.find((u) => u.fileId === fileId);

      if (upload) {
        // Reset the upload progress
        setUploads((prev) =>
          prev.map((u) =>
            u.fileId === fileId
              ? {
                  ...u,
                  progress: 0,
                  stage: "queued" as AssetUploadStage,
                  error: undefined,
                }
              : u,
          ),
        );
      }
    },
    [uploads],
  );

  // Clear completed uploads
  const handleClearCompleted = useCallback(() => {
    setUploads((prev) =>
      prev.filter(
        (upload) => upload.stage !== "completed" && upload.stage !== "failed",
      ),
    );
  }, []);

  // Clear validation errors
  const handleClearErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  // Trigger file input
  const handleBrowseClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const isUploading = uploads.some(
    (upload) => upload.stage !== "completed" && upload.stage !== "failed",
  );

  const completedUploads = uploads.filter(
    (upload) => upload.stage === "completed",
  );
  const failedUploads = uploads.filter((upload) => upload.stage === "failed");

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Upload Drop Zone */}
      <GlassmorphicCard
        className={clsx(
          "relative overflow-hidden transition-all duration-200",
          isDragOver &&
            !disabled &&
            "ring-2 ring-purple-400/60 bg-purple-500/10",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        variant="subtle"
      >
        <div
          className="p-8 text-center"
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white/90">
                {isDragOver ? "Drop files here" : "Upload Assets"}
              </h3>
              <p className="text-sm text-white/60 max-w-sm mx-auto">
                Drag and drop files here, or click browse to select files from
                your computer
              </p>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <GlassmorphicButton
                disabled={disabled}
                variant="gaming"
                onClick={handleBrowseClick}
              >
                Browse Files
              </GlassmorphicButton>

              {config.requiresSubscription && (
                <GlassmorphicBadge size="sm" variant="gaming">
                  Pro+ Required
                </GlassmorphicBadge>
              )}
            </div>

            {/* File format info */}
            <div className="text-xs text-white/50 space-y-1">
              <p>Supported formats: {config.allowedFormats.join(", ")}</p>
              <p>Max file size: {formatFileSize(config.maxFileSize)}</p>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          accept={config.allowedFormats.map((f) => `.${f}`).join(",")}
          className="hidden"
          disabled={disabled}
          multiple={multiple}
          type="file"
          onChange={handleFileInputChange}
        />
      </GlassmorphicCard>

      {/* Validation Errors */}
      <AnimatePresence>
        {validationErrors.length > 0 && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
          >
            <GlassmorphicCard
              className="p-4 border border-red-500/30"
              variant="default"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-red-300">
                  Validation Errors
                </h4>
                <GlassmorphicButton
                  size="sm"
                  variant="glass-ghost"
                  onClick={handleClearErrors}
                >
                  ×
                </GlassmorphicButton>
              </div>
              <ul className="text-sm text-red-300 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </GlassmorphicCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Progress */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-4"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
          >
            {/* Progress Summary */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white/90">
                Upload Progress
              </h3>
              <div className="flex items-center space-x-2">
                {completedUploads.length > 0 && (
                  <GlassmorphicBadge size="sm" variant="success">
                    {completedUploads.length} completed
                  </GlassmorphicBadge>
                )}
                {failedUploads.length > 0 && (
                  <GlassmorphicBadge size="sm" variant="danger">
                    {failedUploads.length} failed
                  </GlassmorphicBadge>
                )}
                <GlassmorphicButton
                  disabled={
                    completedUploads.length === 0 && failedUploads.length === 0
                  }
                  size="sm"
                  variant="glass"
                  onClick={handleClearCompleted}
                >
                  Clear
                </GlassmorphicButton>
              </div>
            </div>

            {/* Upload Items */}
            <div className="space-y-2">
              <AnimatePresence>
                {uploads.map((progress) => (
                  <UploadFileItem
                    key={progress.fileId}
                    progress={progress}
                    onCancel={() => handleCancel(progress.fileId)}
                    onRetry={() => handleRetry(progress.fileId)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
