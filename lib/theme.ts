/**
 * GameGen Theme Configuration
 * Comprehensive theme system for glassmorphic gaming UI
 */

export type GameGenTheme = "light" | "dark" | "gaming-dark" | "gaming-neon";

export interface ThemeColors {
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    DEFAULT: string;
    foreground: string;
  };
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    DEFAULT: string;
    foreground: string;
  };
  accent: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    DEFAULT: string;
    foreground: string;
  };
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
}

export interface GlassEffects {
  blur: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
  };
  opacity: {
    light: string;
    medium: string;
    strong: string;
  };
  saturation: {
    low: string;
    medium: string;
    high: string;
  };
  glow: {
    subtle: string;
    medium: string;
    strong: string;
  };
}

export interface GameGenThemeConfig {
  name: string;
  displayName: string;
  colors: ThemeColors;
  glass: GlassEffects;
  animations: {
    duration: {
      fast: string;
      medium: string;
      slow: string;
    };
    easing: {
      default: string;
      bounce: string;
      elastic: string;
    };
  };
}

// Gaming Purple Theme (Default Dark)
export const gamingDarkTheme: GameGenThemeConfig = {
  name: "gaming-dark",
  displayName: "Gaming Dark",
  colors: {
    primary: {
      50: "#faf5ff",
      100: "#f3e8ff",
      200: "#e9d5ff",
      300: "#d8b4fe",
      400: "#c084fc",
      500: "#a855f7", // Primary purple
      600: "#9333ea",
      700: "#7c3aed",
      800: "#6b21a8",
      900: "#581c87",
      DEFAULT: "#a855f7",
      foreground: "#ffffff",
    },
    secondary: {
      50: "#ecfeff",
      100: "#cffafe",
      200: "#a5f3fc",
      300: "#67e8f9",
      400: "#22d3ee",
      500: "#06b6d4", // Cyan accent
      600: "#0891b2",
      700: "#0e7490",
      800: "#155e75",
      900: "#164e63",
      DEFAULT: "#06b6d4",
      foreground: "#ffffff",
    },
    accent: {
      50: "#fdf4ff",
      100: "#fae8ff",
      200: "#f5d0fe",
      300: "#f0abfc",
      400: "#e879f9",
      500: "#d946ef", // Magenta
      600: "#c026d3",
      700: "#a21caf",
      800: "#86198f",
      900: "#701a75",
      DEFAULT: "#d946ef",
      foreground: "#ffffff",
    },
    background: "#0f0f23", // Deep space blue
    foreground: "#e2e8f0",
    card: "rgba(15, 15, 35, 0.6)",
    cardForeground: "#f1f5f9",
    popover: "rgba(15, 15, 35, 0.9)",
    popoverForeground: "#f1f5f9",
    muted: "rgba(100, 116, 139, 0.3)",
    mutedForeground: "#94a3b8",
    border: "rgba(168, 85, 247, 0.2)",
    input: "rgba(168, 85, 247, 0.1)",
    ring: "rgba(168, 85, 247, 0.5)",
  },
  glass: {
    blur: {
      xs: "2px",
      sm: "4px",
      md: "8px",
      lg: "12px",
      xl: "16px",
      "2xl": "24px",
      "3xl": "32px",
    },
    opacity: {
      light: "0.1",
      medium: "0.15",
      strong: "0.25",
    },
    saturation: {
      low: "120%",
      medium: "150%",
      high: "180%",
    },
    glow: {
      subtle: "0 0 10px rgba(168, 85, 247, 0.2)",
      medium: "0 0 20px rgba(168, 85, 247, 0.4)",
      strong: "0 0 30px rgba(168, 85, 247, 0.6)",
    },
  },
  animations: {
    duration: {
      fast: "0.15s",
      medium: "0.3s",
      slow: "0.5s",
    },
    easing: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      elastic: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    },
  },
};

// Gaming Neon Theme
export const gamingNeonTheme: GameGenThemeConfig = {
  name: "gaming-neon",
  displayName: "Gaming Neon",
  colors: {
    primary: {
      50: "#ecfdf5",
      100: "#d1fae5",
      200: "#a7f3d0",
      300: "#6ee7b7",
      400: "#34d399",
      500: "#10b981", // Neon green
      600: "#059669",
      700: "#047857",
      800: "#065f46",
      900: "#064e3b",
      DEFAULT: "#10b981",
      foreground: "#000000",
    },
    secondary: {
      50: "#fef7ff",
      100: "#fce7ff",
      200: "#f8ccff",
      300: "#f2a2ff",
      400: "#e879ff",
      500: "#d946ef", // Hot pink
      600: "#c026d3",
      700: "#a21caf",
      800: "#86198f",
      900: "#701a75",
      DEFAULT: "#d946ef",
      foreground: "#ffffff",
    },
    accent: {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b", // Electric yellow
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f",
      DEFAULT: "#f59e0b",
      foreground: "#000000",
    },
    background: "#000811", // Deep black-blue
    foreground: "#00ff88",
    card: "rgba(0, 8, 17, 0.8)",
    cardForeground: "#00ff88",
    popover: "rgba(0, 8, 17, 0.95)",
    popoverForeground: "#00ff88",
    muted: "rgba(16, 185, 129, 0.2)",
    mutedForeground: "#10b981",
    border: "rgba(16, 185, 129, 0.3)",
    input: "rgba(16, 185, 129, 0.1)",
    ring: "rgba(16, 185, 129, 0.6)",
  },
  glass: {
    blur: {
      xs: "1px",
      sm: "2px",
      md: "6px",
      lg: "10px",
      xl: "14px",
      "2xl": "20px",
      "3xl": "28px",
    },
    opacity: {
      light: "0.05",
      medium: "0.1",
      strong: "0.2",
    },
    saturation: {
      low: "200%",
      medium: "250%",
      high: "300%",
    },
    glow: {
      subtle: "0 0 15px rgba(16, 185, 129, 0.3)",
      medium: "0 0 25px rgba(16, 185, 129, 0.5)",
      strong: "0 0 40px rgba(16, 185, 129, 0.8)",
    },
  },
  animations: {
    duration: {
      fast: "0.1s",
      medium: "0.2s",
      slow: "0.4s",
    },
    easing: {
      default: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      elastic: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
    },
  },
};

