import { create } from 'zustand';

export type PortalType = 'HOME' | 'PDR' | 'PREVENTIVE' | 'ANALYTICS' | 'ORGANIZATION' | 'SETTINGS' | 'FACTORY' | 'CORRECTIVE';

export interface Tab {
  id: string; // The specific page/view ID within the engine
  portalId: PortalType; // The engine/portal ID (e.g., 'PDR', 'PREVENTIVE')
  title: string;
  component: string;
  isActive: boolean;
}

interface TabState {
  tabs: Tab[];
  openTab: (tab: Omit<Tab, 'isActive'>) => void;
  closeTab: (portalId: PortalType) => void;
  setActiveTab: (portalId: PortalType) => void;
  clearTabs: () => void;
}

export const useTabStore = create<TabState>((set) => ({
  tabs: [],
  openTab: (newTab) => set((state) => {
    // 1. Check if a tab for this portal already exists
    const existingPortalTabIndex = state.tabs.findIndex(t => t.portalId === newTab.portalId);

    if (existingPortalTabIndex !== -1) {
      // Update the existing engine tab with the new page/view
      const updatedTabs = state.tabs.map((t, idx) => {
        if (idx === existingPortalTabIndex) {
          return { ...t, id: newTab.id, title: newTab.title, component: newTab.component, isActive: true };
        }
        return { ...t, isActive: false };
      });

      return {
        tabs: updatedTabs
      };
    }

    // 2. FIFO Logic: If it's a new portal tab and we are at the limit (4)
    let currentTabs = [...state.tabs.map(t => ({ ...t, isActive: false }))];
    if (currentTabs.length >= 4) {
      currentTabs.shift(); // Remove the oldest tab (the one at index 0)
    }

    // 3. Add the new portal tab at the end
    return {
      tabs: [...currentTabs, { ...newTab, isActive: true }]
    };
  }),
  closeTab: (portalId) => set((state) => {
    const newTabs = state.tabs.filter(t => t.portalId !== portalId);
    return {
      tabs: newTabs
    };
  }),
  setActiveTab: (portalId) => set((state) => ({
    tabs: state.tabs.map(t => ({ ...t, isActive: t.portalId === portalId }))
  })),
  clearTabs: () => set({ tabs: [] })
}));
