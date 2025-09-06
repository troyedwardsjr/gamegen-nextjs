"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
// import { Avatar } from "@heroui/avatar"; // Temporarily disabled for testing

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
  CogIcon,
  ArrowRightOnRectangleIcon,
  ArrowRightEndOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from "@/components/icons";

import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { useAuth } from "@/lib/auth/context";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconActive: React.ComponentType<{ className?: string }>;
  description?: string;
}

export interface AuthNavbarProps {
  isMenuOpen?: boolean;
  onMenuOpenChange?: (isOpen: boolean) => void;
}

export function AuthNavbar({ isMenuOpen, onMenuOpenChange }: AuthNavbarProps) {
  const { user, session, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position for enhanced glass effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Disable body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  }, [isMenuOpen]);

  // Close mobile menu when navigating to a new page
  useEffect(() => {
    if (onMenuOpenChange) {
      onMenuOpenChange(false);
    }
  }, [pathname, onMenuOpenChange]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Public navigation items
  const publicMenuItems: NavigationItem[] = [
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

  // Authenticated navigation items
  const authenticatedMenuItems: NavigationItem[] = [
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

  return (
    <motion.div
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-navbar w-full navbar-mobile-fixed"
      style={{ zIndex: 9998 }}
    >
      <Navbar
        className={
          `backdrop-blur-3xl border-b transition-all duration-500 ${
            isScrolled 
              ? "bg-gradient-to-r from-black/30 via-purple-900/20 to-black/30 border-purple-500/40 shadow-2xl shadow-purple-500/20" 
              : "bg-gradient-to-r from-black/15 via-purple-900/10 to-black/15 border-purple-500/25 shadow-lg shadow-purple-500/10"
          }`
        }
        style={{
          background: isScrolled 
            ? 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(132,61,255,0.15) 20%, rgba(168,85,247,0.1) 50%, rgba(132,61,255,0.15) 80%, rgba(0,0,0,0.4) 100%)'
            : 'linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(132,61,255,0.08) 20%, rgba(168,85,247,0.05) 50%, rgba(132,61,255,0.08) 80%, rgba(0,0,0,0.2) 100%)',
        }}
        isMenuOpen={isMenuOpen}
        maxWidth="2xl"
        height="70px"
        onMenuOpenChange={onMenuOpenChange}
        position="static"
        shouldHideOnScroll={false}
      >
        {/* Brand */}
        <NavbarContent className="pr-3" justify="start">
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="lg:hidden text-foreground hover:text-primary transition-colors"
            icon={
              isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )
            }
          />
          <NavbarBrand className="mr-4">
            <Link 
              className="flex items-center space-x-3 transition-transform hover:scale-105 active:scale-95" 
              href="/"
            >
              <motion.div 
                className="w-10 h-10 relative rounded-xl flex items-center justify-center overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, rgba(132,61,255,0.8) 0%, rgba(168,85,247,0.9) 50%, rgba(139,92,246,0.8) 100%)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(132,61,255,0.4)',
                  boxShadow: '0 8px 32px rgba(132,61,255,0.3), inset 0 1px 2px rgba(255,255,255,0.2)',
                }}
                whileHover={{ 
                  rotate: 8, 
                  scale: 1.15,
                  boxShadow: '0 12px 48px rgba(132,61,255,0.5), inset 0 1px 2px rgba(255,255,255,0.3)'
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                {/* Glass shine effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                {/* Animated glow */}
                <div className="absolute inset-0 rounded-xl bg-purple-400/20 group-hover:bg-purple-300/30 transition-colors duration-300" />
                <span className="text-white font-bold text-lg relative z-10 drop-shadow-lg">G</span>
              </motion.div>
              <motion.span 
                className="font-bold text-xl text-white bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                GameGen
              </motion.span>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        {/* Desktop Navigation */}
        <NavbarContent className="hidden lg:flex gap-1" justify="center">
          <AnimatePresence>
            {(user ? authenticatedMenuItems : publicMenuItems).map((item, index) => {
              const Icon = isActive(item.href) ? item.iconActive : item.icon;
              const active = isActive(item.href);
              
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <NavbarItem>
                    <Link href={item.href}>
                      <motion.div
                        className={
                          `px-4 py-2 rounded-xl flex items-center space-x-2 transition-all duration-300 group relative overflow-hidden ${
                            active 
                              ? "text-white shadow-lg shadow-purple-500/25" 
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
                        whileHover={{ 
                          scale: 1.05, 
                          y: -2,
                          background: active 
                            ? 'linear-gradient(135deg, rgba(132,61,255,0.4) 0%, rgba(168,85,247,0.35) 50%, rgba(139,92,246,0.4) 100%)'
                            : 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(132,61,255,0.1) 50%, rgba(255,255,255,0.1) 100%)',
                          boxShadow: active 
                            ? '0 8px 32px rgba(132,61,255,0.4)' 
                            : '0 4px 16px rgba(132,61,255,0.2)',
                        }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <Icon className={`w-4 h-4 ${active ? "text-purple-400" : "text-current"}`} />
                        <span className="font-medium text-sm">
                          {item.name}
                        </span>
                        {active && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-purple-400/10 rounded-xl -z-10"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                      </motion.div>
                    </Link>
                  </NavbarItem>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </NavbarContent>

        {/* Right side content */}
        <NavbarContent className="pl-4" justify="end">

          {user ? (
            // Authenticated user menu
            <NavbarItem>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Dropdown 
                  placement="bottom-end"
                  classNames={{
                    content: "glass backdrop-blur-xl border border-purple-500/20 shadow-2xl shadow-purple-500/10",
                  }}
                >
                  <DropdownTrigger>
                    <motion.button
                      className="glass p-2 rounded-xl hover:bg-white/10 transition-all duration-300 flex items-center space-x-3"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold ring-2 ring-purple-500/30 ring-offset-2 ring-offset-black/20">
                        {getDisplayName().charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden md:flex flex-col items-start text-left">
                        <span className="text-sm font-semibold text-white">
                          {getDisplayName()}
                        </span>
                        <span className="text-xs text-gray-400">Online</span>
                      </div>
                    </motion.button>
                  </DropdownTrigger>
                  <DropdownMenu 
                    aria-label="User menu" 
                    className="w-60"
                    itemClasses={{
                      base: "glass-nav-item rounded-lg data-[hover=true]:bg-purple-500/20 data-[hover=true]:text-white",
                    }}
                  >
                    <DropdownItem
                      key="dashboard"
                      startContent={<HomeIcon className="w-4 h-4" />}
                      textValue="Dashboard"
                      className="text-sm"
                      as={Link}
                      href="/dashboard"
                    >
                      Dashboard
                    </DropdownItem>
                    <DropdownItem
                      key="creator"
                      startContent={<GameIcon className="w-4 h-4" />}
                      textValue="Creator Studio"
                      className="text-sm"
                      as={Link}
                      href="/creator"
                    >
                      Creator Studio
                    </DropdownItem>
                    <DropdownItem
                      key="profile"
                      startContent={<UserIcon className="w-4 h-4" />}
                      textValue="Profile"
                      className="text-sm"
                      as={Link}
                      href="/profile"
                    >
                      Profile
                    </DropdownItem>
                    <DropdownItem
                      key="settings"
                      startContent={<CogIcon className="w-4 h-4" />}
                      textValue="Settings"
                      className="text-sm"
                      as={Link}
                      href="/settings"
                    >
                      Settings
                    </DropdownItem>
                    <DropdownItem
                      key="logout"
                      color="danger"
                      startContent={
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      }
                      textValue="Sign out"
                      onPress={handleSignOut}
                      className="text-sm text-danger"
                    >
                      Sign out
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </motion.div>
            </NavbarItem>
          ) : (
            // Unauthenticated user buttons - HIDDEN on mobile, shown only on lg+ screens
            <>
              <NavbarItem className="hidden lg:flex">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Link href="/auth">
                    <GlassmorphicButton
                      variant="glass-ghost"
                      intensity="subtle"
                      blur="md"
                      startContent={
                        <ArrowRightEndOnRectangleIcon className="w-4 h-4" />
                      }
                      className="text-sm font-medium text-white"
                    >
                      Login
                    </GlassmorphicButton>
                  </Link>
                </motion.div>
              </NavbarItem>
              <NavbarItem className="hidden lg:flex">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Link href="/auth">
                    <GlassmorphicButton
                      variant="glass-filled"
                      intensity="medium"
                      blur="md"
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold border border-purple-400/50 hover:from-purple-400 hover:to-purple-500 shadow-lg shadow-purple-500/25"
                    >
                      Sign Up
                    </GlassmorphicButton>
                  </Link>
                </motion.div>
              </NavbarItem>
            </>
          )}
        </NavbarContent>

        {/* Mobile menu - covers full viewport */}
        <NavbarMenu 
          className="glass backdrop-blur-3xl border-r border-purple-500/20 pt-6 px-6 z-navbar-menu fixed inset-0 w-screen h-screen"
          style={{ 
            zIndex: 9999,
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            paddingTop: '80px' // Account for navbar height
          }}
          motionProps={{
            initial: { x: "-100%", opacity: 0 },
            animate: { x: 0, opacity: 1 },
            exit: { x: "-100%", opacity: 0 },
            transition: { duration: 0.3, ease: "easeInOut" },
          }}
        >
          {/* Mobile Navigation Items */}
          <div className="space-y-2 mb-6">
            {(user ? authenticatedMenuItems : publicMenuItems).map((item, index) => {
              const Icon = isActive(item.href) ? item.iconActive : item.icon;
              const active = isActive(item.href);
              
              return (
                <NavbarMenuItem key={item.name}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={item.href} className="w-full block">
                      <div
                        className={
                          `glass p-4 rounded-xl flex items-center space-x-3 transition-all duration-300 ${
                            active
                              ? "bg-gradient-to-r from-purple-500/30 to-purple-400/20 border border-purple-500/40"
                              : "hover:bg-white/10"
                          }`
                        }
                      >
                        <Icon className={`w-5 h-5 ${active ? "text-purple-400" : "text-gray-300"}`} />
                        <div className="flex flex-col">
                          <span className={`font-semibold ${active ? "text-white" : "text-gray-200"}`}>
                            {item.name}
                          </span>
                          {item.description && (
                            <span className="text-xs text-gray-400">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                </NavbarMenuItem>
              );
            })}
          </div>

          {/* Mobile User Actions */}
          {user ? (
            <>
              <div className="mt-6 pt-4 border-t border-purple-500/20">
                <div className="glass p-4 rounded-xl flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold ring-2 ring-purple-500/30">
                    {getDisplayName().charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white text-sm">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs text-gray-400">{user?.email}</p>
                  </div>
                </div>
              </div>
              
              <NavbarMenuItem>
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="w-full glass p-4 rounded-xl flex items-center space-x-3 text-red-400 hover:bg-red-500/20 transition-all duration-300"
                  onClick={handleSignOut}
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span className="font-medium">Sign out</span>
                </motion.button>
              </NavbarMenuItem>
            </>
          ) : (
            <>
              <div className="mt-6 pt-4 border-t border-purple-500/20 space-y-3">
                <NavbarMenuItem>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Link href="/auth" className="w-full block">
                      <GlassmorphicButton
                        variant="glass-ghost"
                        intensity="subtle"
                        blur="md"
                        startContent={
                          <ArrowRightEndOnRectangleIcon className="w-4 h-4" />
                        }
                        className="w-full justify-center text-white"
                      >
                        Login
                      </GlassmorphicButton>
                    </Link>
                  </motion.div>
                </NavbarMenuItem>
                <NavbarMenuItem>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Link href="/auth" className="w-full block">
                      <GlassmorphicButton
                        variant="glass-filled"
                        intensity="medium"
                        blur="md"
                        className="w-full justify-center bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold border border-purple-400/50 shadow-lg shadow-purple-500/25"
                      >
                        Sign Up
                      </GlassmorphicButton>
                    </Link>
                  </motion.div>
                </NavbarMenuItem>
              </div>
            </>
          )}
        </NavbarMenu>
      </Navbar>
    </motion.div>
  );
}