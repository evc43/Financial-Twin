# Replace example amounts with "Type here"

The empty money boxes currently hint at example numbers (120000, 3200, 1800, 125000). Those look like real values and can be confusing. Replace them with a plain "Type here" prompt.

## What changes

- Current salary, current monthly rent, monthly spending, and offer salary all show "Type here" as the faint prompt text.
- Offer rent (optional) keeps its own prompt, "Estimated", since leaving it blank means we estimate it.
- The small helper line under each box stays as is, so the example range is still explained in words where needed.
- No change to the calculations, the city dropdowns, the button rules, or the results screen.

## Technical notes

- In `src/routes/relocation.tsx`, change the `placeholder` values in `CURRENT_FIELDS` and `OFFER_FIELDS` from the numeric strings to `"Type here"`; leave `offerRent`'s `"Estimated"` untouched.
