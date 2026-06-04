import type { ModLoader, Profile } from "../types/Profile";

export const minecraftVersions = [
  "26.1.2",
  "26.1.1",
  "26.1",
  "1.21.11",
  "1.21.10",
  "1.21.9",
  "1.21.8",
  "1.21.7",
  "1.21.6",
  "1.21.5",
  "1.21.4",
  "1.21.3",
  "1.21.2",
  "1.21.1",
  "1.21",
  "1.20.6",
  "1.20.5",
  "1.20.4",
  "1.20.3",
  "1.20.2",
  "1.20.1",
  "1.20",
  "1.19.4",
  "1.19.3",
  "1.19.2",
  "1.19.1",
  "1.19",
  "1.18.2",
  "1.18.1",
  "1.18",
  "1.17.1",
  "1.17",
  "1.16.5",
  "1.16.4",
  "1.16.3",
  "1.16.2",
  "1.16.1",
  "1.16",
  "1.15.2",
  "1.14.4",
  "1.12.2",
  "1.8.9",
  "1.7.10",
];
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
