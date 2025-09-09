"use client";

import React, { useState, useEffect } from "react";
import { Switch } from "@heroui/switch";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Divider } from "@heroui/divider";
import { Tabs, Tab } from "@heroui/tabs";
import { 
  Shield, 
  Eye, 
  Users, 
  Bell, 
  MessageCircle,
  Heart,
  Share2,
  Crown,
  Settings
} from "lucide-react";
import { toast } from "sonner";

import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";
import { createClient } from "@/lib/supabase/client";

interface SocialPrivacySettingsProps {
  userId: string;
  className?: string;
}

interface PrivacySettings {
  // Profile visibility
  profile_visibility: "public" | "friends" | "private";
  show_real_name: boolean;
  show_email: boolean;
  show_games_created: boolean;
  show_achievements: boolean;
  show_activity_feed: boolean;
  
  // Social interactions
  allow_follows: boolean;
  allow_comments: boolean;
  allow_game_ratings: boolean;
  allow_mentions: boolean;
  require_follow_approval: boolean;
  
  // Notifications
  notify_on_follow: boolean;
  notify_on_like: boolean;
  notify_on_comment: boolean;
  notify_on_mention: boolean;
  notify_on_game_featured: boolean;
  
  // Content moderation
  auto_moderate_comments: boolean;
  block_inappropriate_content: boolean;
  require_approval_for_tags: boolean;
  
  // Data sharing
  analytics_sharing: boolean;
  marketing_communications: boolean;
  third_party_integrations: boolean;
}

const DEFAULT_SETTINGS: PrivacySettings = {
  profile_visibility: "public",
  show_real_name: false,
  show_email: false,
  show_games_created: true,
  show_achievements: true,
  show_activity_feed: true,
  
  allow_follows: true,
  allow_comments: true,
  allow_game_ratings: true,
  allow_mentions: true,
  require_follow_approval: false,
  
  notify_on_follow: true,
  notify_on_like: true,
  notify_on_comment: true,
  notify_on_mention: true,
  notify_on_game_featured: true,
  
  auto_moderate_comments: true,
  block_inappropriate_content: true,
  require_approval_for_tags: false,
  
  analytics_sharing: true,
  marketing_communications: false,
  third_party_integrations: false,
};

