// Notifications API functions for server-side data fetching

import type { Notification, NotificationSettings } from '@/types/dashboard';

interface GetNotificationsParams {
  limit?: number;
  includeSettings?: boolean;
  filter?: 'unread' | 'all';
}

interface GetNotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  settings?: NotificationSettings;
}

export async function getNotifications(params: GetNotificationsParams): Promise<GetNotificationsResponse> {
  try {
    // In a real implementation, this would fetch from Supabase
    // For now, return mock data with realistic delay
    await new Promise(resolve => setTimeout(resolve, 120));
    
    const mockNotifications: Notification[] = [
      {
        id: '1',
        userId: 'user-123',
        type: 'project_published',
        title: 'Project Published Successfully',
        message: 'Your game "Pixel Adventure Quest" has been published and is now live!',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isRead: false,
        priority: 'high',
        category: 'system',
        actionUrl: '/projects/1',
        data: {
          projectId: '1',
          projectTitle: 'Pixel Adventure Quest',
        },
      },
      {
        id: '2',
        userId: 'user-123',
        type: 'like_received',
        title: 'New Like on Your Project',
        message: 'GameMaster42 liked your project "Space Shooter Deluxe"',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        isRead: true,
        priority: 'medium',
        category: 'social',
        actionUrl: '/projects/2',
        data: {
          projectId: '2',
          projectTitle: 'Space Shooter Deluxe',
        },
      },
      {
        id: '3',
        userId: 'user-123',
        type: 'collaboration_invite',
        title: 'New Collaboration Invitation',
        message: 'PixelArtist99 invited you to collaborate on "Retro RPG Chronicles"',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isRead: false,
        priority: 'high',
        category: 'collaboration',
        actionUrl: '/collaborations/3',
        actionLabel: 'View Invitation',
        data: {
          projectId: '3',
          projectTitle: 'Retro RPG Chronicles',
        },
      },
      {
        id: '4',
        userId: 'user-123',
        type: 'achievement_unlocked',
        title: 'Achievement Unlocked!',
        message: 'You unlocked the "Game Creator" achievement for publishing your first game!',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        isRead: true,
        priority: 'medium',
        category: 'achievements',
        data: {
          achievementTitle: 'Game Creator',
        },
      },
      {
        id: '5',
        userId: 'user-123',
        type: 'credit_low',
        title: 'Credits Running Low',
        message: 'You have 50 credits remaining. Consider purchasing more to continue using AI features.',
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        isRead: false,
        priority: 'medium',
        category: 'billing',
        actionUrl: '/billing',
        actionLabel: 'Purchase Credits',
        data: {
          creditsRemaining: 50,
        },
      },
    ];

    // Filter notifications if requested
    const filteredNotifications = params.filter === 'unread' 
      ? mockNotifications.filter(n => !n.isRead)
      : mockNotifications;

    // Limit results
    const limitedNotifications = params.limit 
      ? filteredNotifications.slice(0, params.limit)
      : filteredNotifications;

    const unreadCount = mockNotifications.filter(n => !n.isRead).length;

    // Mock settings if requested
    let settings: NotificationSettings | undefined;
    if (params.includeSettings) {
      settings = {
        email: {
          collaborations: true,
          socialActivity: true,
          achievements: true,
          billing: true,
          system: true,
        },
        inApp: {
          collaborations: true,
          socialActivity: true,
          achievements: true,
          billing: true,
          system: true,
        },
        push: {
          collaborations: true,
          socialActivity: false,
          achievements: true,
          billing: true,
          system: false,
        },
      };
    }

    return {
      notifications: limitedNotifications,
      unreadCount,
      settings,
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    // In a real implementation, this would update the notification in Supabase
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`Marked notification ${notificationId} as read`);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw new Error('Failed to mark notification as read');
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  try {
    // In a real implementation, this would update all notifications in Supabase
    await new Promise(resolve => setTimeout(resolve, 150));
    console.log('Marked all notifications as read');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw new Error('Failed to mark all notifications as read');
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    // In a real implementation, this would delete the notification from Supabase
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`Deleted notification ${notificationId}`);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw new Error('Failed to delete notification');
  }
}

export async function updateNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    // In a real implementation, this would update settings in Supabase
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log('Updated notification settings:', settings);
  } catch (error) {
    console.error('Error updating notification settings:', error);
    throw new Error('Failed to update notification settings');
  }
}

export default {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  updateNotificationSettings,
};