# Move Before/After labels above the comparison slider

## Goal
The "Before" and "After" chips currently sit on top of the CV images, covering content. Move them above the slider so nothing is hidden.

## Change
In `src/components/BeforeAfterSlider.tsx`:
- Remove the two absolutely-positioned `<span>` chips from inside the slider.
- Add a small header row above the slider: "Before" on the left, "After" on the right, same chip styling as now.
- Keep everything else unchanged: drag behaviour, divider handle, "Drag to compare" hint, caption.

## Technical details
- Single-file edit in `src/components/BeforeAfterSlider.tsx`.
- No new dependencies, no logic changes.
- Verify in the preview that both CV images are fully visible and the labels sit above them.
