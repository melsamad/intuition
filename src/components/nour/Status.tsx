import { Check, CircleDashed, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/nour/rules";

export const STATUS_META: Record<Status, { label: string; cls: string; Icon: typeof Check }> = {
  fixed: { label: "Fixed", cls: "bg-fixed-soft text-fixed-foreground border-fixed/50", Icon: Check },
  locked: { label: "Not fixed", cls: "bg-pending-soft text-pending-foreground border-pending/60", Icon: CircleDashed },
  taught_wrong: { label: "Taught wrong", cls: "bg-wrong-soft text-wrong-foreground border-wrong/50", Icon: TriangleAlert },
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const m = STATUS_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", m.cls, className)}>
      <m.Icon className="h-3.5 w-3.5" aria-hidden />
      {m.label}
    </span>
  );
}

export function StatusLegend() {
  return (
    <div className="flex flex-wrap gap-2" aria-label="Legend">
      {(["fixed", "locked", "taught_wrong"] as Status[]).map((s) => (
        <StatusBadge key={s} status={s} />
      ))}
    </div>
  );
}

/** Three-slot understanding meter. Animates only when a slot's server status changes. */
export function UnderstandingMeter({ slots }: { slots: { status: Status; label: string; active: boolean }[] }) {
  return (
    <ol className="flex gap-2 sm:gap-3" aria-label="Jonathan's understanding">
      {slots.map((s, i) => {
        const done = s.status !== "locked";
        return (
          <li
            key={`${i}-${s.status}`}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-3 py-2 text-xs transition-colors",
              s.status === "fixed" && "border-fixed/60 bg-fixed/20 text-midnight-foreground animate-slot-pop",
              s.status === "taught_wrong" && "border-wrong/60 bg-wrong/20 text-midnight-foreground animate-slot-pop",
              s.status === "locked" && (s.active ? "border-glow/70 bg-midnight-soft text-midnight-foreground" : "border-midnight-foreground/15 bg-midnight-soft/50 text-midnight-foreground/60"),
            )}
            aria-label={`${s.label}: ${done ? STATUS_META[s.status].label : s.active ? "working on it" : "not started"}`}
          >
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-full",
                s.status === "fixed" && "bg-fixed text-midnight",
                s.status === "taught_wrong" && "bg-wrong text-midnight",
                s.status === "locked" && (s.active ? "bg-orb shadow-glow" : "bg-midnight-foreground/15"),
              )}
            >
              {s.status === "fixed" ? <Check className="h-3.5 w-3.5" /> : s.status === "taught_wrong" ? <TriangleAlert className="h-3.5 w-3.5" /> : null}
            </span>
            <span className="truncate font-semibold">{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
