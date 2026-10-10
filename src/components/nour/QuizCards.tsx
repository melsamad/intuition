import { Check, Quote, X } from "lucide-react";
import type { QuizCard } from "@/lib/nour/rules";
import { StatusBadge } from "./Status";
import { cn } from "@/lib/utils";

export function QuizCardView({ card, index, showExplanation }: { card: QuizCard; index: number; showExplanation?: boolean }) {
  return (
    <article className="animate-rise rounded-3xl bg-card p-5 text-card-foreground shadow-soft sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question {index + 1}</span>
        <StatusBadge status={card.status} />
      </div>
      <h3 className="mt-2 text-lg font-bold">{card.question}</h3>
      <div className={cn("mt-4 flex gap-3 rounded-2xl p-4", card.correct ? "bg-fixed-soft text-fixed-foreground" : "bg-wrong-soft text-wrong-foreground")}>
        <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full", card.correct ? "bg-fixed text-midnight" : "bg-wrong text-midnight")}>
          {card.correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider">Jonathan wrote · {card.correct ? "Correct" : "Incorrect"}</p>
          <p className="mt-1 font-semibold">"{card.nourAnswer}"</p>
        </div>
      </div>
      {card.evidenceQuote && (
        <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
          <Quote className="h-4 w-4 shrink-0 text-primary" />
          <span>
            Jonathan learned this from you: <q className="font-semibold text-foreground">{card.evidenceQuote}</q>
          </span>
        </p>
      )}
      {card.note && <p className="mt-3 text-sm text-muted-foreground">{card.note}</p>}
      {showExplanation && (
        <p className="mt-3 rounded-2xl bg-muted p-3 text-sm">
          <span className="font-semibold">{card.title}: </span>
          {card.explanation}
        </p>
      )}
    </article>
  );
}
