'use client';

import React, { useState } from 'react';
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Link,
  Button,
} from '@heroui/react';
import { useAuth } from '../hooks/useAuth';
import { UserDropdown } from './UserDropdown';
import { NavigationItems } from './NavigationItems';
import { MobileNavMenu } from './MobileNavMenu';
import { Logo } from './icons';

export function AuthNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, loading } = useAuth();

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <Navbar
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      className="glassmorphic-navbar backdrop-blur-lg bg-white/10 dark:bg-black/10 border-b border-white/20 dark:border-white/10"
      maxWidth="full"
      position="sticky"
    >
      {/* Mobile menu toggle */}
      <NavbarContent className="md:hidden" justify="start">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          onClick={handleMenuToggle}
          className="text-foreground"
        />
      </NavbarContent>

      {/* Brand/Logo */}
      <NavbarContent className="md:hidden pr-3" justify="center">
        <NavbarBrand>
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <p className="font-bold text-xl bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              GameGen
            </p>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      {/* Desktop Brand */}
      <NavbarContent className="hidden md:flex gap-4" justify="start">
        <NavbarBrand>
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-8 w-8" />
            <p className="font-bold text-xl bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              GameGen
            </p>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      {/* Desktop Navigation */}
      <NavbarContent className="hidden md:flex gap-6" justify="center">
        <NavigationItems />
      </NavbarContent>

      {/* User Actions */}
      <NavbarContent justify="end">
        {loading ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
        ) : user ? (
          <UserDropdown user={user} />
        ) : (
          <div className="flex gap-2">
            <NavbarItem className="hidden md:flex">
              <Link href="/auth">
                <Button 
                  variant="light" 
                  className="text-foreground hover:text-purple-500 transition-colors"
                >
                  Sign In
                </Button>
              </Link>
            </NavbarItem>
            <NavbarItem>
              <Link href="/auth">
                <Button 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
                  variant="solid"
                >
                  Get Started
                </Button>
              </Link>
            </NavbarItem>
          </div>
        )}
      </NavbarContent>

      {/* Mobile Menu */}
      <NavbarMenu className="glassmorphic-menu backdrop-blur-lg bg-white/95 dark:bg-black/95 border-r border-white/20 dark:border-white/10">
        <MobileNavMenu 
          user={user} 
          onClose={() => setIsMenuOpen(false)}
        />
      </NavbarMenu>
    </Navbar>
  );
}
