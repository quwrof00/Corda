import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";

interface DashboardSettingsState {
  showTeams: boolean;
  setShowTeams: (show: boolean) => void;
  toggleShowTeams: () => void;
}

export const useDashboardSettingsStore = create<DashboardSettingsState>()(
  persist(
    (set) => ({
      showTeams: true,
      setShowTeams: (show: boolean) => set({ showTeams: show }),
      toggleShowTeams: () => set((state) => ({ showTeams: !state.showTeams })),
    }),
    {
      name: "dashboard-settings",
    }
  )
);

export function useDashboardSettings() {
  const store = useDashboardSettingsStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return {
    showTeams: hydrated ? store.showTeams : true,
    setShowTeams: store.setShowTeams,
    toggleShowTeams: store.toggleShowTeams,
    isHydrated: hydrated,
  };
}
