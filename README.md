# Uniform

**A stack of CVs in. One clean format out.**

Uniform is a free batch CV formatting tool for recruiters. Drop in CVs in any layout and each one is rebuilt in your standard template using the candidate's own words, ready to review, tweak and send to a client as PDF or Word.

**Live app:** https://uniform-cv.lovable.app

---

## Who it's for

Agency and in-house **recruiters** who need to send clients a stack of CVs in one consistent, branded format, without retyping them.

## What it does

1. **Upload in bulk.** Drop in as many PDFs, Word files, text files or photos/scans (JPG, PNG, WebP) as you like, up to 10 MB each. Scanned CVs are read with OCR, and five CVs are processed at once so big batches move quickly.
2. **Rebuilt in one format.** AI extracts each CV into a structured layout. It formats only and never rewrites the candidate's content.
3. **Review side by side.** Compare the original and the formatted version page by page, and edit any text, link or detail directly.
4. **Export.** Download each CV as a client-ready PDF or Word file.

Need to fix just one CV? **Quick CV edit** on the start page opens a single file so you can correct the text and download it again as PDF or Word.

## Key features

- **Format only, no rewriting:** the candidate's own words are kept.
- **Style picker:** Modern, Classic, Minimal and Executive templates, each shown with a real rendered example and fine-tunable under *Template*.
- **Recruiter branding:** consultant details, an agency footer and a small logo in the reserved footer space, applied consistently across preview, PDF and Word. The logo background can be removed if needed.
- **Recruiter cover page:** an optional first page with your details and logo on every formatted export.
- **Candidate details for clients:** notice period, current salary, salary expectations, current or last employer, and willingness to relocate.
- **Recruiter notes:** a notes box for your own comments on each candidate.
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
- AI extraction and proofreading through server functions, using **Claude Sonnet 5.5** via the Claude API (pay-as-you-go)
- Tests with Vitest
- Built and hosted with [Lovable](https://lovable.dev)

### AI configuration

Set these as project secrets:

| Secret | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude API key. Required for the primary AI path. |
| `CLAUDE_MODEL` | Optional. Switches model without a code change, e.g. `claude-haiku-5-5`. Defaults to `claude-sonnet-5-5`. |

If `ANTHROPIC_API_KEY` is not set, Uniform falls back to the Lovable AI Gateway.

## Roadmap

- [ ] Pull CVs directly from an ATS

---

Built by **Wiam El Youbi**, [wiam-elyoubi.com](https://wiam-elyoubi.com).
