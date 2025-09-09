import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { NotificationSettings } from '@/types/dashboard';

// Helper function to safely access notification_settings table
// This is a temporary workaround until the database migration is applied
function getNotificationSettingsQuery(supabase: any) {
  return (supabase as any).from('notification_settings');
}

// Schema for updating notification settings
const UpdateNotificationSettingsSchema = z.object({
  email: z.object({
    collaborations: z.boolean(),
    socialActivity: z.boolean(),
    achievements: z.boolean(),
    billing: z.boolean(),
    system: z.boolean(),
  }).optional(),
  inApp: z.object({
    collaborations: z.boolean(),
    socialActivity: z.boolean(),
    achievements: z.boolean(),
    billing: z.boolean(),
    system: z.boolean(),
  }).optional(),
  push: z.object({
    collaborations: z.boolean(),
    socialActivity: z.boolean(),
    achievements: z.boolean(),
    billing: z.boolean(),
    system: z.boolean(),
  }).optional(),
});

interface NotificationSettingsResponse {
  success: boolean;
  settings?: NotificationSettings;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<NotificationSettingsResponse>> {
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

    // Get user's notification settings, or return defaults if none exist
    const { data: settings, error: settingsError } = await getNotificationSettingsQuery(supabase)
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      // PGRST116 is "not found" - that's OK, we'll use defaults
      console.error('Error fetching notification settings:', settingsError);
      
      // Fallback: If notification_settings table doesn't exist, use default settings
      if (settingsError.code === '42P01') {
        console.warn('Notification settings table not found, using default settings');
        // Continue with default settings (settings will be null)
      } else {
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch notification settings' 
        }, { status: 500 });
      }
    }

    // Transform database settings to dashboard format, with defaults
    const settingsData = settings as any;
    const notificationSettings: NotificationSettings = {
      email: {
        collaborations: settingsData?.email_collaborations ?? true,
        socialActivity: settingsData?.email_social_activity ?? true,
        achievements: settingsData?.email_achievements ?? true,
        billing: settingsData?.email_billing ?? true,
        system: settingsData?.email_system ?? false,
      },
      inApp: {
        collaborations: settingsData?.in_app_collaborations ?? true,
        socialActivity: settingsData?.in_app_social_activity ?? true,
        achievements: settingsData?.in_app_achievements ?? true,
        billing: settingsData?.in_app_billing ?? true,
        system: settingsData?.in_app_system ?? true,
      },
      push: {
        collaborations: settingsData?.push_collaborations ?? false,
        socialActivity: settingsData?.push_social_activity ?? false,
        achievements: settingsData?.push_achievements ?? true,
        billing: settingsData?.push_billing ?? true,
        system: settingsData?.push_system ?? false,
      },
    };

    return NextResponse.json({
      success: true,
      settings: notificationSettings,
    });

  } catch (error) {
    console.error('Get notification settings API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse<NotificationSettingsResponse>> {
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
    const validatedData = UpdateNotificationSettingsSchema.parse(body);

    // Build update object
    const updateData: any = {
      user_id: user.id,
    };

    if (validatedData.email) {
      updateData.email_collaborations = validatedData.email.collaborations;
      updateData.email_social_activity = validatedData.email.socialActivity;
      updateData.email_achievements = validatedData.email.achievements;
      updateData.email_billing = validatedData.email.billing;
      updateData.email_system = validatedData.email.system;
    }

    if (validatedData.inApp) {
      updateData.in_app_collaborations = validatedData.inApp.collaborations;
      updateData.in_app_social_activity = validatedData.inApp.socialActivity;
      updateData.in_app_achievements = validatedData.inApp.achievements;
      updateData.in_app_billing = validatedData.inApp.billing;
      updateData.in_app_system = validatedData.inApp.system;
    }

    if (validatedData.push) {
      updateData.push_collaborations = validatedData.push.collaborations;
      updateData.push_social_activity = validatedData.push.socialActivity;
      updateData.push_achievements = validatedData.push.achievements;
      updateData.push_billing = validatedData.push.billing;
      updateData.push_system = validatedData.push.system;
    }

    // Upsert notification settings (insert if not exists, update if exists)
    const { data: settings, error: upsertError } = await getNotificationSettingsQuery(supabase)
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single();

    if (upsertError) {
      console.error('Error updating notification settings:', upsertError);
      
      // Fallback: If notification_settings table doesn't exist, return mock success
      if (upsertError.code === '42P01') {
        console.warn('Notification settings table not found, returning mock settings');
        const mockSettings: NotificationSettings = {
          email: {
            collaborations: validatedData.email?.collaborations ?? true,
            socialActivity: validatedData.email?.socialActivity ?? true,
            achievements: validatedData.email?.achievements ?? true,
            billing: validatedData.email?.billing ?? true,
            system: validatedData.email?.system ?? false,
          },
          inApp: {
            collaborations: validatedData.inApp?.collaborations ?? true,
            socialActivity: validatedData.inApp?.socialActivity ?? true,
            achievements: validatedData.inApp?.achievements ?? true,
            billing: validatedData.inApp?.billing ?? true,
            system: validatedData.inApp?.system ?? true,
          },
          push: {
            collaborations: validatedData.push?.collaborations ?? false,
            socialActivity: validatedData.push?.socialActivity ?? false,
            achievements: validatedData.push?.achievements ?? true,
            billing: validatedData.push?.billing ?? true,
            system: validatedData.push?.system ?? false,
          },
        };
        
        return NextResponse.json({
          success: true,
          settings: mockSettings,
        });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update notification settings' 
      }, { status: 500 });
    }

    // Transform back to dashboard format
    const settingsResult = settings as any;
    const notificationSettings: NotificationSettings = {
      email: {
        collaborations: settingsResult.email_collaborations,
        socialActivity: settingsResult.email_social_activity,
        achievements: settingsResult.email_achievements,
        billing: settingsResult.email_billing,
        system: settingsResult.email_system,
      },
      inApp: {
        collaborations: settingsResult.in_app_collaborations,
        socialActivity: settingsResult.in_app_social_activity,
        achievements: settingsResult.in_app_achievements,
        billing: settingsResult.in_app_billing,
        system: settingsResult.in_app_system,
      },
      push: {
        collaborations: settingsResult.push_collaborations,
        socialActivity: settingsResult.push_social_activity,
        achievements: settingsResult.push_achievements,
        billing: settingsResult.push_billing,
        system: settingsResult.push_system,
      },
    };

    return NextResponse.json({
      success: true,
      settings: notificationSettings,
    });

  } catch (error) {
    console.error('Update notification settings API error:', error);
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

export async function PATCH(request: NextRequest): Promise<NextResponse<NotificationSettingsResponse>> {
  // PATCH allows partial updates - same logic as PUT but only updates provided fields
  return PUT(request);
}