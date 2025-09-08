/**
 * GameGen Glassmorphic UI Component Library
 *
 * A comprehensive collection of glassmorphic UI components
 * designed specifically for gaming and creative applications.
 *
 * Features:
 * - Gaming-focused design system with purple/black theme
 * - Comprehensive glassmorphic effects with backdrop blur
 * - Dark/light theme support with smooth transitions
 * - Framer Motion animations throughout
 * - Accessibility-first approach (WCAG 2.1 AA compliant)
 * - TypeScript support with full type safety
 * - HeroUI component integration
 */

// Core Components
export {
  GlassmorphicCard,
  GameGenCardPresets,
  type GlassmorphicCardProps,
} from "./GlassmorphicCard";

export {
  GlassmorphicButton,
  GameGenButtonPresets,
  type GlassmorphicButtonProps,
} from "./GlassmorphicButton";

// Import for internal usage
import { GameGenCardPresets } from "./GlassmorphicCard";
import { GameGenButtonPresets } from "./GlassmorphicButton";
import { GameGenInputPresets } from "./GlassmorphicInput";
import { GameGenModalPresets } from "./GlassmorphicModal";
import { GameGenDropdownPresets } from "./GlassmorphicDropdown";
import { GameGenBadgePresets } from "./GlassmorphicBadge";
import { GameGenAlertPresets } from "./GlassmorphicAlert";

export {
  GlassmorphicInput,
  GameGenInputPresets,
  type GlassmorphicInputProps,
} from "./GlassmorphicInput";

export {
  GlassmorphicModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  GameGenModalPresets,
  type GlassmorphicModalProps,
} from "./GlassmorphicModal";

export {
  GlassmorphicDropdown,
  GlassmorphicDropdownItem,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  GameGenDropdownPresets,
  type GlassmorphicDropdownProps,
  type GlassmorphicDropdownItemProps,
} from "./GlassmorphicDropdown";

export {
  GlassmorphicBadge,
  GameStatusBadge,
  GameGenBadgePresets,
  type GlassmorphicBadgeProps,
  type GameStatusBadgeProps,
} from "./GlassmorphicBadge";

export {
  GlassmorphicAlert,
  GameNotification,
  GameGenAlertPresets,
  type GlassmorphicAlertProps,
  type GameNotificationProps,
} from "./GlassmorphicAlert";

export {
  GlassmorphicSpinner,
  type GlassmorphicSpinnerProps,
} from "./GlassmorphicSpinner";

export {
  GlassmorphicLoadingOverlay,
  type GlassmorphicLoadingOverlayProps,
} from "./GlassmorphicLoadingOverlay";

// Theme System
export {
  themes,
  getTheme,
  getThemeColors,
  getGlassEffects,
  generateThemeCSS,
  gameComponentVariants,
  gamingDarkTheme,
  gamingNeonTheme,
  lightTheme,
  type GameGenTheme,
  type ThemeColors,
  type GlassEffects,
  type GameGenThemeConfig,
} from "../../lib/theme";

// Utility Types
export type GlassVariant =
  | "default"
  | "subtle"
  | "strong"
  | "gradient"
  | "gaming"
  | "accent-cyan"
  | "accent-emerald"
  | "accent-rose";
export type GlassBlur = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
export type GlassOpacity = "light" | "medium" | "strong";
export type GlassBorder = "none" | "subtle" | "visible" | "gaming";
export type GlassShadow = "none" | "sm" | "md" | "lg" | "xl" | "gaming";

// Common Props Interface
export interface BaseGlassmorphicProps {
  variant?: GlassVariant;
  blur?: GlassBlur;
  opacity?: GlassOpacity;
  border?: GlassBorder;
  shadow?: GlassShadow;
  animated?: boolean;
  className?: string;
}

// Gaming Component Configurations
export const GameGenComponentConfigs = {
  // Main App Components
  mainNav: {
    card: GameGenCardPresets.floatingPanel,
    button: GameGenButtonPresets.ghost,
  },

  // Game Editor Components
  editorSidebar: {
    card: GameGenCardPresets.chatPanel,
    button: GameGenButtonPresets.secondary,
    input: GameGenInputPresets.search,
  },

  gameCanvas: {
    card: GameGenCardPresets.heroCard,
    modal: GameGenModalPresets.gameEditor,
  },

  assetLibrary: {
    card: GameGenCardPresets.gameCard,
    dropdown: GameGenDropdownPresets.contextMenu,
    badge: GameGenBadgePresets.statusBadge,
  },

  // User Interface Components
  userProfile: {
    card: GameGenCardPresets.accentCard,
    button: GameGenButtonPresets.primary,
    badge: GameGenBadgePresets.levelBadge,
    dropdown: GameGenDropdownPresets.userMenu,
  },

  // Notification System
  notifications: {
    alert: GameGenAlertPresets.newFeature,
    badge: GameGenBadgePresets.achievementBadge,
  },

  // Game Components
  gameCard: {
    card: GameGenCardPresets.gameCard,
    button: GameGenButtonPresets.accent,
    badge: GameGenBadgePresets.statusBadge,
  },

  // Modal Configurations
  confirmations: {
    modal: GameGenModalPresets.confirmation,
    button: GameGenButtonPresets.danger,
  },

  settings: {
    modal: GameGenModalPresets.gameSettings,
    input: GameGenInputPresets.login,
    button: GameGenButtonPresets.primary,
  },
};

