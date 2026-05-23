import { CircleAlert, Wrench } from "lucide-react";
import { useI18n } from "../i18n";
import type { Conflict } from "../types/Conflict";

type ConflictListProps = {
  title: string;
  conflicts: Conflict[];
  tone: "error" | "warning";
  onFix: (conflict: Conflict) => void;
};

export function ConflictList({ title, conflicts, tone, onFix }: ConflictListProps) {
  const { t } = useI18n();
  const toneClasses = tone === "error" ? "text-red-200 bg-red-500/10 ring-red-400/20" : "text-amber-200 bg-amber-500/10 ring-amber-400/20";

  return (
    <section className="rounded-lg border border-terminal-line bg-terminal-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-terminal-text">{title}</h2>
        <span className={`rounded px-2 py-1 text-xs font-bold ring-1 ${toneClasses}`}>{conflicts.length}</span>
      </div>
      <div className="space-y-3">
        {conflicts.length === 0 && <p className="text-sm text-terminal-muted">{t.noConflicts}</p>}
        {conflicts.map((conflict) => (
          <div key={conflict.id} className="flex items-center gap-3 rounded border border-terminal-line bg-terminal-panel2 p-3">
            <CircleAlert className={tone === "error" ? "text-red-300" : "text-amber-300"} size={18} />
            <p className="min-w-0 flex-1 text-sm text-terminal-text">{conflict.message}</p>
            {conflict.autoFixAvailable && (
              <button title={t.fix} onClick={() => onFix(conflict)} className="rounded border border-terminal-line p-2 text-terminal-muted transition hover:text-terminal-text">
                <Wrench size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
