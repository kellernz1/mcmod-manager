import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Mod } from "../types/Mod";
import type { ModLoader } from "../types/Profile";

type ModState = {
  modsByProfile: Record<string, Mod[]>;
  syncSignatures: Record<string, string>;
  setMods: (profileId: string, mods: Mod[]) => Promise<void>;
  addMod: (profileId: string, mod: Mod) => Promise<void>;
  syncFromDisk: (profileId: string, modsPath: string, profileContext?: { minecraftVersion: string; loader: ModLoader }) => Promise<void>;
};

function normalizeLocalMod(mod: Mod, filename: string, profileContext?: { minecraftVersion: string; loader: ModLoader }): Mod {
  if (mod.source !== "local" || !profileContext) {
    return { ...mod, filename, enabled: !filename.endsWith(".disabled") };
  }

  return {
    ...mod,
    filename,
    enabled: !filename.endsWith(".disabled"),
    minecraftVersions: mod.minecraftVersions,
    loaders: mod.loaders,
  };
}

export const useModStore = create<ModState>()(
  persist(
    (set, get) => ({
      modsByProfile: {},
      syncSignatures: {},
      setMods: async (profileId, mods) => {
        await window.modforge.saveMods(profileId, mods);
        set({
          modsByProfile: { ...get().modsByProfile, [profileId]: mods },
          syncSignatures: { ...get().syncSignatures, [profileId]: JSON.stringify(mods) },
        });
      },
      addMod: async (profileId, mod) => {
        const current = get().modsByProfile[profileId] ?? [];
        const next = [mod, ...current.filter((item) => item.id !== mod.id)];
        await window.modforge.saveMods(profileId, next);
        set({
          modsByProfile: { ...get().modsByProfile, [profileId]: next },
          syncSignatures: { ...get().syncSignatures, [profileId]: JSON.stringify(next) },
        });
      },
      syncFromDisk: async (profileId, modsPath, profileContext) => {
        const [stored, scannedMods] = await Promise.all([
          window.modforge.getMods(profileId),
          window.modforge.scanMods(modsPath),
        ]);
        const merged = scannedMods.map((scannedMod) => {
          const filename = scannedMod.filename;
          const match = stored.find((mod) => mod.filename === filename || mod.filename.replace(/\.disabled$/, "") === filename.replace(/\.disabled$/, ""));
          return normalizeLocalMod({ ...scannedMod, enabled: match?.enabled ?? scannedMod.enabled }, filename, profileContext);
        });
        const signature = JSON.stringify(merged);
        if (get().syncSignatures[profileId] === signature) return;

        await window.modforge.saveMods(profileId, merged);
        set({
          modsByProfile: { ...get().modsByProfile, [profileId]: merged },
          syncSignatures: { ...get().syncSignatures, [profileId]: signature },
        });
      },
    }),
    {
      name: "modforge-mods",
      partialize: (state) => ({ modsByProfile: state.modsByProfile }),
    },
  ),
);
