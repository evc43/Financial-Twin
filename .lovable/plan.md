# Rename to Financial Twin + a real README

## Goal

The project is called **Financial Twin**. Right now the README is the generic Lovable starter text and the browser tab says "Lovable App". Fix both, and use the name consistently.

## What changes

### 1. New README

Rewrite `README.md` as a real project readme:

- **Financial Twin** — one-line pitch: it tells you whether an out-of-state job offer is actually a raise once taxes and cost of living are accounted for.
- **What it does** — the relocation comparison: current city vs. offer city after federal tax, Social Security/Medicare, state tax and city income tax, plus local cost of living; break-even salary; monthly surplus change; one-time move cost and payback period; a written verdict and explanation; Monthly/Annual toggle.
- **Try it** — `/relocation` for your own numbers, `/relocation-demo` for a sample report.
- **How the numbers are produced** — deterministic tax and cost-of-living math first, then a language model writes the plain-English read on top of those finished numbers only.
- **Data caveat** — cost-of-living indexes are marked verified/unverified in the data file; only verified ones are real figures, and 2026 tax brackets are estimates. Keep this honest and prominent.
- **Running it locally** — clone, install, dev server.
- **Built with** — TanStack Start, React, TypeScript, Tailwind, Lovable Cloud.
- **Project layout** — short pointer list to the relocation data, engine, advisor, server function, report component and routes.

### 2. Name shown to visitors

- Browser tab / share title in `src/routes/__root.tsx`: "Lovable App" / "Lovable Generated Project" become Financial Twin's name and description.
- Page titles for `/relocation` and `/relocation-demo` get "Financial Twin" in front of their existing titles, with matching share text.
- The on-screen header wordmark on both pages reads "Financial Twin" (currently "Relocation Offer Comparison" on the sample page), with the page's own subject as the smaller heading.

## Notes

No calculations, engine code, prompt, or form behaviour change — this is naming, metadata and documentation only. The `package.json` name stays as-is since it isn't published anywhere; say the word if you want it renamed too.
