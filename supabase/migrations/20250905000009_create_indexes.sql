-- Migration: Create Performance Indexes
-- Description: Core performance indexes for all tables
-- Date: 2025-09-05

-- Core performance indexes
CREATE INDEX idx_games_creator_visibility ON games(creator_id, visibility);
CREATE INDEX idx_games_published ON games(published_at DESC) WHERE visibility = 'public';
CREATE INDEX idx_games_genre ON games(genre) WHERE visibility = 'public';
CREATE INDEX idx_games_search ON games USING GIN(search_vector);
CREATE INDEX idx_games_tags ON games USING GIN(tags);

-- Social features indexes
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_game_likes_user ON game_likes(user_id);
CREATE INDEX idx_game_likes_game ON game_likes(game_id);
CREATE INDEX idx_game_comments_game ON game_comments(game_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_game_comments_author ON game_comments(author_id);

-- Analytics indexes
CREATE INDEX idx_play_sessions_game_date ON play_sessions(game_id, created_at);
CREATE INDEX idx_ai_generations_user_date ON ai_generations(user_id, created_at);
CREATE INDEX idx_creator_analytics_creator_date ON creator_analytics(creator_id, date);
CREATE INDEX idx_user_sessions_user_date ON user_sessions(user_id, created_at);

-- Vector similarity indexes
CREATE INDEX idx_game_embeddings_title ON game_embeddings USING ivfflat (title_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_game_embeddings_description ON game_embeddings USING ivfflat (description_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_user_embeddings_play ON user_embeddings USING ivfflat (play_preferences vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_asset_embeddings_visual ON asset_embeddings USING ivfflat (visual_embedding vector_cosine_ops) WITH (lists = 100);

-- Script performance indexes
CREATE INDEX idx_game_scripts_game_active ON game_scripts(game_id, is_active);
CREATE INDEX idx_game_scripts_type_validation ON game_scripts(script_type, validation_status);
CREATE INDEX idx_script_execution_logs_script_date ON script_execution_logs(script_id, created_at DESC);
CREATE INDEX idx_script_versions_script_version ON script_versions(script_id, version_number DESC);

-- Script embeddings indexes
CREATE INDEX idx_script_embeddings_code ON script_embeddings USING ivfflat (code_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_script_embeddings_functionality ON script_embeddings USING ivfflat (functionality_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_toxoid_patterns_embedding ON toxoid_patterns USING ivfflat (pattern_embedding vector_cosine_ops) WITH (lists = 100);

-- Asset management indexes
CREATE INDEX idx_game_assets_game ON game_assets(game_id);
CREATE INDEX idx_game_assets_creator ON game_assets(creator_id);
CREATE INDEX idx_game_assets_type ON game_assets(asset_type);
CREATE INDEX idx_community_assets_creator ON community_assets(creator_id);
CREATE INDEX idx_community_assets_status ON community_assets(status);

-- Marketplace indexes
CREATE INDEX idx_templates_creator ON templates(creator_id);
CREATE INDEX idx_templates_status ON templates(status);
CREATE INDEX idx_purchases_buyer ON purchases(buyer_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_creator_earnings_creator ON creator_earnings(creator_id);

-- Collections indexes
CREATE INDEX idx_collections_creator ON collections(creator_id);
CREATE INDEX idx_collection_games_collection ON collection_games(collection_id);
CREATE INDEX idx_collection_games_game ON collection_games(game_id);