import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { relocationAnalyzeFn } from "@/lib/relocation/relocation.functions";
import type { RelocationResult } from "@/lib/relocation/relocation.types";

export const Route = createFileRoute("/relocation")({
  head: () => ({
    meta: [
      { title: "Relocation — Is that out-of-state offer actually a raise?" },
      {
        name: "description",
        content:
          "Compare two cities after federal, FICA, state and city income tax plus cost of living, and see the break-even salary.",
      },
      { property: "og:title", content: "Relocation — Is that out-of-state offer actually a raise?" },
      {
        property: "og:description",
        content:
          "Compare two cities after every tax layer and cost of living, and see the break-even salary your offer must clear.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Relocation,
});

function money(n: number | null | undefined) {
  if (n === undefined || n === null) return "—";
  return `$${Math.round(n).toLocaleString()}`;
}

type FieldKey =
  | "currentCity"
  | "currentState"
  | "currentSalary"
  | "currentRent"
  | "monthlySpendingExRent"
  | "offerCity"
  | "offerState"
  | "offerSalary"
  | "offerRent";

const DEFAULTS: Record<FieldKey, string> = {
  currentCity: "New York",
  currentState: "New York",
  currentSalary: "120000",
  currentRent: "3200",
  monthlySpendingExRent: "1800",
  offerCity: "Austin",
  offerState: "Texas",
  offerSalary: "125000",
  offerRent: "",
};

const CURRENT_FIELDS: { key: FieldKey; label: string; hint: string; prefix?: string; text?: boolean }[] = [
  { key: "currentCity", label: "Current city", hint: "e.g. New York", text: true },
  { key: "currentState", label: "Current state", hint: "Full state name", text: true },
  { key: "currentSalary", label: "Current salary", hint: "Annual gross.", prefix: "$" },
  { key: "currentRent", label: "Current monthly rent", hint: "What housing costs you now.", prefix: "$" },
  {
    key: "monthlySpendingExRent",
    label: "Monthly spending (excl. rent)",
    hint: "Groceries, transport, dining, utilities.",
    prefix: "$",
  },
];

const OFFER_FIELDS: { key: FieldKey; label: string; hint: string; prefix?: string; text?: boolean }[] = [
  { key: "offerCity", label: "Offer city", hint: "e.g. Austin", text: true },
  { key: "offerState", label: "Offer state", hint: "Full state name", text: true },
  { key: "offerSalary", label: "Offer salary", hint: "Annual gross.", prefix: "$" },
  { key: "offerRent", label: "Offer rent (optional)", hint: "Leave blank to estimate it.", prefix: "$" },
];

const VERDICT: Record<RelocationResult["verdict"], { label: string; blurb: string }> = {
  clear_win: { label: "Clear win", blurb: "You keep meaningfully more every month after everything." },
  marginal: { label: "Marginal", blurb: "Close to a wash — the money barely moves either way." },
  worse: { label: "Worse", blurb: "Despite the headline number, you'd keep less each month." },
};

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2.5">
      <dt className="min-w-0 truncate text-sm text-ink-soft">{label}</dt>
      <dd
        className={
          strong
            ? "font-display text-lg font-bold text-ink"
            : "text-[15px] font-medium text-ink"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function SurplusCard({
  title,
  bd,
  accent,
}: {
  title: string;
  bd: RelocationResult["current"];
  accent?: boolean;
}) {
  return (
    <section
      className={`rounded-[var(--radius)] p-6 ${accent ? "bg-sage" : "bg-card"}`}
    >
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">{title}</h3>
      <p className="mt-1 font-display text-lg font-semibold text-ink">
        {bd.city}, {bd.state}
      </p>
      <p className="mt-4 font-display text-4xl font-bold tracking-tight text-ink">
        {money(bd.monthlySurplus)}
      </p>
      <p className="mt-1 text-xs text-ink-faint">left over each month</p>
      <dl className="mt-4 divide-y divide-[var(--line-soft)]">
        <Row label="Gross salary" value={money(bd.grossSalary)} />
        <Row label="Federal tax" value={money(bd.federalTax)} />
        <Row label="FICA" value={money(bd.fica)} />
        <Row label="State tax" value={money(bd.stateTax)} />
        <Row label="City tax" value={money(bd.localTax)} />
        <Row label="Net per month" value={money(bd.netMonthly)} strong />
        <Row label="Rent" value={money(bd.monthlyRent)} />
        <Row label="Other spending" value={money(bd.monthlyNonRent)} />
      </dl>
    </section>
  );
}

function Relocation() {
  const analyze = useServerFn(relocationAnalyzeFn);
  const [values, setValues] = useState<Record<FieldKey, string>>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RelocationResult | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    try {
      const offerRent = values.offerRent.trim();
      setResult(
        await analyze({
          data: {
            currentCity: values.currentCity.trim(),
            currentState: values.currentState.trim(),
            currentSalary: Number(values.currentSalary) || 0,
            currentRent: Number(values.currentRent) || 0,
            monthlySpendingExRent: Number(values.monthlySpendingExRent) || 0,
            offerCity: values.offerCity.trim(),
            offerState: values.offerState.trim(),
            offerSalary: Number(values.offerSalary) || 0,
            ...(offerRent ? { offerRent: Number(offerRent) || 0 } : {}),
          },
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function field(f: (typeof CURRENT_FIELDS)[number]) {
    return (
      <label key={f.key} className="block min-w-0">
        <span className="text-sm font-medium text-ink-soft">{f.label}</span>
        <span className="mt-2 flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-background px-4 py-3 focus-within:border-forest">
          {f.prefix && <span className="text-ink-faint">{f.prefix}</span>}
          <input
            type={f.text ? "text" : "number"}
            min={f.text ? undefined : 0}
            inputMode={f.text ? "text" : "numeric"}
            value={values[f.key]}
            onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-ink outline-hidden"
          />
        </span>
        <span className="mt-1 block text-xs text-ink-faint">{f.hint}</span>
      </label>
    );
  }

  return (
    <main className="min-h-screen bg-background px-6 py-14 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
            <span className="text-[17px] font-semibold tracking-tight text-ink">
              Financial Twin
            </span>
          </div>
          <Link
            to="/"
            className="text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
          >
            Cascades
          </Link>
        </div>

        {!result && (
          <>
            <p className="mt-10 text-sm font-semibold text-forest">Relocation</p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-[1.05] tracking-tight text-ink sm:text-5xl">
              Is that offer actually a raise?
            </h1>
            <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-ink-soft">
              We run both cities through federal tax, FICA, state tax, city tax and local
              cost of living — then tell you the salary the offer has to clear.
            </p>

            <section className="mt-8 rounded-[var(--radius)] bg-card p-6 sm:p-7">
              <h2 className="font-display text-2xl font-bold text-ink">Where you are now</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">{CURRENT_FIELDS.map(field)}</div>
            </section>

            <section className="mt-4 rounded-[var(--radius)] bg-card p-6 sm:p-7">
              <h2 className="font-display text-2xl font-bold text-ink">The offer</h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">{OFFER_FIELDS.map(field)}</div>
            </section>

            {error && (
              <div className="mt-6 rounded-[var(--radius-sm)] border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={onSubmit}
                className="rounded-full bg-forest px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-forest-hover disabled:opacity-60"
              >
                {loading ? "Comparing…" : "Compare the two cities"}
              </button>
            </div>
          </>
        )}

        {result && (
          <div className="mt-10 space-y-8">
            <div>
              <p className="text-sm font-semibold text-forest">Relocation verdict</p>
              <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink">
                {VERDICT[result.verdict].label}
              </h1>
              <p className="mt-2 text-[15px] text-ink-soft">{VERDICT[result.verdict].blurb}</p>
            </div>

            {result.advice && (
              <section className="rounded-[var(--radius)] bg-card p-6 sm:p-7">
                <h2 className="font-display text-2xl font-bold leading-snug text-ink">
                  {result.advice.headline}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">
                  {result.advice.reasoning}
                </p>
                {result.advice.recommendation && (
                  <p className="mt-4 inline-flex rounded-full bg-sage px-4 py-2 text-sm font-semibold text-ink">
                    {result.advice.recommendation}
                  </p>
                )}
              </section>
            )}

            <section className="rounded-[var(--radius)] bg-forest px-6 py-8 sm:px-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-cream-deep/70">
                Break-even salary in {result.offer.city}
              </h2>
              <p className="mt-2 font-display text-5xl font-bold tracking-tight text-cream-deep sm:text-6xl">
                {money(result.breakEvenSalary)}
              </p>
              <p className="mt-3 text-sm text-cream-deep/80">
                {result.offerClearsBreakEvenBy === null
                  ? "We couldn't solve a break-even salary for this pair of cities."
                  : result.offerClearsBreakEvenBy >= 0
                    ? `Your ${money(result.offer.grossSalary)} offer clears it by ${money(result.offerClearsBreakEvenBy)}.`
                    : `Your ${money(result.offer.grossSalary)} offer falls short by ${money(Math.abs(result.offerClearsBreakEvenBy))}.`}
              </p>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <SurplusCard title="Today" bd={result.current} />
              <SurplusCard title="After the move" bd={result.offer} accent />
            </div>

            <section className="rounded-[var(--radius)] bg-card p-6 sm:p-7">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
                The move itself
              </h2>
              <dl className="mt-3 divide-y divide-[var(--line-soft)]">
                <Row label="Headline raise" value={money(result.raiseHeadline)} strong />
                <Row
                  label="Change in monthly surplus"
                  value={`${result.surplusDelta >= 0 ? "+" : "−"}${money(Math.abs(result.surplusDelta))}`}
                  strong
                />
                <Row label="First-year cost of moving" value={money(result.firstYearMoveCost)} strong />
                <Row
                  label="Months to recoup that cost"
                  value={
                    result.monthsToRecoup === null
                      ? "Never — the move loses money monthly"
                      : `${result.monthsToRecoup} month${result.monthsToRecoup === 1 ? "" : "s"}`
                  }
                  strong
                />
              </dl>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
              >
                Start over
              </button>
              <button
                type="button"
                onClick={() => setShowDebug((s) => !s)}
                className="text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
              >
                {showDebug ? "Hide debug" : "Debug"}
              </button>
            </div>

            {showDebug && (
              <section className="rounded-[var(--radius)] border border-dashed border-border p-5">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
                  Debug — raw RelocationResult
                </h2>
                <pre className="mt-3 overflow-x-auto text-xs leading-relaxed text-ink-soft">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
