import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserModCard } from "../components/ModCard";
import { VersionSelector } from "../components/VersionSelector";
import { useI18n } from "../i18n";
import { getShaderPackVersions, searchShaderPacks } from "../services/resourcePackApi";
import { useProfileStore } from "../store/useProfileStore";
import type { ModrinthSearchResult } from "../types/Mod";

function getShaderPacksPath(modsPath: string) {
  const separator = modsPath.includes("\\") ? "\\" : "/";
  const trimmed = modsPath.replace(/[\\/]+$/, "");
  if (/[\\/]mods$/i.test(trimmed)) {
    return trimmed.replace(/[\\/]mods$/i, `${separator}shaderpacks`);
  }
  return `${trimmed}${separator}shaderpacks`;
}

export function ShaderPacksPage() {
  const { t } = useI18n();
  const { profiles, activeProfileId } = useProfileStore();
  const activeProfile = useMemo(() => profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0], [profiles, activeProfileId]);
  const [query, setQuery] = useState("");
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
    setStatus(t.searchingShaders);
    try {
      const found = await searchShaderPacks(searchQuery, version, sortIndex, nextOffset);
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
  }, [version]);

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
  }, [hasMore, loading, offset, query, version]);

  async function install(result: ModrinthSearchResult) {
    if (!activeProfile) return;
    setInstalling(result.project_id);
    try {
      const versions = await getShaderPackVersions(result.project_id, version);
      const packVersion = versions[0];
      const file = packVersion?.files.find((item) => item.primary) ?? packVersion?.files[0];
      if (!file) throw new Error("No compatible shader pack file found.");
      await window.modforge.installDownloadedMod(file.url, file.filename, getShaderPacksPath(activeProfile.modsPath));
      setStatus(`${result.title} ${t.shaderPackInstalled}`);
    } finally {
      setInstalling(null);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold">Shaders</h2>
        <p className="mt-2 text-sm text-terminal-muted">{t.shadersSubtitle}</p>
      </header>
      <section className="rounded-lg border border-terminal-line bg-terminal-panel p-5">
        <div className="grid grid-cols-[1fr_180px_auto] gap-3">
          <label className="relative">
            <Search className="absolute left-3 top-2.5 text-terminal-muted" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && runSearch()}
              placeholder={t.searchShaders}
              className="w-full rounded border border-terminal-line bg-terminal-panel2 py-2 pl-10 pr-3 text-sm outline-none focus:border-terminal-glow"
            />
          </label>
          <VersionSelector value={version} onChange={setVersion} />
          <button onClick={() => runSearch()} className="rounded bg-terminal-glow px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300">{t.search}</button>
        </div>
        {activeProfile && <p className="mt-3 truncate text-xs text-terminal-muted">{t.shaderPacksPath}: {getShaderPacksPath(activeProfile.modsPath)}</p>}
        {status && <p className="mt-3 text-sm text-terminal-muted">{status}</p>}
      </section>
      <section className="space-y-3">
        {results.map((result) => (
          <BrowserModCard key={result.project_id} result={result} installing={installing === result.project_id} onInstall={() => install(result)} />
        ))}
        <div ref={loadMoreRef} className="py-3 text-center text-sm text-terminal-muted">
          {loading ? t.loadingMore : hasMore ? "" : t.noMoreResults}
        </div>
      </section>
    </div>
  );
}
