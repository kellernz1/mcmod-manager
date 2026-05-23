import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, FolderKanban, Gauge, Settings, Search } from "lucide-react";
import { DashboardPage } from "./pages/DashboardPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ModBrowserPage } from "./pages/ModBrowserPage";
import { ConflictCenterPage } from "./pages/ConflictCenterPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useProfileStore } from "./store/useProfileStore";
import { useModStore } from "./store/useModStore";
import { useSettingsStore } from "./store/useSettingsStore";
import { useI18n } from "./i18n";

type Page = "dashboard" | "profiles" | "mods" | "conflicts" | "settings";

const navItems: Array<{ id: Page; labelKey: "navDashboard" | "navProfiles" | "navMods" | "navConflicts" | "navSettings"; icon: typeof Gauge }> = [
  { id: "dashboard", labelKey: "navDashboard", icon: Gauge },
  { id: "profiles", labelKey: "navProfiles", icon: FolderKanban },
  { id: "mods", labelKey: "navMods", icon: Search },
  { id: "conflicts", labelKey: "navConflicts", icon: AlertTriangle },
  { id: "settings", labelKey: "navSettings", icon: Settings },
];

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const { profiles, activeProfileId, hydrateProfiles } = useProfileStore();
  const { syncFromDisk } = useModStore();
  const theme = useSettingsStore((state) => state.theme);
  const { t } = useI18n();
  const activeProfile = useMemo(() => profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0], [profiles, activeProfileId]);

  useEffect(() => {
    hydrateProfiles();
  }, [hydrateProfiles]);

  useEffect(() => {
    if (activeProfile) {
      syncFromDisk(activeProfile.id, activeProfile.modsPath, {
        minecraftVersion: activeProfile.minecraftVersion,
        loader: activeProfile.loader,
      });
    }
  }, [activeProfile?.id, activeProfile?.modsPath, activeProfile?.minecraftVersion, activeProfile?.loader, syncFromDisk]);

  useEffect(() => {
    if (!activeProfile) return;

    const syncActiveProfile = () => {
      syncFromDisk(activeProfile.id, activeProfile.modsPath, {
        minecraftVersion: activeProfile.minecraftVersion,
        loader: activeProfile.loader,
      });
    };

    const intervalId = window.setInterval(syncActiveProfile, 30000);
    window.addEventListener("focus", syncActiveProfile);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", syncActiveProfile);
    };
  }, [activeProfile?.id, activeProfile?.modsPath, activeProfile?.minecraftVersion, activeProfile?.loader, syncFromDisk]);

  const content = {
    dashboard: <DashboardPage goTo={setPage} />,
    profiles: <ProfilePage />,
    mods: <ModBrowserPage />,
    conflicts: <ConflictCenterPage />,
    settings: <SettingsPage />,
  }[page];

  return (
    <div className={theme === "dark" ? "theme-dark dark" : "theme-light"}>
      <main className="flex h-screen overflow-hidden bg-terminal-bg text-terminal-text">
        <aside className="flex w-64 shrink-0 flex-col border-r border-terminal-line bg-terminal-sidebar/20">
          <div className="flex h-16 items-center gap-3 border-b border-terminal-line px-5">
            <div className="grid h-9 w-9 place-items-center rounded bg-terminal-glow text-zinc-950">
              <Boxes size={20} />
            </div>
            <div>
              <h1 className="text-sm font-bold">MCMod Manager</h1>
              <p className="text-xs text-terminal-muted">Minecraft mods</p>
            </div>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = page === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setPage(item.id)}
                  className={`flex w-full items-center gap-3 rounded px-3 py-2 text-sm transition ${
                    active ? "bg-terminal-panel2 text-terminal-text" : "text-terminal-muted hover:bg-terminal-panel hover:text-terminal-text"
                  }`}
                >
                  <Icon size={18} />
                  {t[item.labelKey]}
                </button>
              );
            })}
          </nav>
          <div className="border-t border-terminal-line p-4 text-xs text-terminal-muted">
            {activeProfile ? activeProfile.name : t.noActiveProfile}
          </div>
        </aside>
        <section className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl p-8 transition-opacity duration-200">{content}</div>
        </section>
      </main>
    </div>
  );
}
