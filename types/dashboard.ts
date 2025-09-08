/**
 * GameGen Dashboard Types
 * Comprehensive type definitions for the P1 User Dashboard & Project Management system
 */

import { GameProject, UserProfile, GameAsset } from '@/src/lib/config/database';

// ========================
// Core Dashboard Types
// ========================

export interface DashboardStats {
  gamesCreated: number;
  totalPlays: number;
  communityFollowers: number;
  achievementsUnlocked: number;
  totalAssets: number;
  totalCollaborations: number;
  creditsUsed: number;
  creditsRemaining: number;
}

export interface DashboardUser extends UserProfile {
  projects: GameProject[];
  assets: GameAsset[];
  recentActivity: ActivityItem[];
}

// ========================
// Project Management Types
// ========================

export interface ProjectGridItem extends GameProject {
  thumbnail?: string;
  lastModified: string;
  collaborators?: ProjectCollaborator[];
  tags: string[];
  analyticsPreview?: {
    plays: number;
    likes: number;
    comments: number;
  };
}

export interface ProjectFilter {
  status?: GameProject['status'][];
  gameType?: GameProject['game_type'][];
  visibility?: GameProject['visibility'][];
  tags?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  collaboratorId?: string;
}

export interface ProjectSort {
  field: 'title' | 'created_at' | 'updated_at' | 'play_count' | 'like_count' | 'status';
  direction: 'asc' | 'desc';
}

export interface ProjectSearchResult {
  projects: ProjectGridItem[];
  totalCount: number;
  hasNextPage: boolean;
  facets: {
    statuses: Array<{ status: string; count: number }>;
    gameTypes: Array<{ gameType: string; count: number }>;
    tags: Array<{ tag: string; count: number }>;
  };
}

// ========================
// Activity Feed Types
// ========================

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  project?: {
    id: string;
    title: string;
    slug: string;
  };
  metadata?: ActivityMetadata;
}

export type ActivityType = 
  | 'project_created'
  | 'project_updated'
  | 'project_published'
  | 'project_played'
  | 'project_liked'
  | 'project_commented'
  | 'collaboration_invited'
  | 'collaboration_accepted'
  | 'asset_uploaded'
  | 'achievement_unlocked'
  | 'template_used';

export interface ActivityMetadata {
  [key: string]: any;
  // Example specific metadata
  plays_count?: number;
  collaborator_name?: string;
  asset_type?: string;
  achievement_title?: string;
}

// ========================
// Template System Types
// ========================

export interface GameTemplate {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  gameType: GameProject['game_type'];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  thumbnailUrl: string;
  screenshots: string[];
  tags: string[];
  usageCount: number;
  rating: number;
  ratingCount: number;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  isOfficial: boolean;
  isFeatured: boolean;
  estimatedTimeToComplete: number; // minutes
  features: string[];
  requirements: string[];
  gameConfig: any;
  sourceCode?: any;
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory = 
  | 'official'
  | 'popular'
  | 'beginner'
  | 'educational'
  | 'game_jams'
  | 'experimental'
  | 'community';

export interface TemplateFilter {
  category?: TemplateCategory[];
  gameType?: GameProject['game_type'][];
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
  tags?: string[];
  isOfficial?: boolean;
  isFeatured?: boolean;
}

// ========================
// Analytics Types
// ========================

export interface ProjectAnalytics {
  projectId: string;
  overview: {
    totalPlays: number;
    uniquePlayers: number;
    averagePlayTime: number;
    completionRate: number;
    retentionRate: number;
    shareCount: number;
  };
  engagement: {
    likes: number;
    comments: number;
    bookmarks: number;
    ratings: {
      average: number;
      count: number;
      distribution: { [rating: number]: number };
    };
  };
  performance: {
    loadTime: number;
    crashRate: number;
    errorRate: number;
    frameRate: number;
  };
  audience: {
    demographics: {
      ageGroups: { [group: string]: number };
      countries: { [country: string]: number };
      devices: { [device: string]: number };
    };
    playPatterns: {
      hourlyDistribution: { [hour: number]: number };
      weeklyDistribution: { [day: string]: number };
      sessionDuration: { [duration: string]: number };
    };
  };
  trends: {
    dailyPlays: Array<{ date: string; plays: number; uniquePlayers: number }>;
    weeklyGrowth: number;
    monthlyGrowth: number;
  };
}

export interface DashboardAnalytics {
  userId: string;
  overview: {
    totalProjects: number;
    publishedProjects: number;
    totalPlays: number;
    totalLikes: number;
    followerCount: number;
    creditsUsed: number;
  };
  projectPerformance: {
    topProjects: Array<{
      projectId: string;
      title: string;
      plays: number;
      growth: number;
    }>;
    recentTrends: Array<{
      date: string;
      plays: number;
      projects: number;
    }>;
  };
  engagement: {
    communityActivity: {
      likes: number;
      comments: number;
      shares: number;
      followers: number;
    };
    collaborations: {
      active: number;
      pending: number;
      completed: number;
    };
  };
  usage: {
    creditsUsage: Array<{
      date: string;
      used: number;
      category: string;
    }>;
    featureUsage: {
      [feature: string]: number;
    };
  };
}

// ========================
// Collaboration Types
// ========================

export interface ProjectCollaborator {
  id: string;
  userId: string;
  projectId: string;
  role: CollaboratorRole;
  permissions: CollaboratorPermission[];
  status: 'pending' | 'active' | 'inactive';
  invitedAt: string;
  joinedAt?: string;
  invitedBy: string;
  user: {
    id: string;
    displayName: string;
    username?: string;
    avatarUrl?: string;
    email: string;
  };
}

export type CollaboratorRole = 'owner' | 'admin' | 'editor' | 'viewer' | 'playtester';

export type CollaboratorPermission = 
  | 'view_project'
  | 'edit_project'
  | 'manage_assets'
  | 'manage_settings'
  | 'publish_project'
  | 'invite_collaborators'
  | 'manage_collaborators'
  | 'delete_project'
  | 'view_analytics';

export interface CollaborationInvite {
  id: string;
  projectId: string;
  inviterUserId: string;
  inviteeEmail: string;
  role: CollaboratorRole;
  permissions: CollaboratorPermission[];
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: string;
  createdAt: string;
  project: {
    id: string;
    title: string;
    thumbnailUrl?: string;
  };
  inviter: {
    displayName: string;
    avatarUrl?: string;
  };
}

// ========================
// Backup & Restore Types
// ========================

export interface ProjectBackup {
  id: string;
  projectId: string;
  version: number;
  name: string;
  description?: string;
  size: number; // bytes
  type: 'manual' | 'auto' | 'milestone';
  createdAt: string;
  createdBy: string;
  restorePoint: {
    gameConfig: any;
    sourceCode?: any;
    assets: string[]; // asset IDs
    metadata: any;
  };
  isRestorable: boolean;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  autoBackupFrequency: 'daily' | 'weekly' | 'on_publish';
  maxBackups: number;
  retentionDays: number;
}

// ========================
// Notification Types
// ========================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  isRead: boolean;
  category: NotificationCategory;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
}

