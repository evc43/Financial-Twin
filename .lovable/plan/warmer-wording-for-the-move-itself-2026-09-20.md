# Warmer wording for "The move itself"

Wording-only change on the Relocation results screen. No calculations, engine, prompts, or cascade code touched — same numbers, same layout, just plainer labels that don't assume the salary goes up.

## Label changes

| Now | New |
| --- | --- |
| The move itself | What the move actually costs you |
| Headline raise | Salary adjustment (on paper) |
| Change in monthly surplus | What actually changes in your pocket each month |
| One-time move cost | Money you spend once to get there |
| Moving & logistics (estimate) | Movers, truck, travel (rough estimate) |
| Security deposit (1 mo. rent) | Deposit on the new place (one month's rent) |
| Months to recoup that cost | How long until you're even |

Sign handling stays as-is, so a lower salary still shows as a negative number under "Salary adjustment (on paper)".

## Sentence and caption

- Positive case: "Getting there costs about $4,536 once. You keep $312 more each month, so you're even after 15 months — everything after that is yours."
- Negative case: "Getting there costs about $4,536 once, and you keep less each month than you do today — so this move never pays itself back."
- Caption: "The movers figure is a rough guess — swap in your real quote. The deposit is just one month of your new rent."

## Technical note

All edits are in the "The move itself" section of `src/routes/relocation.tsx` (heading, `Row` labels, the two indented sub-item labels, the interpreting sentence, the muted caption). No changes to `relocationEngine.ts`, `relocation.functions.ts`, `relocationAdvisor.server.ts`, or any cascade file.
