import { useState } from "react";

import type {
  LocationBreakdown,
  RelocationReportData,
  RelocationVerdict,
} from "@/lib/relocation/relocation.types";

type Period = "monthly" | "annual";

function currency(n: number | null | undefined) {
  if (n === undefined || n === null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Scale a per-month figure into the selected view. */
function per(n: number, period: Period) {
  return period === "annual" ? n * 12 : n;
}

const VERDICT: Record<
  RelocationVerdict,
  { label: string; tone: "good" | "warn" | "bad" }
> = {
  clear_win: { label: "Clear win", tone: "good" },
  marginal: { label: "Marginal", tone: "warn" },
  break_even: { label: "Break even", tone: "warn" },
  worse: { label: "Worse", tone: "bad" },
  loss: { label: "Loss", tone: "bad" },
};

const BADGE: Record<"good" | "warn" | "bad", string> = {
  good: "bg-forest text-primary-foreground",
  warn: "bg-amber-deep text-amber-text",
  bad: "bg-destructive text-destructive-foreground",
};

const TAX_COLORS = ["var(--ink)", "var(--forest)", "var(--amber-text)", "var(--destructive)"];

function TaxPie({ bd }: { bd: LocationBreakdown }) {
  const [active, setActive] = useState<number | null>(null);

  const parts = [
    { label: "Federal", value: bd.federalTax },
    { label: "FICA", value: bd.fica },
    { label: "State", value: bd.stateTax },
    { label: "City", value: bd.localTax },
  ];
  const total = parts.reduce((s, p) => s + p.value, 0);
  const safeTotal = total || 1;

  // Donut geometry
  const R = 54;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const arcs = parts.map((p, i) => {
    const len = (p.value / safeTotal) * C;
    const arc = { ...p, i, len, offset };
    offset += len;
    return arc;
  });

  const shown = active === null ? null : parts[active];

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="shrink-0">
        <div className="relative">
        <svg
          viewBox="0 0 140 140"
          className="h-[140px] w-[140px] -rotate-90"
          role="img"
          aria-label={`Tax split for ${bd.city}`}
        >
          <circle cx="70" cy="70" r={R} fill="none" stroke="var(--line-soft)" strokeWidth="18" />
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={TAX_COLORS[a.i]}
              strokeWidth={active === a.i ? 24 : 18}
              strokeDasharray={`${a.len} ${C - a.len}`}
              strokeDashoffset={-a.offset}
              className="cursor-pointer transition-[stroke-width,opacity] duration-200"
              style={{ opacity: active === null || active === a.i ? 1 : 0.35 }}
              onMouseEnter={() => setActive(a.i)}
              onMouseLeave={() => setActive(null)}
            />
          ))}
        </svg>
          {shown && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                {shown.label}
              </span>
              <span className="font-display text-[15px] font-bold leading-tight text-ink">
                {currency(shown.value)}
              </span>
              {total > 0 && (
                <span className="text-[10px] font-semibold text-ink-faint">
                  {Math.round((shown.value / safeTotal) * 100)}%
                </span>
              )}
            </div>
          )}
        </div>
        <div className="mt-2 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint">
            Total taxes (annual)
          </p>
          <p className="font-display text-base font-bold text-ink">{currency(total)}</p>
        </div>
      </div>

      <dl className="w-full space-y-1.5">
        {parts.map((p, i) => (
          <div
            key={p.label}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md px-1 py-0.5 transition-colors"
            style={{ background: active === i ? "var(--line-soft)" : "transparent" }}
          >
            <dt className="flex min-w-0 items-center gap-2 text-[13px] text-ink-soft">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: TAX_COLORS[i] }}
              />
              <span className="truncate">{p.label}</span>
            </dt>
            <dd
              className={
                p.value === 0
                  ? "text-[13px] font-semibold text-ink-faint"
                  : "text-[13px] font-semibold text-ink"
              }
            >
              {currency(p.value)}
              {p.value === 0 && (
                <span className="ml-1.5 text-[11px] font-medium text-ink-faint">none here</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function LineItem({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "good" | "bad";
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-2">
      <dt
        className={
          strong ? "min-w-0 truncate text-sm font-bold text-ink" : "min-w-0 truncate text-sm text-ink-soft"
        }
      >
        {label}
      </dt>
      <dd
        className={[
          strong ? "font-display text-lg font-bold" : "text-[15px] font-semibold",
          tone === "good" ? "text-forest" : tone === "bad" ? "text-destructive" : "text-ink",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}

function CityCard({
  title,
  bd,
  period,
  accent,
}: {
  title: string;
  bd: LocationBreakdown;
  period: Period;
  accent?: boolean;
}) {
  const label = period === "annual" ? "left over each year" : "left over each month";
  return (
    <section
      className={`rounded-[var(--radius)] p-6 shadow-[0_1px_2px_rgba(18,24,20,0.04),0_10px_30px_-18px_rgba(18,24,20,0.25)] ${
        accent ? "bg-sage" : "bg-card"
      }`}
    >
      <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-faint">{title}</h3>
      <p className="mt-1 font-display text-lg font-semibold text-ink">
        {bd.city}, {bd.state}
      </p>

      <p
        className={`mt-4 font-display text-4xl font-bold tracking-tight ${
          bd.monthlySurplus >= 0 ? "text-ink" : "text-destructive"
        }`}
      >
        {currency(per(bd.monthlySurplus, period))}
      </p>
      <p className="mt-1 text-xs text-ink-faint">{label}</p>

      <dl className="mt-5 divide-y divide-[var(--line-soft)]">
        <LineItem label="Gross salary (annual)" value={currency(bd.grossSalary)} />
      </dl>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-faint">
        Taxes (annual)
      </p>
      <div className="mt-3">
        <TaxPie bd={bd} />
      </div>

      <dl className="mt-4 divide-y divide-[var(--line-soft)]">
        {period === "monthly" ? (
          <LineItem label="Net pay (annual)" value={currency(bd.netAnnual)} />
        ) : null}
        <LineItem
          label={period === "annual" ? "Net pay (annual)" : "Net pay (monthly)"}
          value={currency(per(bd.netMonthly, period))}
          strong
        />
        <LineItem label="Rent" value={currency(per(bd.monthlyRent, period))} />
        <LineItem label="Everything else" value={currency(per(bd.monthlyNonRent, period))} />
      </dl>
    </section>
  );
}

function BreakEvenGauge({ data }: { data: RelocationReportData }) {
  const be = data.breakEvenSalary;
  if (be === null) {
    return (
      <p className="mt-2 text-sm font-semibold text-white">
        We couldn&rsquo;t solve a break-even salary for this pair of cities.
      </p>
    );
  }
  const offer = data.offer.grossSalary;
  const scaleMax = Math.max(be, offer) * 1.15;
  const bePct = (be / scaleMax) * 100;
  const offerPct = (offer / scaleMax) * 100;
  const clears = (data.offerClearsBreakEvenBy ?? offer - be) >= 0;

  return (
    <div className="mt-5">
      <div className="relative h-4 w-full rounded-full bg-white/25">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${clears ? "bg-cream-deep" : "bg-gradient-to-r from-destructive/70 to-destructive/15"}`}
          style={{ width: `${offerPct}%` }}
        />
        <div
          className="absolute inset-y-[-6px] w-[3px] rounded-full bg-white"
          style={{ left: `${bePct}%` }}
          aria-hidden
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-[13px] font-semibold text-white">
        <span>Break-even {currency(be)}</span>
        <span>Your offer {currency(offer)}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-white">
        {data.offerClearsBreakEvenBy === null
          ? null
          : clears
            ? `The offer clears break-even by ${currency(data.offerClearsBreakEvenBy)}.`
            : `The offer falls short by ${currency(Math.abs(data.offerClearsBreakEvenBy))}.`}
      </p>
    </div>
  );
}

export function RelocationReport({ data }: { data: RelocationReportData }) {
  const [period, setPeriod] = useState<Period>("monthly");
  const [showReasoning, setShowReasoning] = useState(false);

  const verdict = VERDICT[data.verdict] ?? VERDICT.marginal;
  const up = data.surplusDelta >= 0;
  const deltaShown = per(data.surplusDelta, period);
  const movers = data.firstYearMoveCost - data.offer.monthlyRent;

  return (
    <div className="space-y-6">
      {/* Verdict header */}
      <section className="rounded-[var(--radius)] bg-card p-6 shadow-[0_1px_2px_rgba(18,24,20,0.04),0_10px_30px_-18px_rgba(18,24,20,0.25)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span
            className={`inline-flex items-center rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] ${BADGE[verdict.tone]}`}
          >
            {verdict.label}
          </span>
          <div className="inline-flex rounded-full bg-cream-deep p-1">
            {(["monthly", "annual"] as Period[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                aria-pressed={period === p}
                className={`rounded-full px-4 py-1.5 text-xs font-bold capitalize transition-colors ${
                  period === p ? "bg-card text-ink shadow-sm" : "text-ink-soft hover:text-ink"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {data.advice && (
          <>
            <h1 className="mt-5 font-display text-3xl font-bold leading-snug tracking-tight text-ink sm:text-4xl">
              {period === "annual"
                ? `The ${currency(data.raiseHeadline)} salary change ${up ? "leaves you" : "costs you"} ${currency(Math.abs(data.surplusDelta * 12))} ${up ? "extra" : "less"} a year after taxes and cost of living.`
                : data.advice.headline}
            </h1>
            {data.advice.recommendation && (
              <p className="mt-4 text-[15px] font-semibold text-ink-soft">
                {data.advice.recommendation}
              </p>
            )}
          </>
        )}
      </section>

      {/* Side-by-side comparison */}
      <div className="grid gap-4 sm:grid-cols-2">
        <CityCard title="Today" bd={data.current} period={period} />
        <CityCard title="After the move" bd={data.offer} period={period} accent />
      </div>

      {/* Bottom line */}
      <section className="rounded-[var(--radius)] bg-forest px-6 py-8 shadow-[0_18px_40px_-24px_rgba(18,24,20,0.45)] sm:px-8">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Bottom line</h2>

        <p className="mt-4 flex items-baseline gap-2 font-display text-5xl font-bold tracking-tight text-cream-deep sm:text-6xl">
          <span aria-hidden>{up ? "▲" : "▼"}</span>
          <span>
            {up ? "+" : "−"}
            {currency(Math.abs(deltaShown)).replace("$", "$")}
          </span>
        </p>
        <p className="mt-1 text-sm font-semibold text-white">
          change in what you keep {period === "annual" ? "each year" : "each month"} · salary
          adjustment on paper {currency(data.raiseHeadline)}
        </p>

        <BreakEvenGauge data={data} />

        <div className="mt-6 grid gap-4 border-t border-white/25 pt-5 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">
              One-time move cost
            </p>
            <p className="mt-1 font-display text-2xl font-bold text-cream-deep">
              {currency(data.firstYearMoveCost)}
            </p>
            <p className="mt-1 text-[13px] text-white">
              {currency(movers)} movers &amp; travel + {currency(data.offer.monthlyRent)} deposit
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">Payback</p>
            <p className="mt-1 font-display text-2xl font-bold text-cream-deep">
              {data.monthsToRecoup === null
                ? "Never"
                : `${data.monthsToRecoup} month${data.monthsToRecoup === 1 ? "" : "s"}`}
            </p>
            <p className="mt-1 text-[13px] text-white">
              {data.monthsToRecoup === null
                ? "You keep less each month, so the move never pays for itself."
                : `Your move pays for itself in ${data.monthsToRecoup} month${
                    data.monthsToRecoup === 1 ? "" : "s"
                  }.`}
            </p>
          </div>
        </div>
      </section>

      {/* Reasoning */}
      {data.advice?.reasoning && (
        <section className="rounded-[var(--radius)] bg-card shadow-[0_1px_2px_rgba(18,24,20,0.04),0_10px_30px_-18px_rgba(18,24,20,0.25)]">
          <button
            type="button"
            onClick={() => setShowReasoning((s) => !s)}
            aria-expanded={showReasoning}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
          >
            <span className="font-display text-lg font-bold text-ink">
              Why the numbers land this way
            </span>
            <span aria-hidden className="text-sm font-bold text-ink-soft">
              {showReasoning ? "−" : "+"}
            </span>
          </button>
          {showReasoning && (
            <div className="px-6 pb-6">
              <p className="text-[15px] leading-relaxed text-ink-soft">
                {data.advice.reasoning}
              </p>
              {period === "annual" && (
                <p className="mt-3 text-xs font-semibold text-ink-soft/70">
                  Figures in this explanation are monthly — multiply by 12 for the yearly view.
                </p>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
