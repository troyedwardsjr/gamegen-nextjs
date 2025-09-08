"use client";

import React from "react";

import { GlassmorphicCard } from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicInput } from "@/components/ui/GlassmorphicInput";
import { GlassmorphicBadge } from "@/components/ui/GlassmorphicBadge";
import { GlassmorphicAlert } from "@/components/ui/GlassmorphicAlert";
import {
  GlassmorphicModal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@/components/ui/GlassmorphicModal";
import {
  GlassmorphicDropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@/components/ui/GlassmorphicDropdown";

export default function GlassmorphicTestPage() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          GameGen Glassmorphic Design System
        </h1>

        {/* Cards Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassmorphicCard variant="default">
              <h3 className="text-xl font-semibold mb-2">Default Card</h3>
              <p>Basic glassmorphic card with subtle effects</p>
            </GlassmorphicCard>

            <GlassmorphicCard pattern variant="gaming">
              <h3 className="text-xl font-semibold mb-2">Gaming Card</h3>
              <p>Enhanced card with gaming aesthetics</p>
            </GlassmorphicCard>

            <GlassmorphicCard variant="gradient">
              <h3 className="text-xl font-semibold mb-2">Gradient Card</h3>
              <p>Card with gradient background</p>
            </GlassmorphicCard>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <GlassmorphicButton variant="glass">
              Glass Button
            </GlassmorphicButton>
            <GlassmorphicButton glow variant="gaming">
              Gaming Button
            </GlassmorphicButton>
            <GlassmorphicButton variant="accent">
              Accent Button
            </GlassmorphicButton>
            <GlassmorphicButton variant="danger">
              Danger Button
            </GlassmorphicButton>
            <GlassmorphicButton variant="success">
              Success Button
            </GlassmorphicButton>
          </div>
        </section>

        {/* Inputs Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GlassmorphicInput
              label="Default Input"
              placeholder="Enter text..."
              variant="default"
            />
            <GlassmorphicInput
              label="Gaming Input"
              placeholder="Player name..."
              variant="gaming"
            />
          </div>
        </section>

        {/* Badges Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Badges</h2>
          <div className="flex flex-wrap gap-4">
            <GlassmorphicBadge variant="default">Default</GlassmorphicBadge>
            <GlassmorphicBadge glow variant="gaming">
              Gaming
            </GlassmorphicBadge>
            <GlassmorphicBadge variant="success">Success</GlassmorphicBadge>
            <GlassmorphicBadge variant="warning">Warning</GlassmorphicBadge>
            <GlassmorphicBadge variant="danger">Danger</GlassmorphicBadge>
          </div>
        </section>

        {/* Alerts Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Alerts</h2>
          <div className="space-y-4">
            <GlassmorphicAlert
              description="Your game has been saved successfully!"
              title="Success Alert"
              variant="success"
            />
            <GlassmorphicAlert
              description="New achievement unlocked!"
              title="Gaming Alert"
              variant="gaming"
            />
          </div>
        </section>

        {/* Modal Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Modal</h2>
          <div className="flex gap-4">
            <GlassmorphicButton glow variant="gaming" onPress={onOpen}>
              Open Gaming Modal
            </GlassmorphicButton>
          </div>
        </section>

        {/* Dropdown Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Dropdown</h2>
          <div className="flex gap-4">
            <GlassmorphicDropdown variant="gaming">
              <DropdownTrigger>
                <GlassmorphicButton variant="gaming">
                  Gaming Menu
                </GlassmorphicButton>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key="new">New Game</DropdownItem>
                <DropdownItem key="load">Load Game</DropdownItem>
                <DropdownItem key="settings">Settings</DropdownItem>
                <DropdownItem key="quit" className="text-danger" color="danger">
                  Quit Game
                </DropdownItem>
              </DropdownMenu>
            </GlassmorphicDropdown>
          </div>
        </section>
      </div>

      {/* Modal */}
      <GlassmorphicModal
        gamePattern
        isOpen={isOpen}
        size="md"
        variant="gaming"
        onClose={onClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Game Settings
          </ModalHeader>
          <ModalBody>
            <p>Configure your game preferences:</p>
            <GlassmorphicInput
              label="Player Name"
              placeholder="Enter your name"
              variant="gaming"
            />
            <div className="flex gap-2 flex-wrap">
              <GlassmorphicBadge variant="gaming">Level 25</GlassmorphicBadge>
              <GlassmorphicBadge variant="success">Online</GlassmorphicBadge>
            </div>
          </ModalBody>
          <ModalFooter>
            <GlassmorphicButton variant="glass" onPress={onClose}>
              Cancel
            </GlassmorphicButton>
            <GlassmorphicButton glow variant="gaming" onPress={onClose}>
              Save Settings
            </GlassmorphicButton>
          </ModalFooter>
        </ModalContent>
      </GlassmorphicModal>
    </div>
  );
}
