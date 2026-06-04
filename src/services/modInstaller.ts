import type { Mod } from "../types/Mod";
import type { Profile } from "../types/Profile";
import { getModVersions, type ModrinthVersion } from "./modrinthApi";

function toInstalledMod(projectId: string, version: ModrinthVersion, filename: string): Mod {
  return {
    id: projectId,
    name: version.name,
    filename,
    version: version.version_number,
    minecraftVersions: version.game_versions,
    loaders: version.loaders,
    dependencies: version.dependencies.filter((dep) => dep.dependency_type === "required" && dep.project_id).map((dep) => dep.project_id as string),
    conflicts: version.dependencies.filter((dep) => dep.dependency_type === "incompatible" && dep.project_id).map((dep) => dep.project_id as string),
    enabled: true,
    source: "modrinth",
  };
}

async function installSingleModrinthProject(projectId: string, profile: Profile): Promise<Mod> {
  const versions = await getModVersions(projectId, profile.loader, profile.minecraftVersion);
  const version = versions[0];
  if (!version) throw new Error("No compatible version found.");
  const file = version.files.find((item) => item.primary) ?? version.files[0];
  if (!file) throw new Error("No .jar file found.");
  await window.modforge.installDownloadedMod(file.url, file.filename, profile.modsPath);
  return toInstalledMod(projectId, version, file.filename);
}

export async function installModrinthProject(projectId: string, profile: Profile): Promise<Mod> {
  return installSingleModrinthProject(projectId, profile);
}

export async function installModrinthProjectWithDependencies(projectId: string, profile: Profile, installedMods: Mod[] = []): Promise<Mod[]> {
  const installed = new Map(installedMods.map((mod) => [mod.id, mod]));
  const installing = new Set<string>();
  const installedNow: Mod[] = [];

  async function installTree(currentProjectId: string) {
    if (installed.has(currentProjectId) || installing.has(currentProjectId)) return;
    installing.add(currentProjectId);

    const mod = await installSingleModrinthProject(currentProjectId, profile);
    installed.set(currentProjectId, mod);
    installedNow.push(mod);

    for (const dependencyId of mod.dependencies) {
      await installTree(dependencyId);
    }
  }

  await installTree(projectId);
  return installedNow;
}
