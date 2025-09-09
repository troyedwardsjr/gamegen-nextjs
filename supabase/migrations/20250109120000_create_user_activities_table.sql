-- Create user_activities table for activity feed system
CREATE TABLE user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (
        activity_type IN (
            'project_created', 'project_updated', 'project_published',
            'project_played', 'project_liked', 'project_commented',
            'collaboration_invited', 'collaboration_accepted', 
            'asset_uploaded', 'achievement_unlocked', 'template_used'
        )
    ),
    title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 200),
    description TEXT NOT NULL CHECK (length(description) >= 1 AND length(description) <= 1000),
    
    -- Related entities (nullable based on activity type)
    related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    related_game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    related_asset_id UUID REFERENCES game_assets(id) ON DELETE SET NULL,
    related_comment_id UUID REFERENCES game_comments(id) ON DELETE SET NULL,
    
    -- Flexible metadata for activity-specific data
    metadata JSONB DEFAULT '{}',
    
    -- Privacy and visibility controls
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'private')),
    is_system_generated BOOLEAN DEFAULT false,
    
    -- Activity aggregation support
    activity_group_id UUID, -- For grouping similar activities (e.g., multiple likes)
    is_primary_in_group BOOLEAN DEFAULT true, -- Whether this is the main activity in a group
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_user_activities_user_id_created_at ON user_activities(user_id, created_at DESC);
CREATE INDEX idx_user_activities_activity_type ON user_activities(activity_type);
CREATE INDEX idx_user_activities_visibility ON user_activities(visibility);
CREATE INDEX idx_user_activities_related_game_id ON user_activities(related_game_id);
CREATE INDEX idx_user_activities_related_user_id ON user_activities(related_user_id);
CREATE INDEX idx_user_activities_group_id ON user_activities(activity_group_id);

-- Create composite index for activity feed queries
CREATE INDEX idx_user_activities_feed ON user_activities(user_id, visibility, created_at DESC) WHERE is_primary_in_group = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_activities_updated_at
    BEFORE UPDATE ON user_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can see their own activities and public activities from others
CREATE POLICY "Users can view own activities" ON user_activities
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view public activities" ON user_activities
    FOR SELECT USING (visibility = 'public');

-- Users can only insert their own activities
CREATE POLICY "Users can create own activities" ON user_activities
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can only update their own activities
CREATE POLICY "Users can update own activities" ON user_activities
    FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Users can only delete their own activities
CREATE POLICY "Users can delete own activities" ON user_activities
    FOR DELETE USING (user_id = auth.uid());

