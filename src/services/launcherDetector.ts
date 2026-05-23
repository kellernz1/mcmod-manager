import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type LauncherInfo = {
  id: string;
  name: string;
  path: string;
  found: boolean;
};

function exists(target: string) {
  return fs.existsSync(target);
}

export function detectLaunchers(): LauncherInfo[] {
  const home = os.homedir();
  const appData = process.env.APPDATA ?? path.join(home, "AppData", "Roaming");

  const candidates =
    process.platform === "win32"
      ? [
          { id: "minecraft", name: "Minecraft Launcher", path: path.join(appData, ".minecraft") },
          { id: "prism", name: "Prism Launcher", path: path.join(appData, "PrismLauncher") },
          { id: "curseforge", name: "CurseForge", path: path.join(appData, "CurseForge") },
          { id: "modrinth", name: "Modrinth App", path: path.join(appData, "com.modrinth.theseus") },
        ]
      : process.platform === "darwin"
        ? [
            { id: "minecraft", name: "Minecraft Launcher", path: path.join(home, "Library/Application Support/minecraft") },
            { id: "prism", name: "Prism Launcher", path: path.join(home, "Library/Application Support/PrismLauncher") },
            { id: "curseforge", name: "CurseForge", path: path.join(home, "Library/Application Support/CurseForge") },
            { id: "modrinth", name: "Modrinth App", path: path.join(home, "Library/Application Support/com.modrinth.theseus") },
          ]
        : [
            { id: "minecraft", name: "Minecraft Launcher", path: path.join(home, ".minecraft") },
            { id: "prism", name: "Prism Launcher", path: path.join(home, ".local/share/PrismLauncher") },
            { id: "curseforge", name: "CurseForge", path: path.join(home, ".local/share/CurseForge") },
            { id: "modrinth", name: "Modrinth App", path: path.join(home, ".local/share/com.modrinth.theseus") },
          ];

  return candidates.map((launcher) => ({ ...launcher, found: exists(launcher.path) }));
}

export function defaultMinecraftModsPath() {
  const detected = detectLaunchers().find((launcher) => launcher.id === "minecraft");
  return path.join(detected?.path ?? path.join(os.homedir(), ".minecraft"), "mods");
}
