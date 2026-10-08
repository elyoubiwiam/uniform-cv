# Compare-mode page navigation

## What will change
- Add previous and next arrow controls to each PDF preview in compare mode.
- Show the current page and total page count beside the arrows.
- Keep navigation independent, so the original and uniformed CV can be viewed on different pages.
- Disable previous on page 1 and next on the final page; reset to page 1 when a document changes.
- Preserve the existing matching page size and zoom controls.

## Technical details
- Extend the shared PDF.js viewer to retain the loaded document, render the selected page, and expose page navigation within each viewer.
- Update the shared viewer’s architecture note and verify multi-page rendering and boundary states.
