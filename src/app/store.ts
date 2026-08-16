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
  reorderTabs: (newTabs: Tab[]) => void;
}

export const useTabStore = create<TabState>((set) => ({
  tabs: [],
  reorderTabs: (newTabs) => set({ tabs: newTabs }),
  openTab: (newTab) => set((state) => {
    // 1. Check if a tab for this portal already exists
    const existingPortalTabIndex = state.tabs.findIndex(t => t.portalId === newTab.portalId);

    if (existingPortalTabIndex !== -1) {
      // Update the existing engine tab with the new page/view
      const updatedTab = { 
        ...state.tabs[existingPortalTabIndex], 
        id: newTab.id, 
        title: newTab.title, 
        component: newTab.component, 
        isActive: true 
      };
      // Remove it from its old position and prepend it to the list (magnetic docking to index 0)
      const remainingTabs = state.tabs
        .filter((_, idx) => idx !== existingPortalTabIndex)
        .map(t => ({ ...t, isActive: false }));

      return {
        tabs: [updatedTab, ...remainingTabs]
      };
    }

    // 2. FIFO Logic: If it's a new portal tab and we are at the limit (4)
    let currentTabs = [...state.tabs.map(t => ({ ...t, isActive: false }))];
    if (currentTabs.length >= 4) {
      currentTabs.pop(); // Remove the last tab (oldest since we prepend new ones)
    }

    // 3. Add the new portal tab at the beginning
    return {
      tabs: [{ ...newTab, isActive: true }, ...currentTabs]
    };
  }),
  closeTab: (portalId) => set((state) => {
    const newTabs = state.tabs.filter(t => t.portalId !== portalId);
    // If we closed the active tab, make the first remaining tab active
    const hasActive = newTabs.some(t => t.isActive);
    if (newTabs.length > 0 && !hasActive) {
      newTabs[0].isActive = true;
    }
    return {
      tabs: newTabs
    };
  }),
  setActiveTab: (portalId) => set((state) => {
    const targetTab = state.tabs.find(t => t.portalId === portalId);
    if (!targetTab) return state;

    const remaining = state.tabs
      .filter(t => t.portalId !== portalId)
      .map(t => ({ ...t, isActive: false }));

    const updatedTarget = { ...targetTab, isActive: true };
    return {
      tabs: [updatedTarget, ...remaining]
    };
  }),
  clearTabs: () => set({ tabs: [] })
}));
