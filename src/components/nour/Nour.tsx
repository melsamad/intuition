import { cn } from "@/lib/utils";
import type { Mood } from "@/lib/nour/rules";
import { useAccessories, type AccessoryId } from "@/lib/nour/accessories";

/** Jonathan: a glowing orb of light with a gentle face. Pure SVG + CSS. */
export function Nour({ mood = "neutral", size = 96, className, label = true, worn }: { mood?: Mood; size?: number; className?: string; label?: boolean; worn?: AccessoryId[] }) {
  const accessories = useAccessories();
  const mouth: Record<Mood, string> = {
    neutral: "M38 62 Q50 68 62 62",
    curious: "M42 63 Q50 66 58 63",
    thinking: "M42 64 L58 62",
    excited: "M36 60 Q50 76 64 60 Z",
    confused: "M40 65 Q45 61 50 65 Q55 69 60 65",
  };
  const brow = mood === "confused" || mood === "thinking";
  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label ? `Jonathan, feeling ${mood}` : undefined}
      aria-hidden={label ? undefined : true}
    >
      <div className="absolute inset-[-18%] rounded-full bg-orb opacity-40 blur-2xl animate-breathe" />
      <div className="absolute inset-0 rounded-full bg-orb shadow-glow animate-float" />
      <svg viewBox="0 0 100 100" className="relative h-full w-full animate-float" aria-hidden>
        <ellipse cx="34" cy="28" rx="10" ry="6" fill="white" opacity="0.55" />
        {brow && (
          <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-midnight" opacity="0.7">
            <path d="M33 38 L43 40" />
            <path d={mood === "confused" ? "M57 38 L67 36" : "M57 40 L67 38"} />
          </g>
        )}
        <g className="text-midnight" fill="currentColor">
          {mood === "excited" ? (
            <>
              <path d="M33 50 Q38 43 43 50" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M57 50 Q62 43 67 50" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="38" cy="48" rx="4" ry={mood === "curious" ? 5.5 : 4.5} />
              <ellipse cx="62" cy="48" rx="4" ry={mood === "curious" ? 5.5 : 4.5} />
              <circle cx="39.5" cy="46.5" r="1.3" fill="white" />
              <circle cx="63.5" cy="46.5" r="1.3" fill="white" />
            </>
          )}
          <path d={mouth[mood]} stroke="currentColor" strokeWidth="3" fill={mood === "excited" ? "currentColor" : "none"} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <circle cx="28" cy="58" r="5" fill="oklch(0.75 0.15 15)" opacity="0.25" />
        <circle cx="72" cy="58" r="5" fill="oklch(0.75 0.15 15)" opacity="0.25" />
      </svg>
      <Accessories ids={worn ?? accessories} />
    </div>
  );
}

/** Optional dress-up layer drawn on top of Jonathan; he himself is unchanged. */
function Accessories({ ids }: { ids: AccessoryId[] }) {
  if (!ids.length) return null;
  const has = (id: AccessoryId) => ids.includes(id);
  return (
    <svg viewBox="0 0 100 100" overflow="visible" className="pointer-events-none absolute inset-0 h-full w-full animate-float" aria-hidden>
      {has("skirt") && (
        <g>
          <path d="M24 92 L76 92 L86 112 L14 112 Z" fill="oklch(0.72 0.2 350)" stroke="oklch(0.2 0.03 275)" strokeWidth="2" strokeLinejoin="round" />
          {[30, 42, 54, 66].map((x) => <path key={x} d={`M${x + 2} 93 L${x - 2 + (x - 50) * 0.25} 111`} stroke="oklch(0.2 0.03 275)" strokeWidth="1.2" opacity="0.5" />)}
          <rect x="24" y="89" width="52" height="5" rx="2" fill="oklch(0.9 0.18 95)" stroke="oklch(0.2 0.03 275)" strokeWidth="1.5" />
        </g>
      )}
      {has("glasses") && (
        <g fill="oklch(1 0 0 / 0.18)" stroke="oklch(0.2 0.03 275)" strokeWidth="2.5">
          <circle cx="38" cy="48" r="9" />
          <circle cx="62" cy="48" r="9" />
          <path d="M47 47 Q50 44 53 47" fill="none" />
          <path d="M29 46 L20 43 M71 46 L80 43" fill="none" />
        </g>
      )}
      {has("hat") && (
        <g stroke="oklch(0.2 0.03 275)" strokeWidth="2" strokeLinejoin="round">
          <path d="M38 9 L62 9 L52 -16 Z" fill="oklch(0.88 0.22 135)" />
          <path d="M43 1 L57 3 M41 6 L60 7" stroke="oklch(0.72 0.2 350)" strokeWidth="2.5" />
          <circle cx="52" cy="-17" r="4" fill="oklch(0.9 0.18 95)" />
        </g>
      )}
      {has("bowtie") && (
        <g fill="oklch(0.62 0.24 25)" stroke="oklch(0.2 0.03 275)" strokeWidth="2" strokeLinejoin="round">
          <path d="M50 80 L38 73 L38 87 Z" />
          <path d="M50 80 L62 73 L62 87 Z" />
          <circle cx="50" cy="80" r="3.5" />
        </g>
      )}
      {has("necklace") && (
        <g>
          <path d="M26 82 Q50 98 74 82" fill="none" stroke="oklch(0.8 0.14 85)" strokeWidth="1.5" />
          {[0.15, 0.32, 0.5, 0.68, 0.85].map((t) => {
            const x = 26 + 48 * t, y = (1 - t) * (1 - t) * 82 + 2 * (1 - t) * t * 98 + t * t * 82;
            return <circle key={t} cx={x} cy={y} r={t === 0.5 ? 3.5 : 2.4} fill={t === 0.5 ? "oklch(0.75 0.15 200)" : "oklch(0.97 0.01 90)"} stroke="oklch(0.2 0.03 275)" strokeWidth="1" />;
          })}
        </g>
      )}
      {has("earrings") && (
        <g stroke="oklch(0.2 0.03 275)" strokeWidth="1.2">
          {[1, 99].map((x) => (
            <g key={x}>
              <path d={`M${x} 52 L${x} 58`} stroke="oklch(0.8 0.14 85)" strokeWidth="1.5" />
              <path d={`M${x} 58 L${x - 4} 63 L${x} 69 L${x + 4} 63 Z`} fill="oklch(0.85 0.15 85)" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

export function Wordmark({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display text-lg font-bold", tone === "light" ? "text-midnight-foreground" : "text-foreground", className)}>
      <span className="relative inline-block h-5 w-5 rounded-full bg-orb shadow-glow" aria-hidden />
      Intuition
    </span>
  );
}

export function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1" role="status" aria-label="Jonathan is thinking">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-2 w-2 rounded-full bg-primary animate-dot" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}
