import { Copy, FolderOpen, Pencil, Trash2 } from "lucide-react";
import { useI18n } from "../i18n";
import type { Profile } from "../types/Profile";
import { LoaderBadge } from "./LoaderBadge";

type ProfileCardProps = {
  profile: Profile;
  active: boolean;
  conflictCount: number;
  onSelect: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function ProfileCard({ profile, active, conflictCount, onSelect, onEdit, onDuplicate, onDelete }: ProfileCardProps) {
  const { t } = useI18n();

  return (
    <article
      onClick={onSelect}
      className={`rounded-lg border p-4 transition hover:-translate-y-0.5 hover:border-terminal-glow/60 ${
        active ? "border-terminal-glow bg-terminal-panel2 shadow-glow" : "border-terminal-line bg-terminal-panel"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-terminal-text">{profile.name}</h3>
          <p className="mt-1 truncate text-xs text-terminal-muted">{profile.modsPath}</p>
        </div>
        {conflictCount > 0 && (
          <span className="rounded bg-red-500/20 px-2 py-1 text-xs font-bold text-red-200 ring-1 ring-red-400/30">
            {conflictCount}
          </span>
        )}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <LoaderBadge loader={profile.loader} />
        <span className="rounded bg-zinc-700/60 px-2 py-1 text-xs text-zinc-200">{profile.minecraftVersion}</span>
        <span className="rounded bg-zinc-700/60 px-2 py-1 text-xs text-zinc-200">{profile.loaderVersion}</span>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button title={t.edit} onClick={(event) => { event.stopPropagation(); onEdit(); }} className="rounded border border-terminal-line p-2 text-terminal-muted transition hover:text-terminal-text">
          <Pencil size={16} />
        </button>
        <button title={t.duplicate} onClick={(event) => { event.stopPropagation(); onDuplicate(); }} className="rounded border border-terminal-line p-2 text-terminal-muted transition hover:text-terminal-text">
          <Copy size={16} />
        </button>
        <button title={t.openFolder} onClick={(event) => { event.stopPropagation(); window.modforge.openFolder(profile.modsPath); }} className="rounded border border-terminal-line p-2 text-terminal-muted transition hover:text-terminal-text">
          <FolderOpen size={16} />
        </button>
        <button title={t.delete} onClick={(event) => { event.stopPropagation(); onDelete(); }} className="ml-auto rounded border border-red-400/30 p-2 text-red-200 transition hover:bg-red-500/10">
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