// Light Theme
export const lightTheme: GameGenThemeConfig = {
  name: "light",
  displayName: "Light",
  colors: {
    primary: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
      DEFAULT: "#0f172a",
      foreground: "#ffffff",
    },
    secondary: {
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
      DEFAULT: "#06b6d4",
      foreground: "#ffffff",
    },
    accent: {
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
      DEFAULT: "#a855f7",
      foreground: "#ffffff",
    },
    background: "#ffffff",
    foreground: "#0f172a",
    card: "rgba(255, 255, 255, 0.8)",
    cardForeground: "#0f172a",
    popover: "rgba(255, 255, 255, 0.95)",
    popoverForeground: "#0f172a",
    muted: "rgba(148, 163, 184, 0.3)",
    mutedForeground: "#64748b",
    border: "rgba(168, 85, 247, 0.2)",
    input: "rgba(168, 85, 247, 0.05)",
    ring: "rgba(168, 85, 247, 0.3)",
  },
  glass: {
    blur: {
      xs: "2px",
      sm: "4px",
      md: "8px",
      lg: "12px",
      xl: "16px",
      "2xl": "24px",
      "3xl": "32px",
    },
    opacity: {
      light: "0.1",
      medium: "0.2",
      strong: "0.3",
    },
    saturation: {
      low: "120%",
      medium: "150%",
      high: "180%",
    },
    glow: {
      subtle: "0 0 10px rgba(168, 85, 247, 0.15)",
      medium: "0 0 20px rgba(168, 85, 247, 0.25)",
      strong: "0 0 30px rgba(168, 85, 247, 0.4)",
    },
  },
  animations: {
    duration: {
      fast: "0.15s",
      medium: "0.3s",
      slow: "0.5s",
    },
    easing: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      elastic: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    },
  },
};

// Theme registry
export const themes: Record<GameGenTheme, GameGenThemeConfig> = {
  "gaming-dark": gamingDarkTheme,
  "gaming-neon": gamingNeonTheme,
  light: lightTheme,
  dark: gamingDarkTheme, // Default dark is gaming dark
};

// Theme utilities
export function getTheme(themeName: GameGenTheme): GameGenThemeConfig {
  return themes[themeName] || gamingDarkTheme;
}

export function getThemeColors(themeName: GameGenTheme): ThemeColors {
  return getTheme(themeName).colors;
}

export function getGlassEffects(themeName: GameGenTheme): GlassEffects {
  return getTheme(themeName).glass;
}

// CSS variable generator for themes
export function generateThemeCSS(theme: GameGenThemeConfig): string {
  const { colors, glass, animations } = theme;

  return `
    :root[data-theme="${theme.name}"] {
      /* Colors */
      --primary: ${colors.primary.DEFAULT};
      --primary-foreground: ${colors.primary.foreground};
      --secondary: ${colors.secondary.DEFAULT};
      --secondary-foreground: ${colors.secondary.foreground};
      --accent: ${colors.accent.DEFAULT};
      --accent-foreground: ${colors.accent.foreground};
      --background: ${colors.background};
      --foreground: ${colors.foreground};
      --card: ${colors.card};
      --card-foreground: ${colors.cardForeground};
      --popover: ${colors.popover};
      --popover-foreground: ${colors.popoverForeground};
      --muted: ${colors.muted};
      --muted-foreground: ${colors.mutedForeground};
      --border: ${colors.border};
      --input: ${colors.input};
      --ring: ${colors.ring};
      
      /* Glass Effects */
      --glass-blur-md: blur(${glass.blur.md});
      --glass-opacity-medium: ${glass.opacity.medium};
      --glass-saturation-medium: ${glass.saturation.medium};
      --glass-glow-medium: ${glass.glow.medium};
      
      /* Animations */
      --animation-duration-medium: ${animations.duration.medium};
      --animation-easing-default: ${animations.easing.default};
    }
  `;
}

// Gaming-specific component variants
export const gameComponentVariants = {
  heroCard: {
    theme: "gaming-dark" as GameGenTheme,
    glass: { blur: "xl", opacity: "medium", saturation: "high" },
    effects: ["glow", "pattern", "animated"],
  },
  editorPanel: {
    theme: "gaming-dark" as GameGenTheme,
    glass: { blur: "2xl", opacity: "strong", saturation: "medium" },
    effects: ["subtle-border"],
  },
  chatInterface: {
    theme: "gaming-dark" as GameGenTheme,
    glass: { blur: "md", opacity: "light", saturation: "medium" },
    effects: ["smooth-scroll", "typing-indicators"],
  },
  gamePreview: {
    theme: "gaming-neon" as GameGenTheme,
    glass: { blur: "lg", opacity: "medium", saturation: "high" },
    effects: ["glow", "pulse", "animated"],
  },
};
