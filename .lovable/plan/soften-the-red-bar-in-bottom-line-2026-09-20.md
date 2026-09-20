# Soften the red bar in Bottom Line

## What changes

On the break-even bar inside the Bottom Line panel, the solid red fill shown when the offer
falls short of break-even is too harsh against the green card. It becomes a soft, faded red
that gradually washes out toward its right edge, so it still reads as "short" without a hard
red block.

- Shortfall case: fill becomes a left-to-right gradient from a muted red into near-transparent.
- Clearing case: unchanged pale-cream fill (the positive state stays as it is).
- The white break-even marker, both labels, and the sentence underneath stay exactly the same.
- No numbers, calculations, verdict logic, or wording change.

## Technical detail

In `src/components/relocation/RelocationReport.tsx`, `BreakEvenGauge`: replace the
`bg-destructive` class on the fill div with a gradient utility
(`bg-gradient-to-r from-destructive/70 to-destructive/15`) so the red fades out; keep
`bg-cream-deep` for the clearing state and leave all other markup untouched.
