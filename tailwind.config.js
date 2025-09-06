import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      // Gaming-focused color palette
      colors: {
        'game-purple': {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#8b5cf6', // Primary purple
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        'game-cyan': {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4', // Primary cyan
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
      },
      // Glass morphism utilities
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        'glass-sm': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'glass-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'glass-lg': '0 8px 25px rgba(0, 0, 0, 0.15)',
        'glass-xl': '0 20px 25px rgba(0, 0, 0, 0.25)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.4)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.4)',
        'glow-rose': '0 0 20px rgba(244, 63, 94, 0.4)',
      },
      animation: {
        'glass-fade-in': 'glassBloomIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'glass-slide-up': 'glassSlideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'glass-pulse': 'glassPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-in-from-bottom': 'slideInFromBottom 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-in-from-top': 'slideInFromTop 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'slide-in-from-left': 'slideInFromLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'zoom-in': 'zoomIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
      },
      keyframes: {
        glassBloomIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
            backdropFilter: 'blur(2px) saturate(100%)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
            backdropFilter: 'blur(8px) saturate(150%)',
          },
        },
        glassSlideUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        glassPulse: {
          '0%, 100%': {
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 0 0 rgba(139, 92, 246, 0)',
          },
          '50%': {
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 0 20px rgba(139, 92, 246, 0.4)',
          },
        },
        fadeIn: {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
        slideInFromBottom: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInFromTop: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInFromLeft: {
          '0%': {
            opacity: '0',
            transform: 'translateX(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        zoomIn: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {
            primary: {
              50: '#f8fafc',
              100: '#f1f5f9',
              200: '#e2e8f0',
              300: '#cbd5e1',
              400: '#94a3b8',
              500: '#8b5cf6',
              600: '#7c3aed',
              700: '#6d28d9',
              800: '#5b21b6',
              900: '#4c1d95',
              DEFAULT: '#8b5cf6',
              foreground: '#ffffff',
            },
            secondary: {
              50: '#ecfeff',
              100: '#cffafe',
              200: '#a5f3fc',
              300: '#67e8f9',
              400: '#22d3ee',
              500: '#06b6d4',
              600: '#0891b2',
              700: '#0e7490',
              800: '#155e75',
              900: '#164e63',
              DEFAULT: '#06b6d4',
              foreground: '#ffffff',
            },
          },
        },
        light: {
          colors: {
            primary: {
              50: '#f8fafc',
              100: '#f1f5f9',
              200: '#e2e8f0',
              300: '#cbd5e1',
              400: '#94a3b8',
              500: '#8b5cf6',
              600: '#7c3aed',
              700: '#6d28d9',
              800: '#5b21b6',
              900: '#4c1d95',
              DEFAULT: '#8b5cf6',
              foreground: '#ffffff',
            },
            secondary: {
              50: '#ecfeff',
              100: '#cffafe',
              200: '#a5f3fc',
              300: '#67e8f9',
              400: '#22d3ee',
              500: '#06b6d4',
              600: '#0891b2',
              700: '#0e7490',
              800: '#155e75',
              900: '#164e63',
              DEFAULT: '#06b6d4',
              foreground: '#ffffff',
            },
          },
        },
      },
    }),
  ],
}

module.exports = config;