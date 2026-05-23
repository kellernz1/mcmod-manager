import type { IpcMain } from "electron";
import Store from "electron-store";
import type { Profile } from "../../src/types/Profile.js";

type StoreShape = {
  profiles: Profile[];
};

const store = new Store<StoreShape>({
  defaults: {
    profiles: [],
  },
});

export function registerProfilesIpc(ipcMain: IpcMain) {
  ipcMain.handle("profile:getAll", async (): Promise<Profile[]> => {
    return store.get("profiles", []);
  });

  ipcMain.handle("profile:save", async (_event, profile: Profile): Promise<Profile[]> => {
    const profiles = store.get("profiles", []);
    const next = profiles.some((item) => item.id === profile.id)
      ? profiles.map((item) => (item.id === profile.id ? profile : item))
      : [profile, ...profiles];
    store.set("profiles", next);
    return next;
  });

  ipcMain.handle("profile:delete", async (_event, profileId: string): Promise<Profile[]> => {
    const next = store.get("profiles", []).filter((profile) => profile.id !== profileId);
    store.set("profiles", next);
    return next;
  });
}
