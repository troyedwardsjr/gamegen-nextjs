import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Notification, NotificationType, NotificationCategory } from '@/types/dashboard';

// Helper function to safely access notifications table
// This is a temporary workaround until the database migration is applied
function getNotificationsQuery(supabase: any) {
  return (supabase as any).from('notifications');
}

// Mock notification store for fallback when database is unavailable
const mockNotificationStore = new Map<string, Notification[]>();

function getMockNotifications(userId: string): Notification[] {
  if (!mockNotificationStore.has(userId)) {
    // Initialize mock notifications for this user
    const mockNotifications: Notification[] = [
      {
        id: 'mock-collab-1',
        userId: userId,
        type: 'collaboration_invite',
        title: 'Collaboration Invite',
        message: 'Sarah invited you to collaborate on "Pixel Adventure"',
        data: { projectId: 'proj-1', projectTitle: 'Pixel Adventure', collaboratorName: 'Sarah' },
        isRead: false,
        category: getNotificationCategory('collaboration_invite'),
        priority: 'medium',
        actionUrl: '/project/proj-1/collaborate',
        actionLabel: 'View Project',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'mock-featured-2',
        userId: userId,
        type: 'project_featured',
        title: 'Project Featured',
        message: 'Your game "Space Shooter" was featured by the GameGen team!',
        data: { projectId: 'proj-2', projectTitle: 'Space Shooter' },
        isRead: false,
        category: getNotificationCategory('project_featured'), // This should be 'system'
        priority: 'high',
        actionUrl: '/project/proj-2',
        actionLabel: 'View Project',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      }
    ];
    mockNotificationStore.set(userId, mockNotifications);
  }
  return mockNotificationStore.get(userId) || [];
}

function updateMockNotification(userId: string, notificationId: string, updates: Partial<Notification>): boolean {
  const notifications = getMockNotifications(userId);
  const index = notifications.findIndex(n => n.id === notificationId);
  if (index !== -1) {
    notifications[index] = { ...notifications[index], ...updates };
    mockNotificationStore.set(userId, notifications);
    return true;
  }
  return false;
}

function markAllMockNotificationsAsRead(userId: string): boolean {
  const notifications = getMockNotifications(userId);
  const now = new Date().toISOString();
  const updatedNotifications = notifications.map(n => ({
    ...n,
    isRead: true,
    readAt: n.readAt || now
  }));
  mockNotificationStore.set(userId, updatedNotifications);
  return true;
}

// Map notification types to their correct categories
function getNotificationCategory(type: NotificationType): NotificationCategory {
  const typeToCategory: Record<NotificationType, NotificationCategory> = {
    'collaboration_invite': 'collaboration',
    'project_published': 'social',
    'project_featured': 'system', // FIXED: project_featured should be system, not social
    'comment_received': 'social',
    'like_received': 'social',
    'follow_received': 'social',
    'achievement_unlocked': 'achievements',
    'credit_low': 'billing',
    'subscription_expiring': 'billing',
    'system_maintenance': 'system',
    'security_alert': 'security',
  };
  
  return typeToCategory[type] || 'system';
}

// Schema for query parameters
const GetNotificationsSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  unread_only: z.string().optional().default('false'),
  category: z.enum(['collaboration', 'social', 'achievements', 'billing', 'system', 'security']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

// Schema for creating notifications
const CreateNotificationSchema = z.object({
  type: z.string(),
  title: z.string().min(1).max(200),
  message: z.string().max(1000),
  category: z.enum(['collaboration', 'social', 'achievements', 'billing', 'system', 'security']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  actionUrl: z.string().optional(),
  actionLabel: z.string().optional(),
  data: z.record(z.string(), z.any()).optional(),
  expiresAt: z.string().datetime().optional(),
});

// Schema for updating notifications
const UpdateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
});

