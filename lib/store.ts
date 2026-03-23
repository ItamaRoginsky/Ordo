import { create } from "zustand";

interface AppState {
  activeBoardId: string | null;
  setActiveBoardId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeBoardId: null,
  setActiveBoardId: (id) => set({ activeBoardId: id }),
}));
