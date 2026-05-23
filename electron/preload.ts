import { contextBridge, ipcRenderer } from "electron";
import type { Profile } from "../src/types/Profile.js";
import type { Mod } from "../src/types/Mod.js";

contextBridge.exposeInMainWorld("modforge", {
  readMods: (modsPath: string) => ipcRenderer.invoke("fs:readMods", modsPath),
  scanMods: (modsPath: string) => ipcRenderer.invoke("fs:scanMods", modsPath),
  toggleMod: (filePath: string) => ipcRenderer.invoke("fs:toggleMod", filePath),
  deleteMod: (filePath: string, profileId?: string) => ipcRenderer.invoke("fs:deleteMod", filePath, profileId),
  copyMod: (sourcePath: string, modsPath: string) => ipcRenderer.invoke("fs:copyMod", sourcePath, modsPath),
  openFolder: (folderPath: string) => ipcRenderer.invoke("fs:openFolder", folderPath),
  detectLaunchers: () => ipcRenderer.invoke("launcher:detect"),
  getProfiles: () => ipcRenderer.invoke("profile:getAll"),
  saveProfile: (profile: Profile) => ipcRenderer.invoke("profile:save", profile),
  deleteProfile: (profileId: string) => ipcRenderer.invoke("profile:delete", profileId),
  installDownloadedMod: (url: string, filename: string, modsPath: string) =>
    ipcRenderer.invoke("mods:installDownloaded", url, filename, modsPath),
  saveMods: (profileId: string, mods: Mod[]) => ipcRenderer.invoke("mods:save", profileId, mods),
  getMods: (profileId: string) => ipcRenderer.invoke("mods:get", profileId),
});
