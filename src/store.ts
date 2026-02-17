import { create } from 'zustand';
import { UserProfile } from './types';

interface UIState {
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isMobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  isDarkMode:
    localStorage.getItem('theme') === 'dark' ||
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
  toggleDarkMode: () =>
    set((state) => {
      const next = !state.isDarkMode;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return { isDarkMode: next };
    }),
}));

interface ConfigState {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile) => void;
  isInitialized: boolean;
  setInitialized: (val: boolean) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  userProfile: null,
  setUserProfile: (profile) => set({ userProfile: profile }),
  isInitialized: false,
  setInitialized: (val) => set({ isInitialized: val }),
}));
