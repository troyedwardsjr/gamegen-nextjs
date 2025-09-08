-- Row Level Security (RLS) Policies for GameGen Authentication System
-- These policies ensure users can only access their own data and enforce tier-based permissions

-- Enable RLS on all relevant tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_attempts ENABLE ROW LEVEL SECURITY;

-- ====================
-- PROFILES TABLE POLICIES
-- ====================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (during registration)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (subscription_tier = 'max' OR 'admin' = ANY(roles))
        )
    );

-- ====================
-- GAMES TABLE POLICIES
-- ====================

-- Users can view public games
CREATE POLICY "Anyone can view public games" ON games
    FOR SELECT USING (visibility = 'public');

-- Users can view their own games
CREATE POLICY "Users can view own games" ON games
    FOR SELECT USING (creator_id = auth.uid());

-- Users can view educational games if they have educational tier
CREATE POLICY "Educational users can view educational games" ON games
    FOR SELECT USING (
        visibility = 'educational' 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND subscription_tier = 'educational'
        )
    );

-- Users can view games shared with them via collaboration
CREATE POLICY "Users can view shared games" ON games
    FOR SELECT USING (
        id IN (
            SELECT game_id FROM collaboration_sessions cs
            WHERE cs.participants ? auth.uid()::text
            AND cs.ended_at IS NULL
        )
    );

-- Users can create games
CREATE POLICY "Authenticated users can create games" ON games
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND creator_id = auth.uid()
    );

-- Users can update their own games
CREATE POLICY "Users can update own games" ON games
    FOR UPDATE USING (creator_id = auth.uid());

-- Users can delete their own games
CREATE POLICY "Users can delete own games" ON games
    FOR DELETE USING (creator_id = auth.uid());

-- ====================
-- AI_GENERATIONS TABLE POLICIES
-- ====================

-- Users can only view their own AI generations
CREATE POLICY "Users can view own AI generations" ON ai_generations
    FOR SELECT USING (user_id = auth.uid());

-- Users can create AI generations with credit limit check
CREATE POLICY "Users can create AI generations within limits" ON ai_generations
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND (
            -- Check daily credit limits based on tier
            (SELECT credits_used_today FROM profiles WHERE id = auth.uid()) 
            < CASE 
                WHEN (SELECT subscription_tier FROM profiles WHERE id = auth.uid()) = 'free' THEN 10
                WHEN (SELECT subscription_tier FROM profiles WHERE id = auth.uid()) = 'pro' THEN 100
                WHEN (SELECT subscription_tier FROM profiles WHERE id = auth.uid()) = 'educational' THEN 50
                ELSE 1000 -- Max tier
            END
        )
    );

-- Users can update their own AI generations
CREATE POLICY "Users can update own AI generations" ON ai_generations
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own AI generations
CREATE POLICY "Users can delete own AI generations" ON ai_generations
    FOR DELETE USING (user_id = auth.uid());

-- ====================
-- COLLABORATION_SESSIONS TABLE POLICIES
-- ====================

-- Users can view collaboration sessions they're part of
CREATE POLICY "Users can view own collaboration sessions" ON collaboration_sessions
    FOR SELECT USING (
        creator_id = auth.uid() 
        OR participants ? auth.uid()::text
    );

-- Users can create collaboration sessions for their games
CREATE POLICY "Game owners can create collaboration sessions" ON collaboration_sessions
    FOR INSERT WITH CHECK (
        creator_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM games 
            WHERE id = game_id 
            AND creator_id = auth.uid()
        )
    );

-- Users can update collaboration sessions they created
CREATE POLICY "Creators can update collaboration sessions" ON collaboration_sessions
    FOR UPDATE USING (creator_id = auth.uid());

-- ====================
-- SECURITY_EVENTS TABLE POLICIES
-- ====================

-- Users can view their own security events
CREATE POLICY "Users can view own security events" ON security_events
    FOR SELECT USING (user_id = auth.uid());

-- System can insert security events for any user
CREATE POLICY "System can insert security events" ON security_events
    FOR INSERT WITH CHECK (true);

-- Admins can view all security events
CREATE POLICY "Admins can view all security events" ON security_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND 'admin' = ANY(roles)
        )
    );

-- ====================
-- MFA_CONFIGURATIONS TABLE POLICIES
-- ====================

-- Users can view their own MFA configuration
CREATE POLICY "Users can view own MFA config" ON mfa_configurations
    FOR SELECT USING (user_id = auth.uid());

-- Users can manage their own MFA configuration
CREATE POLICY "Users can manage own MFA config" ON mfa_configurations
    FOR ALL USING (user_id = auth.uid());

-- ====================
-- FAILED_LOGIN_ATTEMPTS TABLE POLICIES
-- ====================

-- Only system can insert failed login attempts
CREATE POLICY "System can insert failed login attempts" ON failed_login_attempts
    FOR INSERT WITH CHECK (true);

-- Users can view their own failed login attempts
CREATE POLICY "Users can view own failed login attempts" ON failed_login_attempts
    FOR SELECT USING (
        email IN (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Admins can view all failed login attempts
CREATE POLICY "Admins can view all failed login attempts" ON failed_login_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND 'admin' = ANY(roles)
        )
    );

