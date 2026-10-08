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
- CV extraction runs in a server function (`src/lib/cv.functions.ts`) calling Lovable AI Gateway Responses with a strict zod schema; why: keeps the key server-side and output uniform.
- PDF/Word export is generated client-side from the structured CV with individual downloads; why: no file storage needed and exports match the on-screen review.
- Read PDF text layers in the browser with a bundled PDF.js worker and fall back to the original PDF if any page lacks usable text; why: avoids duplicate document reading while retaining scan support.
- Candidate CVs live only in browser memory; the template is in localStorage; why: v1 has no backend/accounts and avoids storing personal data.
- All exports and the preview pass the template through effectiveTemplate(), which strips agency branding and anonymisation in candidate mode; why: branding entered earlier must never leak into a candidate's CV.
- Photos/scans (JPG/PNG/WEBP) are sent to the extraction model as image files under the same verbatim rules; why: OCR without a separate service.
