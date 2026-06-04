import type { ModLoader } from "./Profile";

export type ModpackProvider = "modrinth";

export type ModpackSearchResult = {
  id: string;
  slug: string;
  title: string;
  description: string;
  iconUrl: string | null;
  downloads: number;
  provider: ModpackProvider;
  minecraftVersions: string[];
  loaders: ModLoader[];
};

export type InstallModpackResult = {
  installed: number;
  skipped: number;
  errors: string[];
};
