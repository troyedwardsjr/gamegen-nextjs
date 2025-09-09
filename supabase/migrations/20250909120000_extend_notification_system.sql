-- Migration: Extend Notification System for Dashboard Integration
-- Description: Extend existing notifications table and create notification_settings and notification_templates
-- Date: 2025-09-09

-- First, add new columns to existing notifications table for dashboard compatibility
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_label TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add new notification types for dashboard requirements
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_notification_type_check 
CHECK (notification_type IN (
    -- Existing social types
    'follow', 'game_like', 'game_comment', 'game_featured',
    'achievement_unlocked', 'challenge_invite', 'mention',
    'collaboration_invite', 'collection_add', 'system_announcement',
    -- New dashboard types  
    'project_published', 'comment_received', 'like_received', 
    'follow_received', 'credit_low', 'subscription_expiring', 
    'system_maintenance', 'security_alert'
));

-- Add category constraint
ALTER TABLE notifications ADD CONSTRAINT notifications_category_check 
CHECK (category IN ('collaboration', 'social', 'achievements', 'billing', 'system', 'security'));

-- Set default values for existing records
UPDATE notifications SET 
    category = CASE 
        WHEN notification_type IN ('collaboration_invite') THEN 'collaboration'
        WHEN notification_type IN ('follow', 'game_like', 'game_comment', 'mention', 'collection_add') THEN 'social'
        WHEN notification_type IN ('achievement_unlocked', 'challenge_invite') THEN 'achievements'
        WHEN notification_type IN ('credit_low', 'subscription_expiring') THEN 'billing'
        WHEN notification_type IN ('system_announcement', 'system_maintenance', 'game_featured') THEN 'system'
        WHEN notification_type IN ('security_alert') THEN 'security'
        ELSE 'system'
    END,
    priority = CASE 
        WHEN notification_type IN ('security_alert') THEN 'urgent'
        WHEN notification_type IN ('game_featured', 'achievement_unlocked') THEN 'high'
        WHEN notification_type IN ('collaboration_invite', 'credit_low', 'subscription_expiring') THEN 'medium'
        ELSE 'low'
    END
WHERE category IS NULL OR priority IS NULL;

-- Create notification_settings table for user preferences
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Email notification preferences
    email_collaborations BOOLEAN DEFAULT true,
    email_social_activity BOOLEAN DEFAULT true,
    email_achievements BOOLEAN DEFAULT true,
    email_billing BOOLEAN DEFAULT true,
    email_system BOOLEAN DEFAULT false,
    
    -- In-app notification preferences  
    in_app_collaborations BOOLEAN DEFAULT true,
    in_app_social_activity BOOLEAN DEFAULT true,
    in_app_achievements BOOLEAN DEFAULT true,
    in_app_billing BOOLEAN DEFAULT true,
    in_app_system BOOLEAN DEFAULT true,
    
    -- Push notification preferences
    push_collaborations BOOLEAN DEFAULT false,
    push_social_activity BOOLEAN DEFAULT false,
    push_achievements BOOLEAN DEFAULT true,
    push_billing BOOLEAN DEFAULT true,
    push_system BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notification_templates table for consistent messaging
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_type TEXT NOT NULL,
    category TEXT NOT NULL,
    
    -- Template content
    title_template TEXT NOT NULL,
    content_template TEXT NOT NULL,
    action_label_template TEXT,
    
    -- Template metadata
    default_priority TEXT DEFAULT 'medium' CHECK (default_priority IN ('low', 'medium', 'high', 'urgent')),
    expires_after_hours INTEGER DEFAULT NULL CHECK (expires_after_hours > 0),
    
    -- Personalization settings
    supports_personalization BOOLEAN DEFAULT false,
    required_data_fields JSONB DEFAULT '[]',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(notification_type)
);

-- Insert default notification templates
INSERT INTO notification_templates (notification_type, category, title_template, content_template, action_label_template, default_priority, expires_after_hours, supports_personalization, required_data_fields) VALUES
-- Collaboration templates
('collaboration_invite', 'collaboration', 'Collaboration Invitation', '{{sender_name}} wants to collaborate on "{{project_title}}"', 'View Invitation', 'medium', 168, true, '["sender_name", "project_title"]'),

-- Social templates
('game_featured', 'system', 'Project Featured', 'Your game "{{project_title}}" has been featured on the homepage!', 'View Project', 'high', 72, true, '["project_title"]'),
('game_like', 'social', 'New Like', '{{sender_name}} liked your game "{{project_title}}"', 'View Game', 'low', 48, true, '["sender_name", "project_title"]'),
('game_comment', 'social', 'New Comment', '{{sender_name}} commented on your game "{{project_title}}"', 'View Comment', 'medium', 48, true, '["sender_name", "project_title"]'),
('follow', 'social', 'New Follower', '{{sender_name}} started following you', 'View Profile', 'low', 24, true, '["sender_name"]'),

-- Achievement templates
('achievement_unlocked', 'achievements', 'Achievement Unlocked', 'Congratulations! You unlocked the "{{achievement_title}}" achievement', 'View Achievement', 'high', 24, true, '["achievement_title"]'),

-- Billing templates
('credit_low', 'billing', 'Credits Running Low', 'You have {{credits_remaining}} credits remaining', 'Buy Credits', 'medium', null, true, '["credits_remaining"]'),
('subscription_expiring', 'billing', 'Subscription Expiring', 'Your subscription expires in {{days_remaining}} days', 'Renew Subscription', 'medium', null, true, '["days_remaining"]'),

