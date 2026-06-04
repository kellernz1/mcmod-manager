import type { ModrinthSearchResult } from "../types/Mod";

const MODRINTH_API_BASE = "https://api.modrinth.com/v2";

type ResourcePackVersion = {
  id: string;
  name: string;
  version_number: string;
  game_versions: string[];
  files: Array<{
    url: string;
    filename: string;
    primary: boolean;
  }>;
};

export async function searchResourcePacks(query: string, gameVersion: string, index = "relevance", offset = 0): Promise<ModrinthSearchResult[]> {
  const facets = JSON.stringify([[`project_type:resourcepack`], [`versions:${gameVersion}`]]);
  const params = new URLSearchParams({
    query,
    facets,
    index,
    offset: String(offset),
    limit: "24",
  });
  const response = await fetch(`${MODRINTH_API_BASE}/search?${params.toString()}`);
  if (!response.ok) throw new Error(`Modrinth resource pack search failed: ${response.status}`);
  const data = (await response.json()) as { hits: ModrinthSearchResult[] };
  return data.hits;
}

export async function searchShaderPacks(query: string, gameVersion: string, index = "relevance", offset = 0): Promise<ModrinthSearchResult[]> {
  const facets = JSON.stringify([[`project_type:shader`], [`versions:${gameVersion}`]]);
  const params = new URLSearchParams({
    query,
    facets,
    index,
    offset: String(offset),
    limit: "24",
  });
  const response = await fetch(`${MODRINTH_API_BASE}/search?${params.toString()}`);
  if (!response.ok) throw new Error(`Modrinth shader pack search failed: ${response.status}`);
  const data = (await response.json()) as { hits: ModrinthSearchResult[] };
  return data.hits;
}

export async function getResourcePackVersions(projectId: string, gameVersion: string): Promise<ResourcePackVersion[]> {
  const gameVersions = JSON.stringify([gameVersion]);
  const params = new URLSearchParams({ game_versions: gameVersions });
  const response = await fetch(`${MODRINTH_API_BASE}/project/${projectId}/version?${params.toString()}`);
  if (!response.ok) throw new Error(`Modrinth resource pack versions unavailable: ${response.status}`);
  return (await response.json()) as ResourcePackVersion[];
}

export async function getShaderPackVersions(projectId: string, gameVersion: string): Promise<ResourcePackVersion[]> {
  return getResourcePackVersions(projectId, gameVersion);
}

export type { ResourcePackVersion };
