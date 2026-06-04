import { Download, PackageOpen } from "lucide-react";
import { useI18n } from "../i18n";
import type { ModpackSearchResult } from "../types/Modpack";
import { LoaderBadge } from "./LoaderBadge";

type ModpackCardProps = {
  pack: ModpackSearchResult;
  installing?: boolean;
  onInstall: () => void;
};

export function ModpackCard({ pack, installing, onInstall }: ModpackCardProps) {
  const { t, language } = useI18n();

  return (
    <article className="grid grid-cols-[56px_1fr_auto] gap-4 rounded-lg border border-terminal-line bg-terminal-panel p-4 transition hover:-translate-y-0.5 hover:border-terminal-glow/60">
      <div className="grid h-14 w-14 place-items-center overflow-hidden rounded bg-terminal-panel2">
        {pack.iconUrl ? <img src={pack.iconUrl} alt="" className="h-full w-full object-cover" /> : <PackageOpen size={22} className="text-terminal-muted" />}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-terminal-text">{pack.title}</h3>
          <span className="rounded bg-terminal-panel2 px-2 py-1 text-xs text-terminal-muted ring-1 ring-terminal-line">
            {t.modrinth}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-terminal-muted">{pack.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {pack.loaders.slice(0, 3).map((loader) => <LoaderBadge key={loader} loader={loader} />)}
          <span className="rounded bg-zinc-700/60 px-2 py-1 text-xs text-zinc-200">
            {pack.downloads.toLocaleString(language === "pt" ? "pt-BR" : "en-US")} {t.downloads}
          </span>
        </div>
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
