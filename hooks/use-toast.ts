"use client";

import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

// Simple in-memory toast store (could be replaced with a more sophisticated state management solution)
let toastStore: ToastStore = {
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
};

const listeners = new Set<() => void>();

const updateStore = (newStore: ToastStore) => {
  toastStore = newStore;
  listeners.forEach((listener) => listener());
};

export function useToast() {
  const [, forceUpdate] = useState({});

  const rerender = useCallback(() => {
    forceUpdate({});
  }, []);

  // Subscribe to store changes
  if (!listeners.has(rerender)) {
    listeners.add(rerender);
  }

  const toast = useCallback(
    ({
      title,
      description,
      variant = "default",
      duration = 5000,
    }: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substring(2, 15);
      const newToast: Toast = { id, title, description, variant, duration };

      updateStore({
        ...toastStore,
        toasts: [...toastStore.toasts, newToast],
        addToast: toastStore.addToast,
        removeToast: toastStore.removeToast,
      });

      // Auto-remove toast after duration
      if (duration > 0) {
        setTimeout(() => {
          updateStore({
            ...toastStore,
            toasts: toastStore.toasts.filter((t) => t.id !== id),
            addToast: toastStore.addToast,
            removeToast: toastStore.removeToast,
          });
        }, duration);
      }
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    updateStore({
      ...toastStore,
      toasts: toastStore.toasts.filter((t) => t.id !== id),
      addToast: toastStore.addToast,
      removeToast: toastStore.removeToast,
    });
  }, []);

  return {
    toast,
    dismiss,
    toasts: toastStore.toasts,
  };
}
