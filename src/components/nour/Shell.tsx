import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Wordmark } from "./Nour";
import { cn } from "@/lib/utils";

export function TopBar({ tone = "dark", right }: { tone?: "dark" | "light"; right?: ReactNode }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
      <Link to="/" aria-label="Intuition home" className="rounded-full">
        <Wordmark tone={tone} />
      </Link>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}

export function ErrorPanel({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn("rounded-2xl border border-wrong/40 bg-wrong-soft p-4 text-sm text-wrong-foreground", className)}>
      <p className="font-semibold">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 font-semibold underline underline-offset-4">
          Try again
        </button>
      )}
    </div>
  );
}

export function errMsg(e: unknown) {
  if (e instanceof Error) return e.message.replace(/^Error:\s*/, "");
  return "Something went wrong. Please try again.";
}
