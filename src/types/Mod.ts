import type { ModLoader } from "./Profile.js";

export type Mod = {
  id: string;
  name: string;
  filename: string;
  version: string;
  minecraftVersions: string[];
  loaders: ModLoader[];
  dependencies: string[];
  conflicts: string[];
  dependencyRanges?: Record<string, string[]>;
  conflictRanges?: Record<string, string[]>;
  provides?: string[];
  enabled: boolean;
  source: "local" | "modrinth" | "curseforge";
};

export type ModrinthSearchResult = {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  icon_url: string | null;
  downloads: number;
  categories: string[];
  versions: string[];
};
