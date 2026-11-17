"use client";

import { useState, useEffect } from "react";

interface UIState {
  sidebarCollapsed: boolean;
  activeDrawer: string | null;
  activeModal: string | null;
  theme: "dark" | "light" | "system";
}

let state: UIState = {
  sidebarCollapsed: false,
  activeDrawer: null,
  activeModal: null,
  theme: "dark",
};

const listeners = new Set<(s: UIState) => void>();

function notify() {
  listeners.forEach((listener) => listener(state));
}

export const uiStore = {
  getState: () => state,
  setSidebarCollapsed: (collapsed: boolean) => {
    state = { ...state, sidebarCollapsed: collapsed };
    notify();
  },
  toggleSidebar: () => {
    state = { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    notify();
  },
  openDrawer: (drawerId: string) => {
    state = { ...state, activeDrawer: drawerId };
    notify();
  },
  closeDrawer: () => {
    state = { ...state, activeDrawer: null };
    notify();
  },
  openModal: (modalId: string) => {
    state = { ...state, activeModal: modalId };
    notify();
  },
  closeModal: () => {
    state = { ...state, activeModal: null };
    notify();
  },
  setTheme: (theme: "dark" | "light" | "system") => {
    state = { ...state, theme };
    notify();
  },
};

export function useUIStore() {
  const [snapshot, setSnapshot] = useState<UIState>(state);

  useEffect(() => {
    const listener = (nextState: UIState) => setSnapshot(nextState);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    ...snapshot,
    setSidebarCollapsed: uiStore.setSidebarCollapsed,
    toggleSidebar: uiStore.toggleSidebar,
    openDrawer: uiStore.openDrawer,
    closeDrawer: uiStore.closeDrawer,
    openModal: uiStore.openModal,
    closeModal: uiStore.closeModal,
    setTheme: uiStore.setTheme,
  };
}
