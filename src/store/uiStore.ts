import { create } from "zustand";
import { CONFIG } from "@/constants";

interface Toast {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

interface UIStore {
  // Toast
  toasts: Toast[];
  showToast: (type: Toast["type"], message: string) => void;
  removeToast: (id: number) => void;

  // Modals
  showCreator: boolean;
  showOpenClawGuide: boolean;
  setShowCreator: (show: boolean) => void;
  setShowOpenClawGuide: (show: boolean) => void;

  // Copy state
  copiedId: string | null;
  setCopiedId: (id: string | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Toast
  toasts: [],
  showToast: (type, message) => {
    const id = Date.now();
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));

    // Auto remove after duration
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, CONFIG.TOAST_DURATION_MS);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  // Modals
  showCreator: false,
  showOpenClawGuide: false,
  setShowCreator: (show) => set({ showCreator: show }),
  setShowOpenClawGuide: (show) => set({ showOpenClawGuide: show }),

  // Copy state
  copiedId: null,
  setCopiedId: (id) => set({ copiedId: id }),
}));
