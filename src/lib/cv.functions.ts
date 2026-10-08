import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cvSchema, type CV } from "./cv-schema";
import { reflowCv } from "./reflow";

const inputSchema = z.object({
  filename: z.string().max(300),
  kind: z.enum(["pdf", "text"]),
  // base64 for pdf, plain text otherwise
  data: z.string().min(1).max(14_000_000),
  hyperlinks: z.array(z.string().max(2000)).max(200).default([]),
  anonymise: z.boolean().default(false),
});

const BASE = `You convert a candidate CV into a fixed structured format for a recruitment agency.
STRICT VERBATIM FORMAT ONLY: every character of text you return must be copied from the candidate's CV, except identifying or sensitive information when ANONYMISE MODE is active. Do not rewrite, paraphrase, summarise, condense, improve, translate, correct spelling or grammar, normalise wording, or invent anything.
- Keep the original language of the CV.
- Split experience into roles, most recent first; copy original bullet points exactly. You may separate existing paragraphs only at their original sentence boundaries, without changing the sentence text.
- Dates: copy them exactly as written. Never normalise date formats or substitute words such as "Present".
- If a field is not in the CV use null (or an empty list). Never guess.
- summary: the CV's own profile/summary text verbatim and COMPLETE (every sentence, never truncated), or null. Line breaks that only come from the source layout's line wrapping are not part of the text: join wrapped lines with a single space and keep only genuine paragraph breaks. The same applies to bullet points.
- Copy ALL text of the CV into the matching fields; never drop sentences, bullets, roles or entries.
- headline: the candidate's stated job title/headline, or null.
- hyperlinks: every link attached to text in the CV. "text" is its original visible title (e.g. "Portfolio"), even if that title appears nowhere else in the CV; "url" is the exact target. Preserve every embedded link provided with the file. These will be displayed beside the candidate's contact information.`;

const ANON = `
ANONYMISE MODE (overrides format-only for personal data only): you MAY modify content to remove identifying or sensitive data.
- fullName: the candidate's initials only (e.g. "J. D.").
- email, phone: null. links: [] . Remove personal profile/social hyperlinks.
- location: city/region/country at most, never a street address.
- Remove the candidate's name, date of birth, age, gender, nationality, marital status, photo references, ID numbers and home address wherever they appear in any text.
- Keep everything else verbatim.`;

const SHORTEN = `You shorten a structured candidate CV for a recruitment agency.
- Keep the same structure, all roles, and all education entries.
- You may remove content and rephrase the summary and bullet points so the shortened text remains clear, natural, and coherent.
- Preserve the original meaning and every factual detail you retain. Never add, infer, exaggerate, or alter facts, numbers, skills, titles, employers, dates, or outcomes.
- Keep names, dates, companies, contact fields, education, skills, languages, and certifications exactly unchanged.
- Keep hyperlinks unchanged when their linked text remains; drop a hyperlink only if its text no longer appears.`;

export type ExtractResult = { ok: true; cv: CV } | { ok: false; error: string };

type Content = Array<{ type: "text"; text: string } | { type: "file"; filename: string; data: string; mediaType: string }>;

function preserveFixedFields(original: CV, proposed: CV): CV {
  const experience = original.experience.map((role, index) => ({
    ...role,
    bullets: proposed.experience[index]?.bullets.slice(0, 3) ?? role.bullets.slice(0, 3),
  }));
  const retainedText = JSON.stringify({ summary: proposed.summary, experience });
  return {
    ...original,
    summary: proposed.summary,
    experience,
    hyperlinks: original.hyperlinks.filter((link) => retainedText.includes(link.text)),
  };
}

async function runCv(instructions: string, content: Content): Promise<ExtractResult> {
  const { streamText, Output, NoObjectGeneratedError } = await import("ai");
  const { createGatewayResponsesModel } = await import("./ai-gateway.server");
  try {
    const result = streamText({
      model: createGatewayResponsesModel(),
      maxRetries: 0,
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
    const cv = reflowCv(await result.output);
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
        : [{ type: "text", text: `CV file: ${data.filename}${links}\n\n${data.data}` }];
    return runCv(BASE + (data.anonymise ? ANON : ""), content);
  });

export const shortenCv = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ cv: cvSchema, anonymise: z.boolean().default(false), attempt: z.number().int().min(0).max(100) }).parse(d))
  .handler(async ({ data }): Promise<ExtractResult> => {
    const text = `Attempt ${data.attempt + 1} — produce a fresh variation.\n\nCV JSON:\n${JSON.stringify(data.cv)}`;
    const result = await runCv(SHORTEN, [{ type: "text", text }]);
    if (!result.ok) return result;
    return { ok: true, cv: preserveFixedFields(data.cv, result.cv) };
  });

const issuesSchema = z.object({
  issues: z.array(z.object({ text: z.string(), suggestion: z.string(), reason: z.string() })),
});

const PROOF = `You proofread a structured candidate CV for spelling and grammar mistakes. You never rewrite the CV; you only report issues.
- "text": the exact erroneous word or short phrase, copied character-for-character from one field (keep it as short as possible but unique enough to locate).
- "suggestion": the corrected replacement for that exact text.
- "reason": a few words, e.g. "Spelling", "Subject–verb agreement".
- Only flag clear errors in the CV's own language. Do not flag style, tone, names, company names, technical terms, acronyms, or date formats.
- Return an empty list if there are no errors.`;

export type CheckResult = { ok: true; issues: { text: string; suggestion: string; reason: string }[] } | { ok: false; error: string };

export const checkCv = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ cv: cvSchema }).parse(d))
  .handler(async ({ data }): Promise<CheckResult> => {
    const { streamText, Output } = await import("ai");
    const { createGatewayResponsesModel } = await import("./ai-gateway.server");
    const { hyperlinks: _h, ...cv } = data.cv;
    try {
      const result = streamText({
        model: createGatewayResponsesModel(),
        instructions: PROOF,
        messages: [{ role: "user", content: [{ type: "text", text: `CV JSON:\n${JSON.stringify(cv)}` }] }],
        output: Output.object({ schema: issuesSchema }),
        providerOptions: {
          openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
        },
      });
      const out = await result.output;
      const all = JSON.stringify(cv);
      const issues = out.issues.filter((i) => i.text && i.text !== i.suggestion && all.includes(JSON.stringify(i.text).slice(1, -1)));
      return { ok: true, issues };
    } catch (err) {
      const status = (err as { statusCode?: number })?.statusCode;
      console.error("Proofread failed", status, err);
      if (status === 402) return { ok: false, error: "AI credits are used up. Add credits in Settings → Plans & credits." };
      if (status === 429) return { ok: false, error: "Too many requests right now. Wait a moment and retry." };
      if (status === 403) return { ok: false, error: "AI access is blocked for this workspace." };
      return { ok: false, error: "Couldn't check this CV. Please retry." };
    }
  });
