# Minimal redesign, UX polish and copy clean-up

## What will change

**Look and feel**
- Switch the whole app to Poppins (one font for titles and text), replacing Manrope.
- Build a tighter palette around the existing dark terracotta: a deeper shade for main buttons, a soft tint for highlights and selected states, and warm neutrals for backgrounds and borders. The current navy goes, so every accent matches the terracotta.
- More white space, fewer borders and boxes, quieter cards and one clear visual hierarchy per screen.

**Landing page**
- Shorter hero: one headline, one sentence, one large primary button ("Upload CVs") plus a secondary link to the example.
- Clear 3-step strip (Upload, Review, Download) so the flow is easy to follow.
- Before/after slider, style examples and "Why structure matters" kept but simplified and spaced out.
- Prominent, high-contrast buttons with clear hover and pressed states.

**Working pages (upload list, editor, compare, template settings, privacy)**
- Clear step indicator showing where the user is (Upload, Format, Download).
- Main actions (Start formatting, Download PDF, Download Word) given primary styling; secondary actions grouped and visually lighter.
- Short helper text under complex controls (anonymise, make shorter, interview availability).
- Gentle motion: fade/slide when panels open, cards appear and steps change, respecting reduced-motion settings.
- Clear loading, empty and error states with plain-language messages.

**Copy**
- Remove every em dash from visible text on all pages, dialogs and exports (replaced with commas, full stops or colons).
- Convert all wording to UK English (for example colour, organise, anonymise, personalise, licence).

**Responsive and QA**
- Check every screen at phone, tablet, laptop and wide desktop sizes for overlapping text, cut-off buttons and horizontal scrolling.
- Cross-test the full flow in both recruiter and candidate modes: upload, start formatting, edit, formatting toolbar, cover page fields and availability, compare with zoom and page arrows, spelling check before download, PDF and Word downloads, logo upload and background removal, logo link back home.

## Technical details
- Load Poppins via a link in the root route head; update the font and colour tokens in the global stylesheet (light and dark), and keep components on semantic tokens only.
- Restyle shared button and card variants rather than one-off classes.
- Search all source and export strings for the em dash character and US spellings; existing behaviour and CV content handling stay unchanged (candidate CV text is never altered).
- Update the saved design memory (font and palette) and run existing tests plus Playwright screenshots at 390, 768, 1280 and 1600 px wide.