export function SocialPrivacySettings({ userId, className }: SocialPrivacySettingsProps) {
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchPrivacySettings();
  }, [userId]);

  const fetchPrivacySettings = async () => {
    try {
      setLoading(true);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const preferences = profile?.preferences as any;
      if (preferences?.privacy) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...preferences.privacy,
        }));
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      toast.error('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      // Get current profile preferences
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('preferences')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const currentPreferences = (profile?.preferences as any) || {};
      const updatedPreferences = {
        ...currentPreferences,
        privacy: settings,
      };

      const { error } = await supabase
        .from('profiles')
        .update({ preferences: updatedPreferences })
        .eq('id', userId);

      if (error) throw error;

      setHasChanges(false);
      toast.success('Privacy settings saved successfully');
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast.error('Failed to save privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <GlassmorphicCard {...GameGenCardPresets.floatingPanel} className={className}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500 mx-auto mb-4"></div>
          <p className="text-foreground/70">Loading privacy settings...</p>
        </div>
      </GlassmorphicCard>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <GlassmorphicCard {...GameGenCardPresets.heroCard}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="text-secondary-500" size={24} />
            <div>
              <h2 className="text-xl font-bold text-foreground">Social Privacy Settings</h2>
              <p className="text-foreground/70">Control who can see and interact with your content</p>
            </div>
          </div>

          {hasChanges && (
            <div className="flex items-center gap-3 p-4 bg-warning-500/10 border border-warning-500/20 rounded-lg">
              <Settings className="text-warning-500" size={20} />
              <p className="text-warning-500 flex-1">You have unsaved changes</p>
              <div className="flex gap-2">
                <Button
                  color="warning"
                  size="sm"
                  variant="flat"
                  onPress={resetToDefaults}
                >
                  Reset
                </Button>
                <Button
                  color="warning"
                  isLoading={saving}
                  size="sm"
                  onPress={saveSettings}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </GlassmorphicCard>

      {/* Privacy Settings */}
      <GlassmorphicCard {...GameGenCardPresets.floatingPanel}>
        <div className="p-6">
          <Tabs aria-label="Privacy Settings" color="secondary" variant="underlined">
            {/* Profile Visibility */}
            <Tab
              key="profile-visibility"
              title={
                <div className="flex items-center space-x-2">
                  <Eye size={18} />
                  <span>Profile</span>
                </div>
              }
            >
              <div className="space-y-4 pb-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Who can view your profile
                  </label>
                  <Select
                    selectedKeys={[settings.profile_visibility]}
                    size="sm"
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0] as PrivacySettings['profile_visibility'];
                      updateSetting('profile_visibility', value);
                    }}
                  >
                    <SelectItem key="public">Everyone</SelectItem>
                    <SelectItem key="friends">People you follow</SelectItem>
                    <SelectItem key="private">Only you</SelectItem>
                  </Select>
                </div>

                <Divider />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-foreground">Show real name</label>
                      <p className="text-xs text-foreground/60">Display your actual name instead of username</p>
                    </div>
                    <Switch
                      isSelected={settings.show_real_name}
                      size="sm"
                      onValueChange={(value) => updateSetting('show_real_name', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-foreground">Show email address</label>
                      <p className="text-xs text-foreground/60">Make your email visible on your profile</p>
                    </div>
                    <Switch
                      isSelected={settings.show_email}
                      size="sm"
                      onValueChange={(value) => updateSetting('show_email', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-foreground">Show created games</label>
                      <p className="text-xs text-foreground/60">Display your games on your profile</p>
                    </div>
                    <Switch
                      isSelected={settings.show_games_created}
                      size="sm"
                      onValueChange={(value) => updateSetting('show_games_created', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-foreground">Show achievements</label>
                      <p className="text-xs text-foreground/60">Display your unlocked achievements</p>
                    </div>
                    <Switch
                      isSelected={settings.show_achievements}
                      size="sm"
                      onValueChange={(value) => updateSetting('show_achievements', value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-foreground">Show activity feed</label>
                      <p className="text-xs text-foreground/60">Let others see your recent activity</p>
                    </div>
                    <Switch
                      isSelected={settings.show_activity_feed}
                      size="sm"
                      onValueChange={(value) => updateSetting('show_activity_feed', value)}
                    />
                  </div>
                </div>
              </div>
            </Tab>

            {/* Social Interactions */}
            <Tab
              key="social-interactions"
              title={
                <div className="flex items-center space-x-2">
                  <Users size={18} />
                  <span>Social</span>
                </div>
              }
            >
              <div className="space-y-3 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Allow follows</label>
                    <p className="text-xs text-foreground/60">Let other users follow you</p>
                  </div>
                  <Switch
                    isSelected={settings.allow_follows}
                    size="sm"
                    onValueChange={(value) => updateSetting('allow_follows', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Require follow approval</label>
                    <p className="text-xs text-foreground/60">Manually approve new followers</p>
                  </div>
                  <Switch
                    isDisabled={!settings.allow_follows}
                    isSelected={settings.require_follow_approval}
                    size="sm"
                    onValueChange={(value) => updateSetting('require_follow_approval', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Allow comments</label>
                    <p className="text-xs text-foreground/60">Let users comment on your games</p>
                  </div>
                  <Switch
                    isSelected={settings.allow_comments}
                    size="sm"
                    onValueChange={(value) => updateSetting('allow_comments', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Allow game ratings</label>
                    <p className="text-xs text-foreground/60">Let users rate your games</p>
                  </div>
                  <Switch
                    isSelected={settings.allow_game_ratings}
                    size="sm"
                    onValueChange={(value) => updateSetting('allow_game_ratings', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Allow mentions</label>
                    <p className="text-xs text-foreground/60">Let users mention you in comments</p>
                  </div>
                  <Switch
                    isSelected={settings.allow_mentions}
                    size="sm"
                    onValueChange={(value) => updateSetting('allow_mentions', value)}
                  />
                </div>
              </div>
            </Tab>

            {/* Notifications */}
            <Tab
              key="notifications"
              title={
                <div className="flex items-center space-x-2">
                  <Bell size={18} />
                  <span>Notifications</span>
                </div>
              }
            >
              <div className="space-y-3 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span className="text-sm font-medium text-foreground">New followers</span>
                  </div>
                  <Switch
                    isSelected={settings.notify_on_follow}
                    size="sm"
                    onValueChange={(value) => updateSetting('notify_on_follow', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart size={16} />
                    <span className="text-sm font-medium text-foreground">Game likes</span>
                  </div>
                  <Switch
                    isSelected={settings.notify_on_like}
                    size="sm"
                    onValueChange={(value) => updateSetting('notify_on_like', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} />
                    <span className="text-sm font-medium text-foreground">Comments</span>
                  </div>
                  <Switch
                    isSelected={settings.notify_on_comment}
                    size="sm"
                    onValueChange={(value) => updateSetting('notify_on_comment', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle size={16} />
                    <span className="text-sm font-medium text-foreground">Mentions</span>
                  </div>
                  <Switch
                    isSelected={settings.notify_on_mention}
                    size="sm"
                    onValueChange={(value) => updateSetting('notify_on_mention', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown size={16} />
                    <span className="text-sm font-medium text-foreground">Featured games</span>
                  </div>
                  <Switch
                    isSelected={settings.notify_on_game_featured}
                    size="sm"
                    onValueChange={(value) => updateSetting('notify_on_game_featured', value)}
                  />
                </div>
              </div>
            </Tab>

            {/* Content Moderation */}
            <Tab
              key="content-moderation"
              title={
                <div className="flex items-center space-x-2">
                  <Shield size={18} />
                  <span>Moderation</span>
                </div>
              }
            >
              <div className="space-y-3 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Auto-moderate comments</label>
                    <p className="text-xs text-foreground/60">Automatically filter inappropriate comments</p>
                  </div>
                  <Switch
                    isSelected={settings.auto_moderate_comments}
                    size="sm"
                    onValueChange={(value) => updateSetting('auto_moderate_comments', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Block inappropriate content</label>
                    <p className="text-xs text-foreground/60">Hide content flagged as inappropriate</p>
                  </div>
                  <Switch
                    isSelected={settings.block_inappropriate_content}
                    size="sm"
                    onValueChange={(value) => updateSetting('block_inappropriate_content', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Require tag approval</label>
                    <p className="text-xs text-foreground/60">Approve tags before they appear on your games</p>
                  </div>
                  <Switch
                    isSelected={settings.require_approval_for_tags}
                    size="sm"
                    onValueChange={(value) => updateSetting('require_approval_for_tags', value)}
                  />
                </div>
              </div>
            </Tab>

            {/* Data & Privacy */}
            <Tab
              key="data-privacy"
              title={
                <div className="flex items-center space-x-2">
                  <Share2 size={18} />
                  <span>Privacy</span>
                </div>
              }
            >
              <div className="space-y-3 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Analytics sharing</label>
                    <p className="text-xs text-foreground/60">Share usage data to improve GameGen</p>
                  </div>
                  <Switch
                    isSelected={settings.analytics_sharing}
                    size="sm"
                    onValueChange={(value) => updateSetting('analytics_sharing', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Marketing communications</label>
                    <p className="text-xs text-foreground/60">Receive updates and promotional content</p>
                  </div>
                  <Switch
                    isSelected={settings.marketing_communications}
                    size="sm"
                    onValueChange={(value) => updateSetting('marketing_communications', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-foreground">Third-party integrations</label>
                    <p className="text-xs text-foreground/60">Allow connections with external services</p>
                  </div>
                  <Switch
                    isSelected={settings.third_party_integrations}
                    size="sm"
                    onValueChange={(value) => updateSetting('third_party_integrations', value)}
                  />
                </div>
              </div>
            </Tab>
          </Tabs>
        </div>
      </GlassmorphicCard>

      {/* Save Actions */}
      {hasChanges && (
        <GlassmorphicCard {...GameGenCardPresets.chatPanel}>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-foreground/70">Don't forget to save your changes</p>
              <div className="flex gap-3">
                <Button
                  variant="flat"
                  onPress={() => {
                    setHasChanges(false);
                    fetchPrivacySettings(); // Reset to server state
                  }}
                >
                  Cancel
                </Button>
                <Button
                  color="secondary"
                  isLoading={saving}
                  onPress={saveSettings}
                >
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </GlassmorphicCard>
      )}
    </div>
  );
}