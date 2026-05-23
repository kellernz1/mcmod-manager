import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "en" | "pt";

type SettingsState = {
  theme: "dark" | "light";
  language: Language;
  javaPath: string;
  automaticBackup: boolean;
  setTheme: (theme: "dark" | "light") => void;
  setLanguage: (language: Language) => void;
  setJavaPath: (javaPath: string) => void;
  setAutomaticBackup: (automaticBackup: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      language: "en",
      javaPath: "",
      automaticBackup: true,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setJavaPath: (javaPath) => set({ javaPath }),
      setAutomaticBackup: (automaticBackup) => set({ automaticBackup }),
    }),
    {
      name: "modforge-settings",
    },
  ),
);
