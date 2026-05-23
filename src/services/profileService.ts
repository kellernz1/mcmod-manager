import type { ModLoader, Profile } from "../types/Profile";

export const minecraftVersions = ["1.21.4", "1.21.1", "1.21", "1.20.6", "1.20.4", "1.20.1", "1.19.4", "1.18.2", "1.16.5"];
export const modLoaders: ModLoader[] = ["fabric", "forge", "quilt", "neoforge"];

export async function getDefaultModsPath(): Promise<string> {
  const launchers = await window.modforge.detectLaunchers();
  const minecraft = launchers.find((launcher) => launcher.id === "minecraft");
  const separator = navigator.userAgent.includes("Windows") ? "\\" : "/";
  return minecraft ? `${minecraft.path}${separator}mods` : "";
}

export async function loadProfiles(): Promise<Profile[]> {
  return window.modforge.getProfiles();
}

export async function saveProfile(profile: Profile): Promise<Profile[]> {
  return window.modforge.saveProfile(profile);
}

export async function deleteProfile(profileId: string): Promise<Profile[]> {
  return window.modforge.deleteProfile(profileId);
}
