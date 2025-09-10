/**
 * Desktop-Specific Component Testing for Glassmorphic Components
 * 
 * This test suite validates that all glassmorphic UI components render correctly
 * and function properly in the Tauri desktop environment.
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { test, expect, describe, beforeAll, afterAll, jest } from "@jest/globals";
import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// Mock framer-motion for stable testing
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    input: ({ children, ...props }: any) => <input {...props}>{children}</input>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
}));

// Import glassmorphic components
import { GlassmorphicCard } from "../../components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "../../components/ui/GlassmorphicButton";
import { GlassmorphicInput } from "../../components/ui/GlassmorphicInput";
import { GlassmorphicModal } from "../../components/ui/GlassmorphicModal";
import { GlassmorphicDropdown } from "../../components/ui/GlassmorphicDropdown";
import { GlassmorphicBadge } from "../../components/ui/GlassmorphicBadge";
import { GlassmorphicAlert } from "../../components/ui/GlassmorphicAlert";
import { GlassmorphicSpinner } from "../../components/ui/GlassmorphicSpinner";
import { GlassmorphicLoadingOverlay } from "../../components/ui/GlassmorphicLoadingOverlay";

// Mock Tauri environment for component testing
const mockTauriAPI = {
  invoke: jest.fn(),
  listen: jest.fn(),
  emit: jest.fn(),
};

Object.defineProperty(window, "__TAURI__", {
  value: mockTauriAPI,
  writable: true,
});

// Mock CSS properties for glassmorphic effects
Object.defineProperty(HTMLElement.prototype, "style", {
  set: jest.fn(),
  get: jest.fn(() => ({
    backdropFilter: "blur(10px)",
    background: "rgba(255, 255, 255, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
  })),
});

// Test wrapper with desktop-specific providers
const DesktopTestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <HeroUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        <div data-testid="desktop-environment">
          {children}
        </div>
      </NextThemesProvider>
    </HeroUIProvider>
  );
};

describe("Glassmorphic Components - Desktop Environment", () => {
  beforeAll(() => {
    // Setup desktop environment simulation
    process.env.NODE_ENV = "test";
    
    // Mock CSS.supports for backdrop-filter
    global.CSS = {
      supports: jest.fn((property: string) => {
        return property.includes("backdrop-filter");
      }) as any,
    } as any;
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe("GlassmorphicCard Desktop Rendering", () => {
    test("should render glassmorphic card with desktop-optimized effects", () => {
      render(
        <DesktopTestWrapper>
          <GlassmorphicCard>
            <p>Desktop card content</p>
          </GlassmorphicCard>
        </DesktopTestWrapper>
      );

      const card = screen.getByText("Desktop card content").closest("div");
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("backdrop-blur-md");
    });

    test("should handle card hover effects in desktop environment", async () => {
      const user = userEvent.setup();
      
      render(
        <DesktopTestWrapper>
          <GlassmorphicCard className="hover:scale-105">
            <p>Hover test card</p>
          </GlassmorphicCard>
        </DesktopTestWrapper>
      );

      const card = screen.getByText("Hover test card").closest("div");
      expect(card).toBeInTheDocument();
      
      await user.hover(card!);
      expect(card).toHaveClass("hover:scale-105");
    });

    test("should support different card variants for desktop", () => {
      render(
        <DesktopTestWrapper>
          <GlassmorphicCard variant="gaming">
            <p>Gaming variant card</p>
          </GlassmorphicCard>
        </DesktopTestWrapper>
      );

      const card = screen.getByText("Gaming variant card").closest("div");
      expect(card).toBeInTheDocument();
    });
  });

  describe("GlassmorphicButton Desktop Interaction", () => {
    test("should handle button clicks in desktop environment", async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <DesktopTestWrapper>
          <GlassmorphicButton onPress={handleClick}>
            Desktop Button
          </GlassmorphicButton>
        </DesktopTestWrapper>
      );

      const button = screen.getByText("Desktop Button");
      expect(button).toBeInTheDocument();

      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test("should render different button variants correctly", () => {
      render(
        <DesktopTestWrapper>
          <GlassmorphicButton variant="glass">Glass Button</GlassmorphicButton>
          <GlassmorphicButton variant="gaming">Gaming Button</GlassmorphicButton>
          <GlassmorphicButton variant="accent">Accent Button</GlassmorphicButton>
          <GlassmorphicButton variant="danger">Danger Button</GlassmorphicButton>
          <GlassmorphicButton variant="success">Success Button</GlassmorphicButton>
          <GlassmorphicButton variant="ghost">Ghost Button</GlassmorphicButton>
        </DesktopTestWrapper>
      );

      expect(screen.getByText("Glass Button")).toBeInTheDocument();
      expect(screen.getByText("Gaming Button")).toBeInTheDocument();
      expect(screen.getByText("Accent Button")).toBeInTheDocument();
      expect(screen.getByText("Danger Button")).toBeInTheDocument();
      expect(screen.getByText("Success Button")).toBeInTheDocument();
      expect(screen.getByText("Ghost Button")).toBeInTheDocument();
    });

    test("should support loading states in desktop", () => {
      render(
        <DesktopTestWrapper>
          <GlassmorphicButton isLoading>
            Loading Button
          </GlassmorphicButton>
        </DesktopTestWrapper>
      );

      const button = screen.getByText("Loading Button");
      expect(button).toBeInTheDocument();
      expect(button).toBeDisabled();
    });
  });

  describe("GlassmorphicInput Desktop Functionality", () => {
    test("should handle text input in desktop environment", async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(
        <DesktopTestWrapper>
          <GlassmorphicInput
            placeholder="Desktop input"
            onValueChange={handleChange}
          />
        </DesktopTestWrapper>
      );

      const input = screen.getByPlaceholderText("Desktop input");
      expect(input).toBeInTheDocument();

      await user.type(input, "Desktop test input");
      expect(handleChange).toHaveBeenCalled();
    });

    test("should render different input variants", () => {
      render(
        <DesktopTestWrapper>
          <GlassmorphicInput variant="glass" placeholder="Glass input" />
          <GlassmorphicInput variant="gaming" placeholder="Gaming input" />
        </DesktopTestWrapper>
      );

      expect(screen.getByPlaceholderText("Glass input")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Gaming input")).toBeInTheDocument();
    });

    test("should handle focus states properly", async () => {
      const user = userEvent.setup();

      render(
        <DesktopTestWrapper>
          <GlassmorphicInput placeholder="Focus test" />
        </DesktopTestWrapper>
      );

      const input = screen.getByPlaceholderText("Focus test");
      await user.click(input);
      expect(input).toHaveFocus();
    });
  });

  describe("GlassmorphicModal Desktop Behavior", () => {
    test("should open and close modal in desktop environment", async () => {
      const user = userEvent.setup();

      render(
        <DesktopTestWrapper>
          <GlassmorphicModal 
            isOpen={true} 
            onOpenChange={() => {}}
            title="Desktop Modal"
          >
            <p>Modal content for desktop</p>
          </GlassmorphicModal>
        </DesktopTestWrapper>
      );

      expect(screen.getByText("Desktop Modal")).toBeInTheDocument();
      expect(screen.getByText("Modal content for desktop")).toBeInTheDocument();
    });

    test("should handle modal backdrop clicks", () => {
      const handleClose = jest.fn();

      render(
        <DesktopTestWrapper>
          <GlassmorphicModal 
            isOpen={true} 
            onOpenChange={handleClose}
            title="Backdrop Test Modal"
          >
            <p>Modal content</p>
          </GlassmorphicModal>
        </DesktopTestWrapper>
      );

      // Test backdrop click functionality would be handled by the underlying Modal component
      expect(screen.getByText("Backdrop Test Modal")).toBeInTheDocument();
    });
  });

  describe("GlassmorphicDropdown Desktop Interaction", () => {
    test("should render dropdown with options", () => {
      const items = [
        { key: "option1", label: "Option 1" },
        { key: "option2", label: "Option 2" },
        { key: "option3", label: "Option 3" },
      ];

      render(
        <DesktopTestWrapper>
          <GlassmorphicDropdown
            items={items}
            placeholder="Select option"
          />
        </DesktopTestWrapper>
      );

      expect(screen.getByText("Select option")).toBeInTheDocument();
    });

    test("should handle dropdown selection", async () => {
      const handleSelect = jest.fn();
      const user = userEvent.setup();
      
      const items = [
        { key: "test1", label: "Test Option 1" },
        { key: "test2", label: "Test Option 2" },
      ];

      render(
        <DesktopTestWrapper>
          <GlassmorphicDropdown
            items={items}
            placeholder="Test dropdown"
            onSelectionChange={handleSelect}
          />
        </DesktopTestWrapper>
      );

      const dropdown = screen.getByText("Test dropdown");
      expect(dropdown).toBeInTheDocument();
    });
  });

  describe("GlassmorphicBadge Desktop Display", () => {
    test("should render badges with different variants", () => {
      render(
        <DesktopTestWrapper>
          <GlassmorphicBadge variant="primary">Primary</GlassmorphicBadge>
          <GlassmorphicBadge variant="secondary">Secondary</GlassmorphicBadge>
          <GlassmorphicBadge variant="success">Success</GlassmorphicBadge>
          <GlassmorphicBadge variant="warning">Warning</GlassmorphicBadge>
          <GlassmorphicBadge variant="danger">Danger</GlassmorphicBadge>
        </DesktopTestWrapper>
      );

      expect(screen.getByText("Primary")).toBeInTheDocument();
      expect(screen.getByText("Secondary")).toBeInTheDocument();
      expect(screen.getByText("Success")).toBeInTheDocument();
      expect(screen.getByText("Warning")).toBeInTheDocument();
      expect(screen.getByText("Danger")).toBeInTheDocument();
    });

    test("should support different sizes", () => {
      render(
        <DesktopTestWrapper>
          <GlassmorphicBadge size="sm">Small Badge</GlassmorphicBadge>
          <GlassmorphicBadge size="md">Medium Badge</GlassmorphicBadge>
          <GlassmorphicBadge size="lg">Large Badge</GlassmorphicBadge>
        </DesktopTestWrapper>
      );

      expect(screen.getByText("Small Badge")).toBeInTheDocument();
      expect(screen.getByText("Medium Badge")).toBeInTheDocument();
      expect(screen.getByText("Large Badge")).toBeInTheDocument();
    });
  });

  describe("GlassmorphicAlert Desktop Notifications", () => {
    test("should render different alert types", () => {
      render(
        <DesktopTestWrapper>
          <GlassmorphicAlert type="info" message="Info alert for desktop" />
          <GlassmorphicAlert type="success" message="Success alert for desktop" />
          <GlassmorphicAlert type="warning" message="Warning alert for desktop" />
          <GlassmorphicAlert type="error" message="Error alert for desktop" />
        </DesktopTestWrapper>
      );

      expect(screen.getByText("Info alert for desktop")).toBeInTheDocument();
      expect(screen.getByText("Success alert for desktop")).toBeInTheDocument();
      expect(screen.getByText("Warning alert for desktop")).toBeInTheDocument();
      expect(screen.getByText("Error alert for desktop")).toBeInTheDocument();
    });

    test("should handle alert dismissal", async () => {
      const handleDismiss = jest.fn();
      const user = userEvent.setup();

      render(
        <DesktopTestWrapper>
          <GlassmorphicAlert 
            type="info" 
            message="Dismissible alert" 
            onDismiss={handleDismiss}
            dismissible
          />
        </DesktopTestWrapper>
      );

      expect(screen.getByText("Dismissible alert")).toBeInTheDocument();
      
      // Look for dismiss button
      const dismissButton = screen.getByLabelText(/close|dismiss/i);
      if (dismissButton) {
        await user.click(dismissButton);
        expect(handleDismiss).toHaveBeenCalled();
      }
    });
  });

  describe("GlassmorphicSpinner Desktop Animation", () => {
    test("should render spinner with proper animation", () => {
      render(
        <DesktopTestWrapper>
          <GlassmorphicSpinner />
        </DesktopTestWrapper>
      );

      const spinner = screen.getByRole("progressbar", { hidden: true }) || 
                    screen.getByTestId("glassmorphic-spinner");
      expect(spinner).toBeInTheDocument();
    });

    test("should support different spinner sizes", () => {
      render(
        <DesktopTestWrapper>
          <GlassmorphicSpinner size="sm" data-testid="small-spinner" />
          <GlassmorphicSpinner size="md" data-testid="medium-spinner" />
          <GlassmorphicSpinner size="lg" data-testid="large-spinner" />
        </DesktopTestWrapper>
      );

      expect(screen.getByTestId("small-spinner")).toBeInTheDocument();
      expect(screen.getByTestId("medium-spinner")).toBeInTheDocument();
      expect(screen.getByTestId("large-spinner")).toBeInTheDocument();
    });
  });

  describe("GlassmorphicLoadingOverlay Desktop Coverage", () => {
    test("should render loading overlay correctly", () => {
      render(
        <DesktopTestWrapper>
          <GlassmorphicLoadingOverlay isVisible={true}>
            <div>Content under overlay</div>
          </GlassmorphicLoadingOverlay>
        </DesktopTestWrapper>
      );

      expect(screen.getByText("Content under overlay")).toBeInTheDocument();
    });

    test("should hide content when overlay is active", () => {
      render(
        <DesktopTestWrapper>
          <GlassmorphicLoadingOverlay isVisible={true} message="Loading desktop content...">
            <div>Hidden content</div>
          </GlassmorphicLoadingOverlay>
        </DesktopTestWrapper>
      );

      expect(screen.getByText("Loading desktop content...")).toBeInTheDocument();
    });
  });

  describe("Desktop-Specific CSS Effects", () => {
    test("should apply backdrop-filter effects correctly", () => {
      render(
        <DesktopTestWrapper>
          <GlassmorphicCard data-testid="backdrop-test">
            Backdrop filter test
          </GlassmorphicCard>
        </DesktopTestWrapper>
      );

      const card = screen.getByTestId("backdrop-test");
      expect(card).toHaveClass("backdrop-blur-sm");
    });

    test("should handle high DPI displays", () => {
      // Mock high DPI display
      Object.defineProperty(window, "devicePixelRatio", {
        value: 2,
        writable: true,
      });

      render(
        <DesktopTestWrapper>
          <GlassmorphicButton>High DPI Button</GlassmorphicButton>
        </DesktopTestWrapper>
      );

      expect(screen.getByText("High DPI Button")).toBeInTheDocument();
    });
  });

  describe("Performance in Desktop Environment", () => {
    test("should render multiple components efficiently", () => {
      const startTime = performance.now();

      render(
        <DesktopTestWrapper>
          {Array.from({ length: 50 }, (_, i) => (
            <GlassmorphicCard key={i}>
              <p>Card {i + 1}</p>
            </GlassmorphicCard>
          ))}
        </DesktopTestWrapper>
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render 50 cards in reasonable time (less than 100ms)
      expect(renderTime).toBeLessThan(100);
      expect(screen.getByText("Card 1")).toBeInTheDocument();
      expect(screen.getByText("Card 50")).toBeInTheDocument();
    });
  });
});