"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { 
  HomeIcon,
  GameIcon,
  UserIcon,
  CogIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
} from "@/components/icons";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";

interface UserDropdownProps {
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  className?: string;
  showCompactView?: boolean;
}

export function UserDropdown({ 
  placement = "bottom-end", 
  className = "",
  showCompactView = false 
}: UserDropdownProps) {
  const { user, session, signOut, getUserTier } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Get user display name from session or user data
  const getDisplayName = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  // Get avatar URL from session or user data
  const getAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || "";
  };

  // Get user subscription status
  const getSubscriptionTier = () => {
    const tier = getUserTier();
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  // Get tier color
  const getTierColor = () => {
    const tier = getUserTier();
    switch (tier) {
      case 'pro':
        return 'text-blue-400';
      case 'max':
        return 'text-purple-400';
      case 'educational':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Dropdown 
      placement={placement}
      classNames={{
        content: "glass backdrop-blur-xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 min-w-[280px]",
      }}
      className={className}
    >
      <DropdownTrigger>
        <motion.button
          className="glass p-2 rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center space-x-3"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Avatar
            name={getDisplayName()}
            size={showCompactView ? "sm" : "md"}
            src={getAvatarUrl()}
            classNames={{
              base: "ring-2 ring-purple-500/30 ring-offset-2 ring-offset-black/20",
            }}
          />
          {!showCompactView && (
            <div className="hidden md:flex flex-col items-start text-left">
              <span className="text-sm font-semibold text-white">
                {getDisplayName()}
              </span>
              <span className={`text-xs ${getTierColor()}`}>
                {getSubscriptionTier()} Plan
              </span>
            </div>
          )}
        </motion.button>
      </DropdownTrigger>
      
      <DropdownMenu 
        aria-label="User menu" 
        className="w-full"
        itemClasses={{
          base: "glass-nav-item rounded-lg data-[hover=true]:bg-purple-500/20 data-[hover=true]:text-white transition-colors",
        }}
      >
        {/* User Info Section */}
        <DropdownSection 
          title="Account" 
          classNames={{
            heading: "text-xs text-purple-400 font-semibold uppercase tracking-wide",
          }}
        >
          <DropdownItem
            key="user-info"
            textValue="User Info"
            className="opacity-100 cursor-default"
            isReadOnly
          >
            <div className="flex items-center space-x-3 py-2">
              <Avatar
                name={getDisplayName()}
                size="md"
                src={getAvatarUrl()}
                classNames={{
                  base: "ring-2 ring-purple-500/30",
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user.email}
                </p>
                <p className={`text-xs font-medium ${getTierColor()}`}>
                  {getSubscriptionTier()} Plan
                </p>
              </div>
            </div>
          </DropdownItem>
        </DropdownSection>

        {/* Navigation Section */}
        <DropdownSection 
          title="Navigation" 
          classNames={{
            heading: "text-xs text-purple-400 font-semibold uppercase tracking-wide",
          }}
        >
          <DropdownItem
            key="dashboard"
            startContent={<HomeIcon className="w-4 h-4" />}
            textValue="Dashboard"
          >
            <Link href="/dashboard" className="w-full block">
              Dashboard
            </Link>
          </DropdownItem>

          <DropdownItem
            key="creator"
            startContent={<GameIcon className="w-4 h-4" />}
            textValue="Creator Studio"
          >
            <Link href="/creator" className="w-full block">
              Creator Studio
            </Link>
          </DropdownItem>

          <DropdownItem
            key="explore"
            startContent={<SparklesIcon className="w-4 h-4" />}
            textValue="Explore Games"
          >
            <Link href="/explore" className="w-full block">
              Explore Games
            </Link>
          </DropdownItem>
        </DropdownSection>

        {/* Account Management Section */}
        <DropdownSection 
          title="Account" 
          classNames={{
            heading: "text-xs text-purple-400 font-semibold uppercase tracking-wide",
          }}
        >
          <DropdownItem
            key="profile"
            startContent={<UserIcon className="w-4 h-4" />}
            textValue="Profile"
          >
            <Link href="/profile" className="w-full block">
              Profile & Preferences
            </Link>
          </DropdownItem>

          <DropdownItem
            key="billing"
            startContent={<CreditCardIcon className="w-4 h-4" />}
            textValue="Billing"
          >
            <Link href="/billing" className="w-full block">
              Billing & Subscription
            </Link>
          </DropdownItem>

          <DropdownItem
            key="settings"
            startContent={<CogIcon className="w-4 h-4" />}
            textValue="Settings"
          >
            <Link href="/settings" className="w-full block">
              Settings
            </Link>
          </DropdownItem>
        </DropdownSection>

        {/* Sign Out Section */}
        <DropdownSection classNames={{ group: "pt-2" }}>
          <DropdownItem
            key="logout"
            color="danger"
            startContent={
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
            }
            textValue="Sign out"
            onPress={handleSignOut}
            className="text-danger hover:bg-red-500/20"
          >
            Sign Out
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
}

/**
 * Compact user avatar button for minimal layouts
 */
export function CompactUserButton({ className = "" }: { className?: string }) {
  return (
    <UserDropdown 
      showCompactView={true}
      className={className}
    />
  );
}

/**
 * User menu specifically designed for mobile layouts
 */
export function MobileUserMenu({ 
  onNavigate 
}: { 
  onNavigate?: (href: string) => void 
}) {
  const { user, signOut, getUserTier } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleNavigate = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    } else {
      router.push(href);
    }
  };

  // Get user display name from session or user data
  const getDisplayName = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  // Get avatar URL from session or user data
  const getAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || "";
  };

  // Get user subscription status
  const getSubscriptionTier = () => {
    const tier = getUserTier();
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  // Get tier color
  const getTierColor = () => {
    const tier = getUserTier();
    switch (tier) {
      case 'pro':
        return 'text-blue-400';
      case 'max':
        return 'text-purple-400';
      case 'educational':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!user) {
    return null;
  }

  const menuItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      href: "/dashboard",
      icon: HomeIcon,
    },
    {
      key: "creator",
      label: "Creator Studio",
      href: "/creator",
      icon: GameIcon,
    },
    {
      key: "explore",
      label: "Explore Games",
      href: "/explore",
      icon: SparklesIcon,
    },
    {
      key: "profile",
      label: "Profile",
      href: "/profile",
      icon: UserIcon,
    },
    {
      key: "billing",
      label: "Billing",
      href: "/billing",
      icon: CreditCardIcon,
    },
    {
      key: "settings",
      label: "Settings",
      href: "/settings",
      icon: CogIcon,
    },
  ];

  return (
    <div className="space-y-4">
      {/* User Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-4 rounded-xl flex items-center space-x-3"
      >
        <Avatar
          name={getDisplayName()}
          size="lg"
          src={getAvatarUrl()}
          classNames={{
            base: "ring-2 ring-purple-500/30",
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-base">
            {getDisplayName()}
          </p>
          <p className="text-sm text-gray-400 truncate">
            {user.email}
          </p>
          <p className={`text-sm font-medium ${getTierColor()}`}>
            {getSubscriptionTier()} Plan
          </p>
        </div>
      </motion.div>

      {/* Menu Items */}
      <div className="space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="ghost"
                className="w-full justify-start p-4 h-auto glass hover:bg-white/10 transition-all duration-300"
                onPress={() => handleNavigate(item.href)}
                startContent={<Icon className="w-5 h-5 text-purple-400" />}
              >
                <span className="text-white font-medium">{item.label}</span>
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Sign Out Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button
          variant="ghost"
          color="danger"
          className="w-full justify-start p-4 h-auto glass hover:bg-red-500/20 transition-all duration-300"
          onPress={handleSignOut}
          startContent={<ArrowRightOnRectangleIcon className="w-5 h-5" />}
        >
          <span className="font-medium">Sign Out</span>
        </Button>
      </motion.div>
    </div>
  );
}