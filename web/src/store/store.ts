import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";

type AuthState = {
  email: string | null;
  setEmail: (email: string) => void;
  clearEmail: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      email: "",

      setEmail: (email) => set({ email }),
      clearEmail: () => set({ email: "" }),
    }),
    {
      name: "user-email-storage",
      storage: createJSONStorage(() => localStorage),

      partialize: (state) => ({ email: state.email }),
    },
  ),
);
