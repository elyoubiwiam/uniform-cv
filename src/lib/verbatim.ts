import type { CV } from "./cv-schema";

export type VerbatimResult = {
  passed: boolean;
  /** Words in the formatted CV that aren't in the original. */
  added: string[];
  /** How many original words are missing, once the count is too high to be just section headings. */
  missingCount: number;
  missingSample: string[];
};

/** Headings and labels ("Experience", "Email:") are dropped on purpose, so a few missing words are normal. */
const MISSING_WORDS_ALLOWED = 20;
const MISSING_SHARE_ALLOWED = 0.05;

function words(text: string): string[] {
  return text.normalize("NFKC").toLowerCase().replace(/[’‘]/g, "'").match(/[\p{L}\p{M}\p{N}]+(?:'[\p{L}]+)*/gu) ?? [];
}

function countWords(list: string[]) {
  const counts = new Map<string, number>();
  for (const word of list) counts.set(word, (counts.get(word) ?? 0) + 1);
  return counts;
}

/** The CV's own text. Links are left out because their URLs come from the file, not its visible text. */
function cvText(cv: CV, anonymised: boolean): string {
  return [
    anonymised ? null : cv.fullName,
    cv.headline,
    cv.location,
    cv.email,
    cv.phone,
    cv.summary,
    ...cv.experience.flatMap((r) => [r.title, r.company, r.location, r.startDate, r.endDate, ...r.bullets]),
    ...cv.education.flatMap((e) => [e.degree, e.institution, e.startDate, e.endDate, e.details]),
    ...cv.skills,
    ...cv.languages,
    ...cv.certifications,
    ...cv.interests,
  ].filter(Boolean).join("\n");
}

/**
 * Compares the words of the formatted CV with the source text. A flag for the recruiter to look,
 * not proof: it checks which words are present, not their order. Only works where we have source text.
 */
export function checkVerbatim(source: string, cv: CV, anonymised = false): VerbatimResult {
  const sourceWords = words(source);
  const outputWords = words(cvText(cv, anonymised));
  const sourceCounts = countWords(sourceWords);
  const outputCounts = countWords(outputWords);
  // Joined-up text catches words a PDF split in two, e.g. "commu-nication" or "Proj ect".
  const sourceJoined = sourceWords.join("");
  const outputJoined = outputWords.join("");

  const added = [...outputCounts.keys()].filter((word) => !sourceCounts.has(word) && !sourceJoined.includes(word));

  let missing = 0;
  const missingWords: string[] = [];
  for (const [word, count] of sourceCounts) {
    const short = count - (outputCounts.get(word) ?? 0);
    if (short <= 0) continue;
    if (!outputCounts.has(word) && outputJoined.includes(word)) continue;
    missing += short;
    missingWords.push(word);
  }
  const allowed = Math.max(MISSING_WORDS_ALLOWED, Math.ceil(sourceWords.length * MISSING_SHARE_ALLOWED));
  const tooManyMissing = missing > allowed;

  return {
    passed: added.length === 0 && !tooManyMissing,
    added,
    missingCount: tooManyMissing ? missing : 0,
    missingSample: tooManyMissing ? missingWords.slice(0, 8) : [],
  };
}

function digits(text: string) {
  return text.replace(/\D/g, "");
}

function allText(cv: CV): string[] {
  return [cvText(cv, false), ...cv.links, ...cv.hyperlinks.flatMap((link) => [link.text, link.url])];
}

/** Emails, phone numbers and LinkedIn profiles from the source that survived anonymising. Names can't be checked this way. */
export function anonymiseLeaks(source: string, cv: CV): string[] {
  const output = allText(cv).join("\n").toLowerCase();
  const outputDigits = allText(cv).flatMap((text) => text.split("\n")).map(digits);
  const textMatches = source.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+|linkedin\.com\/[^\s)]+/gi) ?? [];
  const phoneMatches = (source.match(/\+?\d[\d\s().-]{7,}\d/g) ?? []).filter((phone) => digits(phone).length >= 9);
  const leaks = [
    ...textMatches.filter((match) => output.includes(match.toLowerCase())),
    ...phoneMatches.filter((phone) => outputDigits.some((text) => text.includes(digits(phone)))),
  ];
  return [...new Set(leaks.map((leak) => leak.trim()))];
}
