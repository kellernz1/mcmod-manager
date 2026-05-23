import { ShieldCheck, Wrench } from "lucide-react";
import { ConflictList } from "../components/ConflictList";
import { useI18n } from "../i18n";
import { detectConflicts } from "../services/conflictDetector";
import { useModStore } from "../store/useModStore";
import { useProfileStore } from "../store/useProfileStore";
import type { Conflict } from "../types/Conflict";

export function ConflictCenterPage() {
  const { language, t } = useI18n();
  const { profiles, activeProfileId } = useProfileStore();
  const { modsByProfile, setMods } = useModStore();
  const profile = profiles.find((item) => item.id === activeProfileId) ?? profiles[0];
  const mods = profile ? modsByProfile[profile.id] ?? [] : [];
  const conflicts = profile ? detectConflicts(mods, profile, language) : [];
  const errors = conflicts.filter((conflict) => conflict.severity === "error");
  const warnings = conflicts.filter((conflict) => conflict.severity === "warning");
  const conflictedIds = new Set(conflicts.flatMap((conflict) => conflict.modIds));
  const cleanCount = mods.filter((mod) => !conflictedIds.has(mod.id)).length;
  const score = mods.length === 0 ? 100 : Math.round((cleanCount / mods.length) * 100);

  async function fix(conflict: Conflict) {
    if (!profile || !conflict.autoFixAvailable) return;
    if (conflict.type === "duplicate_mod") {
      const keep = conflict.modIds[0];
      await setMods(profile.id, mods.filter((mod) => !conflict.modIds.includes(mod.id) || mod.id === keep));
      return;
    }
    if (conflict.type === "wrong_minecraft_version" || conflict.type === "missing_dependency") {
      await setMods(profile.id, mods.map((mod) => (conflict.modIds.includes(mod.id) ? { ...mod, enabled: false } : mod)));
    }
  }

  async function fixAll() {
    for (const conflict of conflicts.filter((item) => item.autoFixAvailable)) {
      await fix(conflict);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Conflict Center</h2>
          <p className="mt-2 text-sm text-terminal-muted">{t.conflictSubtitle}</p>
        </div>
        <button onClick={fixAll} disabled={!conflicts.some((item) => item.autoFixAvailable)} className="flex items-center gap-2 rounded bg-terminal-glow px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-50">
          <Wrench size={16} />
          {t.fixAll}
        </button>
      </header>
      <section className="rounded-lg border border-terminal-line bg-terminal-panel p-5">
        <div className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded bg-terminal-panel2 text-terminal-glow">
            <ShieldCheck size={28} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t.compatibilityScore}</h3>
              <span className="text-2xl font-bold text-terminal-glow">{score}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded bg-terminal-panel2">
              <div className="h-full rounded bg-terminal-glow transition-all" style={{ width: `${score}%` }} />
            </div>
          </div>
        </div>
      </section>
      <div className="grid grid-cols-2 gap-6">
        <ConflictList title={t.criticalErrors} conflicts={errors} tone="error" onFix={fix} />
        <ConflictList title={t.warnings} conflicts={warnings} tone="warning" onFix={fix} />
      </div>
    </div>
  );
}
