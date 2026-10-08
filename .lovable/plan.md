# Restore hobbies in the before/after demo CV

## Why it happened

The "after" image on the landing page is not produced by running the messy PDF through the tool. It was rendered directly from a hand-written structured CV (via the app's own `buildPdf` + default template) in a one-off script. That hand-written data simply omitted the hobbies — nothing in the tool removed them, and anonymisation was not involved. So the "after" shows less content than the "before", which undercuts the comparison.

## Fix

1. Regenerate `src/assets/cv-after.jpg` from the same Alexandra Reed content as the messy "before" PDF, this time including the **Interests** section (volleyball, pilates, dance, etc. — matching whatever the before PDF lists) so both sides show identical information.
2. Render through the app's own PDF export with the default (Classic) template, same as now, so the demo stays truthful about the output.
3. Re-check the other style sample images (`style-*.jpg`): if they were built from the same data, add Interests there too for consistency.

## Verification

- View the regenerated `cv-after.jpg` and confirm the Interests section appears.
- Playwright screenshot of the landing page before/after slider showing both versions with matching content.
- Confirm build log is clean.
