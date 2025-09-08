import React from "react";
import { Spinner } from "@heroui/spinner";

import { cn } from "@/lib/utils";

export interface GlassmorphicLoadingOverlayProps {
  isVisible: boolean;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const GlassmorphicLoadingOverlay: React.FC<
  GlassmorphicLoadingOverlayProps
> = ({ isVisible, label = "Loading...", size = "lg", className }) => {
  if (!isVisible) return null;

  return (
    <div
      aria-label={label}
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-background/20 backdrop-blur-sm",
        className,
      )}
      role="dialog"
    >
      <div className="bg-background/60 backdrop-blur-xl border border-primary/20 rounded-2xl p-8 shadow-2xl shadow-primary/10">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl" />
            <Spinner
              aria-hidden="true"
              className="relative z-10"
              color="primary"
              size={size}
            />
          </div>
          <p className="text-default-700 font-medium text-center">{label}</p>
        </div>
      </div>
    </div>
  );
};

export default GlassmorphicLoadingOverlay;
