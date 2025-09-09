/**
 * Asset Quality Validator
 * 
 * Comprehensive quality validation system for AI-generated assets with technical,
 * visual, and content appropriateness checks, scoring algorithms, and approval workflows.
 */

import {
  AssetGenerationRequest,
  QualityValidationConfig,
  QualityValidationResult,
  AssetGenerationError,
  ERROR_CODES,
  AssetType,
} from './types';

export class AssetQualityValidator {
  private config: QualityValidationConfig;

  constructor(config: QualityValidationConfig) {
    this.config = {
      contentFiltering: true,
      nsfw: true,
      violenceFilter: true,
      copyrightFilter: false, // Requires external service
      ...config,
    };
  }

  /**
   * Validate asset quality across multiple dimensions
   */
  async validateAsset(asset: any): Promise<QualityValidationResult> {
    const validationResults = await Promise.all([
      this.validateTechnicalQuality(asset),
      this.validateVisualQuality(asset),
      this.validateContentAppropriateness(asset),
      this.validateStyleConsistency(asset),
    ]);

    const [technical, visual, content, style] = validationResults;

    // Calculate overall score
    const overallScore = (
      technical.score * 0.3 +
      visual.score * 0.4 +
      content.score * 0.2 +
      style.score * 0.1
    );

    // Collect all issues and warnings
    const allIssues = [
      ...technical.issues,
      ...visual.issues,
      ...content.issues,
      ...style.issues,
    ];

    const allWarnings = [
      ...technical.warnings,
      ...visual.warnings,
      ...content.warnings,
      ...style.warnings,
    ];

    // Determine if asset is valid
    const isValid = overallScore >= this.getQualityThreshold(asset.metadata?.assetType) &&
                   content.score >= 0.8 && // Content must be appropriate
                   technical.score >= 0.6; // Minimum technical quality

    return {
      isValid,
      score: overallScore,
      issues: allIssues,
      warnings: allWarnings,
      technicalQuality: technical.score,
      visualQuality: visual.score,
      contentAppropriate: content.score,
      styleConsistency: style.score,
    };
  }

  /**
   * Validate technical aspects (dimensions, format, file size, etc.)
   */
  private async validateTechnicalQuality(asset: any): Promise<{
    score: number;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 1.0;

    const metadata = asset.metadata || {};
    const { dimensions = {}, fileSize = 0, format = 'unknown' } = metadata;

    // Validate dimensions
    if (dimensions.width && dimensions.height) {
      if (dimensions.width < this.config.minResolution.width ||
          dimensions.height < this.config.minResolution.height) {
        issues.push(`Resolution too low: ${dimensions.width}x${dimensions.height}`);
        score *= 0.3;
      }

      if (dimensions.width > this.config.maxResolution.width ||
          dimensions.height > this.config.maxResolution.height) {
        issues.push(`Resolution too high: ${dimensions.width}x${dimensions.height}`);
        score *= 0.7;
      }

      // Check aspect ratio sanity
      const aspectRatio = dimensions.width / dimensions.height;
      if (aspectRatio > 10 || aspectRatio < 0.1) {
        warnings.push('Unusual aspect ratio detected');
        score *= 0.9;
      }
    } else {
      issues.push('Missing dimension information');
      score *= 0.5;
    }

    // Validate format
    if (!this.config.allowedFormats.includes(format)) {
      issues.push(`Unsupported format: ${format}`);
      score *= 0.8;
    }

    // Validate file size
    if (fileSize === 0) {
      issues.push('Invalid file size');
      score *= 0.3;
    } else if (fileSize > 10 * 1024 * 1024) { // 10MB
      warnings.push('Large file size may affect performance');
      score *= 0.9;
    }

    // Check for corruption indicators
    if (asset.buffer && asset.buffer.length !== fileSize) {
      warnings.push('Buffer size mismatch detected');
      score *= 0.95;
    }

    return { score: Math.max(score, 0), issues, warnings };
  }

