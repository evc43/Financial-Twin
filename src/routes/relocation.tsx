import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { RelocationReport } from "@/components/relocation/RelocationReport";
import { cityCostData, getCityCost } from "@/lib/relocation/costOfLivingData";
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


type FieldKey =
  | "currentCity"
  | "currentSalary"
  | "currentRent"
  | "monthlySpendingExRent"
  | "offerCity"
  | "offerSalary"
  | "offerRent";

const CITY_OPTIONS = cityCostData
  .map((c) => ({ city: c.city, state: c.state }))
  .sort((a, b) => a.city.localeCompare(b.city));

function stateForCity(city: string) {
  return getCityCost(city)?.state ?? "";
}

const DEFAULTS: Record<FieldKey, string> = {
  currentCity: "",
  currentSalary: "",
  currentRent: "",
  monthlySpendingExRent: "",
  offerCity: "",
  offerSalary: "",
  offerRent: "",
};

type FieldDef = {
  key: FieldKey;
  label: string;
  hint: string;
  prefix?: string;
  text?: boolean;
  select?: boolean;
  placeholder?: string;
};

const CURRENT_FIELDS: FieldDef[] = [
  { key: "currentCity", label: "Current city", hint: "Pick a supported city.", select: true },
  { key: "currentSalary", label: "Current salary", hint: "Annual gross.", prefix: "$", placeholder: "120000" },
  { key: "currentRent", label: "Current monthly rent", hint: "What housing costs you now.", prefix: "$", placeholder: "3200" },
  {
    key: "monthlySpendingExRent",
    label: "Monthly spending (excl. rent)",
    hint: "Groceries, transport, dining, utilities.",
    prefix: "$",
    placeholder: "1800",
  },
];

const OFFER_FIELDS: FieldDef[] = [
  { key: "offerCity", label: "Offer city", hint: "Pick a supported city.", select: true },
  { key: "offerSalary", label: "Offer salary", hint: "Annual gross.", prefix: "$", placeholder: "125000" },
  { key: "offerRent", label: "Offer rent (optional)", hint: "Leave blank to estimate it.", prefix: "$", placeholder: "Estimated" },
];


function Relocation() {
  const analyze = useServerFn(relocationAnalyzeFn);
  const [values, setValues] = useState<Record<FieldKey, string>>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RelocationResult | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const canSubmit = (
    [
      "currentCity",
      "offerCity",
      "currentSalary",
      "currentRent",
      "monthlySpendingExRent",
      "offerSalary",
    ] as FieldKey[]
  ).every((k) => values[k].trim() !== "");

  async function onSubmit() {
    setLoading(true);
    setError(null);
    try {
      const offerRent = values.offerRent.trim();
      setResult(
        await analyze({
          data: {
            currentCity: values.currentCity.trim(),
            currentState: stateForCity(values.currentCity),
            currentSalary: Number(values.currentSalary) || 0,
            currentRent: Number(values.currentRent) || 0,
            monthlySpendingExRent: Number(values.monthlySpendingExRent) || 0,
            offerCity: values.offerCity.trim(),
            offerState: stateForCity(values.offerCity),
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

  function field(f: FieldDef) {
    const state = f.select ? stateForCity(values[f.key]) : "";
    return (
      <label key={f.key} className="block min-w-0">
        <span className="text-sm font-medium text-ink-soft">{f.label}</span>
        <span className="mt-2 flex items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-background px-4 py-3 focus-within:border-forest">
          {f.prefix && <span className="text-ink-faint">{f.prefix}</span>}
          {f.select ? (
            <select
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-ink outline-hidden"
            >
              <option value="" disabled>
                Select a city
              </option>
              {CITY_OPTIONS.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city}, {c.state}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={f.text ? "text" : "number"}
              min={f.text ? undefined : 0}
              inputMode={f.text ? "text" : "numeric"}
              placeholder={f.placeholder}
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-ink outline-hidden"
            />
          )}
        </span>
        <span className="mt-1 block text-xs text-ink-faint">
          {f.select && state ? `State: ${state}` : f.hint}
        </span>
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
            to="/relocation-demo"
            className="text-sm font-semibold text-ink-soft underline underline-offset-2 hover:text-ink"
          >
            Sample report
          </Link>
        </div>

        {!result && !loading && (
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

            <div className="mt-6 flex flex-wrap items-center justify-end gap-4">
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

        {!result && loading && (
          <section
            className="mt-10 flex min-h-[28rem] flex-col items-center justify-center rounded-[var(--radius)] bg-card px-6 py-12 text-center"
            aria-live="polite"
            aria-busy="true"
          >
            <span className="relative flex h-16 w-16 items-center justify-center" aria-hidden>
              <span className="absolute inset-0 animate-ping rounded-full bg-sage-deep opacity-40" />
              <span className="relative h-9 w-9 animate-pulse rounded-full bg-forest" />
            </span>
            <p className="mt-8 text-sm font-semibold text-forest">Comparing your move</p>
            <h1 className="mt-3 max-w-lg font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
              Running both cities through every tax layer
            </h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-soft">
              We’re calculating taxes, housing, local costs and your real monthly surplus. This
              takes a few seconds.
            </p>
          </section>
        )}

        {result && (
          <div className="mt-10 space-y-8">
            <RelocationReport data={result} />


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
