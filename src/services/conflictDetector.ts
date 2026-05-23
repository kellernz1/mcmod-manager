import type { Conflict } from "../types/Conflict";
import type { Mod } from "../types/Mod";
import type { Profile } from "../types/Profile";
import { getTranslations } from "../i18n";
import type { Language } from "../store/useSettingsStore";

function versionParts(version: string): number[] {
  return version
    .split(".")
    .map((part) => Number.parseInt(part.replace(/\D.*/, ""), 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
}

function compareVersions(left: string, right: string): number {
  const leftParts = versionParts(left);
  const rightParts = versionParts(right);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0;
    const rightPart = rightParts[index] ?? 0;
    if (leftPart !== rightPart) return leftPart > rightPart ? 1 : -1;
  }
  return 0;
}

function isMinorVersionFamily(version: string): boolean {
  return /^\d+\.\d+$/.test(version.trim());
}

function sameMinorVersionFamily(profileVersion: string, targetVersion: string): boolean {
  const cleanTarget = targetVersion.trim();
  return isMinorVersionFamily(cleanTarget) && (profileVersion === cleanTarget || profileVersion.startsWith(`${cleanTarget}.`));
}

function satisfiesComparator(profileVersion: string, comparator: string): boolean {
  const clean = comparator.trim();
  const match = clean.match(/^(>=|<=|>|<|=)?\s*([0-9]+(?:\.[0-9x*]+)*)$/i);
  if (!match) return clean === profileVersion;

  const rawOperator = match[1];
  const operator = rawOperator ?? "=";
  const target = match[2];
  if (sameMinorVersionFamily(profileVersion, target)) {
    return profileVersion === target || profileVersion.startsWith(`${target}.`);
  }
  if (target.includes("x") || target.includes("*")) {
    const prefix = target.split(/[x*]/i)[0].replace(/\.$/, "");
    return profileVersion === prefix || profileVersion.startsWith(`${prefix}.`);
  }

  const comparison = compareVersions(profileVersion, target);
  if (operator === ">") return comparison > 0;
  if (operator === ">=") return comparison >= 0;
  if (operator === "<") return comparison < 0;
  if (operator === "<=") return comparison <= 0;
  return comparison === 0;
}

function satisfiesForgeRange(profileVersion: string, range: string): boolean {
  const exact = range.trim().match(/^\[\s*([0-9]+(?:\.[0-9]+)*)\s*\]$/);
  if (exact) return sameMinorVersionFamily(profileVersion, exact[1]) || compareVersions(profileVersion, exact[1]) === 0;

  const match = range.trim().match(/^([\[(])\s*([^,\])]*?)\s*,\s*([^\])]*?)\s*([\])])$/);
  if (!match) return false;
  const includeMin = match[1] === "[";
  const min = match[2];
  const max = match[3];
  const includeMax = match[4] === "]";

  if (min) {
    const comparison = compareVersions(profileVersion, min);
    if (comparison < 0 || (comparison === 0 && !includeMin)) return false;
  }
  if (max) {
    const comparison = compareVersions(profileVersion, max);
    if (sameMinorVersionFamily(profileVersion, max)) return true;
    // Some Minecraft mod metadata uses an exclusive upper bound equal to the
    // target game version. Treat that boundary as compatible to avoid noisy
    // false positives in local modpacks.
    if (comparison > 0) return false;
    if (comparison === 0 && !includeMax) return true;
  }
  return true;
}

