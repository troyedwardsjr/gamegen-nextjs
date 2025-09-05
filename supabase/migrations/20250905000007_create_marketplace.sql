-- Migration: Create Marketplace and Monetization Tables
-- Description: Templates, purchases, and creator earnings
-- Date: 2025-09-05

-- Templates marketplace
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
    
    -- Template metadata
    name TEXT NOT NULL CHECK (length(name) >= 1),
    description TEXT CHECK (length(description) <= 2000),
    category TEXT CHECK (category IN ('educational', 'commercial', 'entertainment', 'tutorial')),
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    
    -- Pricing
    price DECIMAL(10,2) DEFAULT 0 CHECK (price >= 0),
    currency TEXT DEFAULT 'USD',
    
    -- Usage tracking
    download_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) CHECK (rating BETWEEN 0 AND 5),
    rating_count INTEGER DEFAULT 0,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'archived')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase transactions
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Purchase details
    item_type TEXT NOT NULL CHECK (item_type IN ('template', 'asset_pack', 'credits', 'subscription')),
    item_id UUID, -- References templates(id) or other items
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    
    -- Payment
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency TEXT DEFAULT 'USD',
    stripe_payment_intent_id TEXT,
    
    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator earnings
CREATE TABLE creator_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
    
    -- Earnings calculation
    gross_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL,
    
    -- Payout tracking
    payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid', 'failed')),
    payout_date DATE,
    payout_reference TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);