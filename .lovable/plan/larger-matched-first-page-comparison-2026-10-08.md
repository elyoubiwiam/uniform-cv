# Larger, matched first-page comparison

## Goal
Make Compare mode show the original CV and the generated CV as two equally sized, larger page previews. Each side will show the full first page rather than shrinking one document or cropping/scrolling inside a simulated page.

## Changes
- Hide the CV list on desktop while Compare mode is active, giving the two documents the full available workspace width.
- Keep the existing list and editing layout unchanged when Edit mode is active.
- Render the generated side from the actual exported PDF, so its page boundaries, pagination, footer, and content match the downloaded file.
- Show page 1 of the original and page 1 of the generated PDF at the same width and A4-shaped frame, aligned from the top.
- Increase both previews to fill their equal columns while preserving each page’s aspect ratio and keeping the full page visible.
- Retain zoom controls for the original and add matching zoom controls to the generated PDF preview; zooming happens inside a fixed page viewport without changing the other column’s size.
- Keep the current page-count label and clearly identify each side as Original and Uniformed.
- On smaller screens, retain the stacked comparison with full-width first pages.

## Technical details
- Reuse the existing client-side PDF generation and PDF.js rendering flow rather than approximating the generated document with the current HTML preview.
- Extract or share a focused PDF page viewer so both sides use identical sizing and zoom behaviour.
- Preserve support for original PDF, image, Word, and text uploads; non-PDF originals will use the same page frame where practical.
- Verify at desktop and mobile widths that both first pages are equally sized, fully visible at 100%, aligned, and independently zoomable.