-- System templates
('system_announcement', 'system', 'System Announcement', '{{announcement_text}}', 'Learn More', 'low', 72, true, '["announcement_text"]'),
('system_maintenance', 'system', 'Scheduled Maintenance', 'Scheduled maintenance on {{maintenance_date}}. Expected downtime: {{duration}}', 'View Details', 'medium', 24, true, '["maintenance_date", "duration"]'),

-- Security templates
('security_alert', 'security', 'Security Alert', '{{alert_message}}', 'Secure Account', 'urgent', 168, true, '["alert_message"]');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category, is_active);

-- Add new indexes for extended notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Create function to get user notification settings (with defaults)
CREATE OR REPLACE FUNCTION get_user_notification_settings(user_uuid UUID)
RETURNS TABLE(
    user_id UUID,
    email_collaborations BOOLEAN,
    email_social_activity BOOLEAN,
    email_achievements BOOLEAN,
    email_billing BOOLEAN,
    email_system BOOLEAN,
    in_app_collaborations BOOLEAN,
    in_app_social_activity BOOLEAN,
    in_app_achievements BOOLEAN,
    in_app_billing BOOLEAN,
    in_app_system BOOLEAN,
    push_collaborations BOOLEAN,
    push_social_activity BOOLEAN,
    push_achievements BOOLEAN,
    push_billing BOOLEAN,
    push_system BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(ns.user_id, user_uuid),
        COALESCE(ns.email_collaborations, true),
        COALESCE(ns.email_social_activity, true),
        COALESCE(ns.email_achievements, true),
        COALESCE(ns.email_billing, true),
        COALESCE(ns.email_system, false),
        COALESCE(ns.in_app_collaborations, true),
        COALESCE(ns.in_app_social_activity, true),
        COALESCE(ns.in_app_achievements, true),
        COALESCE(ns.in_app_billing, true),
        COALESCE(ns.in_app_system, true),
        COALESCE(ns.push_collaborations, false),
        COALESCE(ns.push_social_activity, false),
        COALESCE(ns.push_achievements, true),
        COALESCE(ns.push_billing, true),
        COALESCE(ns.push_system, false)
    FROM (SELECT user_uuid as user_id) u
    LEFT JOIN notification_settings ns ON ns.user_id = u.user_id;
END;
$$;

-- Create function to create notification from template
CREATE OR REPLACE FUNCTION create_notification_from_template(
    p_recipient_id UUID,
    p_sender_id UUID DEFAULT NULL,
    p_notification_type TEXT,
    p_template_data JSONB DEFAULT '{}'::jsonb,
    p_related_game_id UUID DEFAULT NULL,
    p_related_comment_id UUID DEFAULT NULL,
    p_related_activity_id UUID DEFAULT NULL
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_template notification_templates%ROWTYPE;
    v_notification_id UUID;
    v_title TEXT;
    v_content TEXT;
    v_action_label TEXT;
    v_expires_at TIMESTAMPTZ;
    v_key TEXT;
    v_value TEXT;
BEGIN
    -- Get template
    SELECT * INTO v_template 
    FROM notification_templates 
    WHERE notification_type = p_notification_type AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active template found for notification type: %', p_notification_type;
    END IF;
    
    -- Process templates with data substitution
    v_title := v_template.title_template;
    v_content := v_template.content_template;
    v_action_label := v_template.action_label_template;
    
    -- Replace template variables
    FOR v_key, v_value IN SELECT * FROM jsonb_each_text(p_template_data)
    LOOP
        v_title := REPLACE(v_title, '{{' || v_key || '}}', v_value);
        v_content := REPLACE(v_content, '{{' || v_key || '}}', v_value);
        IF v_action_label IS NOT NULL THEN
            v_action_label := REPLACE(v_action_label, '{{' || v_key || '}}', v_value);
        END IF;
    END LOOP;
    
    -- Calculate expiration
    IF v_template.expires_after_hours IS NOT NULL THEN
        v_expires_at := NOW() + (v_template.expires_after_hours || ' hours')::INTERVAL;
    END IF;
    
    -- Create notification
    INSERT INTO notifications (
        recipient_id, sender_id, notification_type, title, content,
        category, priority, action_label, expires_at,
        related_game_id, related_comment_id, related_activity_id,
        notification_data
    ) VALUES (
        p_recipient_id, p_sender_id, p_notification_type, v_title, v_content,
        v_template.category, v_template.default_priority, v_action_label, v_expires_at,
        p_related_game_id, p_related_comment_id, p_related_activity_id,
        p_template_data
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- Create trigger to automatically set updated_at
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_settings_updated_at();

-- Create RLS policies for new tables
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Notification settings policies - users can only access their own settings
CREATE POLICY "notification_settings_select_own" ON notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notification_settings_insert_own" ON notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notification_settings_update_own" ON notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notification_settings_delete_own" ON notification_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Notification templates policies - read-only for users, admin can manage
CREATE POLICY "notification_templates_select_all" ON notification_templates
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT SELECT ON notification_templates TO authenticated;
GRANT ALL ON notification_settings TO authenticated;

-- Add helpful comments
COMMENT ON TABLE notification_settings IS 'User preferences for different types of notifications';
COMMENT ON TABLE notification_templates IS 'Templates for generating consistent notification content';
COMMENT ON FUNCTION create_notification_from_template IS 'Creates a notification using a template with data substitution';
COMMENT ON FUNCTION get_user_notification_settings IS 'Gets user notification settings with fallback defaults';