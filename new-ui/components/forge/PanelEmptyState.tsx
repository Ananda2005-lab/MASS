// Shared empty-state UI for Forge panels when no backend data is connected yet.
import { Plug } from "lucide-react";

export function PanelEmptyState({
  title,
  hint,
  icon,
}: {
  title: string;
  hint: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2.5 p-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-dashed border-white/15 text-slate2-muted">
        {icon ?? <Plug size={18} />}
      </span>
      <p className="text-xs2 font-medium text-slate2-secondary">{title}</p>
      <p className="max-w-[240px] text-2xs leading-relaxed text-slate2-muted">{hint}</p>
    </div>
  );
}