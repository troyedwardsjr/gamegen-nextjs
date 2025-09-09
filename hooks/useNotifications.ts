import { useState, useEffect, useCallback } from 'react';
import type { Notification, NotificationSettings } from '@/types/dashboard';

interface UseNotificationsReturn {
  // Data
  notifications: Notification[];
  unreadCount: number;
  notificationSettings: NotificationSettings;
  
  // Loading states
  loading: boolean;
  settingsLoading: boolean;
  
  // Error states
  error: string | null;
  settingsError: string | null;
  
  // Actions
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  updateNotificationSettings: (settings: NotificationSettings) => Promise<boolean>;
  handleNotificationAction: (notificationId: string, action: string) => void;
  
  // Refresh
  refreshNotifications: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

interface NotificationFilters {
  unreadOnly?: boolean;
  category?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export function useNotifications(filters: NotificationFilters = {}): UseNotificationsReturn {
  // State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: {
      collaborations: true,
      socialActivity: true,
      achievements: true,
      billing: true,
      system: false,
    },
    inApp: {
      collaborations: true,
      socialActivity: true,
      achievements: true,
      billing: true,
      system: true,
    },
    push: {
      collaborations: false,
      socialActivity: false,
      achievements: true,
      billing: true,
      system: false,
    },
  });
  
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Build query parameters for API
  const buildQueryParams = useCallback((filters: NotificationFilters) => {
    const params = new URLSearchParams();
    
    if (filters.unreadOnly) params.set('unread_only', 'true');
    if (filters.category) params.set('category', filters.category);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.page) params.set('page', filters.page.toString());
    if (filters.limit) params.set('limit', filters.limit.toString());
    
    return params.toString();
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = buildQueryParams(filters);
      const url = `/api/notifications${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch notifications');
      }
      
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [filters, buildQueryParams]);

  // Fetch notification settings
  const fetchNotificationSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      setSettingsError(null);
      
      const response = await fetch('/api/notifications/settings');
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch notification settings');
      }
      
      if (data.settings) {
        setNotificationSettings(data.settings);
      }
      
    } catch (err) {
      console.error('Error fetching notification settings:', err);
      setSettingsError(err instanceof Error ? err.message : 'Failed to fetch settings');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true, readAt: new Date().toISOString() }
            : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications?mark_all_read=true', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to mark all notifications as read');
      }
      
      // Update local state
      const now = new Date().toISOString();
      setNotifications(prev => 
        prev.map(notif => ({ 
          ...notif, 
          isRead: true, 
          readAt: notif.readAt || now 
        }))
      );
      
      setUnreadCount(0);
      
      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete notification');
      }
      
      // Update local state
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (notificationToDelete && !notificationToDelete.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  }, [notifications]);

  // Update notification settings
  const updateNotificationSettings = useCallback(async (settings: NotificationSettings): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update notification settings');
      }
      
      if (data.settings) {
        setNotificationSettings(data.settings);
      }
      
      return true;
    } catch (err) {
      console.error('Error updating notification settings:', err);
      return false;
    }
  }, []);

  // Handle notification action (like clicking a CTA button)
  const handleNotificationAction = useCallback((notificationId: string, action: string) => {
    // Find the notification
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    // Mark as read when user interacts
    if (!notification.isRead) {
      markAsRead(notificationId);
    }

    // Handle specific actions
    if (action === 'click' && notification.actionUrl) {
      // Navigate to the action URL
      window.location.href = notification.actionUrl;
    }

    console.log('Notification action:', { notificationId, action, notification });
  }, [notifications, markAsRead]);

  // Refresh functions
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  const refreshSettings = useCallback(async () => {
    await fetchNotificationSettings();
  }, [fetchNotificationSettings]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    fetchNotificationSettings();
  }, [fetchNotifications, fetchNotificationSettings]);

  return {
    // Data
    notifications,
    unreadCount,
    notificationSettings,
    
    // Loading states
    loading,
    settingsLoading,
    
    // Error states
    error,
    settingsError,
    
    // Actions
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updateNotificationSettings,
    handleNotificationAction,
    
    // Refresh
    refreshNotifications,
    refreshSettings,
  };
}