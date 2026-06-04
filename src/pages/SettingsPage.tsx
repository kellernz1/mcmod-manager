import { useEffect, useState } from "react";
import { FolderOpen } from "lucide-react";
import { useI18n } from "../i18n";
import { useSettingsStore, type Language } from "../store/useSettingsStore";

type LauncherInfo = {
  id: string;
  name: string;
  path: string;
  found: boolean;
};

export function SettingsPage() {
  const { t } = useI18n();
  const {
    theme,
    language,
    javaPath,
    automaticBackup,
    setTheme,
    setLanguage,
    setJavaPath,
    setAutomaticBackup,
  } = useSettingsStore();
  const [launchers, setLaunchers] = useState<LauncherInfo[]>([]);

  useEffect(() => {
    window.modforge.detectLaunchers().then(setLaunchers);
  }, []);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold">Settings</h2>
        <p className="mt-2 text-sm text-terminal-muted">{t.settingsSubtitle}</p>
      </header>
      <section className="rounded-lg border border-terminal-line bg-terminal-panel p-5">
        <h3 className="text-lg font-semibold">{t.launchers}</h3>
        <div className="mt-4 space-y-3">
          {launchers.map((launcher) => (
            <div key={launcher.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded border border-terminal-line bg-terminal-panel2 p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{launcher.name}</p>
                <p className="truncate text-xs text-terminal-muted">{launcher.path}</p>
              </div>
              <span className={`rounded px-2 py-1 text-xs ${launcher.found ? "bg-emerald-500/15 text-emerald-200" : "bg-zinc-700 text-zinc-300"}`}>
                {launcher.found ? t.found : t.missing}
              </span>
              <button title={t.openFolder} onClick={() => window.modforge.openFolder(launcher.path)} className="rounded border border-terminal-line p-2 text-terminal-muted transition hover:text-terminal-text">
                <FolderOpen size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
      <section className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border border-terminal-line bg-terminal-panel p-5">
          <h3 className="text-lg font-semibold">{t.theme}</h3>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["dark", "light"] as const).map((item) => (
              <button key={item} onClick={() => setTheme(item)} className={`rounded border px-3 py-2 text-sm transition ${theme === item ? "border-terminal-glow bg-terminal-panel2 text-terminal-text" : "border-terminal-line text-terminal-muted"}`}>
                {item === "dark" ? t.dark : t.light}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-terminal-line bg-terminal-panel p-5">
          <h3 className="text-lg font-semibold">{t.language}</h3>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["en", "pt"] as const).map((item) => (
              <button key={item} onClick={() => setLanguage(item as Language)} className={`rounded border px-3 py-2 text-sm transition ${language === item ? "border-terminal-glow bg-terminal-panel2 text-terminal-text" : "border-terminal-line text-terminal-muted"}`}>
                {item === "en" ? t.english : t.portuguese}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-6">
        <div className="rounded-lg border border-terminal-line bg-terminal-panel p-5">
          <h3 className="text-lg font-semibold">{t.backups}</h3>
          <label className="mt-4 flex items-center justify-between rounded border border-terminal-line bg-terminal-panel2 px-3 py-2 text-sm">
            {t.automaticBackup}
            <input type="checkbox" checked={automaticBackup} onChange={(event) => setAutomaticBackup(event.target.checked)} className="h-4 w-4 accent-terminal-glow" />
          </label>
        </div>
        <div className="rounded-lg border border-terminal-line bg-terminal-panel p-5">
          <h3 className="text-lg font-semibold">Java</h3>
          <input value={javaPath} onChange={(event) => setJavaPath(event.target.value)} placeholder="C:\\Program Files\\Java\\bin\\java.exe" className="mt-4 w-full rounded border border-terminal-line bg-terminal-panel2 px-3 py-2 text-sm outline-none focus:border-terminal-glow" />
        </div>
      </section>
    </div>
  );
}
