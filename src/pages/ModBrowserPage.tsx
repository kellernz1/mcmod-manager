import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserModCard, InstalledModCard } from "../components/ModCard";
import { VersionSelector } from "../components/VersionSelector";
import { useI18n } from "../i18n";
import { installModrinthProjectWithDependencies } from "../services/modInstaller";
import { searchMods } from "../services/modrinthApi";
import { modLoaders } from "../services/profileService";
import { useModStore } from "../store/useModStore";
import { useProfileStore } from "../store/useProfileStore";
import type { ModrinthSearchResult } from "../types/Mod";
import type { ModLoader } from "../types/Profile";

function joinPath(base: string, file: string) {
  const separator = base.includes("\\") ? "\\" : "/";
  return `${base.replace(/[\\/]+$/, "")}${separator}${file}`;
}

export function ModBrowserPage() {
  const { t } = useI18n();
  const { profiles, activeProfileId } = useProfileStore();
  const { modsByProfile, setMods, syncFromDisk } = useModStore();
  const activeProfile = useMemo(() => profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0], [profiles, activeProfileId]);
  const installed = activeProfile ? modsByProfile[activeProfile.id] ?? [] : [];
  const [query, setQuery] = useState("");
  const [loader, setLoader] = useState<ModLoader>(activeProfile?.loader ?? "fabric");
  const [version, setVersion] = useState(activeProfile?.minecraftVersion ?? "1.20.1");
  const [results, setResults] = useState<ModrinthSearchResult[]>([]);
  const [installing, setInstalling] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  async function runSearch(searchQuery = query, sortIndex = query.trim() ? "relevance" : "downloads", nextOffset = 0, append = false) {
    if (loading) return;
    setLoading(true);
    setStatus(t.searchingModrinth);
    try {
      const hits = await searchMods(searchQuery, loader, version, sortIndex, nextOffset);
      setResults((current) => (append ? [...current, ...hits] : hits));
      setOffset(nextOffset + hits.length);
      setHasMore(hits.length === 24);
      setStatus(`${append ? results.length + hits.length : hits.length} ${t.resultsFound}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void runSearch("", "downloads");
  }, [loader, version]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && hasMore && !loading) {
        void runSearch(query, query.trim() ? "relevance" : "downloads", offset, true);
      }
    }, { rootMargin: "320px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, offset, query, loader, version]);

  async function install(result: ModrinthSearchResult) {
    if (!activeProfile) return;
    setInstalling(result.project_id);
    try {
      const installedMods = await installModrinthProjectWithDependencies(result.project_id, { ...activeProfile, loader, minecraftVersion: version }, installed);
      const renamedMods = installedMods.map((mod) => (mod.id === result.project_id ? { ...mod, name: result.title } : mod));
      const nextMods = [...renamedMods, ...installed.filter((mod) => !renamedMods.some((installedMod) => installedMod.id === mod.id))];
      await setMods(activeProfile.id, nextMods);
      await syncFromDisk(activeProfile.id, activeProfile.modsPath, {
        minecraftVersion: activeProfile.minecraftVersion,
        loader: activeProfile.loader,
      });
      setStatus(`${result.title} ${t.installedStatus} ${renamedMods.length > 1 ? `${renamedMods.length - 1} ${t.dependenciesInstalled}` : ""}`);
    } finally {
      setInstalling(null);
    }
  }

  async function toggle(filename: string) {
    if (!activeProfile) return;
    await window.modforge.toggleMod(joinPath(activeProfile.modsPath, filename));
    await syncFromDisk(activeProfile.id, activeProfile.modsPath, {
      minecraftVersion: activeProfile.minecraftVersion,
      loader: activeProfile.loader,
    });
  }

  async function remove(filename: string) {
    if (!activeProfile) return;
    await window.modforge.deleteMod(joinPath(activeProfile.modsPath, filename), activeProfile.id);
    await syncFromDisk(activeProfile.id, activeProfile.modsPath, {
      minecraftVersion: activeProfile.minecraftVersion,
      loader: activeProfile.loader,
    });
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold">Mod Browser</h2>
        <p className="mt-2 text-sm text-terminal-muted">{t.modBrowserSubtitle}</p>
      </header>
      <section className="rounded-lg border border-terminal-line bg-terminal-panel p-5">
        <div className="grid grid-cols-[1fr_180px_180px_auto] gap-3">
          <label className="relative">
            <Search className="absolute left-3 top-2.5 text-terminal-muted" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" && runSearch()} placeholder={t.searchMods} className="w-full rounded border border-terminal-line bg-terminal-panel2 py-2 pl-10 pr-3 text-sm outline-none focus:border-terminal-glow" />
          </label>
          <select value={loader} onChange={(event) => setLoader(event.target.value as ModLoader)} className="rounded border border-terminal-line bg-terminal-panel2 px-3 py-2 text-sm outline-none focus:border-terminal-glow">
            {modLoaders.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <VersionSelector value={version} onChange={setVersion} />
          <button onClick={() => runSearch()} className="rounded bg-terminal-glow px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300">{t.search}</button>
        </div>
        {status && <p className="mt-3 text-sm text-terminal-muted">{status}</p>}
      </section>
      <div className="grid grid-cols-[1.2fr_0.8fr] gap-6">
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Modrinth</h3>
          {results.map((result) => (
            <BrowserModCard key={result.project_id} result={result} installing={installing === result.project_id} onInstall={() => install(result)} />
          ))}
          <div ref={loadMoreRef} className="py-3 text-center text-sm text-terminal-muted">
            {loading ? t.loadingMore : hasMore ? "" : t.noMoreResults}
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">{t.installed}</h3>
          {installed.map((mod) => (
            <InstalledModCard key={`${mod.id}-${mod.filename}`} mod={mod} onToggle={() => toggle(mod.filename)} onDelete={() => remove(mod.filename)} />
          ))}
        </section>
      </div>
    </div>
  );
}
