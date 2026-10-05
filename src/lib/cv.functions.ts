import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cvSchema, type CV } from "./cv-schema";

const inputSchema = z.object({
  filename: z.string().max(300),
  kind: z.enum(["pdf", "text"]),
  // base64 for pdf, plain text otherwise
  data: z.string().min(1).max(14_000_000),
  hyperlinks: z.array(z.string().max(2000)).max(200).default([]),
  anonymise: z.boolean().default(false),
});

const BASE = `You convert a candidate CV into a fixed structured format for a recruitment agency.
FORMAT ONLY: copy the candidate's own wording. Do not rewrite, summarise, improve, translate, or invent anything.
- Keep the original language of the CV.
- Split experience into roles, most recent first; keep the original bullet points verbatim (split paragraphs into bullets only at sentence boundaries).
- Dates: keep as written (e.g. "Jan 2021", "2019"); use "Present" only if the CV says current/present.
- If a field is not in the CV use null (or an empty list). Never guess.
- summary: the CV's own profile/summary text verbatim, or null.
- headline: the candidate's stated job title/headline, or null.
- hyperlinks: every link that was attached to text in the CV. "text" must be the exact visible words as they appear in one of your output fields (e.g. a project name, "Portfolio", a URL); "url" is the target. Use the embedded link list provided with the file when available.`;

const ANON = `
ANONYMISE MODE (overrides format-only for personal data only): you MAY modify content to remove identifying or sensitive data.
- fullName: the candidate's initials only (e.g. "J. D.").
- email, phone: null. links: [] . Remove personal profile/social hyperlinks.
- location: city/region/country at most, never a street address.
- Remove the candidate's name, date of birth, age, gender, nationality, marital status, photo references, ID numbers and home address wherever they appear in any text.
- Keep everything else verbatim.`;

const SHORTEN = `You shorten a structured candidate CV for a recruitment agency.
- Keep the same language and the same structure (all roles and education entries stay).
- summary: at most 3 sentences. Each role: at most 3 of its strongest bullets, condensed.
- Only use facts already present. Never invent numbers, skills, titles or employers.
- Keep names, dates, companies, contact fields and hyperlinks unchanged; drop a hyperlink only if its text no longer appears.`;

export type ExtractResult = { ok: true; cv: CV } | { ok: false; error: string };

type Content = Array<{ type: "text"; text: string } | { type: "file"; filename: string; data: string; mediaType: string }>;

async function runCv(instructions: string, content: Content): Promise<ExtractResult> {
  const { streamText, Output, NoObjectGeneratedError } = await import("ai");
  const { createGatewayResponsesModel } = await import("./ai-gateway.server");
  try {
    const result = streamText({
      model: createGatewayResponsesModel(),
      instructions,
      messages: [{ role: "user", content }],
      output: Output.object({ schema: cvSchema }),
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const cv = await result.output;
    return { ok: true, cv };
  } catch (err) {
    if (NoObjectGeneratedError.isInstance(err)) {
      return { ok: false, error: "Couldn't read this CV's structure. Try another file format." };
    }
    const status = (err as { statusCode?: number })?.statusCode;
    console.error("CV AI call failed", status, err);
    if (status === 402) return { ok: false, error: "AI credits are used up. Add credits in Settings → Plans & credits." };
    if (status === 429) return { ok: false, error: "Too many requests right now. Wait a moment and retry." };
    if (status === 403) return { ok: false, error: "AI access is blocked for this workspace." };
    return { ok: false, error: "Something went wrong. Please retry." };
  }
}

export const extractCv = createServerFn({ method: "POST" })
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<ExtractResult> => {
    const links = data.hyperlinks.length ? `\n\nEmbedded links found in the file:\n${data.hyperlinks.join("\n")}` : "";
    const content: Content =
      data.kind === "pdf"
        ? [
            { type: "text", text: `CV file: ${data.filename}${links}` },
            { type: "file", filename: data.filename, data: data.data, mediaType: "application/pdf" },
          ]
        : [{ type: "text", text: `CV file: ${data.filename}${links}\n\n${data.data.slice(0, 200_000)}` }];
    return runCv(BASE + (data.anonymise ? ANON : ""), content);
  });

export const shortenCv = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ cv: cvSchema, anonymise: z.boolean().default(false), attempt: z.number().int().min(0).max(100) }).parse(d))
  .handler(async ({ data }): Promise<ExtractResult> => {
    const text = `Attempt ${data.attempt + 1} — produce a fresh variation.\n\nCV JSON:\n${JSON.stringify(data.cv)}`;
    return runCv(SHORTEN + (data.anonymise ? ANON : ""), [{ type: "text", text }]);
  });
