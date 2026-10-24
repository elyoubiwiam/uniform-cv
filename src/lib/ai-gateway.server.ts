import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";

// Primary: Claude via the Claude API (pay-as-you-go, set ANTHROPIC_API_KEY).
// Optional CLAUDE_MODEL secret switches model without a code change, e.g. "claude-haiku-5-5".
export const DEFAULT_CLAUDE_MODEL = "claude-sonnet-5-5";

function claudeModel() {
  const configured = process.env["CLAUDE_MODEL"]?.trim();
  return configured && /^claude-[a-z0-9.-]+$/.test(configured) ? configured : DEFAULT_CLAUDE_MODEL;
}

// Fallback: Lovable AI Gateway, used only when ANTHROPIC_API_KEY is not set.
const LOVABLE_AIG_RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";
export const GATEWAY_BASE_URL = "https://ai.gateway.lovable.dev/v1";
export const CHAT_MODEL = "openai/gpt-6-astra";

function createRunIdFetch(initialRunId?: string) {
  let runId = initialRunId?.trim() || undefined;
  return {
    getRunId: () => runId,
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has(LOVABLE_AIG_RUN_ID_HEADER)) headers.set(LOVABLE_AIG_RUN_ID_HEADER, runId);
      const response = await fetch(input, { ...init, headers });
      runId ??= response.headers.get(LOVABLE_AIG_RUN_ID_HEADER)?.trim() || undefined;
      return response;
    },
  };
}

export function createGatewayResponsesModel() {
  const anthropicKey = process.env["ANTHROPIC_API_KEY"]?.trim();
  if (anthropicKey) return createAnthropic({ apiKey: anthropicKey })(claudeModel());

  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured for this app.");
  const runIdFetch = createRunIdFetch();
  const provider = createOpenAI({
    baseURL: GATEWAY_BASE_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  return provider.responses(CHAT_MODEL);
}
