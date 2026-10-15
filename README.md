# Uniform

**A stack of CVs in. One clean format out.**

Uniform is a free batch CV formatting tool for recruiters and candidates. Drop in CVs in any layout and each one is rebuilt in a standard template using the candidate's own words, ready to review, tweak and send as PDF or Word.

**Live app:** https://uniform-cv.lovable.app

---

## Who it's for

- **Recruiters** who need to send clients a stack of CVs in one consistent, branded format, without retyping them.
- **Candidates** who want a clean, structured CV that both recruiters and recruitment software (ATS) can read correctly. Candidates see no agency branding.

## What it does

1. **Upload in bulk.** Drop in as many PDFs, Word files, text files or photos/scans (JPG, PNG) as you like, up to 10 MB each. Scanned CVs are read with OCR.
2. **Rebuilt in one format.** AI extracts each CV into a structured layout. It formats only and never rewrites the candidate's content.
3. **Review side by side.** Compare the original and the formatted version page by page, and edit any text, link or detail directly.
4. **Export.** Download each CV as a client-ready PDF or Word file.

## Key features

- **Format only, no rewriting:** the candidate's own words are kept.
- **Style picker:** Modern, Classic, Minimal and Executive templates, each shown with a real rendered example and fine-tunable under *Template*.
- **Recruiter branding:** consultant details, an agency footer and a small logo in the reserved footer space, applied consistently across preview, PDF and Word. The logo background can be removed if needed.
- **Compare mode:** original and generated PDFs shown at the same size, each with its own page navigation.
- **Spelling and grammar review:** suggestions are offered before every download. Nothing is corrected automatically.
- **Make shorter:** an optional condensed version when a CV runs too long.
- **Anonymise option** for blind submissions.
- **Live page count**, so you know how long the exported CV will be.

## Privacy

Uniform is free to use and needs no account. A dedicated privacy and data page explains how CV data is handled. Most of the work (editing, comparing, PDF and Word generation) runs entirely in the browser. Only text extraction, shortening and proofreading call an AI service.

## Tech stack

- React, TypeScript, TanStack Start and Router, Vite
- Tailwind CSS with shadcn/ui components
- `pdfjs-dist`, `pdf-lib` and `jspdf` for PDF reading and generation, `docx` and `mammoth` for Word
- AI extraction and proofreading through server functions
- Tests with Vitest
- Built and hosted with [Lovable](https://lovable.dev)

## Roadmap

- [ ] Pull CVs directly from an ATS

---

Built by **Wiam El Youbi**, [wiam-elyoubi.com](https://wiam-elyoubi.com).
