import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

// Claude via the Claude API (pay-as-you-go, set ANTHROPIC_API_KEY).
// Optional CLAUDE_MODEL secret switches model without a code change, e.g. "claude-haiku-5-5".
export const DEFAULT_CLAUDE_MODEL = "claude-sonnet-5-5";

function claudeModel() {
  const configured = process.env["CLAUDE_MODEL"]?.trim();
  return configured && /^claude-[a-z0-9.-]+$/.test(configured) ? configured : DEFAULT_CLAUDE_MODEL;
}

// There is deliberately no fallback provider: CVs must only go to the provider named on the privacy page.
// The provider bundles its own @ai-sdk/provider copy, so cast to the app's LanguageModel type.
export function createClaudeModel(): LanguageModel {
  const apiKey = process.env["ANTHROPIC_API_KEY"]?.trim();
  if (!apiKey) {
    const error = new Error("ANTHROPIC_API_KEY is not set.");
    error.name = "AiNotConfigured";
    throw error;
  }
  return createAnthropic({ apiKey })(claudeModel()) as unknown as LanguageModel;
}
