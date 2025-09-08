"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Badge } from '@heroui/badge';
import { Tabs, Tab } from '@heroui/tabs';
import { Chip } from '@heroui/chip';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@heroui/dropdown';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { Switch } from '@heroui/switch';
import { Divider } from '@heroui/divider';
import { Avatar } from '@heroui/avatar';
import { Spinner } from '@heroui/spinner';
import Link from 'next/link';

import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  EllipsisHorizontalIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  GameIcon,
  StarIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  TrophyIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  WrenchIcon,
} from '@/components/icons';

import type { 
  Notification, 
  NotificationType, 
  NotificationCategory,
  NotificationSettings 
} from '@/types/dashboard';

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  loading?: boolean;
  notificationSettings: NotificationSettings;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: string) => void;
  onUpdateSettings: (settings: NotificationSettings) => void;
  onNotificationAction?: (notificationId: string, action: string) => void;
}

const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  title: string;
}> = {
  collaboration_invite: {
    icon: UserPlusIcon,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    title: 'Collaboration Invite',
  },
  project_published: {
    icon: GameIcon,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    title: 'Project Published',
  },
  project_featured: {
    icon: StarIcon,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    title: 'Project Featured',
  },
  comment_received: {
    icon: ChatBubbleLeftIcon,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    title: 'New Comment',
  },
  like_received: {
    icon: HeartIcon,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    title: 'Project Liked',
  },
  follow_received: {
    icon: UserPlusIcon,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    title: 'New Follower',
  },
  achievement_unlocked: {
    icon: TrophyIcon,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    title: 'Achievement Unlocked',
  },
  credit_low: {
    icon: CreditCardIcon,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    title: 'Credits Running Low',
  },
  subscription_expiring: {
    icon: ExclamationTriangleIcon,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    title: 'Subscription Expiring',
  },
  system_maintenance: {
    icon: WrenchIcon,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/20',
    title: 'System Maintenance',
  },
  security_alert: {
    icon: ShieldCheckIcon,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    title: 'Security Alert',
  },
};

const PRIORITY_COLORS = {
  low: 'default',
  medium: 'primary',
  high: 'warning',
  urgent: 'danger',
} as const;

