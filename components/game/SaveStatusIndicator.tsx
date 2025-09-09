"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassmorphicBadge } from '@/components/ui/GlassmorphicBadge';
import { GlassmorphicButton } from '@/components/ui/GlassmorphicButton';
import { useGame } from '@/contexts/GameContext';
import { formatDistanceToNow } from 'date-fns';

interface SaveStatusIndicatorProps {
  showDetails?: boolean;
  showForceButton?: boolean;
  className?: string;
}

export function SaveStatusIndicator({ 
  showDetails = true, 
  showForceButton = true,
  className 
}: SaveStatusIndicatorProps) {
  const { 
    saveStatus, 
    hasUnsavedChanges, 
    isSaving, 
    lastSaved, 
    error,
    forceSave 
  } = useGame();

  const getStatusConfig = () => {
    if (error) {
      return {
        variant: 'danger' as const,
        icon: '❌',
        label: 'Error',
        description: 'Failed to save'
      };
    }

    switch (saveStatus) {
      case 'saving':
        return {
          variant: 'warning' as const,
          icon: '💾',
          label: 'Saving...',
          description: 'Saving your changes'
        };
      case 'saved':
        return {
          variant: 'gaming' as const,
          icon: '✅',
          label: 'Saved',
          description: lastSaved ? `Saved ${formatDistanceToNow(lastSaved)} ago` : 'Saved'
        };
      case 'conflict':
        return {
          variant: 'warning' as const,
          icon: '⚠️',
          label: 'Conflict',
          description: 'Save conflict needs resolution'
        };
      default:
        if (hasUnsavedChanges) {
          return {
            variant: 'accent' as const,
            icon: '●',
            label: 'Unsaved',
            description: 'You have unsaved changes'
          };
        }
        return {
          variant: 'default' as const,
          icon: '○',
          label: 'Ready',
          description: 'No changes to save'
        };
    }
  };

  const statusConfig = getStatusConfig();

  const handleForceSave = async () => {
    try {
      await forceSave();
    } catch (err) {
      console.error('Force save failed:', err);
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Status Badge */}
      <GlassmorphicBadge
        variant={statusConfig.variant}
        size="sm"
        className="flex items-center space-x-1"
      >
        <motion.span
          animate={isSaving ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 1, repeat: isSaving ? Infinity : 0, ease: "linear" }}
        >
          {statusConfig.icon}
        </motion.span>
        <span>{statusConfig.label}</span>
      </GlassmorphicBadge>

      {/* Details */}
      <AnimatePresence mode="wait">
        {showDetails && (
          <motion.div
            animate={{ opacity: 1 }}
            className="text-xs text-white/60 min-w-0 flex-1"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            key={statusConfig.description}
          >
            {statusConfig.description}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Force Save Button */}
      {showForceButton && hasUnsavedChanges && !isSaving && (
        <GlassmorphicButton
          size="sm"
          variant="glass-ghost"
          onClick={handleForceSave}
          disabled={isSaving}
        >
          Save Now
        </GlassmorphicButton>
      )}
    </div>
  );
}

// Compact version for toolbar
export function CompactSaveStatus() {
  const { saveStatus, hasUnsavedChanges, isSaving, error } = useGame();
  
  const getStatusDot = () => {
    if (error) return { color: 'bg-red-400', pulse: true };
    if (isSaving) return { color: 'bg-yellow-400', pulse: true };
    if (hasUnsavedChanges) return { color: 'bg-orange-400', pulse: false };
    if (saveStatus === 'saved') return { color: 'bg-green-400', pulse: false };
    return { color: 'bg-gray-400', pulse: false };
  };

  const statusDot = getStatusDot();

  return (
    <div 
      className="flex items-center space-x-1"
      title={
        error ? 'Save error' :
        isSaving ? 'Saving...' :
        hasUnsavedChanges ? 'Unsaved changes' :
        'All changes saved'
      }
    >
      <div className={`w-2 h-2 rounded-full ${statusDot.color} ${statusDot.pulse ? 'animate-pulse' : ''}`} />
      <span className="text-xs text-white/60">
        {error ? 'Error' :
         isSaving ? 'Saving...' :
         hasUnsavedChanges ? 'Unsaved' :
         'Saved'}
      </span>
    </div>
  );
}