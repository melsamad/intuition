import { useEffect, useRef, useState } from "react";
import { Music, VolumeX } from "lucide-react";
import { Nour } from "./Nour";
import { Button } from "@/components/ui/button";
import waitingTrack from "@/assets/jonathan-waiting.mp3";

/** Jonathan bent over a sheet of paper with a pencil moving across it. */
export function WritingJonathan({ writing }: { writing: boolean }) {
  return (
    <div className="relative flex flex-col items-center" aria-label={writing ? "Jonathan is writing his answers" : "Jonathan finished his test"} role="img">
      <Nour mood={writing ? "thinking" : "excited"} size={100} label={false} />
      <div className="relative -mt-3 h-24 w-40 rotate-[-3deg] rounded-xl bg-card shadow-soft">
        <svg viewBox="0 0 160 96" className="absolute inset-0 h-full w-full" aria-hidden>
          {[24, 44, 64, 84].map((y) => (
            <line key={y} x1="12" x2="148" y1={y} y2={y} className="stroke-border" strokeWidth="1" />
          ))}
          {writing &&
            [22, 42, 62].map((y, i) => (
              <path
                key={y}
                d={`M16 ${y} q8 -6 16 0 t16 0 t16 0 t16 0`}
                fill="none"
                className="animate-ink stroke-primary"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ animationDelay: `${i * 0.8}s` }}
              />
            ))}
        </svg>
        {writing && (
          <svg viewBox="0 0 40 40" className="animate-pencil absolute left-12 top-1 h-10 w-10" aria-hidden>
            <g transform="rotate(45 20 20)">
              <rect x="16" y="2" width="8" height="26" rx="1.5" className="fill-pending" />
              <rect x="16" y="2" width="8" height="5" className="fill-wrong" />
              <path d="M16 28 L20 37 L24 28 Z" className="fill-lavender" />
              <path d="M19 34 L20 37 L21 34 Z" className="fill-midnight" />
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}

/** A local instrumental loop; playback is confirmed before showing Music on. */
export function WaitingMusic({ active }: { active: boolean }) {
  const [on, setOn] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef(0);

  function stop() {
    requestRef.current += 1;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  async function start() {
    const audio = audioRef.current;
    if (!audio) return;
    const request = ++requestRef.current;
    setError("");
    setStarting(true);
    audio.volume = 0.65;
    audio.muted = false;
    try {
      await audio.play();
      if (request === requestRef.current) setOn(true);
    } catch {
      if (request === requestRef.current) {
        setOn(false);
        setError("Music couldn’t start. Tap to try again.");
      }
    } finally {
      if (request === requestRef.current) setStarting(false);
    }
  }

  const wasActive = useRef(active);
  useEffect(() => {
    // Only auto-stop when writing transitions from active to done —
    // not whenever `active` happens to be false (that would kill the
    // music the instant the user taps the button).
    if (wasActive.current && !active) {
      stop();
      setOn(false);
      setStarting(false);
    }
    wasActive.current = active;
  }, [active, on]);
  useEffect(() => () => stop(), []);

  return (
    <div className="fixed right-4 top-4 z-20 flex max-w-[calc(100%-2rem)] flex-col items-end gap-2">
      <audio ref={audioRef} src={waitingTrack} loop preload="auto" onPause={() => setOn(false)}
        onError={() => { setOn(false); setStarting(false); setError("Music couldn’t load. Please refresh and try again."); }} />
      <Button variant="night" size="sm" disabled={starting} aria-pressed={on}
        onClick={() => {
          if (on) { stop(); setOn(false); }
          else void start();
        }}>
        {on ? <Music className="text-glow" /> : <VolumeX />}
        {starting ? "Starting music…" : on ? "Music on" : "Play relaxing music"}
      </Button>
      {error && <p role="alert" className="max-w-64 rounded-md bg-midnight-soft px-3 py-2 text-sm text-midnight-foreground">{error}</p>}
    </div>
  );
}
