import type { ModLoader } from "../types/Profile";
import type { ModpackSearchResult } from "../types/Modpack";
import type { ModrinthVersion } from "./modrinthApi";

const MODRINTH_API_BASE = "https://api.modrinth.com/v2";

type ModrinthPackHit = {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  icon_url: string | null;
  downloads: number;
  categories: string[];
  versions: string[];
};

function mapModrinthPack(hit: ModrinthPackHit): ModpackSearchResult {
  return {
    id: hit.project_id,
    slug: hit.slug,
    title: hit.title,
    description: hit.description,
    iconUrl: hit.icon_url,
    downloads: hit.downloads,
    provider: "modrinth",
    minecraftVersions: hit.versions,
    loaders: hit.categories.filter((category): category is ModLoader =>
      ["fabric", "forge", "quilt", "neoforge"].includes(category),
    ),
  };
}

export async function searchModrinthModpacks(query: string, loader: ModLoader, gameVersion: string, index = "relevance", offset = 0): Promise<ModpackSearchResult[]> {
  const facets = JSON.stringify([[`project_type:modpack`], [`categories:${loader}`], [`versions:${gameVersion}`]]);
  const params = new URLSearchParams({
    query,
    facets,
    index,
    offset: String(offset),
    limit: "24",
  });
  const response = await fetch(`${MODRINTH_API_BASE}/search?${params.toString()}`);
  if (!response.ok) throw new Error(`Modrinth modpack search failed: ${response.status}`);
  const data = (await response.json()) as { hits: ModrinthPackHit[] };
  return data.hits.map(mapModrinthPack);
}

export async function getModrinthModpackVersions(projectId: string, loader: ModLoader, gameVersion: string): Promise<ModrinthVersion[]> {
  const loaders = JSON.stringify([loader]);
  const gameVersions = JSON.stringify([gameVersion]);
  const params = new URLSearchParams({ loaders, game_versions: gameVersions });
  const response = await fetch(`${MODRINTH_API_BASE}/project/${projectId}/version?${params.toString()}`);
  if (!response.ok) throw new Error(`Modrinth modpack versions unavailable: ${response.status}`);
  return (await response.json()) as ModrinthVersion[];
}