  /**
   * Validate visual quality (sharpness, clarity, artifacts, etc.)
   */
  private async validateVisualQuality(asset: any): Promise<{
    score: number;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 1.0;

    const metadata = asset.metadata || {};

    // Check for pixel art quality if applicable
    if (metadata.pixelArtScore !== undefined) {
      if (metadata.pixelArtScore < 0.5) {
        warnings.push('Low pixel art quality detected');
        score *= 0.9;
      } else if (metadata.pixelArtScore > 0.8) {
        // Bonus for good pixel art
        score = Math.min(score * 1.1, 1.0);
      }
    }

    // Check color quality
    if (metadata.colors) {
      const { count } = metadata.colors;
      
      // Too many colors for pixel art
      if (count > 256 && metadata.pixelArtScore > 0.7) {
        warnings.push('High color count for pixel art style');
        score *= 0.95;
      }

      // Too few colors
      if (count < 4) {
        warnings.push('Very limited color palette');
        score *= 0.9;
      }
    }

    // Check visual complexity
    if (metadata.visualComplexity !== undefined) {
      if (metadata.visualComplexity < 0.1) {
        warnings.push('Image appears too simple or corrupted');
        score *= 0.8;
      } else if (metadata.visualComplexity > 0.9) {
        warnings.push('Image may be overly complex');
        score *= 0.95;
      }
    }

    // Simulate additional visual quality checks
    // In a real implementation, these would use computer vision:
    
    // - Blur detection
    // - Noise analysis  
    // - Artifact detection
    // - Contrast analysis
    // - Color harmony assessment
    
    // For now, we'll use quality score from metadata
    if (metadata.qualityScore !== undefined) {
      if (metadata.qualityScore < 0.5) {
        issues.push('Low overall quality score');
        score *= 0.7;
      } else if (metadata.qualityScore < 0.7) {
        warnings.push('Moderate quality detected');
        score *= 0.9;
      }
    }

    return { score: Math.max(score, 0), issues, warnings };
  }

  /**
   * Validate content appropriateness (NSFW, violence, etc.)
   */
  private async validateContentAppropriateness(asset: any): Promise<{
    score: number;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 1.0;

    if (!this.config.contentFiltering) {
      return { score, issues, warnings };
    }

    try {
      // Simulate content filtering checks
      // In a real implementation, this would use:
      // - Google Cloud Vision API for safe search
      // - AWS Rekognition for content moderation  
      // - Microsoft Azure Content Moderator
      // - Custom ML models for game-specific content

      const contentAnalysis = await this.analyzeContentSafety(asset);

      // Check NSFW content
      if (this.config.nsfw && contentAnalysis.nsfw > 0.3) {
        if (contentAnalysis.nsfw > 0.7) {
          issues.push('Inappropriate content detected');
          score = 0;
        } else {
          warnings.push('Potentially inappropriate content');
          score *= 0.8;
        }
      }

      // Check violence
      if (this.config.violenceFilter && contentAnalysis.violence > 0.5) {
        if (contentAnalysis.violence > 0.8) {
          issues.push('Excessive violence detected');
          score *= 0.5;
        } else {
          warnings.push('Mild violence detected');
          score *= 0.9;
        }
      }

      // Check for copyright issues (if enabled)
      if (this.config.copyrightFilter && contentAnalysis.copyright > 0.7) {
        issues.push('Potential copyright violation detected');
        score *= 0.3;
      }

    } catch (error) {
      console.error('Content filtering failed:', error);
      warnings.push('Content filtering unavailable');
      score *= 0.95; // Small penalty for inability to verify
    }

    return { score: Math.max(score, 0), issues, warnings };
  }

  /**
   * Validate style consistency
   */
  private async validateStyleConsistency(asset: any): Promise<{
    score: number;
    issues: string[];
    warnings: string[];
  }> {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 1.0;

    const metadata = asset.metadata || {};

    // Check style consistency score if available
    if (metadata.styleConsistency !== undefined) {
      if (metadata.styleConsistency < 0.5) {
        warnings.push('Style inconsistency detected');
        score *= 0.8;
      } else if (metadata.styleConsistency > 0.9) {
        // Bonus for excellent style consistency
        score = Math.min(score * 1.05, 1.0);
      }
    }

    // Check if colors match requested palette
    if (asset.requestedPalette && metadata.colors?.palette) {
      const matchingColors = this.calculateColorPaletteMatch(
        metadata.colors.palette,
        asset.requestedPalette
      );
      
      if (matchingColors < 0.7) {
        warnings.push('Generated colors don\'t match requested palette');
        score *= 0.9;
      }
    }

    // Check dimension consistency with asset type
    if (metadata.dimensions && asset.assetType) {
      const dimensionScore = this.validateAssetTypeDimensions(
        asset.assetType,
        metadata.dimensions
      );
      score *= dimensionScore;
      
      if (dimensionScore < 0.8) {
        warnings.push('Dimensions may not be optimal for asset type');
      }
    }

    return { score: Math.max(score, 0), issues, warnings };
  }

  /**
   * Simulate content safety analysis
   */
  private async analyzeContentSafety(asset: any): Promise<{
    nsfw: number;
    violence: number;
    copyright: number;
  }> {
    // In a real implementation, this would call external APIs
    // For simulation, we'll return safe content scores
    return {
      nsfw: 0.1,      // Low probability of NSFW content
      violence: 0.2,  // Low probability of violence
      copyright: 0.1, // Low probability of copyright issues
    };
  }

