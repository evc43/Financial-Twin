# Financial Twin

**Is that out-of-state offer actually a raise?** Financial Twin compares a job offer in another city against where you live today — after every tax layer and local cost of living — and tells you what actually changes in your pocket each month.

## The problem

A "$30,000 raise" can leave you with less money at the end of the month. Salary alone tells you nothing: federal tax, Social Security and Medicare, state income tax, *city* income tax, rent and local prices decide the real outcome. Most salary calculators stop at federal and state tax and ignore the city layer entirely — which is exactly where two offers diverge most (New York City and Yonkers tax your income; Dallas and Seattle don't).

## What it does

- **Side-by-side city comparison** — each city broken down from gross salary through federal tax, FICA, state tax and local city tax to net pay, then rent and other spending.
- **Monthly surplus for each city**, and the real change between them — the number that actually matters.
- **Break-even salary** — what the new city would have to pay for you to end up exactly as well off as you are today, plus whether your offer clears it and by how much, shown on a gauge.
- **What the move costs** — a movers estimate plus one month of the new rent as a deposit, and how many months of extra surplus it takes until you're even.
- **A verdict** — clear win / marginal / worse, colour-coded, with a written headline, reasoning and recommendation.
- **Monthly ⇄ Annual toggle** across every dollar figure on the report, including the written headline.

## Try it

| Route | What you get |
| --- | --- |
| `/relocation` | Enter your own numbers and run the comparison |
| `/relocation-demo` | A full sample report, no input needed |

## How the numbers are produced

**Deterministic math first.** Bracket-based federal tax, FICA (with the wage base cap), state income tax, and city income tax are computed from data in the repo. Non-rent spending is scaled between cities by a cost-of-living goods index; if you don't know the rent in the offer city, it's estimated from the rent-index ratio. The break-even salary is solved by binary search against the same pipeline. The verdict thresholds are fixed rules, not opinions:

```text
surplusDelta >  $200  → clear win
surplusDelta < -$100  → worse
otherwise             → marginal
```

**Then the language model explains it.** An NVIDIA Nemotron model receives the *finished* result object and writes the headline, reasoning and recommendation using only those numbers — it is explicitly instructed never to invent a figure. If the model is unavailable or rate-limited, the full numeric report still renders; only the prose is missing. No number a user sees comes from a model.

## Data honesty

Every city entry in `costOfLivingData.ts` carries a `verified` flag. Verified entries use researched figures (New York City's 2026 brackets and Yonkers' surcharge among them); unverified entries are clearly-marked placeholders, and the 2026 federal and state brackets are estimates pending final published tables. This is surfaced in the data rather than hidden, so nothing gets presented as more certain than it is.

## Run it locally

Requires Node.js and npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

The app runs at `http://localhost:8080`.

## Built with

TanStack Start (SSR + server functions) · React · TypeScript · Tailwind CSS · Lovable Cloud

## Code map

| File | Role |
| --- | --- |
| `src/lib/relocation/costOfLivingData.ts` | Per-city cost-of-living and rent indexes, plus local city income tax rules |
| `src/lib/relocation/federalTax.ts` | Bracket-based federal income tax |
| `src/lib/relocation/fica.ts` | Social Security (with wage base) and Medicare |
| `src/lib/relocation/stateTaxData2026.ts` | State income tax by state |
| `src/lib/relocation/relocationEngine.ts` | Pure engine: net pay, surplus, break-even, move cost, verdict |
| `src/lib/relocation/relocationAdvisor.server.ts` | Server-only Nemotron call that writes the plain-English read |
| `src/lib/relocation/relocation.functions.ts` | Server function tying the engine and advisor together |
| `src/lib/relocation/relocation.types.ts` | Shared input/result types |
| `src/lib/relocation/mockRelocationReport.ts` | Sample payload behind `/relocation-demo` |
| `src/components/relocation/RelocationReport.tsx` | The report UI: verdict, city cards, break-even gauge, bottom line |
| `src/routes/relocation.tsx` | Input form, progress state, result |
| `src/routes/relocation-demo.tsx` | Sample report route |

---

Built with [Lovable](https://lovable.dev).
