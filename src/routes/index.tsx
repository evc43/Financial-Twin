import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { runCascadeDemoFn } from "@/lib/cascade/cascade.functions";
import type { CascadeDemoResponse } from "@/lib/cascade/cascade.types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cascades — Find the cash-flow chain reaction" },
      {
        name: "description",
        content:
          "Detect the timing cascade between your rent draft and payday, and see the smallest fix.",
      },
      { property: "og:title", content: "Cascades — Find the cash-flow chain reaction" },
      {
        property: "og:description",
        content:
          "Detect the timing cascade between your rent draft and payday, and see the smallest fix.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Cascades,
});

function money(n?: number) {
  if (n === undefined || n === null) return null;
  return `$${Math.round(n).toLocaleString()}`;
}

function Cascades() {
  const detect = useServerFn(runCascadeDemoFn);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CascadeDemoResponse | null>(null);

  async function onDetect() {
    setLoading(true);
    setError(null);
    try {
      setResult(await detect());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const chain = result?.cascade.cascadeChain ?? [];

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Cascades
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
          One small date, one repeating cost
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          We read the account history, look for a chain reaction between when money leaves and when
          it lands, and put a dollar figure on it.
        </p>

        <button
          onClick={onDetect}
          disabled={loading}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Detecting…" : "Detect Cascade"}
        </button>

        {loading && (
          <p className="mt-4 text-sm text-muted-foreground">
            Pulling transactions and working through the timeline…
          </p>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {result && !loading && (
          <div className="mt-10 space-y-8">
            {chain.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {chain.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                      <p className="text-sm font-medium text-card-foreground">{step.label}</p>
                      {step.amount !== undefined && (
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          {money(step.amount)}
                        </p>
                      )}
                    </div>
                    {i < chain.length - 1 && (
                      <span aria-hidden className="text-muted-foreground">
                        →
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {result.explanation ? (
              <>
                <section className="rounded-2xl border border-border bg-card p-6">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Root cause
                  </h2>
                  <p className="mt-2 text-lg text-card-foreground">
                    {result.explanation.rootCause}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {result.explanation.narrative}
                  </p>
                </section>

                <section className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    The fix
                  </h2>
                  <p className="mt-2 text-lg text-foreground">{result.explanation.smallestFix}</p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {money(result.cascade.projectedSavings)}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      saved over {result.cascade.projectionMonths} months
                    </span>
                  </p>
                </section>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No cascade found in this account history.
              </p>
            )}

            <div>
              <button
                type="button"
                onClick={() => setShowDebug((v) => !v)}
                className="text-xs font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                {showDebug ? "Hide debug" : "Debug"}
              </button>
            </div>

            {showDebug && (
            <section className="rounded-2xl border border-dashed border-border bg-muted/40 p-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Debug — raw data
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Transactions pulled: {result.transactionsPulled}
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">firstTransaction</p>
                  <pre className="mt-1 max-h-72 overflow-auto rounded-lg bg-card p-3 text-xs text-card-foreground">
                    {JSON.stringify(result.firstTransaction, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">model</p>
                  <pre className="mt-1 max-h-96 overflow-auto rounded-lg bg-card p-3 text-xs text-card-foreground">
                    {JSON.stringify(result.model, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">cascade</p>
                  <pre className="mt-1 max-h-96 overflow-auto rounded-lg bg-card p-3 text-xs text-card-foreground">
                    {JSON.stringify(result.cascade, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">full response</p>
                  <pre className="mt-1 max-h-96 overflow-auto rounded-lg bg-card p-3 text-xs text-card-foreground">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
