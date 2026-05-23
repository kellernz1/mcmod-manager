import { shell, type IpcMain } from "electron";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { createBackup } from "../../src/services/backupService.js";
import { detectLaunchers } from "../../src/services/launcherDetector.js";
import { scanModJar } from "../services/modMetadata.js";
import type { Mod } from "../../src/types/Mod.js";

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

const scanCache = new Map<string, { signature: string; mod: Mod }>();

async function scanModJarCached(filePath: string): Promise<Mod> {
  const stat = await fs.stat(filePath);
  const signature = `${stat.mtimeMs}:${stat.size}`;
  const cached = scanCache.get(filePath);
  if (cached?.signature === signature) return cached.mod;

  const mod = scanModJar(filePath);
  scanCache.set(filePath, { signature, mod });
  return mod;
}

export function registerFileSystemIpc(ipcMain: IpcMain) {
  ipcMain.handle("fs:readMods", async (_event, modsPath: string): Promise<string[]> => {
    await ensureDir(modsPath);
    const files = await fs.readdir(modsPath);
    return files.filter((file) => file.endsWith(".jar") || file.endsWith(".jar.disabled"));
  });

  ipcMain.handle("fs:scanMods", async (_event, modsPath: string) => {
    await ensureDir(modsPath);
    const files = await fs.readdir(modsPath);
    const modFiles = files
      .filter((file) => file.endsWith(".jar") || file.endsWith(".jar.disabled"))
      .sort((left, right) => left.localeCompare(right));
    const activePaths = new Set(modFiles.map((file) => path.join(modsPath, file)));

    for (const cachedPath of scanCache.keys()) {
      if (path.dirname(cachedPath) === modsPath && !activePaths.has(cachedPath)) {
        scanCache.delete(cachedPath);
      }
    }

    return Promise.all(modFiles.map((file) => scanModJarCached(path.join(modsPath, file))));
  });

  ipcMain.handle("fs:toggleMod", async (_event, filePath: string): Promise<string> => {
    const nextPath = filePath.endsWith(".disabled")
      ? filePath.replace(/\.disabled$/, "")
      : `${filePath}.disabled`;
    await fs.rename(filePath, nextPath);
    scanCache.delete(filePath);
    return nextPath;
  });

  ipcMain.handle("fs:deleteMod", async (_event, filePath: string, profileId?: string): Promise<boolean> => {
    if (profileId) await createBackup(profileId, filePath);
    await fs.rm(filePath, { force: true });
    scanCache.delete(filePath);
    return true;
  });

  ipcMain.handle("fs:copyMod", async (_event, sourcePath: string, modsPath: string): Promise<string> => {
    await ensureDir(modsPath);
    const destination = path.join(modsPath, path.basename(sourcePath));
    await fs.copyFile(sourcePath, destination);
    scanCache.delete(destination);
    return destination;
  });

  ipcMain.handle("fs:openFolder", async (_event, folderPath: string): Promise<boolean> => {
    await ensureDir(folderPath);
    const result = await shell.openPath(folderPath);
    if (result) {
      const command = process.platform === "win32" ? "explorer" : process.platform === "darwin" ? "open" : "xdg-open";
      execFile(command, [folderPath]);
    }
    return true;
  });

  ipcMain.handle("launcher:detect", async () => detectLaunchers());
}
