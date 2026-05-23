import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { registerFileSystemIpc } from "./ipc/fileSystem.ipc.js";
import { registerProfilesIpc } from "./ipc/profiles.ipc.js";
import { registerModsIpc } from "./ipc/mods.ipc.js";

function createWindow() {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: "#0a0f0d",
    title: "MCMod Manager",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL || !app.isPackaged) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173");
  } else {
    win.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

app.whenReady().then(() => {
  registerFileSystemIpc(ipcMain);
  registerProfilesIpc(ipcMain);
  registerModsIpc(ipcMain);
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