// CSS Class Utilities
export const glassClasses = {
  // Base glass effects
  base: "backdrop-blur-md backdrop-saturate-150 bg-white/15 dark:bg-black/15 border border-white/20 dark:border-black/20",
  subtle:
    "backdrop-blur-sm backdrop-saturate-120 bg-white/10 dark:bg-black/10 border border-white/10 dark:border-black/10",
  strong:
    "backdrop-blur-lg backdrop-saturate-180 bg-white/25 dark:bg-black/25 border border-white/30 dark:border-black/30",

  // Gaming variants
  gaming:
    "backdrop-blur-md backdrop-saturate-150 bg-gradient-to-br from-purple-500/20 to-purple-700/30 border border-purple-400/40 shadow-lg shadow-purple-500/20",
  accent:
    "backdrop-blur-md backdrop-saturate-150 bg-gradient-to-br from-cyan-500/20 to-purple-600/30 border border-cyan-400/40 shadow-lg shadow-cyan-500/20",

  // Interactive states
  hover:
    "hover:backdrop-blur-lg hover:backdrop-saturate-180 hover:shadow-lg hover:border-white/40 dark:hover:border-black/40 transition-all duration-300",
  focus:
    "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-transparent",

  // Animation classes
  fadeIn: "animate-glass-fade-in",
  slideUp: "animate-glass-slide-up",
  pulse: "animate-glass-pulse",
};

// Design Tokens
export const designTokens = {
  colors: {
    gamePurple: {
      50: "#faf5ff",
      100: "#f3e8ff",
      200: "#e9d5ff",
      300: "#d8b4fe",
      400: "#c084fc",
      500: "#a855f7",
      600: "#9333ea",
      700: "#7c3aed",
      800: "#6b21a8",
      900: "#581c87",
    },
    gameCyan: {
      50: "#ecfeff",
      100: "#cffafe",
      200: "#a5f3fc",
      300: "#67e8f9",
      400: "#22d3ee",
      500: "#06b6d4",
      600: "#0891b2",
      700: "#0e7490",
      800: "#155e75",
      900: "#164e63",
    },
  },
  spacing: {
    glassCard: "1.5rem",
    glassButton: "0.75rem 1.5rem",
    glassInput: "0.75rem 1rem",
  },
  borderRadius: {
    glass: "0.75rem",
    glassLarge: "1rem",
    glassSmall: "0.5rem",
  },
  shadows: {
    glass: "0 4px 6px rgba(0, 0, 0, 0.1)",
    glassLarge: "0 8px 25px rgba(0, 0, 0, 0.15)",
    glow: "0 0 20px rgba(139, 92, 246, 0.4)",
  },
};

// Accessibility Utilities
export const a11yUtils = {
  // ARIA labels for glass components
  glassCard: "Glassmorphic content card",
  glassButton: "Interactive glass button",
  glassModal: "Glassmorphic modal dialog",
  glassAlert: "Important notification",

  // Focus management
  focusRing:
    "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2",

  // Screen reader utilities
  srOnly: "sr-only",

  // Reduced motion support
  reduceMotion: "motion-reduce:transition-none motion-reduce:animate-none",
};

// Performance Optimizations
export const performanceHints = {
  // Use will-change for elements that will be animated
  willChange: "will-change-transform",

  // Promote to compositor layer for smooth animations
  promote: "transform-gpu",

  // Optimize backdrop-filter performance
  backfaceVisibility: "backface-visibility-hidden",
};

// Component Usage Examples (for documentation)
export const usageExamples = {
  basicCard: `
    <GlassmorphicCard variant="gaming" blur="md" animated>
      <h3>Game Title</h3>
      <p>Game description here...</p>
    </GlassmorphicCard>
  `,

  interactiveButton: `
    <GlassmorphicButton 
      variant="gaming" 
      glow 
      animated 
      onClick={handleClick}
    >
      Play Game
    </GlassmorphicButton>
  `,

  searchInput: `
    <GlassmorphicInput 
      {...GameGenInputPresets.search}
      placeholder="Search games..."
      onChange={handleSearch}
    />
  `,

  gameModal: `
    <GlassmorphicModal {...GameGenModalPresets.gameSettings}>
      <ModalContent>
        <ModalHeader>Game Settings</ModalHeader>
        <ModalBody>Settings content...</ModalBody>
        <ModalFooter>Action buttons...</ModalFooter>
      </ModalContent>
    </GlassmorphicModal>
  `,
};
