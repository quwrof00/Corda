import { create } from "zustand";

interface User {
  id: string;
  name: string;
  skills: string[];
  workload: number;
  teamIds: string[];
  role: string;
}

interface UserStore {
  user: User | null;
  setUser: (u: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  clearUser: () => set({ user: null }),
}));
