import type { ModLoader } from "../types/Profile";

const colors: Record<ModLoader, string> = {
  fabric: "bg-blue-500/15 text-blue-200 ring-blue-400/30",
  forge: "bg-orange-500/15 text-orange-200 ring-orange-400/30",
  quilt: "bg-purple-500/15 text-purple-200 ring-purple-400/30",
  neoforge: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
};

export function LoaderBadge({ loader }: { loader: ModLoader }) {
  return (
    <span className={`inline-flex items-center rounded px-2 py-1 text-xs font-semibold uppercase ring-1 ${colors[loader]}`}>
      {loader}
    </span>
  );
}
