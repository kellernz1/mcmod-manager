import type { IpcMain } from "electron";
import Store from "electron-store";
import fs from "node:fs/promises";
import path from "node:path";
import type { Mod } from "../../src/types/Mod.js";

type StoreShape = {
  modsByProfile: Record<string, Mod[]>;
};

const store = new Store<StoreShape>({
  defaults: {
    modsByProfile: {},
  },
});

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export function registerModsIpc(ipcMain: IpcMain) {
  ipcMain.handle("mods:installDownloaded", async (_event, url: string, filename: string, modsPath: string): Promise<string> => {
    await ensureDir(modsPath);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download falhou: ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    const destination = path.join(modsPath, filename);
    await fs.writeFile(destination, bytes);
    return destination;
  });

  ipcMain.handle("mods:save", async (_event, profileId: string, mods: Mod[]): Promise<Mod[]> => {
    const map = store.get("modsByProfile", {});
    const next = { ...map, [profileId]: mods };
    store.set("modsByProfile", next);
    return next[profileId];
  });

  ipcMain.handle("mods:get", async (_event, profileId: string): Promise<Mod[]> => {
    return store.get("modsByProfile", {})[profileId] ?? [];
  });
}
