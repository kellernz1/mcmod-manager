import type { IpcMain } from "electron";
import Store from "electron-store";
import AdmZip from "adm-zip";
import fs from "node:fs/promises";
import path from "node:path";
import type { Mod } from "../../src/types/Mod.js";
import type { InstallModpackResult, ModpackProvider } from "../../src/types/Modpack.js";

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

type InstallModpackOptions = {
  provider: ModpackProvider;
  url?: string;
  filename?: string;
  modsPath: string;
};

type ModrinthIndex = {
  files: Array<{
    path: string;
    downloads: string[];
  }>;
};

async function downloadBytes(url: string, headers?: Record<string, string>): Promise<Uint8Array> {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  return new Uint8Array(await response.arrayBuffer());
}

function readJsonEntry<T>(zip: AdmZip, entryName: string): T {
  const entry = zip.getEntry(entryName);
  if (!entry) throw new Error(`${entryName} not found in modpack archive.`);
  return JSON.parse(entry.getData().toString("utf8")) as T;
}

function modFilenameFromArchivePath(filePath: string) {
  return path.basename(filePath.replace(/\\/g, "/"));
}

async function installModFile(url: string, modsPath: string, preferredFilename: string) {
  const bytes = await downloadBytes(url);
  const destination = path.join(modsPath, preferredFilename);
  await fs.writeFile(destination, bytes);
}

async function installModrinthArchive(zip: AdmZip, modsPath: string): Promise<InstallModpackResult> {
  const index = readJsonEntry<ModrinthIndex>(zip, "modrinth.index.json");
  const result: InstallModpackResult = { installed: 0, skipped: 0, errors: [] };

  for (const file of index.files) {
    const normalizedPath = file.path.replace(/\\/g, "/");
    if (!normalizedPath.startsWith("mods/") || !normalizedPath.endsWith(".jar") || file.downloads.length === 0) {
      result.skipped += 1;
      continue;
    }

    try {
      await installModFile(file.downloads[0], modsPath, modFilenameFromArchivePath(normalizedPath));
      result.installed += 1;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return result;
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

  ipcMain.handle("mods:installModpackArchive", async (_event, options: InstallModpackOptions): Promise<InstallModpackResult> => {
    await ensureDir(options.modsPath);
    if (!options.url) throw new Error("No modpack download URL available.");
    const archive = await downloadBytes(options.url);
    const zip = new AdmZip(Buffer.from(archive));
    return installModrinthArchive(zip, options.modsPath);
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
