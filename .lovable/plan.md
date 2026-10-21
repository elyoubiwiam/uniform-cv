# Fix cursor jumping while editing CV text

## Problem
In the Edit panel, some fields tidy the text on every keystroke (trimming spaces, dropping empty lines, re-joining comma lists). When you type a space or press Enter at the end of a sentence, the tidied text no longer matches what you typed, so the box resets and the cursor jumps to the end of the whole field.

Affected fields: Experience bullet points, Links, Interests & hobbies, Languages, Certifications.

## Fix
- These fields keep exactly what you type while you are typing (a local draft), so the cursor stays wherever you are.
- The tidy-up (trim spaces, remove empty lines, split by commas) runs only when you leave the field — the same way the Skills box already works.
- If the CV changes from elsewhere (Accept a spelling fix, Make shorter, Re-read file), the field refreshes to the new text.
- Profile, names, dates and other single fields already keep your text as typed; no change there.

## Technical details
- In `src/components/cv/CvEditor.tsx`, add a generic `DraftField` (local `useState` draft, sync from prop via `useEffect` when the parsed value changes, commit `parse(draft)` on blur) and use it for bullets (`lines`), links/interests/languages/certifications (`list`).
- Add a small test that typing "Led team " followed by more text is not trimmed mid-edit (parse only on commit), and that blur still produces the trimmed list.
