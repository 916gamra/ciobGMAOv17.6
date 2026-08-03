import { create } from 'zustand';
import { useTabStore, type PortalType } from '../../app/store';

interface OsState {
  activePortal: PortalType;
  setPortal: (portal: PortalType) => void;
}

export const useOsStore = create<OsState>((set) => ({
  activePortal: 'HOME',
  setPortal: (portal) => {
    set({ activePortal: portal });
  }
}));
