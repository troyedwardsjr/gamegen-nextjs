"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Select, SelectItem } from "@heroui/select";
import { Tabs, Tab } from "@heroui/tabs";
import { Divider } from "@heroui/divider";
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
  const { user, signOut } = useAuth();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onOpenChange: onDeleteOpenChange,
  } = useDisclosure();
  const [activeSection, setActiveSection] = useState("account");

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

  const handleSaveSettings = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handleDeleteAccount = async () => {
    // Handle account deletion
    console.log("Account deletion requested");
    onDeleteOpenChange();
  };

  const handlePasswordChange = async () => {
    if (accountSettings.newPassword !== accountSettings.confirmPassword) {
      // Handle password mismatch
      return;
    }
    // Handle password change
    console.log("Password change requested");
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
          >
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
