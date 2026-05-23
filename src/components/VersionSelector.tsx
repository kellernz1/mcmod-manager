import { minecraftVersions } from "../services/profileService";

type VersionSelectorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function VersionSelector({ value, onChange }: VersionSelectorProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded border border-terminal-line bg-terminal-panel px-3 py-2 text-sm text-terminal-text outline-none transition focus:border-terminal-glow"
    >
      {minecraftVersions.map((version) => (
        <option key={version} value={version}>
          Minecraft {version}
        </option>
      ))}
    </select>
  );
}
