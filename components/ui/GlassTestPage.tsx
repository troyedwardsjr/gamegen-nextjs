"use client";

/**
 * Test page for GameGen Glassmorphic Components
 * This component demonstrates all the glassmorphic UI components
 */

import React from "react";

import {
  GlassmorphicCard,
  GlassmorphicButton,
  GlassmorphicInput,
  GlassmorphicModal,
  GlassmorphicDropdown,
  GlassmorphicBadge,
  GlassmorphicAlert,
  GameStatusBadge,
  GameNotification,
  useDisclosure,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "./index";

export function GlassTestPage() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [showAlert, setShowAlert] = React.useState(false);
  const [showNotification, setShowNotification] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black p-8 space-y-8">
      {/* Header */}
      <GlassmorphicCard
        pattern
        blur="xl"
        className="text-center"
        variant="gaming"
      >
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          GameGen Glassmorphic Components
        </h1>
        <p className="text-purple-200">
          A comprehensive collection of glassmorphic UI components for gaming
          applications
        </p>
      </GlassmorphicCard>

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassmorphicCard variant="default">
          <h3 className="text-lg font-semibold mb-2">Default Card</h3>
          <p className="text-sm opacity-80">
            Basic glassmorphic card with subtle effects
          </p>
        </GlassmorphicCard>

        <GlassmorphicCard blur="lg" shadow="gaming" variant="gaming">
          <h3 className="text-lg font-semibold mb-2 text-purple-200">
            Gaming Card
          </h3>
          <p className="text-sm text-purple-300">
            Enhanced card with gaming aesthetics
          </p>
        </GlassmorphicCard>

        <GlassmorphicCard hover variant="accent-cyan">
          <h3 className="text-lg font-semibold mb-2 text-cyan-200">
            Accent Card
          </h3>
          <p className="text-sm text-cyan-300">
            Cyan accent variant with hover effects
          </p>
        </GlassmorphicCard>
      </div>

      {/* Buttons Section */}
      <GlassmorphicCard variant="subtle">
        <h2 className="text-2xl font-semibold mb-4">Button Variants</h2>
        <div className="flex flex-wrap gap-4">
          <GlassmorphicButton glow variant="gaming">
            Gaming Button
          </GlassmorphicButton>

          <GlassmorphicButton glow variant="accent">
            Accent Button
          </GlassmorphicButton>

          <GlassmorphicButton glow variant="success">
            Success Button
          </GlassmorphicButton>

          <GlassmorphicButton glow variant="danger">
            Danger Button
          </GlassmorphicButton>

          <GlassmorphicButton variant="glass-ghost">
            Ghost Button
          </GlassmorphicButton>
        </div>
      </GlassmorphicCard>

      {/* Input Section */}
      <GlassmorphicCard variant="default">
        <h2 className="text-2xl font-semibold mb-4">Input Components</h2>
        <div className="space-y-4">
          <GlassmorphicInput
            glow
            placeholder="Gaming themed input..."
            variant="gaming"
          />
          <GlassmorphicInput
            placeholder="Accent themed input..."
            variant="accent"
          />
          <GlassmorphicInput placeholder="Subtle input..." variant="subtle" />
        </div>
      </GlassmorphicCard>

      {/* Interactive Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Modal Test */}
        <GlassmorphicCard variant="default">
          <h3 className="text-xl font-semibold mb-4">Modal Component</h3>
          <GlassmorphicButton glow variant="gaming" onPress={onOpen}>
            Open Gaming Modal
          </GlassmorphicButton>
        </GlassmorphicCard>

        {/* Dropdown Test */}
        <GlassmorphicCard variant="default">
          <h3 className="text-xl font-semibold mb-4">Dropdown Component</h3>
          <GlassmorphicDropdown animated variant="gaming">
            <DropdownTrigger>
              <GlassmorphicButton glow variant="accent">
                Gaming Menu
              </GlassmorphicButton>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem key="play">Play Game</DropdownItem>
              <DropdownItem key="edit">Edit Game</DropdownItem>
              <DropdownItem key="share">Share Game</DropdownItem>
              <DropdownItem key="delete" className="text-danger">
                Delete Game
              </DropdownItem>
            </DropdownMenu>
          </GlassmorphicDropdown>
        </GlassmorphicCard>
      </div>

      {/* Badges Section */}
      <GlassmorphicCard variant="subtle">
        <h2 className="text-2xl font-semibold mb-4">Badge Components</h2>
        <div className="flex flex-wrap gap-4">
          <GlassmorphicBadge glow variant="gaming">
            Level 42
          </GlassmorphicBadge>

          <GlassmorphicBadge glow variant="success">
            Online
          </GlassmorphicBadge>

          <GameStatusBadge status="playing" />
          <GameStatusBadge status="streaming" />
          <GameStatusBadge status="creating" />
          <GameStatusBadge status="idle" />
        </div>
      </GlassmorphicCard>

      {/* Alerts Section */}
      <div className="space-y-4">
        <GlassmorphicButton
          variant="gaming"
          onPress={() => setShowAlert(!showAlert)}
        >
          Toggle Alert
        </GlassmorphicButton>

        <GlassmorphicButton
          variant="accent"
          onPress={() => setShowNotification(!showNotification)}
        >
          Show Game Notification
        </GlassmorphicButton>

        {showAlert && (
          <GlassmorphicAlert
            closable
            message="Your glassmorphic gaming platform is ready. Start creating amazing games with AI assistance."
            title="Welcome to GameGen!"
            variant="gaming"
            onClose={() => setShowAlert(false)}
          />
        )}

        {showNotification && (
          <GameNotification
            message="You've successfully implemented the glassmorphic design system!"
            title="Achievement Unlocked!"
            type="achievement"
            onClose={() => setShowNotification(false)}
          />
        )}
      </div>

      {/* Modal */}
      <GlassmorphicModal
        gamePattern
        blur="2xl"
        isOpen={isOpen}
        variant="gaming"
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-semibold text-purple-200">
              Gaming Modal
            </h2>
          </ModalHeader>
          <ModalBody>
            <p className="text-purple-300">
              This is a gaming-themed glassmorphic modal with backdrop blur and
              beautiful visual effects. Perfect for game settings, dialogs, and
              more.
            </p>
            <GlassmorphicInput
              className="mt-4"
              placeholder="Enter game name..."
              variant="gaming"
            />
          </ModalBody>
          <ModalFooter>
            <GlassmorphicButton
              variant="glass-ghost"
              onPress={() => onOpenChange()}
            >
              Cancel
            </GlassmorphicButton>
            <GlassmorphicButton
              glow
              variant="gaming"
              onPress={() => onOpenChange()}
            >
              Save Game
            </GlassmorphicButton>
          </ModalFooter>
        </ModalContent>
      </GlassmorphicModal>
    </div>
  );
}

export default GlassTestPage;