export type NotificationType = 
  | 'collaboration_invite'
  | 'project_published'
  | 'project_featured'
  | 'comment_received'
  | 'like_received'
  | 'follow_received'
  | 'achievement_unlocked'
  | 'credit_low'
  | 'subscription_expiring'
  | 'system_maintenance'
  | 'security_alert';

export type NotificationCategory = 
  | 'collaboration'
  | 'social'
  | 'achievements'
  | 'billing'
  | 'system'
  | 'security';

export interface NotificationData {
  projectId?: string;
  projectTitle?: string;
  collaboratorName?: string;
  achievementTitle?: string;
  creditsRemaining?: number;
  [key: string]: any;
}

export interface NotificationSettings {
  email: {
    collaborations: boolean;
    socialActivity: boolean;
    achievements: boolean;
    billing: boolean;
    system: boolean;
  };
  inApp: {
    collaborations: boolean;
    socialActivity: boolean;
    achievements: boolean;
    billing: boolean;
    system: boolean;
  };
  push: {
    collaborations: boolean;
    socialActivity: boolean;
    achievements: boolean;
    billing: boolean;
    system: boolean;
  };
}

// ========================
// Billing & Usage Types
// ========================

export interface BillingInfo {
  subscription: {
    tier: 'free' | 'pro' | 'max';
    status: 'active' | 'past_due' | 'canceled' | 'incomplete';
    currentPeriodStart: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
    trialEnd?: string;
  };
  usage: {
    credits: {
      used: number;
      remaining: number;
      limit: number;
    };
    projects: {
      count: number;
      limit: number;
    };
    storage: {
      used: number; // bytes
      limit: number; // bytes
    };
    apiCalls: {
      count: number;
      limit: number;
    };
  };
  billing: {
    nextBillingDate: string;
    amount: number;
    currency: string;
    paymentMethod?: {
      type: 'card' | 'bank';
      last4: string;
      brand?: string;
    };
  };
}

export interface UsageHistory {
  period: string; // YYYY-MM
  credits: number;
  projects: number;
  storage: number;
  apiCalls: number;
  cost: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue' | 'void';
  amount: number;
  currency: string;
  description: string;
  downloadUrl: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

// ========================
// UI Component Types
// ========================

export interface DashboardTab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  badge?: number;
}

export interface DashboardAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export interface DashboardWidget {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  size: 'small' | 'medium' | 'large' | 'full';
  order: number;
  isVisible: boolean;
  isResizable?: boolean;
  minSize?: { width: number; height: number };
}

// ========================
// Search & Filtering Types
// ========================

export interface SearchQuery {
  q?: string;
  filters?: {
    [key: string]: any;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchSuggestion {
  type: 'project' | 'template' | 'user' | 'tag';
  id: string;
  label: string;
  subtitle?: string;
  thumbnailUrl?: string;
  metadata?: any;
}

// ========================
// Real-time Updates Types
// ========================

export interface RealtimeEvent {
  type: 'project_updated' | 'collaboration_activity' | 'notification_received' | 'analytics_updated';
  payload: any;
  userId: string;
  timestamp: string;
}

export interface RealtimeSubscription {
  channel: string;
  userId: string;
  isConnected: boolean;
  lastHeartbeat: string;
  events: RealtimeEvent[];
}