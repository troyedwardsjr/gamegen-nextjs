"use client";

import React, { Suspense } from "react";

import { GameCreatorLayout } from "./components/GameCreatorLayout";
import { GameCreatorErrorBoundary } from "./components/GameCreatorErrorBoundary";
import { GameCreatorLoading } from "./components/GameCreatorLoading";
import { GameProvider } from "@/contexts/GameContext";

export default function GameCreatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-purple-900/40 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_#3b0764_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_#312e81_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_#1e1b4b_0%,_transparent_50%)]" />

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl animate-pulse" />
      <div className="absolute top-3/4 left-3/4 w-20 h-20 bg-rose-500/10 rounded-full blur-2xl animate-pulse" />

      {/* Main Layout with Error Boundary */}
      <div className="relative z-10 h-screen">
        <GameCreatorErrorBoundary>
          <Suspense fallback={<GameCreatorLoading />}>
            <GameProvider>
              <GameCreatorLayout />
            </GameProvider>
          </Suspense>
        </GameCreatorErrorBoundary>
      </div>
    </div>
  );
}
