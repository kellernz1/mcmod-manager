import type { ModLoader } from "../types/Profile";
import type { ModrinthSearchResult } from "../types/Mod";

const API_BASE = "https://api.modrinth.com/v2";

type ModrinthVersion = {
  id: string;
  name: string;
  version_number: string;
  game_versions: string[];
  loaders: ModLoader[];
  files: Array<{
    url: string;
    filename: string;
    primary: boolean;
  }>;
  dependencies: Array<{
    project_id: string | null;
    dependency_type: string;
  }>;
};

export async function searchMods(query: string, loader: ModLoader, gameVersion: string, index = "relevance", offset = 0): Promise<ModrinthSearchResult[]> {
  const facets = JSON.stringify([[`categories:${loader}`], [`versions:${gameVersion}`]]);
  const params = new URLSearchParams({
    query,
    facets,
    index,
    offset: String(offset),
    limit: "24",
  });
  const response = await fetch(`${API_BASE}/search?${params.toString()}`);
  if (!response.ok) throw new Error(`Busca Modrinth falhou: ${response.status}`);
  const data = (await response.json()) as { hits: ModrinthSearchResult[] };
  return data.hits;
}

export async function getModVersions(projectId: string, loader: ModLoader, gameVersion: string): Promise<ModrinthVersion[]> {
  const loaders = JSON.stringify([loader]);
  const gameVersions = JSON.stringify([gameVersion]);
  const params = new URLSearchParams({ loaders, game_versions: gameVersions });
  const response = await fetch(`${API_BASE}/project/${projectId}/version?${params.toString()}`);
  if (!response.ok) throw new Error(`Versões Modrinth indisponíveis: ${response.status}`);
  return (await response.json()) as ModrinthVersion[];
}

export async function downloadMod(versionId: string): Promise<string> {
  const response = await fetch(`${API_BASE}/version/${versionId}`);
  if (!response.ok) throw new Error(`Versão Modrinth indisponível: ${response.status}`);
  const version = (await response.json()) as ModrinthVersion;
  const file = version.files.find((item) => item.primary) ?? version.files[0];
  if (!file) throw new Error("Nenhum arquivo primário encontrado para esta versão.");
  return file.url;
}

export type { ModrinthVersion };
