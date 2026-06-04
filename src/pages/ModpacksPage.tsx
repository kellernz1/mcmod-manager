import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ModpackCard } from "../components/ModpackCard";
import { VersionSelector } from "../components/VersionSelector";
import { useI18n } from "../i18n";
import { getModrinthModpackVersions, searchModrinthModpacks } from "../services/modpackApi";
import { modLoaders } from "../services/profileService";
import { useModStore } from "../store/useModStore";
import { useProfileStore } from "../store/useProfileStore";
import type { ModLoader } from "../types/Profile";
import type { ModpackSearchResult } from "../types/Modpack";

export function ModpacksPage() {
  const { t } = useI18n();
  const { profiles, activeProfileId } = useProfileStore();
  const { syncFromDisk } = useModStore();
  const activeProfile = useMemo(() => profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0], [profiles, activeProfileId]);
  const [query, setQuery] = useState("");
  const [loader, setLoader] = useState<ModLoader>(activeProfile?.loader ?? "fabric");
  const [version, setVersion] = useState(activeProfile?.minecraftVersion ?? "1.20.1");
  const [results, setResults] = useState<ModpackSearchResult[]>([]);
  const [installing, setInstalling] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  async function runSearch(searchQuery = query, sortIndex = query.trim() ? "relevance" : "downloads", nextOffset = 0, append = false) {
    if (loading) return;
    setLoading(true);
    setStatus(t.searchingModpacks);
    try {
      const found = await searchModrinthModpacks(searchQuery, loader, version, sortIndex, nextOffset);
      setResults((current) => (append ? [...current, ...found] : found));
      setOffset(nextOffset + found.length);
      setHasMore(found.length === 24);
      setStatus(`${append ? results.length + found.length : found.length} ${t.resultsFound}`);
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

  async function install(pack: ModpackSearchResult) {
    if (!activeProfile) return;
    setInstalling(`${pack.provider}-${pack.id}`);
    try {
      const versions = await getModrinthModpackVersions(pack.id, loader, version);
      const modpackVersion = versions[0];
      const file = modpackVersion?.files.find((item) => item.primary) ?? modpackVersion?.files[0];
      if (!file) throw new Error("No compatible Modrinth modpack file found.");
      const result = await window.modforge.installModpackArchive({
        provider: "modrinth",
        url: file.url,
        filename: file.filename,
        modsPath: activeProfile.modsPath,
      });
      setStatus(`${pack.title} ${t.modpackInstalled} ${result.installed} ${t.installedFiles}, ${result.skipped} ${t.skippedFiles}.`);

      await syncFromDisk(activeProfile.id, activeProfile.modsPath, {
        minecraftVersion: activeProfile.minecraftVersion,
        loader: activeProfile.loader,
      });
    } finally {
      setInstalling(null);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold">Modpacks</h2>
        <p className="mt-2 text-sm text-terminal-muted">{t.modpacksSubtitle}</p>
      </header>
      <section className="rounded-lg border border-terminal-line bg-terminal-panel p-5">
        <div className="grid grid-cols-[1fr_170px_180px_auto] gap-3">
          <label className="relative">
            <Search className="absolute left-3 top-2.5 text-terminal-muted" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && runSearch()}
              placeholder={t.searchModpacks}
              className="w-full rounded border border-terminal-line bg-terminal-panel2 py-2 pl-10 pr-3 text-sm outline-none focus:border-terminal-glow"
            />
          </label>
          <select value={loader} onChange={(event) => setLoader(event.target.value as ModLoader)} className="rounded border border-terminal-line bg-terminal-panel2 px-3 py-2 text-sm outline-none focus:border-terminal-glow">
            {modLoaders.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <VersionSelector value={version} onChange={setVersion} />
          <button onClick={() => runSearch()} className="rounded bg-terminal-glow px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300">{t.search}</button>
        </div>
        {status && <p className="mt-3 text-sm text-terminal-muted">{status}</p>}
      </section>
      <section className="space-y-3">
        {results.map((pack) => (
          <ModpackCard
            key={`${pack.provider}-${pack.id}`}
            pack={pack}
            installing={installing === `${pack.provider}-${pack.id}`}
            onInstall={() => install(pack)}
          />
        ))}
        <div ref={loadMoreRef} className="py-3 text-center text-sm text-terminal-muted">
          {loading ? t.loadingMore : hasMore ? "" : t.noMoreResults}
        </div>
      </section>
    </div>
  );
}
