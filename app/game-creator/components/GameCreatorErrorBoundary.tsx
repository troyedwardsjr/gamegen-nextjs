"use client";

import React from "react";

import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";
import { GlassmorphicButton } from "@/components/ui/GlassmorphicButton";
import { GlassmorphicAlert } from "@/components/ui/GlassmorphicAlert";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class GameCreatorErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "GameCreator Error Boundary caught an error:",
      error,
      errorInfo,
    );

    this.setState({
      error,
      errorInfo,
    });

    // Log to error reporting service
    if (typeof window !== "undefined") {
      // Analytics or error reporting would go here
      console.error("Error boundary triggered:", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleReload = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/20 to-purple-900/40 relative overflow-hidden flex items-center justify-center p-4">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_#3b0764_0%,_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_#312e81_0%,_transparent_50%)]" />

          <GlassmorphicCard
            {...GameGenCardPresets.modalCard}
            className="max-w-2xl w-full relative z-10"
          >
            <div className="p-8 text-center">
              {/* Error Icon */}
              <div className="text-6xl mb-6">⚠️</div>

              <h1 className="text-2xl font-bold text-white mb-4">
                Oops! Something went wrong
              </h1>

              <p className="text-white/70 mb-6">
                The GameGen creator encountered an unexpected error. Don't worry
                - your work is automatically saved.
              </p>

              {/* Error Details (Development) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="mb-6 text-left">
                  <GlassmorphicAlert
                    message={this.state.error.message}
                    title="Error Details"
                    variant="error"
                  />

                  {this.state.error.stack && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-white/60 hover:text-white/80">
                        View Stack Trace
                      </summary>
                      <pre className="mt-2 p-4 bg-black/20 rounded-lg text-xs text-white/60 overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <GlassmorphicButton
                  className="flex items-center space-x-2"
                  variant="gaming"
                  onClick={this.handleReset}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  <span>Try Again</span>
                </GlassmorphicButton>

                <GlassmorphicButton
                  className="flex items-center space-x-2"
                  variant="glass"
                  onClick={this.handleReload}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  <span>Reload Page</span>
                </GlassmorphicButton>

                <GlassmorphicButton
                  className="flex items-center space-x-2"
                  variant="glass-ghost"
                  onClick={() => (window.location.href = "/")}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                  <span>Go Home</span>
                </GlassmorphicButton>
              </div>

              {/* Help Text */}
              <div className="mt-8 text-sm text-white/50">
                <p>If this error persists, please contact our support team.</p>
                <p className="mt-1">
                  Error ID:{" "}
                  <code className="bg-white/10 px-2 py-1 rounded font-mono text-xs">
                    {Date.now().toString(36)}
                  </code>
                </p>
              </div>
            </div>
          </GlassmorphicCard>
        </div>
      );
    }

    return this.props.children;
  }
}
