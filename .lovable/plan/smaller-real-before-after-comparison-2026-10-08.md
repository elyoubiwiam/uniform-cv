# Smaller, real before/after comparison

## What changes

1. **Real digital CVs instead of generated mock images**
   - Create a realistic "before" CV as an actual digital PDF: a fictional candidate (e.g. Alexandra Reed) in a typically messy layout — two columns, coloured boxes, icons, inconsistent fonts, cramped spacing.
   - Create the "after" by running the same fictional content through Uniform's own PDF export (`buildPdf` with the Classic template), so the after image is genuinely our template, not an approximation.
   - Render the first page of each PDF to an image (pdftoppm) and save as `src/assets/cv-before.jpg` / `cv-after.jpg`, replacing the current AI-generated pictures.

2. **Smaller comparison on the start page**
   - Constrain the slider to a narrower column (about half to two-thirds of the current width, centred) so it no longer dominates the page.

## Technical notes

- Script in `/tmp` builds both PDFs (before via reportlab; after via the project's `buildPdf` through a small bun script), converts page 1 of each with `pdftoppm`, and writes the JPGs into `src/assets/`.
- `BeforeAfterSlider` gets a `max-w` wrapper in `src/routes/index.tsx`; component itself unchanged.
- Same fictional candidate on both sides so "same words, one structure" stays true.
