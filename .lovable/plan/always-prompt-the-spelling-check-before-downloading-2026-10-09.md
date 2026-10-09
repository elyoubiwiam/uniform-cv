# Always prompt the spelling check before downloading

## Problem

The "Check spelling before downloading?" dialog only appears once per CV. After a CV has been spell-checked once, every later download skips the prompt and exports immediately.

## Cause

In `src/routes/index.tsx`, `requestDownload()` checks a `spellCheckedIds` ref: once a CV's id is in that set (added after "Check spelling first" runs), the dialog is bypassed forever — even if the user later edits the CV or downloads again.

## Fix

- Remove the `spellCheckedIds` skip in `requestDownload()` so the dialog appears on **every** PDF/Word download (single CV and batch).
- Remove the now-unused `spellCheckedIds` ref and the line that adds ids to it in `checkBeforeDownload()`.
- Keep the rest unchanged: "Download anyway" still exports directly, "Check spelling first" still runs the check then lets the user download.

## Technical details

- File touched: `src/routes/index.tsx` only.
- Update `src/lib/download-review.test.ts`? No — the reviewed-ids logic is unchanged; only the skip condition in the route is removed.
- Verify: build OK, then a quick Playwright pass — download a CV, confirm the dialog, download again, confirm the dialog appears a second time.
