# A judge-ready README for Financial Twin

Replace the generic starter text in `README.md` with a real project readme, written for someone seeing the project for the first time (a judge, a reviewer). It will contain:

**Financial Twin** — one-line pitch: find out whether an out-of-state job offer is actually a raise once every tax layer and local cost of living are accounted for.

**The problem** — a "$30k raise" can leave you with less money each month. Salary alone tells you nothing; federal tax, Social Security/Medicare, state tax, city income tax and local cost of living decide the real outcome.

**What it does**
- Side-by-side comparison of your current city and the offer city, each broken down from gross salary through every tax layer to net pay, rent and other spending.
- Monthly surplus for each city, and the real change between them.
- Break-even salary: what the new city would have to pay for you to come out even — and whether the offer clears it.
- One-time move cost (movers estimate plus one month's deposit) and how many months until you're even.
- A colour-coded verdict (clear win / marginal / worse) with a written headline, reasoning and recommendation.
- Monthly/Annual toggle across every dollar figure.

**Try it** — `/relocation` to run your own numbers, `/relocation-demo` for a sample report with no input needed.

**How the numbers are produced** — deterministic math first: real bracket-based federal tax, FICA, state tax and city income tax, with non-rent spending scaled by cost-of-living index and offer rent estimated from the rent-index ratio when not supplied. A language model then writes the plain-English read using only those finished numbers — it never invents a figure.

**Data honesty** — cost-of-living entries carry a `verified` flag; only verified cities use researched figures, the rest are placeholders, and the 2026 tax brackets are estimates. Stated plainly rather than hidden.

**Run it locally** — clone, `npm i`, `npm run dev`.

**Built with** — TanStack Start, React, TypeScript, Tailwind, Lovable Cloud.

**Code map** — a short table pointing at the cost-of-living data, tax modules, relocation engine, AI advisor, server function, report component and routes, so a reviewer can find the real logic in seconds.

Only `README.md` changes — no app code, numbers or behaviour touched.