interface NotificationsResponse {
  success: boolean;
  notifications?: Notification[];
  unread_count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<NotificationsResponse>> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { page, limit, unread_only, category, priority } = GetNotificationsSchema.parse(queryParams);

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    const isUnreadOnly = unread_only === 'true';

    // Build query
    let query = getNotificationsQuery(supabase)
      .select('*', { count: 'exact' })
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (isUnreadOnly) {
      query = query.eq('is_read', false);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Add pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: notifications, error: notificationsError, count } = await query;

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError);
      
      // Fallback: If notifications table doesn't exist, return mock data
      if (notificationsError.code === '42P01') { // Table doesn't exist
        console.warn('Notifications table not found, using fallback mock data');
        
        // Get mock notifications from store
        const mockNotifications = getMockNotifications(user.id);

        // Apply filters to mock data
        let filteredMockNotifications = mockNotifications;
        
        if (isUnreadOnly) {
          filteredMockNotifications = filteredMockNotifications.filter(n => !n.isRead);
        }
        
        if (category) {
          filteredMockNotifications = filteredMockNotifications.filter(n => n.category === category);
        }
        
        if (priority) {
          filteredMockNotifications = filteredMockNotifications.filter(n => n.priority === priority);
        }

        // Apply pagination
        const startIndex = (pageNum - 1) * limitNum;
        const paginatedNotifications = filteredMockNotifications.slice(startIndex, startIndex + limitNum);
        
        const unreadCount = mockNotifications.filter(n => !n.isRead).length;

        return NextResponse.json({
          success: true,
          notifications: paginatedNotifications,
          unread_count: unreadCount,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: filteredMockNotifications.length,
            hasMore: startIndex + limitNum < filteredMockNotifications.length,
          },
        });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch notifications' 
      }, { status: 500 });
    }

    // Get unread count separately
    const { count: unreadCount, error: unreadError } = await getNotificationsQuery(supabase)
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    if (unreadError) {
      console.error('Error fetching unread count:', unreadError);
      // If table doesn't exist, default to 0
      if (unreadError.code === '42P01') {
        console.warn('Notifications table not found for unread count, defaulting to 0');
      }
    }

    // Transform database notifications to dashboard format
    const transformedNotifications: Notification[] = (notifications || []).map((notif: any) => {
      const notificationType = notif.notification_type as NotificationType;
      return {
        id: notif.id,
        userId: notif.recipient_id,
        type: notificationType,
        title: notif.title,
        message: notif.content || '',
        data: notif.notification_data || {},
        isRead: notif.is_read,
        category: notif.category || getNotificationCategory(notificationType), // Use proper categorization
        priority: notif.priority || 'medium',
        actionUrl: notif.action_url,
        actionLabel: notif.action_label,
        createdAt: notif.created_at,
        readAt: notif.read_at,
        expiresAt: notif.expires_at,
      };
    });

    return NextResponse.json({
      success: true,
      notifications: transformedNotifications,
      unread_count: unreadCount || 0,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        hasMore: (count || 0) > offset + limitNum,
      },
    });

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<{ success: boolean; notification?: Notification; error?: string }>> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const validatedData = CreateNotificationSchema.parse(body);

    // Create notification in database
    const { data: notification, error: insertError } = await getNotificationsQuery(supabase)
      .insert({
        recipient_id: user.id,
        notification_type: validatedData.type,
        title: validatedData.title,
        content: validatedData.message,
        category: validatedData.category,
        priority: validatedData.priority,
        action_url: validatedData.actionUrl,
        action_label: validatedData.actionLabel,
        notification_data: validatedData.data || {},
        expires_at: validatedData.expiresAt,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating notification:', insertError);
      
      // Fallback: If notifications table doesn't exist, return mock response
      if (insertError.code === '42P01') {
        console.warn('Notifications table not found, returning mock success response');
        const notificationType = validatedData.type as NotificationType;
        const mockNotification: Notification = {
          id: 'mock-' + Date.now(),
          userId: user.id,
          type: notificationType,
          title: validatedData.title,
          message: validatedData.message,
          data: validatedData.data || {},
          isRead: false,
          category: validatedData.category || getNotificationCategory(notificationType), // Use proper categorization
          priority: validatedData.priority || 'medium',
          actionUrl: validatedData.actionUrl,
          actionLabel: validatedData.actionLabel,
          createdAt: new Date().toISOString(),
          readAt: undefined,
          expiresAt: validatedData.expiresAt,
        };
        
        return NextResponse.json({
          success: true,
          notification: mockNotification,
        });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create notification' 
      }, { status: 500 });
    }

    // Transform to dashboard format
    const notificationType = (notification as any).notification_type as NotificationType;
    const transformedNotification: Notification = {
      id: (notification as any).id,
      userId: (notification as any).recipient_id,
      type: notificationType,
      title: (notification as any).title,
      message: (notification as any).content || '',
      data: (notification as any).notification_data || {},
      isRead: (notification as any).is_read,
      category: (notification as any).category || getNotificationCategory(notificationType), // Use proper categorization
      priority: (notification as any).priority || 'medium',
      actionUrl: (notification as any).action_url,
      actionLabel: (notification as any).action_label,
      createdAt: (notification as any).created_at,
      readAt: (notification as any).read_at,
      expiresAt: (notification as any).expires_at,
    };

    return NextResponse.json({
      success: true,
      notification: transformedNotification,
    });

  } catch (error) {
    console.error('Create notification API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request data: ' + (error as any).errors.map((e: any) => e.message).join(', ')
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');
    const markAllAsRead = url.searchParams.get('mark_all_read') === 'true';

    if (markAllAsRead) {
      // Mark all user's notifications as read
      const { error: updateError } = await getNotificationsQuery(supabase)
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('recipient_id', user.id)
        .eq('is_read', false);

      if (updateError) {
        console.error('Error marking all notifications as read:', updateError);
        
        // Fallback: If notifications table doesn't exist, use mock store
        if (updateError.code === '42P01') {
          console.warn('Notifications table not found, using mock store for mark all read');
          markAllMockNotificationsAsRead(user.id);
          return NextResponse.json({ success: true });
        }
        
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to mark all notifications as read' 
        }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (!notificationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Notification ID required' 
      }, { status: 400 });
    }

    // Parse request body
    const body = await request.json();
    const validatedData = UpdateNotificationSchema.parse(body);

    // Update specific notification
    const updateData: any = {};
    if (validatedData.isRead !== undefined) {
      updateData.is_read = validatedData.isRead;
      if (validatedData.isRead) {
        updateData.read_at = new Date().toISOString();
      } else {
        updateData.read_at = null;
      }
    }

    const { error: updateError } = await getNotificationsQuery(supabase)
      .update(updateData)
      .eq('id', notificationId)
      .eq('recipient_id', user.id); // Ensure user owns the notification

    if (updateError) {
      console.error('Error updating notification:', updateError);
      
      // Fallback: If notifications table doesn't exist, use mock store
      if (updateError.code === '42P01') {
        console.warn('Notifications table not found, using mock store for update');
        const success = updateMockNotification(user.id, notificationId, updateData);
        return NextResponse.json({ success });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update notification' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update notification API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request data: ' + (error as any).errors.map((e: any) => e.message).join(', ')
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const url = new URL(request.url);
    const notificationId = url.searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Notification ID required' 
      }, { status: 400 });
    }

    // Delete notification
    const { error: deleteError } = await getNotificationsQuery(supabase)
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', user.id); // Ensure user owns the notification

    if (deleteError) {
      console.error('Error deleting notification:', deleteError);
      
      // Fallback: If notifications table doesn't exist, return success anyway
      if (deleteError.code === '42P01') {
        console.warn('Notifications table not found, returning mock success for delete');
        return NextResponse.json({ success: true });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete notification' 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete notification API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}