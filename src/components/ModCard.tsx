import { Download, Power, Trash2 } from "lucide-react";
import { useI18n } from "../i18n";
import type { Mod, ModrinthSearchResult } from "../types/Mod";
import { LoaderBadge } from "./LoaderBadge";

type InstalledModCardProps = {
  mod: Mod;
  onToggle?: () => void;
  onDelete?: () => void;
};

type BrowserModCardProps = {
  result: ModrinthSearchResult;
  onInstall: () => void;
  installing?: boolean;
};

export function InstalledModCard({ mod, onToggle, onDelete }: InstalledModCardProps) {
  const { t } = useI18n();

  return (
    <article className="rounded-lg border border-terminal-line bg-terminal-panel p-4 transition hover:border-terminal-glow/50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-terminal-text">{mod.name}</h3>
          <p className="mt-1 truncate text-xs text-terminal-muted">{mod.filename}</p>
        </div>
        <span className={`rounded px-2 py-1 text-xs ${mod.enabled ? "bg-emerald-500/15 text-emerald-200" : "bg-zinc-700 text-zinc-300"}`}>
          {mod.enabled ? t.active : t.disabled}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {mod.loaders.slice(0, 3).map((loader) => <LoaderBadge key={loader} loader={loader} />)}
      </div>
      <div className="mt-4 flex items-center gap-2">
        {onToggle && (
          <button title={t.toggle} onClick={onToggle} className="rounded border border-terminal-line p-2 text-terminal-muted transition hover:text-terminal-text">
            <Power size={16} />
          </button>
        )}
        {onDelete && (
          <button title={t.remove} onClick={onDelete} className="rounded border border-red-400/30 p-2 text-red-200 transition hover:bg-red-500/10">
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </article>
  );
}

export function BrowserModCard({ result, onInstall, installing }: BrowserModCardProps) {
  const { t, language } = useI18n();

  return (
    <article className="grid grid-cols-[48px_1fr_auto] gap-4 rounded-lg border border-terminal-line bg-terminal-panel p-4 transition hover:-translate-y-0.5 hover:border-terminal-glow/60">
      <div className="h-12 w-12 overflow-hidden rounded bg-terminal-panel2">
        {result.icon_url ? <img src={result.icon_url} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-terminal-text">{result.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-terminal-muted">{result.description}</p>
        <p className="mt-2 text-xs text-zinc-400">{result.downloads.toLocaleString(language === "pt" ? "pt-BR" : "en-US")} {t.downloads}</p>
      </div>
      <button
        onClick={onInstall}
        disabled={installing}
        className="self-center rounded bg-terminal-glow px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60"
      >
        <span className="flex items-center gap-2">
          <Download size={16} />
          {installing ? t.installing : t.install}
        </span>
      </button>
    </article>
  );
}
