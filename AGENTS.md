<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Landing-page style previews use the shared carousel with larger slides and overflow-only navigation; why: keeps full CV samples readable without changing the compact template-settings chooser.
- Keep PDF.js on a release compatible with supported browsers (currently v5); why: v6 uses newer Map methods that prevent page rendering in existing Chromium versions.
- Recruiter cover data lives on each in-memory candidate, outside the extracted CV schema, and a shared cover-content helper feeds preview and both exports; why: recruiter notes must not rewrite source text or leak into candidate-mode or anonymous documents.
- CV editor fields auto-size on text, width, visibility and font changes, and the editor uses normal page scrolling; why: hidden desktop panels must not retain clipped measurements and all content must stay reachable.
- Preview PDF page counts are read from the actual client-generated export; why: matches downloaded pagination and updates with CV/template changes.
- Compare mode renders every page of both the original and generated PDF through one shared PDF.js viewer with independent navigation; why: keeps page scale, boundaries, zoom and page controls identical.
- CV extraction runs in a server function (`src/lib/cv.functions.ts`) calling Claude Sonnet 5.5 via the Claude API when ANTHROPIC_API_KEY is set (falling back to Lovable AI Gateway Responses otherwise) with a strict zod schema; why: keeps the key server-side, output uniform, and AI cost on pay-as-you-go billing.
- PDF/Word export is generated client-side from the structured CV with individual downloads; why: no file storage needed and exports match the on-screen review.
- Read PDF text layers in the browser with a bundled PDF.js worker and fall back to the original PDF if any page lacks usable text; why: avoids duplicate document reading while retaining scan support.
- Candidate CVs live only in browser memory; the template is in localStorage; why: v1 has no backend/accounts and avoids storing personal data.
- All exports and the preview pass the template through effectiveTemplate(), which strips agency branding and anonymisation in candidate mode; why: branding entered earlier must never leak into a candidate's CV.
- Photos/scans (JPG/PNG/WEBP) are sent to the extraction model as image files under the same verbatim rules; why: OCR without a separate service.
- Footer branding uses bounded, aspect-ratio-preserving logos and reserved space in preview and exports; why: branding cannot overlap candidate content.
- CV paragraph boundaries and export spacing are handled by the shared CV layout module; why: consistent readable spacing without rewriting source content.
- Recruiter details share one form between the start page and Template settings; why: both surfaces edit the same saved template without divergent fields.
- Every PDF/Word download uses one spelling-review dialog and shared candidate selection, skipped for CVs checked once whose text hasn't changed since (each check snapshots the CV; edits, shortening or re-reading trigger the prompt again); why: consistent prompting without redundant re-checks and without automatically accepting corrections.
- Skill separator normalization is shared by category cleanup, editor blur, preview and exports; why: comma lists and explicit groups remain consistent without rewriting terms.
- Recruiter logo background removal runs in the browser on flat edge-connected backdrops and produces a transparent PNG; why: preserves logo details without uploading branding to another service, and refuses uncertain patterned backgrounds.
- Inline bold/italic/underline is stored in CV text as **, *, __ markers parsed by src/lib/cv-format.ts and rendered by preview, PDF and Word; why: no schema change and formatting survives every export.
