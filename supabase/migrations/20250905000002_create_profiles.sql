-- Migration: Create Profiles Table
-- Description: User profiles and preferences table with subscription management
-- Date: 2025-09-05

-- User profiles and preferences
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE NOT NULL CHECK (length(username) >= 3),
    display_name TEXT,
    bio TEXT CHECK (length(bio) <= 500),
    avatar_url TEXT,
    website_url TEXT,
    social_links JSONB DEFAULT '{}',
    
    -- Subscription & billing
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'max', 'educational')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trialing')),
    subscription_ends_at TIMESTAMPTZ,
    stripe_customer_id TEXT UNIQUE,
    
    -- Credits & usage
    credits_remaining INTEGER DEFAULT 100 CHECK (credits_remaining >= 0),
    credits_used_today INTEGER DEFAULT 0 CHECK (credits_used_today >= 0),
    credits_reset_date DATE DEFAULT CURRENT_DATE,
    
    -- User preferences
    preferences JSONB DEFAULT '{
        "theme": "system",
        "notifications": {
            "email": true,
            "push": false,
            "comments": true,
            "follows": true
        },
        "editor": {
            "auto_save": true,
            "grid_snap": true,
            "show_fps": false
        },
        "ai": {
            "generation_style": "balanced",
            "content_filter": "moderate"
        }
    }',
    
    -- Metadata
    is_verified BOOLEAN DEFAULT FALSE,
    is_educator BOOLEAN DEFAULT FALSE,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User activity tracking for analytics
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_start TIMESTAMPTZ DEFAULT NOW(),
    session_end TIMESTAMPTZ,
    ip_address INET,
    user_agent TEXT,
    platform TEXT CHECK (platform IN ('web', 'desktop', 'mobile')),
    activities JSONB DEFAULT '[]', -- Array of activity events
    created_at TIMESTAMPTZ DEFAULT NOW()
);