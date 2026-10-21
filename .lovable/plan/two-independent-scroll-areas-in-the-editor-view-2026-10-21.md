# Two independent scroll areas in the editor view

## What changes
- **Preview side (cover page + CV):** becomes its own scrolling area, the height of the screen. With the cursor over it, the mouse wheel/trackpad scrolls through the cover page and the CV pages, and the text fields on the left do not move.
- **Text fields side:** keeps scrolling as now. With the cursor over it, the fields scroll and the preview on the right stays fixed in place.
- Reaching the end of the preview won't start scrolling the text fields (and vice versa), so each side only moves when the cursor is over it.
- A thin scrollbar on the preview shows there's more to see.
- Applies to the desktop Edit view. The Compare view and the stacked mobile layout stay as they are.

## Technical details
- `src/routes/index.tsx`: the sticky right column (`sticky top-20 self-start`) gets `max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain` in edit mode only.
- Editor keeps normal page scrolling (matches the existing rule that all editor content stays reachable); the preview is sticky, so page scrolling leaves it fixed.
- Verify in Playwright at 1280 width: wheel over preview changes its scrollTop while window.scrollY stays the same; wheel over the editor changes window.scrollY while the preview's position stays the same.