-- Create function to log activities programmatically
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_activity_type TEXT,
    p_title TEXT,
    p_description TEXT,
    p_related_user_id UUID DEFAULT NULL,
    p_related_game_id UUID DEFAULT NULL,
    p_related_asset_id UUID DEFAULT NULL,
    p_related_comment_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_visibility TEXT DEFAULT 'public'
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO user_activities (
        user_id, activity_type, title, description,
        related_user_id, related_game_id, related_asset_id, related_comment_id,
        metadata, visibility
    ) VALUES (
        p_user_id, p_activity_type, p_title, p_description,
        p_related_user_id, p_related_game_id, p_related_asset_id, p_related_comment_id,
        p_metadata, p_visibility
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create database triggers for automatic activity logging

-- Trigger for game creation
CREATE OR REPLACE FUNCTION trigger_log_game_created()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_user_activity(
        NEW.creator_id,
        'project_created',
        'Created ' || NEW.title,
        'Created a new ' || COALESCE(NEW.genre, 'game') || ' project: ' || NEW.title,
        NULL,
        NEW.id,
        NULL,
        NULL,
        jsonb_build_object('game_type', NEW.genre, 'visibility', NEW.visibility),
        CASE WHEN NEW.visibility = 'public' THEN 'public' ELSE 'private' END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_game_created
    AFTER INSERT ON games
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_game_created();

-- Trigger for game updates
CREATE OR REPLACE FUNCTION trigger_log_game_updated()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log significant updates, not every minor change
    IF OLD.updated_at IS DISTINCT FROM NEW.updated_at AND 
       (OLD.title IS DISTINCT FROM NEW.title OR 
        OLD.description IS DISTINCT FROM NEW.description OR
        OLD.visibility IS DISTINCT FROM NEW.visibility) THEN
        
        PERFORM log_user_activity(
            NEW.creator_id,
            'project_updated',
            'Updated ' || NEW.title,
            'Made updates to ' || NEW.title,
            NULL,
            NEW.id,
            NULL,
            NULL,
            jsonb_build_object('previous_title', OLD.title, 'new_title', NEW.title),
            CASE WHEN NEW.visibility = 'public' THEN 'public' ELSE 'private' END
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_game_updated
    AFTER UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_game_updated();

-- Trigger for game publishing
CREATE OR REPLACE FUNCTION trigger_log_game_published()
RETURNS TRIGGER AS $$
BEGIN
    -- Log when a game is published (published_at changes from null to a value)
    IF OLD.published_at IS NULL AND NEW.published_at IS NOT NULL THEN
        PERFORM log_user_activity(
            NEW.creator_id,
            'project_published',
            'Published ' || NEW.title,
            'Published ' || NEW.title || ' for everyone to play!',
            NULL,
            NEW.id,
            NULL,
            NULL,
            jsonb_build_object('game_type', NEW.genre, 'published_at', NEW.published_at),
            'public'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_game_published
    AFTER UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_game_published();

-- Trigger for game likes
CREATE OR REPLACE FUNCTION trigger_log_game_liked()
RETURNS TRIGGER AS $$
DECLARE
    game_title TEXT;
    game_creator_id UUID;
BEGIN
    -- Get game info
    SELECT title, creator_id INTO game_title, game_creator_id 
    FROM games WHERE id = NEW.game_id;
    
    -- Log activity for the person who liked (if it's not their own game)
    IF NEW.user_id != game_creator_id THEN
        PERFORM log_user_activity(
            NEW.user_id,
            'project_liked',
            'Liked ' || game_title,
            'Liked the game ' || game_title,
            game_creator_id,
            NEW.game_id,
            NULL,
            NULL,
            jsonb_build_object('action', 'liked'),
            'public'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_game_liked
    AFTER INSERT ON game_likes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_game_liked();

-- Trigger for game comments
CREATE OR REPLACE FUNCTION trigger_log_game_commented()
RETURNS TRIGGER AS $$
DECLARE
    game_title TEXT;
    game_creator_id UUID;
BEGIN
    -- Get game info
    SELECT title, creator_id INTO game_title, game_creator_id 
    FROM games WHERE id = NEW.game_id;
    
    -- Log activity (including if commenting on own game)
    PERFORM log_user_activity(
        NEW.author_id,
        'project_commented',
        'Commented on ' || game_title,
        'Left a comment on ' || game_title,
        CASE WHEN NEW.author_id != game_creator_id THEN game_creator_id ELSE NULL END,
        NEW.game_id,
        NULL,
        NEW.id,
        jsonb_build_object('comment_length', length(NEW.content)),
        'public'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_game_commented
    AFTER INSERT ON game_comments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_game_commented();

-- Trigger for play sessions (project played)
CREATE OR REPLACE FUNCTION trigger_log_game_played()
RETURNS TRIGGER AS $$
DECLARE
    game_title TEXT;
    game_creator_id UUID;
BEGIN
    -- Only log if player_id is not null (authenticated plays)
    IF NEW.player_id IS NOT NULL THEN
        -- Get game info
        SELECT title, creator_id INTO game_title, game_creator_id 
        FROM games WHERE id = NEW.game_id;
        
        -- Log activity for the player (if it's not their own game)
        IF NEW.player_id != game_creator_id THEN
            PERFORM log_user_activity(
                NEW.player_id,
                'project_played',
                'Played ' || game_title,
                'Played ' || game_title || CASE 
                    WHEN NEW.session_duration IS NOT NULL 
                    THEN ' for ' || (NEW.session_duration / 60) || ' minutes'
                    ELSE ''
                END,
                game_creator_id,
                NEW.game_id,
                NULL,
                NULL,
                jsonb_build_object(
                    'session_duration', NEW.session_duration,
                    'completion_percentage', NEW.completion_percentage,
                    'platform', NEW.platform
                ),
                'public'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_game_played
    AFTER INSERT ON play_sessions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_game_played();

-- Trigger for asset uploads
CREATE OR REPLACE FUNCTION trigger_log_asset_uploaded()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM log_user_activity(
        NEW.creator_id,
        'asset_uploaded',
        'Uploaded ' || NEW.name,
        'Uploaded a new ' || NEW.asset_type || ' asset: ' || NEW.name,
        NULL,
        NEW.game_id,
        NEW.id,
        NULL,
        jsonb_build_object(
            'asset_type', NEW.asset_type,
            'file_size', NEW.file_size,
            'generated_by_ai', NEW.generated_by_ai
        ),
        CASE WHEN NEW.game_id IS NOT NULL THEN 
            (SELECT CASE WHEN visibility = 'public' THEN 'public' ELSE 'private' END 
             FROM games WHERE id = NEW.game_id)
        ELSE 'private' END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_asset_uploaded
    AFTER INSERT ON game_assets
    FOR EACH ROW
    EXECUTE FUNCTION trigger_log_asset_uploaded();