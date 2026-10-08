import type { CV } from "./cv-schema";

export type Issue = { id: string; text: string; suggestion: string; reason: string };

function mapStrings<T>(value: T, fn: (s: string) => string): T {
  if (typeof value === "string") return fn(value) as T;
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, k === "url" ? v : mapStrings(v, fn)])) as T;
  }
  return value;
}

/** Replace the flagged text with the suggestion wherever it appears (only after the user accepts). */
export function applyFix(cv: CV, issue: Issue): CV {
  return mapStrings(cv, (s) => s.split(issue.text).join(issue.suggestion));
}

/** Issues whose flagged text still appears in the CV (direct edits make them disappear). */
export function liveIssues(cv: CV, issues: Issue[]): Issue[] {
  const all = JSON.stringify(mapStrings(cv, (s) => s));
  return issues.filter((i) => i.text && all.includes(JSON.stringify(i.text).slice(1, -1)));
}
