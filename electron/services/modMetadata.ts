import AdmZip from "adm-zip";
import toml from "@iarna/toml";
import path from "node:path";
import type { Mod } from "../../src/types/Mod.js";
import type { ModLoader } from "../../src/types/Profile.js";

type FabricMetadata = {
  id?: string;
  name?: string;
  version?: string;
  depends?: Record<string, string | string[]>;
  breaks?: Record<string, string | string[]>;
  conflicts?: Record<string, string | string[]>;
};

type QuiltMetadata = {
  quilt_loader?: {
    id?: string;
    metadata?: {
      name?: string;
    };
    version?: string;
    depends?: Array<string | { id?: string; versions?: string | string[] }>;
    breaks?: Array<string | { id?: string; versions?: string | string[] }>;
  };
};

type ForgeDependency = {
  modId?: string;
  mandatory?: boolean;
  type?: string;
  versionRange?: string;
};

type ForgeMetadata = {
  modLoader?: string;
  mods?: Array<{
    modId?: string;
    displayName?: string;
    version?: string;
  }>;
  dependencies?: Record<string, ForgeDependency[]>;
};

function readZipText(zip: AdmZip, entryName: string): string | null {
  const entry = zip.getEntry(entryName);
  return entry ? entry.getData().toString("utf8") : null;
}

function normalizeDependencyId(id: string) {
  return id.trim().toLowerCase();
}

function isRuntimeDependency(id: string) {
  return ["minecraft", "java", "fabricloader", "fabric-api", "forge", "neoforge", "quilt_loader", "quilted_fabric_api"].includes(id);
}

function dependencyKeys(input?: Record<string, string | string[]>) {
  return Object.keys(input ?? {})
    .map(normalizeDependencyId)
    .filter((id) => !isRuntimeDependency(id));
}

function rangeMap(input?: Record<string, string | string[]>) {
  return Object.fromEntries(
    Object.entries(input ?? {})
      .map(([id, ranges]) => [normalizeDependencyId(id), Array.isArray(ranges) ? ranges : [ranges]])
      .filter(([id]) => !isRuntimeDependency(String(id))),
  );
}