function supportsMinecraftVersion(constraints: string[], profileVersion: string): boolean {
  if (constraints.length === 0) return true;
  return constraints.some((constraint) => {
    const clean = constraint.trim();
    if (!clean || clean === "*" || clean === "any") return true;
    if (clean === profileVersion) return true;
    if (/^[\[(]/.test(clean)) return satisfiesForgeRange(profileVersion, clean);
    if (clean.startsWith("~")) {
      const base = clean.slice(1).trim();
      const profile = versionParts(profileVersion);
      const target = versionParts(base);
      return profile[0] === target[0] && profile[1] === target[1] && compareVersions(profileVersion, base) >= 0;
    }
    if (clean.startsWith("^")) {
      const base = clean.slice(1).trim();
      return versionParts(profileVersion)[0] === versionParts(base)[0] && compareVersions(profileVersion, base) >= 0;
    }
    return clean.split(/\s+/).every((part) => satisfiesComparator(profileVersion, part));
  });
}

function satisfiesVersionConstraints(constraints: string[] | undefined, version: string): boolean {
  if (!constraints || constraints.length === 0) return true;
  if (!version || version === "unknown" || version === "local") return false;
  return supportsMinecraftVersion(constraints, version);
}

function normalizeIdentifier(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.jar(\.disabled)?$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compactIdentifier(value: string): string {
  return normalizeIdentifier(value).replace(/\s+/g, "");
}

function identifierAliases(value: string): string[] {
  const normalized = normalizeIdentifier(value);
  const words = normalized
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !/^\d+(\.\d+)*$/.test(word))
    .filter((word) => !["forge", "neoforge", "fabric", "quilt", "mc", "minecraft", "beta", "alpha", "release"].includes(word));
  const aliases = new Set<string>([normalized, compactIdentifier(value)]);

  for (let end = words.length; end > 0; end -= 1) {
    const phrase = words.slice(0, end).join(" ");
    aliases.add(phrase);
    aliases.add(phrase.replace(/\s+/g, ""));
  }

  return Array.from(aliases).filter(Boolean);
}

function modMatchesDependency(mod: Mod, dependency: string): boolean {
  const dependencyCompact = compactIdentifier(dependency);
  const dependencyWords = normalizeIdentifier(dependency).split(/\s+/).filter(Boolean);
  const dependencyAliases = identifierAliases(dependency);
  const identifiers = [mod.id, mod.name, mod.filename, ...(mod.provides ?? [])].flatMap(identifierAliases);

  if (dependencyAliases.some((alias) => identifiers.includes(alias))) return true;
  if (identifiers.some((alias) => alias === dependencyCompact || alias.startsWith(dependencyCompact) || dependencyCompact.startsWith(alias))) return true;
  if (compactIdentifier(mod.id) && dependencyCompact.startsWith(compactIdentifier(mod.id))) return true;

  const normalizedFilename = normalizeIdentifier(mod.filename);
  const filenameWords = normalizedFilename.split(/\s+/).filter(Boolean);
  return dependencyWords.length > 0 && dependencyWords.every((word) => filenameWords.includes(word));
}

function isLikelyOptionalOrBundledDependency(owner: Mod, dependency: string): boolean {
  const dependencyCompact = compactIdentifier(dependency);
  const ownerCompact = compactIdentifier(owner.id);
  const dependencyName = normalizeIdentifier(dependency);

  if (!dependencyCompact) return true;
  if (ownerCompact && dependencyCompact.startsWith(ownerCompact)) return true;
  if (dependencyName.includes(" api") || dependencyName.endsWith(" api")) return true;
  if (dependencyName.includes(" loader ") || dependencyName.includes(" resource loader")) return true;
  if (dependencyName.includes(" compat") || dependencyName.includes(" compatibility")) return true;
  return false;
}

function shouldReportMissingDependency(owner: Mod, dependency: string): boolean {
  if (owner.source === "local") return false;
  return !isLikelyOptionalOrBundledDependency(owner, dependency);
}

function shouldReportIncompatibility(owner: Mod, conflicting: Mod, ranges: string[] | undefined): boolean {
  if (owner.source === "local" && conflicting.source === "local") return false;
  return Boolean(ranges && ranges.length > 0 && satisfiesVersionConstraints(ranges, conflicting.version));
}

export function detectConflicts(mods: Mod[], profile: Profile, language: Language = "en"): Conflict[] {
  const t = getTranslations(language);
  const conflicts: Conflict[] = [];

  for (const mod of mods) {
    if (mod.version === "corrupted") {
      conflicts.push({
        id: crypto.randomUUID(),
        severity: "error",
        type: "corrupted_file",
        message: t.corruptedFile(mod.filename),
        modIds: [mod.id],
        autoFixAvailable: false,
      });
      continue;
    }

    if (mod.loaders.length > 0 && !mod.loaders.includes(profile.loader)) {
      conflicts.push({
        id: crypto.randomUUID(),
        severity: "error",
        type: "wrong_loader",
        message: t.wrongLoader(mod.name, mod.loaders.join("/"), profile.loader),
        modIds: [mod.id],
        autoFixAvailable: false,
      });
    }

    if (!supportsMinecraftVersion(mod.minecraftVersions, profile.minecraftVersion)) {
      conflicts.push({
        id: crypto.randomUUID(),
        severity: "error",
        type: "wrong_minecraft_version",
        message: t.wrongVersion(mod.name, mod.minecraftVersions.join(", "), profile.minecraftVersion),
        modIds: [mod.id],
        autoFixAvailable: true,
      });
    }

    for (const dep of mod.dependencies) {
      const found = mods.find((m) => modMatchesDependency(m, dep));
      if (!found && shouldReportMissingDependency(mod, dep)) {
        conflicts.push({
          id: crypto.randomUUID(),
          severity: "warning",
          type: "missing_dependency",
          message: t.missingDependency(mod.name, dep),
          modIds: [mod.id],
          autoFixAvailable: true,
        });
      }
    }

    for (const conflictId of mod.conflicts) {
      const conflicting = mods.find((m) => modMatchesDependency(m, conflictId));
      const conflictRanges = mod.conflictRanges?.[conflictId] ?? mod.conflictRanges?.[compactIdentifier(conflictId)];
      if (conflicting && shouldReportIncompatibility(mod, conflicting, conflictRanges)) {
        conflicts.push({
          id: crypto.randomUUID(),
          severity: "error",
          type: "incompatible_mod",
          message: t.incompatible(mod.name, conflicting.name),
          modIds: [mod.id, conflicting.id],
          autoFixAvailable: false,
        });
      }
    }
  }

  const nameCount: Record<string, Mod[]> = {};
  for (const mod of mods) {
    nameCount[mod.name] = [...(nameCount[mod.name] || []), mod];
  }
  for (const [name, dupes] of Object.entries(nameCount)) {
    if (dupes.length > 1) {
      conflicts.push({
        id: crypto.randomUUID(),
        severity: "warning",
        type: "duplicate_mod",
        message: t.duplicateMod(name, dupes.length),
        modIds: dupes.map((m) => m.id),
        autoFixAvailable: true,
      });
    }
  }

  return conflicts;
}
