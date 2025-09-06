"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@heroui/button";
import {
  HomeIcon,
  HomeIconSolid,
  GameIcon,
  GameIconSolid,
  SparklesIcon,
  SparklesIconSolid,
  CurrencyDollarIcon,
  CurrencyDollarIconSolid,
  InformationCircleIcon,
  InformationCircleIconSolid,
  UserIcon,
  UserIconSolid,
} from "@/components/icons";

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconActive: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string | number;
  disabled?: boolean;
}

interface NavigationItemsProps {
  items: NavigationItem[];
  variant?: "desktop" | "mobile" | "sidebar";
  className?: string;
  onItemClick?: (item: NavigationItem) => void;
  showDescription?: boolean;
  showBadges?: boolean;
}

/**
 * Reusable navigation items component with glassmorphic design
 * Supports different variants for desktop, mobile, and sidebar layouts
 */
export function NavigationItems({
  items,
  variant = "desktop",
  className = "",
  onItemClick,
  showDescription = true,
  showBadges = true,
}: NavigationItemsProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.disabled) return;
    onItemClick?.(item);
  };

  if (variant === "desktop") {
    return (
      <div className={`flex gap-1 ${className}`}>
        {items.map((item, index) => {
          const Icon = isActive(item.href) ? item.iconActive : item.icon;
          const active = isActive(item.href);
          
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.disabled ? "#" : item.href}
                onClick={() => handleItemClick(item)}
                className={item.disabled ? "pointer-events-none" : ""}
              >
                <motion.div
                  className={
                    `px-4 py-2 rounded-xl flex items-center space-x-2 transition-all duration-300 group relative overflow-hidden ${
                      active 
                        ? "text-white shadow-lg shadow-purple-500/25" 
                        : item.disabled 
                          ? "text-gray-500 opacity-50"
                          : "text-gray-300 hover:text-white"
                    }`
                  }
                  style={{
                    background: active 
                      ? 'linear-gradient(135deg, rgba(132,61,255,0.3) 0%, rgba(168,85,247,0.25) 50%, rgba(139,92,246,0.3) 100%)'
                      : 'transparent',
                    backdropFilter: 'blur(8px)',
                    border: active 
                      ? '1px solid rgba(132,61,255,0.4)' 
                      : '1px solid transparent',
                  }}
                  whileHover={!item.disabled ? { 
                    scale: 1.05, 
                    y: -2,
                    background: active 
                      ? 'linear-gradient(135deg, rgba(132,61,255,0.4) 0%, rgba(168,85,247,0.35) 50%, rgba(139,92,246,0.4) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(132,61,255,0.1) 50%, rgba(255,255,255,0.1) 100%)',
                    boxShadow: active 
                      ? '0 8px 32px rgba(132,61,255,0.4)' 
                      : '0 4px 16px rgba(132,61,255,0.2)',
                  } : {}}
                  whileTap={!item.disabled ? { scale: 0.95 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-purple-400" : "text-current"}`} />
                  <span className="font-medium text-sm">
                    {item.name}
                  </span>
                  {showBadges && item.badge && (
                    <span className="bg-purple-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                      {item.badge}
                    </span>
                  )}
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-purple-400/10 rounded-xl -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    );
  }

  if (variant === "mobile") {
    return (
      <div className={`space-y-2 ${className}`}>
        {items.map((item, index) => {
          const Icon = isActive(item.href) ? item.iconActive : item.icon;
          const active = isActive(item.href);
          
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link 
                href={item.disabled ? "#" : item.href}
                className={`w-full block ${item.disabled ? "pointer-events-none" : ""}`}
                onClick={() => handleItemClick(item)}
              >
                <div
                  className={
                    `glass p-4 rounded-xl flex items-center space-x-3 transition-all duration-300 relative ${
                      active
                        ? "bg-gradient-to-r from-purple-500/30 to-purple-400/20 border border-purple-500/40"
                        : item.disabled
                          ? "opacity-50"
                          : "hover:bg-white/10"
                    }`
                  }
                >
                  <Icon className={`w-5 h-5 ${active ? "text-purple-400" : item.disabled ? "text-gray-500" : "text-gray-300"}`} />
                  <div className="flex-1 flex flex-col">
                    <span className={`font-semibold ${active ? "text-white" : item.disabled ? "text-gray-500" : "text-gray-200"}`}>
                      {item.name}
                    </span>
                    {showDescription && item.description && (
                      <span className="text-xs text-gray-400">
                        {item.description}
                      </span>
                    )}
                  </div>
                  {showBadges && item.badge && (
                    <span className="bg-purple-500 text-white text-xs rounded-full px-2 py-1 min-w-[1.5rem] text-center">
                      {item.badge}
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <nav className={`space-y-1 ${className}`}>
        {items.map((item, index) => {
          const Icon = isActive(item.href) ? item.iconActive : item.icon;
          const active = isActive(item.href);
          
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.disabled ? "#" : item.href}
                className={item.disabled ? "pointer-events-none" : ""}
                onClick={() => handleItemClick(item)}
              >
                <motion.div
                  className={
                    `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                      active
                        ? "bg-gradient-to-r from-purple-600/20 to-purple-500/20 text-white border-r-2 border-purple-500"
                        : item.disabled
                          ? "text-gray-500 opacity-50"
                          : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`
                  }
                  whileHover={!item.disabled ? { x: 4 } : {}}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Icon 
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      active ? "text-purple-400" : "text-current"
                    }`} 
                  />
                  <span className="flex-1">{item.name}</span>
                  {showBadges && item.badge && (
                    <span className="bg-purple-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              </Link>
            </motion.div>
          );
        })}
      </nav>
    );
  }

  return null;
}

// Pre-defined navigation items for different contexts
export const publicNavigationItems: NavigationItem[] = [
  {
    name: "Home",
    href: "/",
    icon: HomeIcon,
    iconActive: HomeIconSolid,
    description: "Home page",
  },
  {
    name: "Features",
    href: "/features",
    icon: SparklesIcon,
    iconActive: SparklesIconSolid,
    description: "Platform features",
  },
  {
    name: "Pricing",
    href: "/pricing",
    icon: CurrencyDollarIcon,
    iconActive: CurrencyDollarIconSolid,
    description: "Pricing plans",
  },
  {
    name: "About",
    href: "/about",
    icon: InformationCircleIcon,
    iconActive: InformationCircleIconSolid,
    description: "About GameGen",
  },
];

export const authenticatedNavigationItems: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
    iconActive: HomeIconSolid,
    description: "Your dashboard",
  },
  {
    name: "Creator Studio",
    href: "/creator",
    icon: GameIcon,
    iconActive: GameIconSolid,
    description: "Game creation studio",
  },
  {
    name: "Explore",
    href: "/explore",
    icon: SparklesIcon,
    iconActive: SparklesIconSolid,
    description: "Discover games",
  },
];

export const dashboardNavigationItems: NavigationItem[] = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: HomeIcon,
    iconActive: HomeIconSolid,
    description: "Dashboard overview",
  },
  {
    name: "My Games",
    href: "/dashboard/games",
    icon: GameIcon,
    iconActive: GameIconSolid,
    description: "Your created games",
  },
  {
    name: "Templates",
    href: "/dashboard/templates",
    icon: SparklesIcon,
    iconActive: SparklesIconSolid,
    description: "Game templates",
  },
  {
    name: "Profile",
    href: "/dashboard/profile",
    icon: UserIcon,
    iconActive: UserIconSolid,
    description: "User profile",
  },
];

/**
 * Hook to get navigation items based on authentication state
 */
export function useNavigationItems(context: "public" | "authenticated" | "dashboard" = "public") {
  switch (context) {
    case "authenticated":
      return authenticatedNavigationItems;
    case "dashboard":
      return dashboardNavigationItems;
    default:
      return publicNavigationItems;
  }
}