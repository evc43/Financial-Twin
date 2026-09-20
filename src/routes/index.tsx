import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { runCascadeDemoFn } from "@/lib/cascade/cascade.functions";
import type { CascadeDemoResponse, CascadeInputs } from "@/lib/cascade/cascade.types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Financial Twin — Find the cash-flow chain reaction" },
      {
        name: "description",
        content:
          "Enter your income, rent and paydates to detect the timing cascade draining your account — and the smallest fix.",
      },
      { property: "og:title", content: "Financial Twin — Find the cash-flow chain reaction" },
      {
        property: "og:description",
        content:
          "Enter your income, rent and paydates to detect the timing cascade draining your account — and the smallest fix.",
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

type Field = keyof CascadeInputs;

const FIELDS: { key: Field; label: string; hint: string; prefix?: string; max?: number }[] = [
  { key: "monthlyIncome", label: "Monthly net income", hint: "What lands in your account each month.", prefix: "$" },
  { key: "paydayOfMonth", label: "Day of month your paycheck lands", hint: "1–31", max: 31 },
  { key: "rentAmount", label: "Rent / mortgage amount", hint: "Your recurring housing payment.", prefix: "$" },
  { key: "rentDayOfMonth", label: "Day of month rent is due", hint: "1–31", max: 31 },
  { key: "checkingBalance", label: "Current checking balance", hint: "Today's balance.", prefix: "$" },
  { key: "monthlySpending", label: "Average monthly spending", hint: "Groceries, gas, subscriptions, shopping.", prefix: "$" },
];

const DEFAULTS: Record<Field, string> = {
  monthlyIncome: "3000",
  paydayOfMonth: "1",
  rentAmount: "1400",
  rentDayOfMonth: "28",
  checkingBalance: "650",
  monthlySpending: "900",
};

function Stepper({ step }: { step: 1 | 2 }) {
  const steps = ["Your Finances", "Review & Build"];
  return (
    <div className="flex flex-wrap items-center gap-3">
      {steps.map((label, i) => {
        const n = (i + 1) as 1 | 2;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex items-center gap-3">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                active || done
                  ? "bg-forest text-primary-foreground"
                  : "bg-sage text-ink-faint"
              }`}
            >
              {n}
            </div>
            <span
              className={`text-sm font-semibold ${active ? "text-forest" : "text-ink-faint"}`}
            >
              {label}
            </span>
            {i === 0 && <span className="h-px w-10 bg-border" aria-hidden />}
          </div>
        );
      })}
    </div>
  );
}

function Cascades() {
  const detect = useServerFn(runCascadeDemoFn);
  const [step, setStep] = useState<1 | 2>(1);
  const [method, setMethod] = useState<"manual" | "plaid">("manual");
  const [values, setValues] = useState<Record<Field, string>>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CascadeDemoResponse | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const parsed: CascadeInputs = {
    monthlyIncome: Number(values.monthlyIncome) || 0,
    paydayOfMonth: Math.min(31, Math.max(1, Number(values.paydayOfMonth) || 1)),
    rentAmount: Number(values.rentAmount) || 0,
    rentDayOfMonth: Math.min(31, Math.max(1, Number(values.rentDayOfMonth) || 1)),
    checkingBalance: Number(values.checkingBalance) || 0,
    monthlySpending: Number(values.monthlySpending) || 0,
  };

  async function onBuild() {
    setLoading(true);
    setError(null);
    try {
      setResult(await detect({ data: parsed }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const chain = result?.cascade.cascadeChain ?? [];

  return (
    <main className="min-h-screen bg-background px-6 py-14 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="h-6 w-6 rounded-full"
            style={{
              background:
                "conic-gradient(from 220deg, var(--forest) 0 55%, var(--sage-deep) 55% 100%)",
              boxShadow: "inset 0 0 0 4px var(--background)",
            }}
          />
          <span className="text-[17px] font-semibold tracking-tight text-ink">Financial Twin</span>
        </div>

        {!result && !loading && (
          <>
            <p className="mt-10 text-sm font-semibold text-forest">
              Step {step} of 2 · {step === 1 ? "Baseline Finances" : "Review & Build"}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
              {step === 1 ? "Tell us how money moves" : "Review your baseline"}
            </h1>
            <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-ink-soft">
              {step === 1
                ? "Six numbers is all it takes to find the chain reaction between when money leaves and when it lands."
                : "Check the numbers below, then we'll build your Financial Twin and run the cascade analysis."}
            </p>

            <div className="mt-8">
              <Stepper step={step} />
            </div>

            {step === 1 && (
              <>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      {
                        id: "manual" as const,
                        badge: "A",
                        title: "Manually Enter Your Finances",
                        body: "Six quick fields. Works right now.",
                      },
                      {
                        id: "plaid" as const,
                        badge: "B",
                        title: "Connect via Plaid",
                        body: "Link a bank account. Coming soon.",
                      },
                    ]
                  ).map((c) => {
                    const sel = method === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setMethod("manual")}
                        className={`rounded-[var(--radius)] border p-5 text-left transition-colors ${
                          sel
                            ? "border-forest bg-sage"
                            : "border-border bg-card hover:bg-cream-deep"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                              sel
                                ? "border-forest bg-forest text-primary-foreground"
                                : "border-border text-ink-faint"
                            }`}
                          >
                            {c.badge}
                          </span>
                          <h3 className="font-display text-lg font-semibold text-ink">{c.title}</h3>
                        </div>
                        <p className="mt-2 text-sm text-ink-soft">{c.body}</p>
                      </button>
                    );
                  })}
                </div>

                <section className="mt-4 rounded-[var(--radius)] bg-card p-6 sm:p-7">
                  <h2 className="font-display text-2xl font-bold text-ink">Your Finances</h2>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    {FIELDS.map((f) => (
                      <label key={f.key} className="block min-w-0">
                        <span className="text-sm font-medium text-ink-soft">{f.label}</span>
                        <span className="mt-2 flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-background px-4 py-3 focus-within:border-forest">
                          {f.prefix && <span className="text-ink-faint">{f.prefix}</span>}
                          <input
                            type="number"
                            min={f.max ? 1 : 0}
                            max={f.max}
                            inputMode="numeric"
                            value={values[f.key]}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [f.key]: e.target.value }))
                            }
                            className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-ink outline-hidden"
                          />
                        </span>
                        <span className="mt-1 block text-xs text-ink-faint">{f.hint}</span>
                      </label>
                    ))}
                  </div>
                </section>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="rounded-full bg-forest px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-forest-hover"
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <section className="mt-6 rounded-[var(--radius)] bg-card p-6 sm:p-7">
                  <h2 className="font-display text-2xl font-bold text-ink">Review & Build</h2>
                  <dl className="mt-5 divide-y divide-[var(--line-soft)]">
                    {[
                      ["Monthly net income", money(parsed.monthlyIncome)],
                      ["Paycheck lands on", `Day ${parsed.paydayOfMonth}`],
                      ["Rent / mortgage", money(parsed.rentAmount)],
                      ["Rent due on", `Day ${parsed.rentDayOfMonth}`],
                      ["Checking balance", money(parsed.checkingBalance)],
                      ["Average monthly spending", money(parsed.monthlySpending)],
                    ].map(([k, v]) => (
                      <div
                        key={k as string}
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3"
                      >
                        <dt className="min-w-0 truncate text-sm text-ink-soft">{k}</dt>
                        <dd className="font-display text-lg font-bold text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                {error && (
                  <div className="mt-6 rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={onBuild}
                    className="rounded-full bg-forest px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-forest-hover"
                  >
                    Build my Financial Twin
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {loading && (
          <div className="mt-16 text-center">
            <h1 className="font-display text-3xl font-bold text-ink">
              Building your Financial Twin…
            </h1>
            <p className="mt-3 text-sm text-ink-soft">
              Pulling transactions and working through the timeline.
            </p>
          </div>
        )}

        {result && !loading && (
          <div className="mt-10 space-y-8">
            <div>
              <p className="text-sm font-semibold text-forest">Your cascade</p>
              <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
                {result.explanation
                  ? "One small date, one repeating cost"
                  : "No cascade in your timing"}
              </h1>
            </div>

            {chain.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {chain.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="rounded-[var(--radius-sm)] border border-border bg-card px-4 py-3">
                      <p className="text-sm font-medium text-ink-soft">{step.label}</p>
                      {step.amount !== undefined && (
                        <p className="mt-1 font-display text-xl font-bold text-ink">
                          {money(step.amount)}
                        </p>
                      )}
                    </div>
                    {i < chain.length - 1 && (
                      <span aria-hidden className="text-ink-faint">
                        →
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {result.explanation ? (
              <>
                <section className="rounded-[var(--radius)] bg-card p-6 sm:p-7">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
                    Root cause
                  </h2>
                  <p className="mt-2 font-display text-2xl font-bold leading-snug text-ink">
                    {result.explanation.rootCause}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                    {result.explanation.narrative}
                  </p>
                </section>

                <section className="rounded-[var(--radius)] bg-sage p-6 sm:p-7">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
                    The fix
                  </h2>
                  <p className="mt-2 text-lg text-ink">{result.explanation.smallestFix}</p>
                  <p className="mt-3 font-display text-4xl font-bold text-ink">
                    {money(result.cascade.projectedSavings)}{" "}
                    <span className="text-sm font-normal text-ink-soft">
                      saved over {result.cascade.projectionMonths} months
                    </span>
                  </p>
                </section>
              </>
            ) : (
              <p className="text-sm text-ink-soft">No cascade found in this account history.</p>
            )}

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setStep(1);
                }}
                className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-cream-deep"
              >
                Start over
              </button>
              <button
                type="button"
                onClick={() => setShowDebug((v) => !v)}
                className="text-xs font-medium text-ink-faint underline underline-offset-4 hover:text-ink"
              >
                {showDebug ? "Hide debug" : "Debug"}
              </button>
            </div>

            {showDebug && (
              <section className="rounded-[var(--radius)] border border-dashed border-border bg-cream-deep p-6">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
                  Debug — raw data
                </h2>
                <p className="mt-2 text-sm text-ink-soft">
                  Transactions pulled: {result.transactionsPulled}
                </p>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-ink-soft">firstTransaction</p>
                    <pre className="mt-1 max-h-72 overflow-auto rounded-lg bg-card p-3 text-xs text-ink">
                      {JSON.stringify(result.firstTransaction, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-ink-soft">model</p>
                    <pre className="mt-1 max-h-96 overflow-auto rounded-lg bg-card p-3 text-xs text-ink">
                      {JSON.stringify(result.model, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-ink-soft">cascade</p>
                    <pre className="mt-1 max-h-96 overflow-auto rounded-lg bg-card p-3 text-xs text-ink">
                      {JSON.stringify(result.cascade, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-ink-soft">full response</p>
                    <pre className="mt-1 max-h-96 overflow-auto rounded-lg bg-card p-3 text-xs text-ink">
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
