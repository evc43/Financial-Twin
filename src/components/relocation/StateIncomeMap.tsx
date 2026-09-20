import { useMemo, useState } from "react";
import { usStatesGeo } from "@/lib/relocation/usStatesGeo";
import {
  MAP_SOURCE_NOTE,
  STATE_MAP_BY_NAME,
  type StateMapDatum,
} from "@/lib/relocation/stateMapData";

/** States too small to hold a label — drawn with a leader line to a right-hand column. */
const CALLOUTS: Record<string, number> = {
  Vermont: 0,
  "New Hampshire": 1,
  Massachusetts: 2,
  "Rhode Island": 3,
  Connecticut: 4,
  "New Jersey": 5,
  Delaware: 6,
  Maryland: 7,
  "District of Columbia": 8,
};

const CALLOUT_X = 986;
const CALLOUT_TOP = 120;
const CALLOUT_GAP = 30;

const VIEWBOX = "0 0 1140 620";

function compactMoney(value: number | null): string {
  if (value == null) return "n/a";
  return `$${Math.round(value / 1000)}K`;
}

function fullMoney(value: number | null): string {
  if (value == null) return "Not published";
  return `$${value.toLocaleString("en-US")}`;
}

function rateLabel(datum: StateMapDatum): string {
  return datum.topMarginalRate == null ? "No income tax" : `${datum.topMarginalRate}%`;
}

export function StateIncomeMap() {
  const [active, setActive] = useState<string | null>(null);

  const scale = useMemo(() => {
    const values = Object.values(STATE_MAP_BY_NAME)
      .map((s) => s.comfortableIncome)
      .filter((v): v is number => v != null);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return (value: number | null) => {
      if (value == null) return 0.18;
      return 0.18 + ((value - min) / (max - min)) * 0.72;
    };
  }, []);

  const activeDatum = active ? STATE_MAP_BY_NAME[active] : undefined;

  return (
    <div className="space-y-3">
      <svg
        viewBox={VIEWBOX}
        role="img"
        aria-label="Map of the United States. Hover or tap a state to see its top state income tax rate and median household income."
        className="w-full select-none"
        onMouseLeave={() => setActive(null)}
      >
        {usStatesGeo.map((shape) => {
          const datum = STATE_MAP_BY_NAME[shape.name];
          if (!datum) return null;
          const t = scale(datum.comfortableIncome);
          const isActive = active === shape.name;
          return (
            <path
              key={shape.name}
              d={shape.d}
              tabIndex={0}
              role="button"
              aria-label={`${datum.name}: state tax ${rateLabel(datum)}, median household income ${fullMoney(
                datum.medianHouseholdIncome,
              )}`}
              onMouseEnter={() => setActive(shape.name)}
              onFocus={() => setActive(shape.name)}
              onBlur={() => setActive((cur) => (cur === shape.name ? null : cur))}
              onClick={() => setActive((cur) => (cur === shape.name ? null : shape.name))}
              style={{
                fill: isActive
                  ? "var(--forest-hover)"
                  : `color-mix(in oklab, var(--forest) ${Math.round(t * 100)}%, var(--cream-deep))`,
                stroke: isActive ? "var(--ink)" : "var(--card)",
                strokeWidth: isActive ? 2 : 1,
                cursor: "pointer",
                outline: "none",
                transition: "fill 140ms ease",
              }}
            />
          );
        })}

        {/* Default labels: the income needed to live comfortably */}
        {usStatesGeo.map((shape) => {
          const datum = STATE_MAP_BY_NAME[shape.name];
          if (!datum) return null;
          const calloutIndex = CALLOUTS[shape.name];
          const isCallout = calloutIndex !== undefined;
          const isActive = active === shape.name;
          if (isActive) return null;

          const t = scale(datum.comfortableIncome);
          const dark = t > 0.55;
          const labelFill = isCallout ? "var(--ink)" : dark ? "var(--card)" : "var(--ink)";

          if (isCallout) {
            const y = CALLOUT_TOP + calloutIndex * CALLOUT_GAP;
            return (
              <g key={`label-${shape.name}`} pointerEvents="none">
                <line
                  x1={shape.cx}
                  y1={shape.cy}
                  x2={CALLOUT_X - 6}
                  y2={y - 4}
                  stroke="var(--ink-faint)"
                  strokeWidth={0.8}
                />
                <text
                  x={CALLOUT_X}
                  y={y}
                  fontSize={15}
                  fontWeight={600}
                  fill={labelFill}
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {datum.abbr}
                  <tspan dx={6} fontWeight={500} fill="var(--ink-soft)">
                    {compactMoney(datum.comfortableIncome)}
                  </tspan>
                </text>
              </g>
            );
          }

          return (
            <text
              key={`label-${shape.name}`}
              x={shape.cx}
              y={shape.cy}
              textAnchor="middle"
              pointerEvents="none"
              fill={labelFill}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              <tspan x={shape.cx} dy={-2} fontSize={11} fontWeight={500} opacity={0.75}>
                {datum.abbr}
              </tspan>
              <tspan x={shape.cx} dy={13} fontSize={13} fontWeight={700}>
                {compactMoney(datum.comfortableIncome)}
              </tspan>
            </text>
          );
        })}

        {/* Hovered state: tax rate + median salary, in place */}
        {activeDatum &&
          (() => {
            const shape = usStatesGeo.find((s) => s.name === activeDatum.name);
            if (!shape) return null;
            const w = 172;
            const h = 74;
            const x = Math.min(Math.max(shape.cx - w / 2, 4), 1140 - w - 4);
            const y = Math.min(Math.max(shape.cy - h - 10, 4), 620 - h - 4);
            return (
              <g pointerEvents="none">
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={12}
                  fill="var(--ink)"
                  opacity={0.97}
                />
                <text x={x + 12} y={y + 22} fontSize={14} fontWeight={700} fill="var(--card)">
                  {activeDatum.abbr}
                </text>
                <text
                  x={x + 12}
                  y={y + 43}
                  fontSize={12}
                  fill="var(--card)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  State tax rate {rateLabel(activeDatum)}
                </text>
                <text
                  x={x + 12}
                  y={y + 62}
                  fontSize={12}
                  fill="var(--card)"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  Median salary {fullMoney(activeDatum.medianHouseholdIncome)}
                </text>
              </g>
            );
          })()}
      </svg>

      {/* Readable panel for small screens / tap */}
      <div className="rounded-[calc(var(--radius)-0.5rem)] bg-cream-deep px-4 py-3 text-sm">
        {activeDatum ? (
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <span className="font-semibold">
              {activeDatum.name} ({activeDatum.abbr})
            </span>
            <span className="tabular-nums">
              State tax rate <strong>{rateLabel(activeDatum)}</strong>
            </span>
            <span className="tabular-nums">
              Median salary <strong>{fullMoney(activeDatum.medianHouseholdIncome)}</strong>
            </span>
          </div>
        ) : (
          <span className="text-ink-soft">
            Each state shows the income a single adult needs to live comfortably. Hover or tap a
            state for its tax rate and median salary.
          </span>
        )}
      </div>

      <p className="text-xs text-ink-faint">{MAP_SOURCE_NOTE}</p>
    </div>
  );
}
