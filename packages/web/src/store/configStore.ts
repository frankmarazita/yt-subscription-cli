import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConfigState {
  hosts: string[];
  activeHostIndex: number;
  addHost: (url: string) => void;
  removeHost: (index: number) => void;
  setActiveHost: (index: number) => void;
  getActiveHost: () => string;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      hosts: ['http://localhost:3000'],
      activeHostIndex: 0,
      addHost: (url) => set((state) => ({ hosts: [...state.hosts, url] })),
      removeHost: (index) =>
        set((state) => {
          const hosts = state.hosts.filter((_, i) => i !== index);
          const activeHostIndex = Math.min(state.activeHostIndex, Math.max(0, hosts.length - 1));
          return { hosts, activeHostIndex };
        }),
      setActiveHost: (index) => set({ activeHostIndex: index }),
      getActiveHost: () => {
        const { hosts, activeHostIndex } = get();
        return hosts[activeHostIndex] ?? 'http://localhost:3000';
      },
    }),
    { name: 'subs-config' }
  )
);
