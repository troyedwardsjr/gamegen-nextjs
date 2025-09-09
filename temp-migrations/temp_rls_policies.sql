-- Migration: Create RLS Policies for Chat and Export Tables
-- Description: Address security advisor findings by creating comprehensive RLS policies
-- Date: 2025-09-09

-- Chat Sessions RLS Policies
CREATE POLICY "Users can view their own chat sessions"
ON chat_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions"
ON chat_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions"
ON chat_sessions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions"
ON chat_sessions FOR DELETE
USING (auth.uid() = user_id);

-- Chat Messages RLS Policies
CREATE POLICY "Users can view messages in their own chat sessions"
ON chat_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = chat_messages.session_id 
    AND chat_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their own chat sessions"
ON chat_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = session_id 
    AND chat_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages in their own chat sessions"
ON chat_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = chat_messages.session_id 
    AND chat_sessions.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = chat_messages.session_id 
    AND chat_sessions.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete messages in their own chat sessions"
ON chat_messages FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM chat_sessions 
    WHERE chat_sessions.id = chat_messages.session_id 
    AND chat_sessions.user_id = auth.uid()
  )
);

-- Chat Message Reactions RLS Policies
CREATE POLICY "Users can view all message reactions"
ON chat_message_reactions FOR SELECT
USING (true);

CREATE POLICY "Users can create their own reactions"
ON chat_message_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reactions"
ON chat_message_reactions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
ON chat_message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Chat Prompt Templates RLS Policies
CREATE POLICY "Users can view public templates and their own templates"
ON chat_prompt_templates FOR SELECT
USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own templates"
ON chat_prompt_templates FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates"
ON chat_prompt_templates FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates"
ON chat_prompt_templates FOR DELETE
USING (auth.uid() = created_by);

-- Export Jobs RLS Policies
CREATE POLICY "Users can view their own export jobs"
ON export_jobs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create export jobs for their own games"
ON export_jobs FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM games 
    WHERE games.id = game_id 
    AND games.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own export jobs"
ON export_jobs FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own export jobs"
ON export_jobs FOR DELETE
USING (auth.uid() = user_id);

-- Export Artifacts RLS Policies
CREATE POLICY "Users can view artifacts from their own export jobs"
ON export_artifacts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM export_jobs 
    WHERE export_jobs.id = export_artifacts.export_job_id 
    AND export_jobs.user_id = auth.uid()
  )
);

CREATE POLICY "System can create export artifacts"
ON export_artifacts FOR INSERT
WITH CHECK (true); -- Allow system to create artifacts

CREATE POLICY "Users can update artifacts from their own export jobs"
ON export_artifacts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM export_jobs 
    WHERE export_jobs.id = export_artifacts.export_job_id 
    AND export_jobs.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete artifacts from their own export jobs"
ON export_artifacts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM export_jobs 
    WHERE export_jobs.id = export_artifacts.export_job_id 
    AND export_jobs.user_id = auth.uid()
  )
);

-- Export Platform Configs RLS Policies (public read, admin write)
CREATE POLICY "All users can view platform configs"
ON export_platform_configs FOR SELECT
USING (true);

-- Export Queue Stats RLS Policies (read-only for users)
CREATE POLICY "All users can view export queue stats"
ON export_queue_stats FOR SELECT
USING (true);

-- User Export Usage RLS Policies
CREATE POLICY "Users can view their own export usage"
ON user_export_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create user export usage"
ON user_export_usage FOR INSERT
WITH CHECK (true); -- Allow system to track usage

CREATE POLICY "System can update user export usage"
ON user_export_usage FOR UPDATE
USING (true); -- Allow system to update usage

-- Export Analytics RLS Policies
CREATE POLICY "Users can view analytics for their own export jobs"
ON export_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM export_jobs 
    WHERE export_jobs.id = export_analytics.export_job_id 
    AND export_jobs.user_id = auth.uid()
  )
);

CREATE POLICY "System can create export analytics"
ON export_analytics FOR INSERT
WITH CHECK (true); -- Allow system to create analytics

-- Export Webhooks RLS Policies
CREATE POLICY "Users can view their own webhooks"
ON export_webhooks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own webhooks"
ON export_webhooks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own webhooks"
ON export_webhooks FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own webhooks"
ON export_webhooks FOR DELETE
USING (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON POLICY "Users can view their own chat sessions" ON chat_sessions IS 'Users can only access their own chat sessions';
COMMENT ON POLICY "Users can view their own export jobs" ON export_jobs IS 'Users can only access their own export jobs';
COMMENT ON POLICY "All users can view platform configs" ON export_platform_configs IS 'Platform configurations are publicly readable';