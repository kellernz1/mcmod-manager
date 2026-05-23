import type { Mod } from "../types/Mod";
import type { Profile } from "../types/Profile";
import { getModVersions } from "./modrinthApi";

export async function installModrinthProject(projectId: string, profile: Profile): Promise<Mod> {
  const versions = await getModVersions(projectId, profile.loader, profile.minecraftVersion);
  const version = versions[0];
  if (!version) throw new Error("Nenhuma versão compatível encontrada.");
  const file = version.files.find((item) => item.primary) ?? version.files[0];
  if (!file) throw new Error("Nenhum arquivo .jar encontrado.");
  await window.modforge.installDownloadedMod(file.url, file.filename, profile.modsPath);

  return {
    id: projectId,
    name: version.name,
    filename: file.filename,
    version: version.version_number,
    minecraftVersions: version.game_versions,
    loaders: version.loaders,
    dependencies: version.dependencies.filter((dep) => dep.dependency_type === "required" && dep.project_id).map((dep) => dep.project_id as string),
    conflicts: version.dependencies.filter((dep) => dep.dependency_type === "incompatible" && dep.project_id).map((dep) => dep.project_id as string),
    enabled: true,
    source: "modrinth",
  };
}
