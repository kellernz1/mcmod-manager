/// <reference types="vite/client" />

import type { Profile } from "./types/Profile";
import type { Mod } from "./types/Mod";
import type { InstallModpackResult, ModpackProvider } from "./types/Modpack";

type LauncherInfo = {
  id: string;
  name: string;
  path: string;
  found: boolean;
};

type InstallModpackOptions = {
  provider: ModpackProvider;
  url?: string;
  filename?: string;
  modsPath: string;
};

declare global {
  interface Window {
    modforge: {
      readMods: (modsPath: string) => Promise<string[]>;
      scanMods: (modsPath: string) => Promise<Mod[]>;
      toggleMod: (filePath: string) => Promise<string>;
      deleteMod: (filePath: string, profileId?: string) => Promise<boolean>;
      copyMod: (sourcePath: string, modsPath: string) => Promise<string>;
      openFolder: (folderPath: string) => Promise<boolean>;
      detectLaunchers: () => Promise<LauncherInfo[]>;
      getProfiles: () => Promise<Profile[]>;
      saveProfile: (profile: Profile) => Promise<Profile[]>;
      deleteProfile: (profileId: string) => Promise<Profile[]>;
      installDownloadedMod: (url: string, filename: string, modsPath: string) => Promise<string>;
      installModpackArchive: (options: InstallModpackOptions) => Promise<InstallModpackResult>;
      saveMods: (profileId: string, mods: Mod[]) => Promise<Mod[]>;
      getMods: (profileId: string) => Promise<Mod[]>;
    };
  }
}
