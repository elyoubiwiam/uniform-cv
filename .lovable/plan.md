# Fill the five gaps

## 1. Recruiter branding in the template
The template already has a logo, agency name and footer note. Add:
- Consultant name, job title, email and phone ("Presented by ..." block).
- Agency footer: agency name, address/website, and registration line, plus page numbers.
- Shown in the preview, the PDF and Word, and kept when CVs are anonymised (these are the recruiter's details, not the candidate's).
- Saved in this browser with the rest of the template.

## 2. Scanned and photo CVs (OCR)
- Accept JPG, PNG and WEBP uploads, as well as PDFs with no text layer.
- Images go to the same reading step as image input, and the same strict word-for-word rules apply.
- A small "Read from a scan, check carefully" badge on those CVs.

## 3. Before/after example on the start screen
- A side-by-side card: a messy sample CV (fictional candidate) next to the same CV in the Uniform layout.
- Made as two images in the app (not real candidate data), with the line "Same words. One structure robots and recruiters both read."

## 4. How data is handled
- A short "Your data" note on the start screen, and a new **Privacy & data** page linked in the footer:
  - Files are read in your browser and sent once to the AI service to pull out the text. They're not stored on our servers.
  - CVs stay in this browser tab only and are cleared on refresh. The template stays in this browser.
  - No accounts, no database, no training on your files.
  - UK GDPR: the agency stays the controller, Uniform processes on its behalf, with a contact for data requests.
- Wording says "designed with UK GDPR in mind", not "certified". The company name and contact email are placeholders until you send the real ones.

## 5. Pricing
- A **Pricing** page plus a header link: "Free during beta". One card listing what's included, a "Planned after beta" note (per-CV / agency plans, ATS import), and a "Get in touch" button with a placeholder email.

## Technical details
- `Template` gets consultantName, consultantTitle, consultantEmail, consultantPhone, agencyAddress and agencyWebsite. `cv-export.ts` draws a consultant block under the header and a 2-line footer with page X/Y. DOCX does the same in its header/footer.
- `fileToPayload` gets `kind: "image"` (base64 + mediaType). `extractCv` sends `{type:"file", mediaType:"image/*"}`. The input validator enum is extended, and `accept` gets image types.
- New routes `src/routes/privacy.tsx` and `src/routes/pricing.tsx`, each with its own head() metadata. A shared footer goes in `__root.tsx`.
- Before/after images go in `src/assets/` via image generation. Copy follows the tool's voice memory.
- Add tests for the consultant block staying when anonymised and for image payload detection.