-- ====================
-- ACCOUNT_LOCKOUTS TABLE POLICIES
-- ====================

-- Users can view their own account lockouts
CREATE POLICY "Users can view own account lockouts" ON account_lockouts
    FOR SELECT USING (user_id = auth.uid());

-- System can insert account lockouts
CREATE POLICY "System can insert account lockouts" ON account_lockouts
    FOR INSERT WITH CHECK (true);

-- Admins can view and manage all account lockouts
CREATE POLICY "Admins can manage account lockouts" ON account_lockouts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND 'admin' = ANY(roles)
        )
    );

-- ====================
-- EMAIL_VERIFICATION_ATTEMPTS TABLE POLICIES
-- ====================

-- Users can view their own email verification attempts
CREATE POLICY "Users can view own email verification attempts" ON email_verification_attempts
    FOR SELECT USING (user_id = auth.uid());

-- System can insert email verification attempts
CREATE POLICY "System can insert email verification attempts" ON email_verification_attempts
    FOR INSERT WITH CHECK (true);

-- ====================
-- HELPER FUNCTIONS FOR RLS
-- ====================

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(permission_name text)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND permission_name = ANY(permissions)
    );
$$;

-- Function to get user's subscription tier
CREATE OR REPLACE FUNCTION get_user_tier()
RETURNS text
LANGUAGE sql STABLE
AS $$
    SELECT subscription_tier FROM profiles WHERE id = auth.uid();
$$;

-- Function to check if email exists (for client-side checks)
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE email = email_to_check
    );
$$;

-- Function to get user ID by email (for server-side operations)
CREATE OR REPLACE FUNCTION get_user_id_by_email(email_address text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
    SELECT id FROM auth.users WHERE email = email_address LIMIT 1;
$$;

-- ====================
-- TIER-SPECIFIC POLICIES
-- ====================

-- Policy for tier-based game creation limits
CREATE POLICY "Tier-based game creation limits" ON games
    FOR INSERT WITH CHECK (
        auth.uid() = creator_id
        AND (
            CASE 
                WHEN get_user_tier() = 'free' THEN (
                    SELECT COUNT(*) FROM games 
                    WHERE creator_id = auth.uid() 
                    AND created_at > NOW() - INTERVAL '24 hours'
                ) < 1
                WHEN get_user_tier() = 'pro' THEN (
                    SELECT COUNT(*) FROM games 
                    WHERE creator_id = auth.uid() 
                    AND created_at > NOW() - INTERVAL '24 hours'
                ) < 10
                ELSE true -- Max and educational tiers have no daily limits
            END
        )
    );

-- Policy for tier-based asset upload limits
CREATE POLICY "Tier-based asset upload limits" ON game_assets
    FOR INSERT WITH CHECK (
        auth.uid() = uploaded_by
        AND (
            CASE 
                WHEN get_user_tier() = 'free' THEN false -- Free tier can't upload custom assets
                WHEN get_user_tier() = 'pro' THEN (
                    SELECT COALESCE(SUM(file_size), 0) FROM game_assets 
                    WHERE uploaded_by = auth.uid()
                ) < 100 * 1024 * 1024 -- 100MB limit for pro
                ELSE true -- Max and educational tiers have higher limits
            END
        )
    );

-- ====================
-- EDUCATIONAL TIER SPECIFIC POLICIES
-- ====================

-- Educational users can manage students in their institution
CREATE POLICY "Educational users can manage students" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p1
            WHERE p1.id = auth.uid()
            AND p1.subscription_tier = 'educational'
            AND p1.institution_id IS NOT NULL
            AND p1.institution_id = profiles.institution_id
        )
    );

-- Educational users can view games from their institution
CREATE POLICY "Educational users can view institutional games" ON games
    FOR SELECT USING (
        creator_id IN (
            SELECT id FROM profiles 
            WHERE institution_id = (
                SELECT institution_id FROM profiles 
                WHERE id = auth.uid()
                AND subscription_tier = 'educational'
            )
        )
    );

-- ====================
-- AUDIT AND COMPLIANCE POLICIES
-- ====================

-- Log all data access for GDPR compliance
CREATE OR REPLACE FUNCTION log_data_access()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO security_events (
        event_type,
        user_id,
        metadata,
        created_at
    ) VALUES (
        'DATA_ACCESS',
        auth.uid(),
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'record_id', COALESCE(NEW.id, OLD.id)
        ),
        NOW()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit logging to sensitive tables
CREATE TRIGGER audit_profiles
    AFTER SELECT OR INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION log_data_access();

CREATE TRIGGER audit_games
    AFTER SELECT OR INSERT OR UPDATE OR DELETE ON games
    FOR EACH ROW EXECUTE FUNCTION log_data_access();

-- ====================
-- CLEANUP POLICIES
-- ====================

-- Policy to allow cleanup of old data (for system maintenance)
CREATE POLICY "System can cleanup old security events" ON security_events
    FOR DELETE USING (
        created_at < NOW() - INTERVAL '90 days'
        AND severity IN ('low', 'medium')
    );

CREATE POLICY "System can cleanup old failed attempts" ON failed_login_attempts
    FOR DELETE USING (
        created_at < NOW() - INTERVAL '24 hours'
    );

-- Grant necessary permissions to service role for maintenance
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;