"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Select, SelectItem } from "@heroui/select";
import { Tabs, Tab } from "@heroui/tabs";
import { Divider } from "@heroui/divider";
import { Textarea } from "@heroui/input";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { useDisclosure } from "@heroui/modal";

import {
  CogIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  KeyIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckIcon,
} from "@/components/icons";
import { useAuth } from "@/lib/auth/context";
import { ProfilePictureUpload } from "@/components/profile/ProfilePictureUpload";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  gameComments: boolean;
  gameRatings: boolean;
  followerActivity: boolean;
  platformUpdates: boolean;
  weeklyDigest: boolean;
}

interface PrivacySettings {
  profileVisibility: "public" | "friends" | "private";
  showEmail: boolean;
  showLocation: boolean;
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
  showGameStats: boolean;
}

interface AccountSettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
}

export default function SettingsPage() {
  const { user, signOut, updateProfile } = useAuth();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();
  const [activeSection, setActiveSection] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const supabase = createClient();

  // Profile state
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState({
    display_name: "",
    username: "",
    bio: "",
    website_url: "",
  });

  // Settings state
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      emailNotifications: true,
      pushNotifications: true,
      gameComments: true,
      gameRatings: true,
      followerActivity: false,
      platformUpdates: true,
      weeklyDigest: false,
    });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: "public",
    showEmail: false,
    showLocation: true,
    showOnlineStatus: true,
    allowDirectMessages: true,
    showGameStats: true,
  });

  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
  });

  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("en");
  const [isSaving, setIsSaving] = useState(false);

  // Load user profile data
  useEffect(() => {
    if (user?.id) {
      loadUserProfile();
    }
  }, [user?.id]);

  const loadUserProfile = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
        setError('Failed to load profile data');
        return;
      }

      if (profile) {
        setProfileData(profile);
        setProfileForm({
          display_name: profile.display_name || '',
          username: profile.username || '',
          bio: profile.bio || '',
          website_url: profile.website_url || '',
        });
        
        // Load preferences if available
        if (profile.preferences) {
          const prefs = profile.preferences as any;
          if (prefs.notifications) {
            setNotificationSettings(prev => ({ ...prev, ...prefs.notifications }));
          }
          if (prefs.privacy) {
            setPrivacySettings(prev => ({ ...prev, ...prefs.privacy }));
          }
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id || !profileForm.username.trim()) {
      setError('Username is required');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // Check if username is unique (excluding current user)
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', profileForm.username.trim())
        .neq('id', user.id)
        .single();

      if (existingUser) {
        setError('Username is already taken');
        return;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          display_name: profileForm.display_name.trim() || null,
          username: profileForm.username.trim(),
          bio: profileForm.bio.trim() || null,
          website_url: profileForm.website_url.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess('Profile updated successfully!');
      await loadUserProfile(); // Reload profile data
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // Update preferences in the database
      const preferences = {
        notifications: notificationSettings,
        privacy: privacySettings,
        theme,
        language,
      } as any; // Cast to avoid TypeScript Json type issues

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          preferences,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setSuccess('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Handle account deletion
    if (!user?.id) return;
    
    try {
      // Call delete account API endpoint
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      // Sign out user
      await signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
    
    onDeleteOpenChange();
  };

  const handlePasswordChange = async () => {
    if (accountSettings.newPassword !== accountSettings.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (accountSettings.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateProfile({ password: accountSettings.newPassword });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update password');
      }

      setSuccess('Password updated successfully!');
      setAccountSettings({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorEnabled: accountSettings.twoFactorEnabled,
      });
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (url: string) => {
    setSuccess('Profile picture updated successfully!');
    if (profileData) {
      setProfileData({ ...profileData, avatar_url: url });
    }
  };

  const handleAvatarError = (error: string) => {
    setError(error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <CogIcon className="w-6 h-6 text-white" />
            </div>
            Settings
          </h1>
          <p className="text-gray-400 text-lg">
            Manage your account preferences and privacy settings
          </p>
        </motion.div>

        {/* Error/Success Messages */}
        {error && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
            initial={{ opacity: 0, y: -10 }}
          >
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-300 text-sm backdrop-blur-xl">
              {error}
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
            initial={{ opacity: 0, y: -10 }}
          >
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-green-300 text-sm backdrop-blur-xl">
              {success}
            </div>
          </motion.div>
        )}

        {/* Settings Tabs */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Tabs
            classNames={{
              tabList:
                "bg-gray-900/50 backdrop-blur-xl border border-purple-500/20",
              tab: "text-gray-400 data-[selected=true]:text-white",
              cursor: "bg-purple-500",
            }}
            selectedKey={activeSection}
            onSelectionChange={(key) => setActiveSection(key as string)}
          >
            <Tab
              key="profile"
              title={
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Profile
                </div>
              }
            >
              <div className="mt-6 space-y-6">
                {/* Profile Information */}
                <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-white">
                      Profile Information
                    </h3>
                  </CardHeader>
                  <CardBody className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center">
                      <ProfilePictureUpload
                        currentAvatarUrl={profileData?.avatar_url}
                        onUploadSuccess={handleAvatarUpload}
                        onUploadError={handleAvatarError}
                        size="lg"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        isRequired
                        classNames={{
                          input: "text-white",
                          label: "text-gray-400",
                          inputWrapper:
                            "border-purple-500/30 hover:border-purple-500/50",
                        }}
                        description="Your unique username (3-30 characters)"
                        label="Username"
                        value={profileForm.username}
                        variant="bordered"
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, username: e.target.value })
                        }
                      />
                      <Input
                        classNames={{
                          input: "text-white",
                          label: "text-gray-400",
                          inputWrapper:
                            "border-purple-500/30 hover:border-purple-500/50",
                        }}
                        description="Your display name (optional)"
                        label="Display Name"
                        value={profileForm.display_name}
                        variant="bordered"
                        onChange={(e) =>
                          setProfileForm({ ...profileForm, display_name: e.target.value })
                        }
                      />
                    </div>

                    <Textarea
                      classNames={{
                        input: "text-white",
                        label: "text-gray-400",
                        inputWrapper:
                          "border-purple-500/30 hover:border-purple-500/50",
                      }}
                      description="Tell others about yourself (max 500 characters)"
                      label="Bio"
                      maxLength={500}
                      rows={3}
                      value={profileForm.bio}
                      variant="bordered"
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, bio: e.target.value })
                      }
                    />

                    <Input
                      classNames={{
                        input: "text-white",
                        label: "text-gray-400",
                        inputWrapper:
                          "border-purple-500/30 hover:border-purple-500/50",
                      }}
                      description="Your personal website or portfolio"
                      label="Website URL"
                      type="url"
                      value={profileForm.website_url}
                      variant="bordered"
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, website_url: e.target.value })
                      }
                    />

                    <Button
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                      isLoading={isSaving}
                      startContent={<CheckIcon className="w-4 h-4" />}
                      onPress={handleSaveProfile}
                    >
                      {isSaving ? 'Saving...' : 'Update Profile'}
                    </Button>
                  </CardBody>
                </Card>
              </div>
            </Tab>
            <Tab
              key="account"
              title={
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" />
                  Account
                </div>
              }
            >
              <div className="mt-6 space-y-6">
                {/* Basic Account Info */}
                <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-white">
                      Account Information
                    </h3>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <Input
                      isReadOnly
                      classNames={{
                        input: "text-white",
                        label: "text-gray-400",
                        inputWrapper: "border-purple-500/30",
                        description: "text-gray-500",
                      }}
                      description="Contact support to change your email address"
                      label="Email Address"
                      value={user?.email || ""}
                      variant="bordered"
                    />
                    <Input
                      classNames={{
                        input: "text-white",
                        label: "text-gray-400",
                        inputWrapper:
                          "border-purple-500/30 hover:border-purple-500/50",
                      }}
                      defaultValue={
                        user?.user_metadata?.display_name ||
                        user?.user_metadata?.full_name ||
                        ""
                      }
                      label="Display Name"
                      variant="bordered"
                    />
                  </CardBody>
                </Card>

                {/* Password & Security */}
                <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-white">
                      Password & Security
                    </h3>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <Input
                      classNames={{
                        input: "text-white",
                        label: "text-gray-400",
                        inputWrapper:
                          "border-purple-500/30 hover:border-purple-500/50",
                      }}
                      label="Current Password"
                      type="password"
                      value={accountSettings.currentPassword}
                      variant="bordered"
                      onValueChange={(value) =>
                        setAccountSettings({
                          ...accountSettings,
                          currentPassword: value,
                        })
                      }
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        classNames={{
                          input: "text-white",
                          label: "text-gray-400",
                          inputWrapper:
                            "border-purple-500/30 hover:border-purple-500/50",
                        }}
                        label="New Password"
                        type="password"
                        value={accountSettings.newPassword}
                        variant="bordered"
                        onValueChange={(value) =>
                          setAccountSettings({
                            ...accountSettings,
                            newPassword: value,
                          })
                        }
                      />
                      <Input
                        classNames={{
                          input: "text-white",
                          label: "text-gray-400",
                          inputWrapper:
                            "border-purple-500/30 hover:border-purple-500/50",
                        }}
                        label="Confirm Password"
                        type="password"
                        value={accountSettings.confirmPassword}
                        variant="bordered"
                        onValueChange={(value) =>
                          setAccountSettings({
                            ...accountSettings,
                            confirmPassword: value,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-900/20 rounded-xl border border-purple-500/20">
                      <div>
                        <h4 className="font-semibold text-white">
                          Two-Factor Authentication
                        </h4>
                        <p className="text-sm text-gray-400">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <Switch
                        classNames={{
                          wrapper: "group-data-[selected=true]:bg-purple-500",
                        }}
                        isSelected={accountSettings.twoFactorEnabled}
                        onValueChange={(value) =>
                          setAccountSettings({
                            ...accountSettings,
                            twoFactorEnabled: value,
                          })
                        }
                      />
                    </div>
                    <Button
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                      startContent={<KeyIcon className="w-4 h-4" />}
                      onPress={handlePasswordChange}
                    >
                      Update Password
                    </Button>
                  </CardBody>
                </Card>
              </div>
            </Tab>

            <Tab
              key="notifications"
              title={
                <div className="flex items-center gap-2">
                  <BellIcon className="w-4 h-4" />
                  Notifications
                </div>
              }
            >
              <div className="mt-6">
                <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-white">
                      Notification Preferences
                    </h3>
                  </CardHeader>
                  <CardBody className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-white text-sm uppercase tracking-wide">
                        General
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Email Notifications</p>
                            <p className="text-sm text-gray-400">
                              Receive notifications via email
                            </p>
                          </div>
                          <Switch
                            classNames={{
                              wrapper:
                                "group-data-[selected=true]:bg-purple-500",
                            }}
                            isSelected={notificationSettings.emailNotifications}
                            onValueChange={(value) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                emailNotifications: value,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Push Notifications</p>
                            <p className="text-sm text-gray-400">
                              Receive browser push notifications
                            </p>
                          </div>
                          <Switch
                            classNames={{
                              wrapper:
                                "group-data-[selected=true]:bg-purple-500",
                            }}
                            isSelected={notificationSettings.pushNotifications}
                            onValueChange={(value) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                pushNotifications: value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Divider className="bg-purple-500/20" />

                    <div className="space-y-4">
                      <h4 className="font-semibold text-white text-sm uppercase tracking-wide">
                        Game Activity
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Game Comments</p>
                            <p className="text-sm text-gray-400">
                              New comments on your games
                            </p>
                          </div>
                          <Switch
                            classNames={{
                              wrapper:
                                "group-data-[selected=true]:bg-purple-500",
                            }}
                            isSelected={notificationSettings.gameComments}
                            onValueChange={(value) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                gameComments: value,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Game Ratings</p>
                            <p className="text-sm text-gray-400">
                              New ratings and reviews
                            </p>
                          </div>
                          <Switch
                            classNames={{
                              wrapper:
                                "group-data-[selected=true]:bg-purple-500",
                            }}
                            isSelected={notificationSettings.gameRatings}
                            onValueChange={(value) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                gameRatings: value,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Follower Activity</p>
                            <p className="text-sm text-gray-400">
                              New followers and mentions
                            </p>
                          </div>
                          <Switch
                            classNames={{
                              wrapper:
                                "group-data-[selected=true]:bg-purple-500",
                            }}
                            isSelected={notificationSettings.followerActivity}
                            onValueChange={(value) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                followerActivity: value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <Divider className="bg-purple-500/20" />

                    <div className="space-y-4">
                      <h4 className="font-semibold text-white text-sm uppercase tracking-wide">
                        Platform
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Platform Updates</p>
                            <p className="text-sm text-gray-400">
                              New features and announcements
                            </p>
                          </div>
                          <Switch
                            classNames={{
                              wrapper:
                                "group-data-[selected=true]:bg-purple-500",
                            }}
                            isSelected={notificationSettings.platformUpdates}
                            onValueChange={(value) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                platformUpdates: value,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white">Weekly Digest</p>
                            <p className="text-sm text-gray-400">
                              Weekly summary of your activity
                            </p>
                          </div>
                          <Switch
                            classNames={{
                              wrapper:
                                "group-data-[selected=true]:bg-purple-500",
                            }}
                            isSelected={notificationSettings.weeklyDigest}
                            onValueChange={(value) =>
                              setNotificationSettings({
                                ...notificationSettings,
                                weeklyDigest: value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </Tab>

            <Tab
              key="privacy"
              title={
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4" />
                  Privacy
                </div>
              }
            >
              <div className="mt-6">
                <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-white">
                      Privacy Settings
                    </h3>
                  </CardHeader>
                  <CardBody className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-white font-medium mb-2 block">
                          Profile Visibility
                        </label>
                        <Select
                          classNames={{
                            trigger:
                              "border-purple-500/30 hover:border-purple-500/50",
                            value: "text-white",
                          }}
                          selectedKeys={[privacySettings.profileVisibility]}
                          variant="bordered"
                          onSelectionChange={(keys) => {
                            const value = Array.from(keys)[0] as
                              | "public"
                              | "friends"
                              | "private";

                            setPrivacySettings({
                              ...privacySettings,
                              profileVisibility: value,
                            });
                          }}
                        >
                          <SelectItem key="public">
                            Public - Anyone can view
                          </SelectItem>
                          <SelectItem key="friends">Friends Only</SelectItem>
                          <SelectItem key="private">
                            Private - Hidden from others
                          </SelectItem>
                        </Select>
                      </div>
                    </div>

                    <Divider className="bg-purple-500/20" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white">Show Email Address</p>
                          <p className="text-sm text-gray-400">
                            Display email on your public profile
                          </p>
                        </div>
                        <Switch
                          classNames={{
                            wrapper: "group-data-[selected=true]:bg-purple-500",
                          }}
                          isSelected={privacySettings.showEmail}
                          onValueChange={(value) =>
                            setPrivacySettings({
                              ...privacySettings,
                              showEmail: value,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white">Show Location</p>
                          <p className="text-sm text-gray-400">
                            Display location on your profile
                          </p>
                        </div>
                        <Switch
                          classNames={{
                            wrapper: "group-data-[selected=true]:bg-purple-500",
                          }}
                          isSelected={privacySettings.showLocation}
                          onValueChange={(value) =>
                            setPrivacySettings({
                              ...privacySettings,
                              showLocation: value,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white">Show Online Status</p>
                          <p className="text-sm text-gray-400">
                            Let others see when you're online
                          </p>
                        </div>
                        <Switch
                          classNames={{
                            wrapper: "group-data-[selected=true]:bg-purple-500",
                          }}
                          isSelected={privacySettings.showOnlineStatus}
                          onValueChange={(value) =>
                            setPrivacySettings({
                              ...privacySettings,
                              showOnlineStatus: value,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white">Allow Direct Messages</p>
                          <p className="text-sm text-gray-400">
                            Let others send you direct messages
                          </p>
                        </div>
                        <Switch
                          classNames={{
                            wrapper: "group-data-[selected=true]:bg-purple-500",
                          }}
                          isSelected={privacySettings.allowDirectMessages}
                          onValueChange={(value) =>
                            setPrivacySettings({
                              ...privacySettings,
                              allowDirectMessages: value,
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white">Show Game Statistics</p>
                          <p className="text-sm text-gray-400">
                            Display play counts and ratings publicly
                          </p>
                        </div>
                        <Switch
                          classNames={{
                            wrapper: "group-data-[selected=true]:bg-purple-500",
                          }}
                          isSelected={privacySettings.showGameStats}
                          onValueChange={(value) =>
                            setPrivacySettings({
                              ...privacySettings,
                              showGameStats: value,
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </Tab>

            <Tab
              key="preferences"
              title={
                <div className="flex items-center gap-2">
                  <PaintBrushIcon className="w-4 h-4" />
                  Preferences
                </div>
              }
            >
              <div className="mt-6 space-y-6">
                {/* Theme Settings */}
                <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-white">
                      Appearance
                    </h3>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div>
                      <label className="text-white font-medium mb-2 block">
                        Theme
                      </label>
                      <Select
                        classNames={{
                          trigger:
                            "border-purple-500/30 hover:border-purple-500/50",
                          value: "text-white",
                        }}
                        selectedKeys={[theme]}
                        variant="bordered"
                        onSelectionChange={(keys) =>
                          setTheme(Array.from(keys)[0] as string)
                        }
                      >
                        <SelectItem key="dark">Dark</SelectItem>
                        <SelectItem key="light">Light</SelectItem>
                        <SelectItem key="auto">Auto (System)</SelectItem>
                      </Select>
                    </div>
                    <div>
                      <label className="text-white font-medium mb-2 block">
                        Language
                      </label>
                      <Select
                        classNames={{
                          trigger:
                            "border-purple-500/30 hover:border-purple-500/50",
                          value: "text-white",
                        }}
                        selectedKeys={[language]}
                        variant="bordered"
                        onSelectionChange={(keys) =>
                          setLanguage(Array.from(keys)[0] as string)
                        }
                      >
                        <SelectItem key="en">English</SelectItem>
                        <SelectItem key="es">Español</SelectItem>
                        <SelectItem key="fr">Français</SelectItem>
                        <SelectItem key="de">Deutsch</SelectItem>
                        <SelectItem key="ja">日本語</SelectItem>
                      </Select>
                    </div>
                  </CardBody>
                </Card>

                {/* Danger Zone */}
                <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/20 backdrop-blur-xl">
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                      Danger Zone
                    </h3>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div className="p-4 bg-red-900/20 rounded-xl border border-red-500/20">
                      <h4 className="font-semibold text-white mb-2">
                        Delete Account
                      </h4>
                      <p className="text-gray-300 text-sm mb-4">
                        Permanently delete your account and all associated data.
                        This action cannot be undone.
                      </p>
                      <Button
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        color="danger"
                        startContent={<TrashIcon className="w-4 h-4" />}
                        variant="bordered"
                        onPress={onDeleteOpen}
                      >
                        Delete Account
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </Tab>
          </Tabs>
        </motion.div>

        {/* Save Button */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end mt-8"
          initial={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold hover:from-purple-400 hover:to-purple-500"
            isLoading={isSaving}
            size="lg"
            startContent={<CheckIcon className="w-5 h-5" />}
            onPress={handleSaveSettings}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </motion.div>

        {/* Delete Account Modal */}
        <Modal isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange}>
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold text-red-400">
                    Delete Account
                  </h2>
                </ModalHeader>
                <ModalBody>
                  <div className="space-y-4">
                    <div className="p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                      <div className="flex items-center gap-3 mb-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                        <h3 className="font-semibold text-white">Warning</h3>
                      </div>
                      <p className="text-gray-300 text-sm">
                        This action will permanently delete your account,
                        including:
                      </p>
                      <ul className="text-gray-400 text-sm mt-2 ml-4 list-disc">
                        <li>All your created games</li>
                        <li>Your profile and achievements</li>
                        <li>Your game statistics and ratings</li>
                        <li>All associated data</li>
                      </ul>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Type <strong>DELETE</strong> to confirm account deletion:
                    </p>
                    <Input
                      classNames={{
                        input: "text-white",
                        inputWrapper:
                          "border-red-500/30 hover:border-red-500/50",
                      }}
                      placeholder="Type DELETE to confirm"
                      variant="bordered"
                    />
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onClose}>
                    Cancel
                  </Button>
                  <Button
                    color="danger"
                    onPress={() => {
                      handleDeleteAccount();
                      onClose();
                    }}
                  >
                    Delete Account
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </div>
  );
}
