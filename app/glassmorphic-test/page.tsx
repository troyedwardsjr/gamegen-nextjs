"use client";

import React from "react";
import {
  GlassmorphicCard,
  GlassmorphicButton,
  GlassmorphicInput,
  GlassmorphicBadge,
  GlassmorphicAlert
} from "@/components/ui";

export default function GlassmorphicTestPage() {
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
            
            <GlassmorphicCard variant="gaming" pattern>
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
            <GlassmorphicButton variant="glass">Glass Button</GlassmorphicButton>
            <GlassmorphicButton variant="gaming" glow>Gaming Button</GlassmorphicButton>
            <GlassmorphicButton variant="accent">Accent Button</GlassmorphicButton>
            <GlassmorphicButton variant="danger">Danger Button</GlassmorphicButton>
            <GlassmorphicButton variant="success">Success Button</GlassmorphicButton>
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
            <GlassmorphicBadge variant="gaming" glow>Gaming</GlassmorphicBadge>
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
              title="Success Alert"
              description="Your game has been saved successfully!"
              variant="success"
            />
            <GlassmorphicAlert
              title="Gaming Alert"
              description="New achievement unlocked!"
              variant="gaming"
            />
          </div>
        </section>
      </div>
    </div>
  );
}