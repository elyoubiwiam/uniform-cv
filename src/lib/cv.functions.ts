import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cvSchema, type CV } from "./cv-schema";

const inputSchema = z.object({
  filename: z.string().max(300),
  kind: z.enum(["pdf", "text"]),
  // base64 for pdf, plain text otherwise
  data: z.string().min(1).max(14_000_000),
});

const INSTRUCTIONS = `You convert a candidate CV into a fixed structured format for a recruitment agency.
FORMAT ONLY: copy the candidate's own wording. Do not rewrite, summarise, improve, translate, or invent anything.
- Keep the original language of the CV.
- Split experience into roles, most recent first; keep the original bullet points verbatim (split paragraphs into bullets only at sentence boundaries).
- Dates: keep as written (e.g. "Jan 2021", "2019"); use "Present" only if the CV says current/present.
- If a field is not in the CV use null (or an empty list). Never guess.
- summary: the CV's own profile/summary text verbatim, or null.
- headline: the candidate's stated job title/headline, or null.`;

export type ExtractResult = { ok: true; cv: CV } | { ok: false; error: string };

export const extractCv = createServerFn({ method: "POST" })
  .inputValidator((d) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<ExtractResult> => {
    const { streamText, Output, NoObjectGeneratedError } = await import("ai");
    const { createGatewayResponsesModel } = await import("./ai-gateway.server");

    const content =
      data.kind === "pdf"
        ? [
            { type: "text" as const, text: `CV file: ${data.filename}` },
            { type: "file" as const, filename: data.filename, data: data.data, mediaType: "application/pdf" },
          ]
        : [{ type: "text" as const, text: `CV file: ${data.filename}\n\n${data.data.slice(0, 200_000)}` }];

    try {
      const result = streamText({
        model: createGatewayResponsesModel(),
        instructions: INSTRUCTIONS,
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
      console.error("extractCv failed", status, err);
      if (status === 402) return { ok: false, error: "AI credits are used up. Add credits in Settings → Plans & credits." };
      if (status === 429) return { ok: false, error: "Too many requests right now. Wait a moment and retry this CV." };
      if (status === 403) return { ok: false, error: "AI access is blocked for this workspace." };
      return { ok: false, error: "Something went wrong reading this CV. Retry it." };
    }
  });
