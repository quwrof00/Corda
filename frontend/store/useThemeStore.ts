import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = 'auto' | 'coffee' | 'mountains' | 'hills';

interface ThemeState {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'auto',
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'corda-theme-storage',
        }
    )
);
