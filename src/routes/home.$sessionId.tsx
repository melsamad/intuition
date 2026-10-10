import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { getHomeTeach, markTaughtAtHome } from "@/lib/nour/api.functions";
import { Nour, Wordmark } from "@/components/nour/Nour";
import { ErrorPanel, errMsg } from "@/components/nour/Shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/home/$sessionId")({
  head: () => ({
    meta: [
      { title: "Teach It at Home — Intuition" },
      { name: "description", content: "Your child taught Jonathan today. Ask them tonight's dinner question and let them explain it to you." },
      { property: "og:title", content: "Ask me at dinner — Intuition" },
      { property: "og:description", content: "Your child taught an AI student today. Now let them teach you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomeTeach,
});

function HomeTeach() {
  const { sessionId } = Route.useParams();
  const fetchIt = useServerFn(getHomeTeach);
  const mark = useServerFn(markTaughtAtHome);
  const qc = useQueryClient();
  const key = ["home-teach", sessionId];
  const q = useQuery({ queryKey: key, queryFn: () => fetchIt({ data: { sessionId } }) });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const d = q.data;

  async function done() {
    setSaving(true);
    setErr(null);
    try {
      const r = await mark({ data: { sessionId } });
      qc.setQueryData(key, d ? { ...d, homeTaughtAt: r.homeTaughtAt } : d);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <main className="mx-auto flex max-w-md flex-col items-center px-5 py-8 text-center">
        <Wordmark />
        {q.isLoading && <Skeleton className="mt-10 h-72 w-full rounded-3xl" />}
        {q.isError && <ErrorPanel className="mt-10 w-full" message={errMsg(q.error)} onRetry={() => q.refetch()} />}
        {d && (
          <>
            <div className="mt-8"><Nour mood={d.homeTaughtAt ? "excited" : "curious"} size={110} /></div>
            <p className="mt-6 text-lg font-semibold text-muted-foreground">{d.name} taught Jonathan this today{d.topic ? ` (${d.topic})` : ""}.</p>
            <p className="mt-2 text-sm font-bold uppercase tracking-wider text-primary">Ask them at dinner</p>
            <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">{d.question}</h1>
            {d.homeTaughtAt ? (
              <div className="mt-10 w-full rounded-3xl bg-card p-6 shadow-soft" role="status">
                <Heart className="mx-auto h-7 w-7 text-primary" />
                <p className="mt-2 font-hand text-2xl">Thank you! Teaching you was the best practice {d.name} could get. — Jonathan</p>
              </div>
            ) : (
              <>
                <p className="mt-6 text-muted-foreground">Let them explain why. You don't need to know the answer — just ask "why?" and "can you show me an example?"</p>
                <Button size="lg" className="mt-8 h-14 w-full text-lg" onClick={done} disabled={saving}>
                  {saving && <Loader2 className="animate-spin" />} They explained it to me!
                </Button>
              </>
            )}
            {err && <ErrorPanel className="mt-4 w-full" message={err} />}
          </>
        )}
      </main>
    </div>
  );
}