export default function NotificationCenter({
  notifications,
  unreadCount,
  loading = false,
  notificationSettings,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onUpdateSettings,
  onNotificationAction,
}: NotificationCenterProps) {
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | 'all'>('all');
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();

  const categories: Array<{ key: NotificationCategory | 'all'; label: string; count: number }> = [
    {
      key: 'all',
      label: 'All',
      count: notifications.length,
    },
    {
      key: 'collaboration',
      label: 'Collaboration',
      count: notifications.filter(n => n.category === 'collaboration').length,
    },
    {
      key: 'social',
      label: 'Social',
      count: notifications.filter(n => n.category === 'social').length,
    },
    {
      key: 'achievements',
      label: 'Achievements',
      count: notifications.filter(n => n.category === 'achievements').length,
    },
    {
      key: 'billing',
      label: 'Billing',
      count: notifications.filter(n => n.category === 'billing').length,
    },
    {
      key: 'system',
      label: 'System',
      count: notifications.filter(n => n.category === 'system').length,
    },
  ];

  const filteredNotifications = notifications.filter(
    notification => selectedCategory === 'all' || notification.category === selectedCategory
  );

  const sortedNotifications = filteredNotifications.sort((a, b) => {
    // Sort by read status (unread first), then by priority, then by date
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const aPriority = priorityOrder[a.priority];
    const bPriority = priorityOrder[b.priority];
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const NotificationItem = ({ notification }: { notification: Notification }) => {
    const config = NOTIFICATION_CONFIG[notification.type];
    const IconComponent = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`p-4 border-l-4 rounded-lg cursor-pointer transition-all duration-200 ${
          notification.isRead
            ? 'bg-gray-800/30 border-gray-600 hover:bg-gray-800/50'
            : 'bg-purple-900/20 border-purple-500 hover:bg-purple-900/30'
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex items-start space-x-3">
          <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
            <IconComponent className={`w-5 h-5 ${config.color}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className={`font-medium ${
                notification.isRead ? 'text-gray-300' : 'text-white'
              }`}>
                {notification.title}
              </h4>
              <div className="flex items-center space-x-2">
                {notification.priority !== 'low' && (
                  <Chip
                    size="sm"
                    color={PRIORITY_COLORS[notification.priority]}
                    variant="flat"
                  >
                    {notification.priority}
                  </Chip>
                )}
                <span className="text-xs text-gray-500">
                  {formatTimeAgo(notification.createdAt)}
                </span>
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EllipsisHorizontalIcon className="w-4 h-4" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu>
                    {[
                      ...(!notification.isRead ? [{
                        key: 'read',
                        label: 'Mark as Read',
                        icon: CheckIcon,
                        action: () => onMarkAsRead(notification.id)
                      }] : []),
                      {
                        key: 'delete',
                        label: 'Delete',
                        icon: XMarkIcon,
                        action: () => onDeleteNotification(notification.id),
                        className: 'text-danger'
                      }
                    ].map(item => (
                      <DropdownItem
                        key={item.key}
                        startContent={<item.icon className="w-4 h-4" />}
                        onClick={item.action}
                        className={item.className}
                      >
                        {item.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>

            <p className={`text-sm mb-2 ${
              notification.isRead ? 'text-gray-400' : 'text-gray-300'
            }`}>
              {notification.message}
            </p>

            {notification.actionUrl && notification.actionLabel && (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNotificationClick(notification);
                }}
              >
                {notification.actionLabel}
              </Button>
            )}

            {/* Special handling for collaboration invites */}
            {notification.type === 'collaboration_invite' && onNotificationAction && (
              <div className="flex space-x-2 mt-2">
                <Button
                  size="sm"
                  color="success"
                  variant="flat"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNotificationAction(notification.id, 'accept');
                  }}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNotificationAction(notification.id, 'decline');
                  }}
                >
                  Decline
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const SettingsModal = () => (
    <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="2xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              <h2 className="text-xl font-bold text-white">Notification Settings</h2>
            </ModalHeader>
            <ModalBody className="space-y-6">
              {/* Email Notifications */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Email Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Collaborations</span>
                    <Switch
                      isSelected={notificationSettings.email.collaborations}
                      onValueChange={(value) =>
                        onUpdateSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, collaborations: value },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Social Activity</span>
                    <Switch
                      isSelected={notificationSettings.email.socialActivity}
                      onValueChange={(value) =>
                        onUpdateSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, socialActivity: value },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Achievements</span>
                    <Switch
                      isSelected={notificationSettings.email.achievements}
                      onValueChange={(value) =>
                        onUpdateSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, achievements: value },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Billing & Account</span>
                    <Switch
                      isSelected={notificationSettings.email.billing}
                      onValueChange={(value) =>
                        onUpdateSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, billing: value },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">System Updates</span>
                    <Switch
                      isSelected={notificationSettings.email.system}
                      onValueChange={(value) =>
                        onUpdateSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, system: value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Divider />

              {/* In-App Notifications */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">In-App Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Collaborations</span>
                    <Switch
                      isSelected={notificationSettings.inApp.collaborations}
                      onValueChange={(value) =>
                        onUpdateSettings({
                          ...notificationSettings,
                          inApp: { ...notificationSettings.inApp, collaborations: value },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Social Activity</span>
                    <Switch
                      isSelected={notificationSettings.inApp.socialActivity}
                      onValueChange={(value) =>
                        onUpdateSettings({
                          ...notificationSettings,
                          inApp: { ...notificationSettings.inApp, socialActivity: value },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Achievements</span>
                    <Switch
                      isSelected={notificationSettings.inApp.achievements}
                      onValueChange={(value) =>
                        onUpdateSettings({
                          ...notificationSettings,
                          inApp: { ...notificationSettings.inApp, achievements: value },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Billing & Account</span>
                    <Switch
                      isSelected={notificationSettings.inApp.billing}
                      onValueChange={(value) =>
                        onUpdateSettings({
                          ...notificationSettings,
                          inApp: { ...notificationSettings.inApp, billing: value },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">System Updates</span>
                    <Switch
                      isSelected={notificationSettings.inApp.system}
                      onValueChange={(value) =>
                        onUpdateSettings({
                          ...notificationSettings,
                          inApp: { ...notificationSettings.inApp, system: value },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onClick={onClose}>
                Save Settings
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );

  return (
    <>
      <Card className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-purple-500/20 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <BellIcon className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <Badge color="danger" size="sm">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="bordered"
                onClick={onMarkAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark All Read
              </Button>
              <Button
                size="sm"
                variant="bordered"
                startContent={<Cog6ToothIcon className="w-4 h-4" />}
                onClick={onSettingsOpen}
              >
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          {/* Category Tabs */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.key}
                  variant={selectedCategory === category.key ? 'solid' : 'bordered'}
                  color={selectedCategory === category.key ? 'primary' : 'default'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.key)}
                >
                  {category.label}
                  {category.count > 0 && (
                    <Badge color="primary" size="sm" className="ml-2">
                      {category.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : sortedNotifications.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sortedNotifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BellIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">No notifications</h4>
              <p className="text-gray-400">
                {selectedCategory === 'all'
                  ? "You're all caught up!"
                  : `No ${selectedCategory} notifications found`}
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      <SettingsModal />
    </>
  );
}