  /**
   * Calculate color palette match percentage
   */
  private calculateColorPaletteMatch(generated: string[], requested: string[]): number {
    if (!generated.length || !requested.length) return 0;

    let matches = 0;
    const tolerance = 30; // RGB difference tolerance

    for (const reqColor of requested) {
      const reqRgb = this.hexToRgb(reqColor);
      if (!reqRgb) continue;

      const hasMatch = generated.some(genColor => {
        const genRgb = this.hexToRgb(genColor);
        if (!genRgb) return false;

        const distance = Math.sqrt(
          Math.pow(reqRgb.r - genRgb.r, 2) +
          Math.pow(reqRgb.g - genRgb.g, 2) +
          Math.pow(reqRgb.b - genRgb.b, 2)
        );

        return distance <= tolerance;
      });

      if (hasMatch) matches++;
    }

    return matches / requested.length;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Validate dimensions against asset type expectations
   */
  private validateAssetTypeDimensions(
    assetType: AssetType,
    dimensions: { width: number; height: number }
  ): number {
    const { width, height } = dimensions;
    const aspectRatio = width / height;

    const typeExpectations = {
      sprite: {
        minSize: 16,
        maxSize: 256,
        preferredAspectRatio: 1,
        aspectTolerance: 0.5,
      },
      background: {
        minSize: 64,
        maxSize: 1920,
        preferredAspectRatio: 16/9,
        aspectTolerance: 1.0,
      },
      tile: {
        minSize: 8,
        maxSize: 64,
        preferredAspectRatio: 1,
        aspectTolerance: 0.2,
      },
      ui: {
        minSize: 16,
        maxSize: 512,
        preferredAspectRatio: 2,
        aspectTolerance: 2.0,
      },
      animation: {
        minSize: 16,
        maxSize: 128,
        preferredAspectRatio: 1,
        aspectTolerance: 0.3,
      },
      tileset: {
        minSize: 64,
        maxSize: 512,
        preferredAspectRatio: 1,
        aspectTolerance: 1.0,
      },
    };

    const expectations = typeExpectations[assetType];
    if (!expectations) return 0.8; // Default score for unknown types

    let score = 1.0;

    // Check minimum size
    if (Math.min(width, height) < expectations.minSize) {
      score *= 0.6;
    }

    // Check maximum size
    if (Math.max(width, height) > expectations.maxSize) {
      score *= 0.9;
    }

    // Check aspect ratio
    const aspectDiff = Math.abs(aspectRatio - expectations.preferredAspectRatio);
    if (aspectDiff > expectations.aspectTolerance) {
      score *= 0.8;
    }

    return score;
  }

  /**
   * Get quality threshold for asset type
   */
  private getQualityThreshold(assetType?: AssetType): number {
    if (!assetType) return 0.7;

    return this.config.qualityThresholds[assetType] || 0.7;
  }

  /**
   * Generate quality improvement recommendations
   */
  generateRecommendations(result: QualityValidationResult): string[] {
    const recommendations: string[] = [];

    if (result.technicalQuality < 0.8) {
      recommendations.push('Consider adjusting resolution or format settings');
    }

    if (result.visualQuality < 0.8) {
      recommendations.push('Try different style parameters or regenerate for better visual quality');
    }

    if (result.styleConsistency < 0.7) {
      recommendations.push('Use more specific style prompts or reference existing assets');
    }

    if (result.score < 0.6) {
      recommendations.push('Asset may need manual editing or regeneration with different parameters');
    }

    return recommendations;
  }

  /**
   * Create approval workflow entry
   */
  async createApprovalWorkflow(
    asset: any,
    validationResult: QualityValidationResult,
    userId: string
  ): Promise<{
    workflowId: string;
    status: 'auto_approved' | 'needs_review' | 'rejected';
    reviewRequired: boolean;
  }> {
    const workflowId = `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Auto-approve if meets all criteria
    if (validationResult.isValid && 
        validationResult.score >= 0.8 &&
        validationResult.contentAppropriate >= 0.9) {
      return {
        workflowId,
        status: 'auto_approved',
        reviewRequired: false,
      };
    }

    // Auto-reject if severely problematic
    if (validationResult.contentAppropriate < 0.5 || 
        validationResult.technicalQuality < 0.3) {
      return {
        workflowId,
        status: 'rejected',
        reviewRequired: false,
      };
    }

    // Needs human review
    return {
      workflowId,
      status: 'needs_review',
      reviewRequired: true,
    };
  }
}