-- Enable RLS on Chat and Export Tables
-- Description: Enable RLS on tables that have policies but RLS not enabled
-- Date: 2025-09-09

-- Enable RLS on Chat tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_prompt_templates ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Export tables
ALTER TABLE export_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_platform_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_queue_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_export_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_webhooks ENABLE ROW LEVEL SECURITY;