function minecraftConstraint(input?: Record<string, string | string[]>) {
  const value = input?.minecraft;
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function fallbackMod(filename: string, error?: unknown): Mod {
  const clean = filename.replace(/\.disabled$/, "");
  const name = clean.replace(/\.jar$/, "").replace(/[-_]\d.*$/, "").replace(/[-_]/g, " ");
  return {
    id: clean.toLowerCase(),
    name,
    filename,
    version: error ? "corrupted" : "local",
    minecraftVersions: [],
    loaders: [],
    dependencies: [],
    conflicts: [],
    dependencyRanges: {},
    conflictRanges: {},
    provides: [],
    enabled: !filename.endsWith(".disabled"),
    source: "local",
  };
}

function fabricMod(zip: AdmZip, filename: string): Mod | null {
  const raw = readZipText(zip, "fabric.mod.json");
  if (!raw) return null;
  const metadata = JSON.parse(raw) as FabricMetadata;
  const id = normalizeDependencyId(metadata.id ?? filename.replace(/\.jar(\.disabled)?$/, ""));
  return {
    id,
    name: metadata.name ?? id,
    filename,
    version: metadata.version ?? "unknown",
    minecraftVersions: minecraftConstraint(metadata.depends),
    loaders: ["fabric"],
    dependencies: dependencyKeys(metadata.depends),
    conflicts: [...dependencyKeys(metadata.breaks), ...dependencyKeys(metadata.conflicts)],
    dependencyRanges: rangeMap(metadata.depends),
    conflictRanges: { ...rangeMap(metadata.breaks), ...rangeMap(metadata.conflicts) },
    provides: [],
    enabled: !filename.endsWith(".disabled"),
    source: "local",
  };
}

function quiltMod(zip: AdmZip, filename: string): Mod | null {
  const raw = readZipText(zip, "quilt.mod.json");
  if (!raw) return null;
  const metadata = JSON.parse(raw) as QuiltMetadata;
  const loader = metadata.quilt_loader;
  const id = normalizeDependencyId(loader?.id ?? filename.replace(/\.jar(\.disabled)?$/, ""));
  const depends = loader?.depends ?? [];
  const breaks = loader?.breaks ?? [];
  const minecraftVersions = depends
    .filter((dep) => typeof dep !== "string" && dep.id === "minecraft")
    .flatMap((dep) => (typeof dep === "string" ? [] : Array.isArray(dep.versions) ? dep.versions : dep.versions ? [dep.versions] : []));

  return {
    id,
    name: loader?.metadata?.name ?? id,
    filename,
    version: loader?.version ?? "unknown",
    minecraftVersions,
    loaders: ["quilt"],
    dependencies: depends
      .map((dep) => (typeof dep === "string" ? dep : dep.id))
      .filter((id): id is string => Boolean(id))
      .map(normalizeDependencyId)
      .filter((id) => !isRuntimeDependency(id)),
    conflicts: breaks
      .map((dep) => (typeof dep === "string" ? dep : dep.id))
      .filter((id): id is string => Boolean(id))
      .map(normalizeDependencyId)
      .filter((id) => !isRuntimeDependency(id)),
    dependencyRanges: Object.fromEntries(
      depends
        .filter((dep) => typeof dep !== "string" && dep.id)
        .map((dep) => {
          const id = normalizeDependencyId((dep as { id: string }).id);
          const versions = (dep as { versions?: string | string[] }).versions;
          return [id, Array.isArray(versions) ? versions : versions ? [versions] : []];
        })
        .filter(([id]) => !isRuntimeDependency(String(id))),
    ),
    conflictRanges: Object.fromEntries(
      breaks
        .filter((dep) => typeof dep !== "string" && dep.id)
        .map((dep) => {
          const id = normalizeDependencyId((dep as { id: string }).id);
          const versions = (dep as { versions?: string | string[] }).versions;
          return [id, Array.isArray(versions) ? versions : versions ? [versions] : []];
        })
        .filter(([id]) => !isRuntimeDependency(String(id))),
    ),
    provides: [],
    enabled: !filename.endsWith(".disabled"),
    source: "local",
  };
}

function forgeMod(zip: AdmZip, filename: string): Mod | null {
  const raw = readZipText(zip, "META-INF/neoforge.mods.toml") ?? readZipText(zip, "META-INF/mods.toml");
  if (!raw) return null;
  const metadata = toml.parse(raw) as ForgeMetadata;
  const firstMod = metadata.mods?.[0];
  const id = normalizeDependencyId(firstMod?.modId ?? filename.replace(/\.jar(\.disabled)?$/, ""));
  const dependencyGroups = Object.values(metadata.dependencies ?? {}).flat();
  const minecraftVersions = dependencyGroups
    .filter((dep) => normalizeDependencyId(dep.modId ?? "") === "minecraft" && dep.versionRange)
    .map((dep) => dep.versionRange as string);
  const loader: ModLoader = readZipText(zip, "META-INF/neoforge.mods.toml") || filename.toLowerCase().includes("neoforge") ? "neoforge" : "forge";

  return {
    id,
    name: firstMod?.displayName ?? id,
    filename,
    version: firstMod?.version ?? "unknown",
    minecraftVersions,
    loaders: [loader],
    dependencies: dependencyGroups
      .filter((dep) => dep.mandatory !== false && dep.type !== "incompatible")
      .map((dep) => dep.modId)
      .filter((depId): depId is string => Boolean(depId))
      .map(normalizeDependencyId)
      .filter((depId) => !isRuntimeDependency(depId)),
    conflicts: dependencyGroups
      .filter((dep) => dep.type === "incompatible")
      .map((dep) => dep.modId)
      .filter((depId): depId is string => Boolean(depId))
      .map(normalizeDependencyId)
      .filter((depId) => !isRuntimeDependency(depId)),
    dependencyRanges: Object.fromEntries(
      dependencyGroups
        .filter((dep) => dep.mandatory !== false && dep.type !== "incompatible" && dep.modId)
        .map((dep) => [normalizeDependencyId(dep.modId as string), dep.versionRange ? [dep.versionRange] : []])
        .filter(([depId]) => !isRuntimeDependency(String(depId))),
    ),
    conflictRanges: Object.fromEntries(
      dependencyGroups
        .filter((dep) => dep.type === "incompatible" && dep.modId)
        .map((dep) => [normalizeDependencyId(dep.modId as string), dep.versionRange ? [dep.versionRange] : []])
        .filter(([depId]) => !isRuntimeDependency(String(depId))),
    ),
    provides: [],
    enabled: !filename.endsWith(".disabled"),
    source: "local",
  };
}

function collectNestedProvides(zip: AdmZip): string[] {
  const provided = new Set<string>();
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory || !entry.entryName.endsWith(".jar")) continue;
    try {
      const nestedZip = new AdmZip(entry.getData());
      const nestedName = path.basename(entry.entryName);
      const detected = fabricMod(nestedZip, nestedName) ?? quiltMod(nestedZip, nestedName) ?? forgeMod(nestedZip, nestedName);
      if (detected) {
        provided.add(detected.id);
        provided.add(detected.name);
      } else {
        provided.add(nestedName.replace(/\.jar$/, ""));
      }
    } catch {
      provided.add(path.basename(entry.entryName).replace(/\.jar$/, ""));
    }
  }
  return Array.from(provided).map(normalizeDependencyId);
}

export function scanModJar(filePath: string): Mod {
  const filename = path.basename(filePath);
  try {
    const zip = new AdmZip(filePath);
    const nestedProvides = collectNestedProvides(zip);
    const detected = [fabricMod(zip, filename), quiltMod(zip, filename), forgeMod(zip, filename)].filter((mod): mod is Mod => Boolean(mod));
    if (detected.length === 0) return { ...fallbackMod(filename), provides: nestedProvides };

    const [primary] = detected;
    return {
      ...primary,
      loaders: Array.from(new Set(detected.flatMap((mod) => mod.loaders))),
      minecraftVersions: Array.from(new Set(detected.flatMap((mod) => mod.minecraftVersions))),
      dependencies: Array.from(new Set(detected.flatMap((mod) => mod.dependencies))),
      conflicts: Array.from(new Set(detected.flatMap((mod) => mod.conflicts))),
      dependencyRanges: detected.reduce<Record<string, string[]>>((ranges, mod) => ({ ...ranges, ...mod.dependencyRanges }), {}),
      conflictRanges: detected.reduce<Record<string, string[]>>((ranges, mod) => ({ ...ranges, ...mod.conflictRanges }), {}),
      provides: Array.from(new Set([...detected.flatMap((mod) => mod.provides ?? []), ...nestedProvides])),
    };
  } catch (error) {
    return fallbackMod(filename, error);
  }
}
