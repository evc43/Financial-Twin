# Tax donut: total below the chart, higher-contrast slice colors

Presentation-only change to the annual tax chart on the relocation results screen. No calculations, engine, or wording changes.

## Changes

1. **Move the total out of the donut.** The center of the ring no longer shows "Total". Instead, a single line sits directly under the chart: the total taxes amount with a small "Total taxes (annual)" label. On hover, the center still shows the hovered slice's name, amount, and percentage, so the interaction stays useful; with nothing hovered the center is empty.

2. **New slice colors with clear separation.** The four slices currently use two near-identical dark greens for Federal and FICA, which are hard to tell apart. New assignment, all from the existing palette so the cream/green look holds:
   - Federal — deep ink green (darkest)
   - FICA — forest green (bright accent)
   - State — amber/gold
   - City — terracotta red (destructive token)

   Legend dots use the same colors, so the legend and chart stay in sync.

## Technical notes

- File: `src/components/relocation/RelocationReport.tsx` only.
- `TAX_COLORS` becomes `["var(--ink)", "var(--forest)", "var(--amber-text)", "var(--destructive)"]`.
- In `TaxPie`, the centered absolute overlay renders only when a slice is active; the total moves to a block below the `<svg>` inside the left column, keeping the chart-plus-legend row layout intact on desktop and stacked on mobile.
