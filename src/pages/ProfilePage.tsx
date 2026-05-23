import { Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { LoaderBadge } from "../components/LoaderBadge";
import { ProfileCard } from "../components/ProfileCard";
import { VersionSelector } from "../components/VersionSelector";
import { useI18n } from "../i18n";
import { detectConflicts } from "../services/conflictDetector";
import { getDefaultModsPath, minecraftVersions, modLoaders } from "../services/profileService";
import { useModStore } from "../store/useModStore";
import { useProfileStore } from "../store/useProfileStore";
import type { ModLoader, Profile } from "../types/Profile";

const emptyProfile = (name = "New profile"): Profile => ({
  id: crypto.randomUUID(),
  name,
  minecraftVersion: minecraftVersions[5] ?? "1.20.1",
  loader: "fabric",
  loaderVersion: "latest",
  modsPath: "",
  enabled: true,
  createdAt: new Date().toISOString(),
});

export function ProfilePage() {
  const { language, t } = useI18n();
  const { profiles, activeProfileId, setActiveProfile, upsertProfile, removeProfile } = useProfileStore();
  const modsByProfile = useModStore((state) => state.modsByProfile);
  const [draft, setDraft] = useState<Profile>(emptyProfile(t.newProfile));
  const isEditing = useMemo(() => profiles.some((profile) => profile.id === draft.id), [profiles, draft.id]);

  async function createProfile() {
    const next = emptyProfile(t.newProfile);
    next.modsPath = await getDefaultModsPath();
    setDraft(next);
  }

  function edit(profile: Profile) {
    setDraft(profile);
    setActiveProfile(profile.id);
  }

  function duplicate(profile: Profile) {
    setDraft({
      ...profile,
      id: crypto.randomUUID(),
      name: `${profile.name} ${t.copySuffix}`,
      createdAt: new Date().toISOString(),
    });
  }

  async function save() {
    await upsertProfile(draft);
  }

  return (
    <div className="grid grid-cols-[1fr_380px] gap-8">
      <section className="space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Profiles</h2>
            <p className="mt-2 text-sm text-terminal-muted">{t.profilesSubtitle}</p>
          </div>
          <button onClick={createProfile} className="flex items-center gap-2 rounded bg-terminal-glow px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300">
            <Plus size={16} />
            {t.new}
          </button>
        </header>
        <div className="grid grid-cols-2 gap-4">
          {profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              active={profile.id === activeProfileId}
              conflictCount={detectConflicts(modsByProfile[profile.id] ?? [], profile, language).length}
              onSelect={() => setActiveProfile(profile.id)}
              onEdit={() => edit(profile)}
              onDuplicate={() => duplicate(profile)}
              onDelete={() => removeProfile(profile.id)}
            />
          ))}
        </div>
      </section>
      <aside className="rounded-lg border border-terminal-line bg-terminal-panel p-5">
        <h3 className="text-lg font-semibold">{isEditing ? t.editProfile : t.createProfile}</h3>
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase text-terminal-muted">{t.name}</span>
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-2 w-full rounded border border-terminal-line bg-terminal-panel2 px-3 py-2 text-sm outline-none focus:border-terminal-glow" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-terminal-muted">Minecraft</span>
            <div className="mt-2">
              <VersionSelector value={draft.minecraftVersion} onChange={(minecraftVersion) => setDraft({ ...draft, minecraftVersion })} />
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-terminal-muted">Loader</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {modLoaders.map((loader) => (
                <button
                  key={loader}
                  onClick={() => setDraft({ ...draft, loader })}
                  className={`rounded border px-3 py-2 text-left transition ${draft.loader === loader ? "border-terminal-glow bg-terminal-panel2" : "border-terminal-line"}`}
                >
                  <LoaderBadge loader={loader as ModLoader} />
                </button>
              ))}
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-terminal-muted">{t.loaderVersion}</span>
            <input value={draft.loaderVersion} onChange={(event) => setDraft({ ...draft, loaderVersion: event.target.value })} className="mt-2 w-full rounded border border-terminal-line bg-terminal-panel2 px-3 py-2 text-sm outline-none focus:border-terminal-glow" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase text-terminal-muted">{t.modsPath}</span>
            <input value={draft.modsPath} onChange={(event) => setDraft({ ...draft, modsPath: event.target.value })} className="mt-2 w-full rounded border border-terminal-line bg-terminal-panel2 px-3 py-2 text-sm outline-none focus:border-terminal-glow" />
          </label>
          <label className="flex items-center justify-between rounded border border-terminal-line bg-terminal-panel2 px-3 py-2 text-sm">
            {t.activeProfile}
            <input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} className="h-4 w-4 accent-terminal-glow" />
          </label>
          <button onClick={save} className="flex w-full items-center justify-center gap-2 rounded bg-terminal-glow px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300">
            <Save size={16} />
            {t.save}
          </button>
        </div>
      </aside>
    </div>
  );
}
