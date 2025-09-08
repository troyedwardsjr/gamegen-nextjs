"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";

import {
  ChevronRightIcon,
  HomeIcon,
  GameIcon,
  SparklesIcon,
  UserIcon,
  CogIcon,
  InformationCircleIcon,
} from "@/components/icons";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItem[];
  variant?: "default" | "glass" | "minimal";
  className?: string;
  separator?: React.ReactNode;
  showHomeIcon?: boolean;
  maxItems?: number;
}

/**
 * Breadcrumb navigation component with glassmorphic design
 * Supports manual items or auto-generation from pathname
 */
export function BreadcrumbNav({
  items,
  variant = "default",
  className = "",
  separator,
  showHomeIcon = true,
  maxItems = 5,
}: BreadcrumbNavProps) {
  const pathname = usePathname();

  // Auto-generate breadcrumb items from pathname if not provided
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    if (items) return items;

    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbItems: BreadcrumbItem[] = [];

    // Always add home
    if (showHomeIcon) {
      breadcrumbItems.push({
        label: "Home",
        href: "/",
        icon: HomeIcon,
      });
    }

    // Generate items from path segments
    segments.forEach((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const label = formatSegmentLabel(segment);
      const icon = getIconForSegment(segment);

      breadcrumbItems.push({
        label,
        href: index === segments.length - 1 ? undefined : href, // Last item is not clickable
        icon,
      });
    });

    return breadcrumbItems;
  };

  const formatSegmentLabel = (segment: string): string => {
    // Convert URL segment to readable label
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getIconForSegment = (
    segment: string,
  ): React.ComponentType<{ className?: string }> | undefined => {
    const iconMap: Record<
      string,
      React.ComponentType<{ className?: string }>
    > = {
      dashboard: HomeIcon,
      creator: GameIcon,
      games: GameIcon,
      explore: SparklesIcon,
      profile: UserIcon,
      settings: CogIcon,
      about: InformationCircleIcon,
    };

    return iconMap[segment.toLowerCase()];
  };

  const breadcrumbItems = getBreadcrumbItems();

  // Limit items if maxItems is specified
  const displayItems =
    maxItems && breadcrumbItems.length > maxItems
      ? [
          breadcrumbItems[0],
          { label: "...", disabled: true },
          ...breadcrumbItems.slice(-2),
        ]
      : breadcrumbItems;

  if (variant === "glass") {
    return (
      <motion.nav
        animate={{ opacity: 1, y: 0 }}
        className={`glass backdrop-blur-lg bg-black/20 border border-purple-500/20 rounded-xl p-3 ${className}`}
        initial={{ opacity: 0, y: -10 }}
      >
        <div className="flex items-center space-x-2 text-sm">
          {displayItems.map((item, index) => {
            const isLast = index === displayItems.length - 1;
            const Icon = item.icon;

            return (
              <React.Fragment key={`${item.label}-${index}`}>
                <motion.div
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-2"
                  initial={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {Icon && (
                    <Icon
                      className={`w-4 h-4 ${
                        isLast
                          ? "text-purple-400"
                          : item.disabled
                            ? "text-gray-500"
                            : "text-gray-400"
                      }`}
                    />
                  )}
                  {item.href && !item.disabled ? (
                    <Link
                      className="text-gray-300 hover:text-white transition-colors duration-200 hover:underline"
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={
                        isLast
                          ? "text-white font-medium"
                          : item.disabled
                            ? "text-gray-500"
                            : "text-gray-400"
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </motion.div>

                {!isLast && (
                  <motion.div
                    animate={{ opacity: 1, scale: 1 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.1 + 0.05 }}
                  >
                    {separator || (
                      <ChevronRightIcon className="w-3 h-3 text-gray-500" />
                    )}
                  </motion.div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </motion.nav>
    );
  }

  if (variant === "minimal") {
    return (
      <motion.nav
        animate={{ opacity: 1, y: 0 }}
        className={`${className}`}
        initial={{ opacity: 0, y: -10 }}
      >
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          {displayItems.map((item, index) => {
            const isLast = index === displayItems.length - 1;

            return (
              <React.Fragment key={`${item.label}-${index}`}>
                <motion.span
                  animate={{ opacity: 1, x: 0 }}
                  initial={{ opacity: 0, x: -5 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {item.href && !item.disabled ? (
                    <Link
                      className="hover:text-white transition-colors duration-200"
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={
                        isLast
                          ? "text-white"
                          : item.disabled
                            ? "text-gray-600"
                            : ""
                      }
                    >
                      {item.label}
                    </span>
                  )}
                </motion.span>

                {!isLast && (
                  <motion.span
                    animate={{ opacity: 1 }}
                    className="text-gray-600"
                    initial={{ opacity: 0 }}
                    transition={{ delay: index * 0.05 + 0.025 }}
                  >
                    {separator || "/"}
                  </motion.span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </motion.nav>
    );
  }

  // Default variant using HeroUI Breadcrumbs
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={className}
      initial={{ opacity: 0, y: -10 }}
    >
      <Breadcrumbs
        classNames={{
          list: "gap-2",
          item: "text-gray-400 data-[current=true]:text-white",
          separator: "text-gray-500",
        }}
        itemClasses={{
          base: "transition-colors hover:text-white",
        }}
        separator={separator || <ChevronRightIcon className="w-4 h-4" />}
      >
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const Icon = item.icon;

          return (
            <BreadcrumbItem
              key={`${item.label}-${index}`}
              href={item.href}
              isCurrent={isLast}
              isDisabled={item.disabled}
              startContent={Icon && <Icon className="w-4 h-4" />}
            >
              <motion.span
                animate={{ opacity: 1, x: 0 }}
                initial={{ opacity: 0, x: -5 }}
                transition={{ delay: index * 0.1 }}
              >
                {item.label}
              </motion.span>
            </BreadcrumbItem>
          );
        })}
      </Breadcrumbs>
    </motion.div>
  );
}

/**
 * Specialized breadcrumb for dashboard pages
 */
export function DashboardBreadcrumb({
  className = "",
  variant = "glass",
}: {
  className?: string;
  variant?: "default" | "glass" | "minimal";
}) {
  return (
    <BreadcrumbNav
      className={className}
      maxItems={4}
      showHomeIcon={true}
      variant={variant}
    />
  );
}

/**
 * Compact breadcrumb for mobile layouts
 */
export function MobileBreadcrumb({
  className = "",
  showOnlyLast = false,
}: {
  className?: string;
  showOnlyLast?: boolean;
}) {
  const pathname = usePathname();

  if (showOnlyLast) {
    const segments = pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    const label =
      lastSegment
        ?.split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ") || "Home";

    return (
      <motion.div
        animate={{ opacity: 1, x: 0 }}
        className={`text-white font-medium text-lg ${className}`}
        initial={{ opacity: 0, x: -10 }}
      >
        {label}
      </motion.div>
    );
  }

  return (
    <BreadcrumbNav
      className={className}
      maxItems={2}
      separator="•"
      showHomeIcon={false}
      variant="minimal"
    />
  );
}

/**
 * Hook to generate breadcrumb items from current route
 */
export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();

  return React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbItems: BreadcrumbItem[] = [];

    // Add home
    breadcrumbItems.push({
      label: "Home",
      href: "/",
      icon: HomeIcon,
    });

    // Generate items from path segments
    segments.forEach((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const label = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      breadcrumbItems.push({
        label,
        href: index === segments.length - 1 ? undefined : href,
      });
    });

    return breadcrumbItems;
  }, [pathname]);
}
