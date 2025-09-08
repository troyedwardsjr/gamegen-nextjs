"use client";

import { useState, useCallback, useRef } from "react";

import {
  UseAssetUploadReturn,
  AssetUploadConfig,
  AssetUploadProgress,
  AssetUploadResult,
  AssetUploadStage,
  Asset,
  AssetType,
  AssetFormat,
  AssetError,
} from "@/types/assets";

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

// Validate file against config
const validateFile = (file: File, config: AssetUploadConfig) => {
  const errors: string[] = [];

  // Size check
  if (file.size > config.maxFileSize) {
    errors.push(
      `File size exceeds ${Math.round(config.maxFileSize / 1024 / 1024)}MB limit`,
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

// Simulate upload stages
const simulateUploadStages = async (
  file: File,
  config: AssetUploadConfig,
  onProgressUpdate: (progress: AssetUploadProgress) => void,
  abortSignal: AbortSignal,
): Promise<AssetUploadResult> => {
  const fileId = Math.random().toString(36).substring(7);

  const stages: AssetUploadStage[] = [
    "queued",
    "uploading",
    "processing",
    ...(config.autoOptimize ? ["optimizing" as AssetUploadStage] : []),
    ...(config.runAIAnalysis ? ["analyzing" as AssetUploadStage] : []),
    ...(config.generateThumbnail
      ? ["generating_thumbnail" as AssetUploadStage]
      : []),
    ...(config.extractMetadata
      ? ["extracting_metadata" as AssetUploadStage]
      : []),
    ...(config.virusScan ? ["virus_scanning" as AssetUploadStage] : []),
    "finalizing",
    "completed",
  ];

  let currentStageIndex = 0;
  const totalStages = stages.length;

  const updateProgress = (
    stage: AssetUploadStage,
    progress: number,
    error?: string,
  ) => {
    const estimatedTimeRemaining = Math.max(
      0,
      (totalStages - currentStageIndex - 1) * 0.8,
    );

    onProgressUpdate({
      fileId,
      fileName: file.name,
      progress,
      stage,
      error,
      estimatedTimeRemaining,
    });
  };

  // Initial progress
  updateProgress("queued", 0);

  try {
    for (let i = 0; i < stages.length; i++) {
      if (abortSignal.aborted) {
        throw new AssetError("Upload cancelled", "UPLOAD_CANCELLED");
      }

      currentStageIndex = i;
      const stage = stages[i];
      const progress = ((i + 1) / stages.length) * 100;

      // Simulate variable delay for each stage
      let delay = 300;

      if (stage === "uploading") delay = 1000 + (file.size / 1024 / 1024) * 100; // Longer for larger files
      if (stage === "processing") delay = 500;
      if (stage === "optimizing") delay = 800;
      if (stage === "analyzing") delay = 1200;
      if (stage === "virus_scanning") delay = 600;

      await new Promise((resolve) =>
        setTimeout(resolve, delay + Math.random() * 300),
      );

      updateProgress(stage, progress);

      // Simulate occasional errors
      if (Math.random() < 0.05 && stage !== "completed") {
        // 5% chance of error
        throw new AssetError(
          `Failed during ${stage} stage`,
          "UPLOAD_STAGE_FAILED",
        );
      }
    }

    // Generate mock asset result
    const type = getFileType(file) || "data";
    const format = getFileFormat(file) || ("unknown" as AssetFormat);

    const asset: Asset = {
      id: fileId,
      name: file.name,
      type,
      format,
      source: "user",
      status: "ready",
      url: URL.createObjectURL(file), // In real app, this would be the uploaded URL
      thumbnailUrl: URL.createObjectURL(file),
      size: file.size,
      dimensions:
        type === "sprite" || type === "tileset"
          ? { width: 256, height: 256 }
          : undefined,
      quality: "high",
      tags: [],
      collections: [],
      categories: [type],
      usage: {
        usageCount: 0,
        usedInScenes: [],
        usedInComponents: [],
        dependencies: [],
      },
      metadata: {
        keywords: [],
      },
      optimization: {
        originalSize: file.size,
        compressedSize: Math.round(file.size * 0.8), // Simulate compression
        compressionRatio: 0.8,
        formats: [format],
        optimizationLevel: config.autoOptimize ? "medium" : "none",
        webOptimized: config.autoOptimize,
        mobileOptimized: config.autoOptimize,
      },
      ai: {
        generated: false,
        qualityScore: Math.round(70 + Math.random() * 25), // Random quality score
        tags: [],
      },
      versioning: {
        version: "1.0",
        isLatest: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: "user-1",
      isPublic: false,
      isEditable: true,
      isDeletable: true,
    };

    return {
      asset,
      optimizationReport: config.autoOptimize
        ? {
            originalSize: file.size,
            finalSize: Math.round(file.size * 0.8),
            sizeSaved: Math.round(file.size * 0.2),
            formatChanged: false,
          }
        : undefined,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Upload failed";

    updateProgress("failed", 0, errorMessage);
    throw error;
  }
};

export function useAssetUpload(): UseAssetUploadReturn {
  const [progress, setProgress] = useState<AssetUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const updateProgress = useCallback((newProgress: AssetUploadProgress) => {
    setProgress((prev) => {
      const existing = prev.find((p) => p.fileId === newProgress.fileId);

      if (existing) {
        return prev.map((p) =>
          p.fileId === newProgress.fileId ? newProgress : p,
        );
      } else {
        return [...prev, newProgress];
      }
    });
  }, []);

  const upload = useCallback(
    async (
      files: File[],
      config?: Partial<AssetUploadConfig>,
    ): Promise<AssetUploadResult[]> => {
      const uploadConfig = { ...DEFAULT_CONFIG, ...config };
      const results: AssetUploadResult[] = [];
      const errors: string[] = [];

      setIsUploading(true);

      try {
        // Validate all files first
        for (const file of files) {
          const validation = validateFile(file, uploadConfig);

          if (!validation.isValid) {
            errors.push(`${file.name}: ${validation.errors.join(", ")}`);
            continue;
          }

          // Create abort controller for this upload
          const abortController = new AbortController();
          const fileId = Math.random().toString(36).substring(7);

          abortControllers.current.set(fileId, abortController);

          try {
            const result = await simulateUploadStages(
              file,
              uploadConfig,
              updateProgress,
              abortController.signal,
            );

            results.push(result);
          } catch (error) {
            if (
              error instanceof AssetError &&
              error.code === "UPLOAD_CANCELLED"
            ) {
              // Upload was cancelled, don't add to errors
            } else {
              errors.push(
                `${file.name}: ${error instanceof Error ? error.message : "Upload failed"}`,
              );
            }
          } finally {
            abortControllers.current.delete(fileId);
          }
        }

        if (errors.length > 0) {
          console.warn("Some uploads failed:", errors);
        }

        return results;
      } finally {
        setIsUploading(false);
      }
    },
    [updateProgress],
  );

  const cancel = useCallback((fileId: string) => {
    const controller = abortControllers.current.get(fileId);

    if (controller) {
      controller.abort();
      abortControllers.current.delete(fileId);
    }

    // Remove from progress
    setProgress((prev) => prev.filter((p) => p.fileId !== fileId));
  }, []);

  const clear = useCallback(() => {
    // Cancel all ongoing uploads
    abortControllers.current.forEach((controller) => controller.abort());
    abortControllers.current.clear();

    // Clear progress
    setProgress([]);
    setIsUploading(false);
  }, []);

  return {
    upload,
    progress,
    isUploading,
    cancel,
    clear,
  };
}
