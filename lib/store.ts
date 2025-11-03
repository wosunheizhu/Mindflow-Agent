import { create } from 'zustand';

type LogItem = { id: string; toolId: string; title: string; ts: number; payload?: any; result?: any; ok?: boolean };

type AppState = {
  theme: 'light'|'dark'|'system';
  setTheme: (t: AppState['theme']) => void;

  logs: LogItem[];
  pushLog: (log: Omit<LogItem,'id'|'ts'>) => void;
};

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
  logs: [],
  pushLog: (log) => set({ logs: [{ id: crypto.randomUUID(), ts: Date.now(), ...log }, ...get().logs ] }),
}));






