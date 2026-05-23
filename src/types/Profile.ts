export type ModLoader = "fabric" | "forge" | "quilt" | "neoforge";

export type Profile = {
  id: string;
  name: string;
  minecraftVersion: string;
  loader: ModLoader;
  loaderVersion: string;
  modsPath: string;
  enabled: boolean;
  createdAt: string;
};
