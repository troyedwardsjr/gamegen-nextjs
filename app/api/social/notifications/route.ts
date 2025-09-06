/**
 * Notifications API Route
 * 
 * Handles user notifications including fetching, marking as read,
 * and managing notification preferences.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Notification, SocialDatabase } from '@/types/social';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const offset = (page - 1) * limit;
    const type = searchParams.get('type'); // Filter by notification type
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    
    const supabase = createRouteHandlerClient<SocialDatabase>({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Build query
    let query = supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!sender_id(id, username, display_name, avatar_url)
      `)
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('notification_type', type);
    }

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error: notificationsError } = await query;

    if (notificationsError) {
      console.error('Notifications error:', notificationsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id)
      .eq('is_read', false);

    // Get total count for pagination
    let totalQuery = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', user.id);

    if (type) {
      totalQuery = totalQuery.eq('notification_type', type);
    }

    if (unreadOnly) {
      totalQuery = totalQuery.eq('is_read', false);
    }

    const { count: totalCount } = await totalQuery;

    const response: NotificationsResponse = {
      success: true,
      notifications: notifications || [],
      unread_count: unreadCount || 0,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        hasMore: (totalCount || 0) > offset + limit
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<SocialDatabase>({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, notification_ids, mark_all_read } = body;

    if (action === 'mark_read') {
      let query = supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('recipient_id', user.id);

      if (mark_all_read) {
        // Mark all notifications as read
        query = query.eq('is_read', false);
      } else if (notification_ids && Array.isArray(notification_ids)) {
        // Mark specific notifications as read
        query = query.in('id', notification_ids);
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid request parameters' },
          { status: 400 }
        );
      }

      const { error: updateError } = await query;

      if (updateError) {
        console.error('Mark read error:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to mark notifications as read' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        message: mark_all_read ? 'All notifications marked as read' : 'Notifications marked as read' 
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Notifications PATCH API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<SocialDatabase>({ cookies });
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    if (deleteAll) {
      // Delete all notifications for the user
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('recipient_id', user.id);

      if (deleteError) {
        console.error('Delete all notifications error:', deleteError);
        return NextResponse.json(
          { success: false, error: 'Failed to delete notifications' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'All notifications deleted' });
    }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Delete specific notification
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('recipient_id', user.id); // Ensure user owns the notification

    if (deleteError) {
      console.error('Delete notification error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Notification deleted' });

  } catch (error) {
    console.error('Notifications DELETE API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}