import { AlertOctagon, FolderOpen, Play, RefreshCw } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { ProfileCard } from "../components/ProfileCard";
import { useI18n } from "../i18n";
import { detectConflicts } from "../services/conflictDetector";
import { useModStore } from "../store/useModStore";
import { useProfileStore } from "../store/useProfileStore";

type Page = "dashboard" | "profiles" | "mods" | "modpacks" | "resources" | "shaders" | "conflicts" | "settings";

export function DashboardPage({ goTo }: { goTo: Dispatch<SetStateAction<Page>> }) {
  const { language, t } = useI18n();
  const { profiles, activeProfileId, setActiveProfile, removeProfile, upsertProfile } = useProfileStore();
  const modsByProfile = useModStore((state) => state.modsByProfile);
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0];
  const activeMods = activeProfile ? (modsByProfile[activeProfile.id] ?? []).filter((mod) => mod.enabled) : [];
  const conflicts = activeProfile ? detectConflicts(modsByProfile[activeProfile.id] ?? [], activeProfile, language) : [];
  const critical = conflicts.filter((conflict) => conflict.severity === "error").length;

  const cards = [
    { label: "Profiles", value: profiles.length, icon: FolderOpen },
    { label: t.activeMods, value: activeMods.length, icon: Play },
    { label: t.criticalConflicts, value: critical, icon: AlertOctagon },
    { label: t.updates, value: 0, icon: RefreshCw },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-normal">Dashboard</h2>
          <p className="mt-2 text-sm text-terminal-muted">{t.dashboardSubtitle}</p>
        </div>
        <button
          onClick={() => activeProfile && window.modforge.openFolder(activeProfile.modsPath)}
          disabled={!activeProfile}
          className="flex items-center gap-2 rounded bg-terminal-glow px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:opacity-50"
        >
          <Play size={16} />
          Launch Minecraft
        </button>
      </header>
      <div className="grid grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-lg border border-terminal-line bg-terminal-panel p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-terminal-muted">{card.label}</p>
                <Icon size={18} className="text-terminal-glow" />
              </div>
              <p className="mt-4 text-3xl font-bold">{card.value}</p>
            </div>
          );
        })}
      </div>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t.recentProfiles}</h3>
          <button onClick={() => goTo("profiles")} className="text-sm text-terminal-glow hover:text-emerald-300">{t.manage}</button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {profiles.slice(0, 6).map((profile) => {
            const conflictCount = detectConflicts(modsByProfile[profile.id] ?? [], profile, language).length;
            return (
              <ProfileCard
                key={profile.id}
                profile={profile}
                active={profile.id === activeProfile?.id}
                conflictCount={conflictCount}
                onSelect={() => setActiveProfile(profile.id)}
                onEdit={() => goTo("profiles")}
                onDuplicate={() => upsertProfile({ ...profile, id: crypto.randomUUID(), name: `${profile.name} ${t.copySuffix}`, createdAt: new Date().toISOString() })}
                onDelete={() => removeProfile(profile.id)}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
