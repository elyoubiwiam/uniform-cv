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
- PDF/Word export is generated client-side (jsPDF, docx, jszip) from the structured CV; why: no file storage needed and exports match the on-screen review.
- Candidate CVs live only in browser memory; the template is in localStorage; why: v1 has no backend/accounts and avoids storing personal data.
