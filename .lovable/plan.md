# Start the relocation form empty

Right now the form opens pre-filled with a sample city, salary, rent and spending. Change it so every field starts blank and the user types their own numbers.

## What changes

- All number fields (current salary, current rent, monthly spending, offer salary, offer rent) start empty with a light placeholder showing an example amount.
- Both city dropdowns start on a "Select a city" placeholder instead of a pre-chosen city.
- The compare button stays disabled (greyed out) until both cities are chosen and salary, rent and spending are filled in, so the comparison never runs on blanks.
- Nothing about the calculations, the written advice, or the results screen changes.

## Technical notes

- In `src/routes/relocation.tsx`: set every value in `DEFAULTS` to `""`.
- Add a disabled empty `<option value="">Select a city</option>` as the first entry in the city `<select>`; keep `CITY_OPTIONS` as-is.
- `stateForCity("")` already returns `""`, so the hint falls back to the field's existing hint text.
- Add `placeholder` to `FieldDef` (e.g. `120000`, `3200`, `1800`) and pass it to the `<input>`.
- Derive a `canSubmit` boolean (both cities non-empty; currentSalary, currentRent, monthlySpendingExRent, offerSalary non-empty) and use it in the button's `disabled` alongside `loading`. Offer rent stays optional.
