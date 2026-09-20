# Interactive US map with per-state hover

Replace the flat map picture under "Why the numbers land this way" with a real, hoverable US map in the app's cream/green palette.

## Behaviour

Default (nothing hovered)
- Every state shows its "income needed to live comfortably" figure, the same numbers the current picture shows.
- States are shaded in the app's green scale — paler green for lower income needed, deeper green for higher — so the map still reads as a heat map.

On hover (or tap on mobile)
- The hovered state lifts slightly and its comfortable-income label is replaced in place by:
  - the state abbreviation (e.g. AZ)
  - State tax rate: the real published rate, or "No income tax"
  - Median salary: the real published figure
- Every other state keeps showing its comfortable-income number.
- Moving off the state restores its original label.

Small screens get the same map, scaled down, with tap-to-reveal instead of hover and the figures shown in a panel under the map so the text stays readable.

## Data

All 50 states plus DC, researched from published sources and stored in one new data file:
- State income tax: top marginal rate for a single filer, 2026 schedules, with a "no income tax" flag for the nine states without one.
- Median salary: median individual earnings per state, most recent published figure.
- Income needed to live comfortably: the $81K-$129K figures the current picture uses.

Each entry records its source and year so the figures can be checked. A short source line sits under the map.

This is new data only — the existing city and tax files that drive the comparison are not touched, so no number in the comparison result changes.

## Technical notes

- New `src/lib/relocation/stateMapData.ts`: one record per state with `abbr`, `name`, `topMarginalRate | null`, `medianSalary`, `comfortableIncome`, plus source metadata.
- New `src/lib/relocation/usStatesGeo.ts`: inline SVG path geometry for the 50 states + DC (public-domain Albers projection outlines) and a label anchor point per state. No new npm dependency, no map library.
- New `src/components/relocation/StateIncomeMap.tsx`: one `<svg viewBox>` with a `<path>` per state, fill from a green scale derived from `--forest` / `--cream-deep`, plus `<text>` labels at the anchor points. Hover state held in one `useState`; the hovered state renders the three-line readout instead of its number. Keyboard focusable paths for accessibility.
- `src/routes/relocation.tsx`: swap the `<img src={incomeMapAsset.url}>` block for `<StateIncomeMap />`. The image asset file stays in place, unused.
- Nothing in `relocationEngine.ts`, `stateTaxData2026.ts`, `costOfLivingData.ts`, `relocationAdvisor.server.ts`, or `RelocationReport.tsx` changes.
