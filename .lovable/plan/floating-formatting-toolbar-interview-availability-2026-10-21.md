# Floating formatting toolbar + interview availability

## 1. Formatting toolbar appears on selection
- Remove the fixed Bold / Italic / Underline bar from the top of the editor.
- When you select text in Profile, bullet points or education details, a small toolbar (B, I, U) pops up right above the selection, wherever you are on the page.
- It disappears when the selection is cleared, you click elsewhere, or you press Escape. Ctrl/Cmd+B/I/U keep working.

## 2. Interview availability (recruiter cover page)
- New "Interview availability" block in the Recruiter cover page section, before Recruiter notes.
- Day chips: Mon, Tue, Wed, Thu, Fri, Sat (no Sunday). Click to select or unselect.
- Each selected day shows its own row with a time range, "HH:MM until HH:MM" (picked from 15-minute steps), plus "Add another time" for more ranges and a remove button for each one.
- Days are listed in week order. A range whose end time is before its start time is flagged and not shown on the cover.
- On the cover page (preview, PDF and Word) a row "Interview availability" lists e.g. "Mon 09:00–12:00, 14:00–17:00 · Wed 10:00–11:30", or "Not provided".
- Kept in anonymised covers too (it identifies no one).

## Technical details
- `CvEditor.tsx`: replace `FormatBar` with a `SelectionToolbar` rendered fixed-position from the textarea selection (mirror-div caret coordinates, onSelect/mouseup/keyup listeners); reuse `toggleMark`.
- `cv-cover.ts`: add `availability: Partial<Record<"mon"|…|"sat", {from: string; to: string}[]>>` to RecruiterCover/empty value; `formatAvailability()` helper feeds `recruiterCoverContent` rows so preview and both exports pick it up.
- Tests in `cv-cover.test.ts`: Sunday not accepted, day order, invalid ranges skipped, "Not provided" when empty.
