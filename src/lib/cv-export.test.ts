import { describe, expect, it } from "vitest";
import { PDFArray, PDFDocument, PDFRawStream, decodePDFRawStream } from "pdf-lib";
import JSZip from "jszip";
import { buildDocx, buildPdf } from "./cv-export";
import { cvSchema, defaultTemplate } from "./cv-schema";
import { emptyRecruiterCover } from "./cv-cover";

const cv = cvSchema.parse({ fullName: "Page Test", headline: null, location: null, email: null, phone: null, links: [], summary: null, experience: [], education: [], skills: ["Social Media Planning - SEO - Hootsuite"], languages: [], certifications: [], interests: [], hyperlinks: [] });
const bytes = (blob: Blob) => new Promise<ArrayBuffer>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => { if (reader.result instanceof ArrayBuffer) resolve(reader.result); else reject(new Error("Invalid file")); };
  reader.onerror = reject;
  reader.readAsArrayBuffer(blob);
});

describe("CV download formatting", () => {
  it("adds a recruiter cover before the CV in PDF but not candidate mode", async () => {
    const recruiter = await PDFDocument.load(await bytes(await buildPdf(cv, defaultTemplate, { ...emptyRecruiterCover, noticePeriod: "4 weeks" })));
    const candidate = await PDFDocument.load(await bytes(await buildPdf(cv, { ...defaultTemplate, audience: "candidate" })));
    expect(recruiter.getPageCount()).toBe(candidate.getPageCount() + 1);
    const text = recruiter.context.enumerateIndirectObjects().flatMap(([, object]) => object instanceof PDFRawStream ? [new TextDecoder().decode(decodePDFRawStream(object).decode())] : []).join("\n");
    expect(text).toContain("(4 weeks)");
  });
  it("includes recruiter notes and a page break before the Word CV", async () => {
    const zip = await JSZip.loadAsync(await bytes(await buildDocx(cv, defaultTemplate, { ...emptyRecruiterCover, notes: "Available for interview" })));
    const body = await zip.file("word/document.xml")?.async("string");
    expect(body).toContain("Available for interview");
    expect(body).toContain('w:val="nextPage"');
    expect(body).not.toContain('<w:br w:type="page"');
  });
  it("keeps long recruiter notes on one PDF cover with the CV immediately on page two", async () => {
    const notes = Array.from({ length: 100 }, (_, index) => `Note ${index}: Candidate available for interview and happy to discuss the role.`).join("\n");
    const pdf = await PDFDocument.load(await bytes(await buildPdf(cv, { ...defaultTemplate, consultantName: "Recruiter End", agencyName: "Agency" }, { ...emptyRecruiterCover, notes })));
    expect(pdf.getPageCount()).toBe(2);
    const pageText = (index: number) => {
      const contents = pdf.getPage(index).node.Contents();
      const streams = contents instanceof PDFArray ? contents.asArray().map((ref) => pdf.context.lookup(ref)) : contents ? [contents] : [];
      return (streams ?? []).flatMap((object) => object instanceof PDFRawStream ? [new TextDecoder().decode(decodePDFRawStream(object).decode())] : []).join("\n");
    };
    expect(pageText(0)).toContain("Note 99:");
    expect(pageText(0)).toContain("(Recruiter End)");
    expect(pageText(1)).toContain("(Social Media Planning, SEO, Hootsuite)");
  });
  it("fits long Word cover notes into a single bounded cover section without an extra page-break paragraph", async () => {
    const notes = Array.from({ length: 100 }, (_, index) => `Note ${index}: Available for interview next week.`).join("\n");
    const zip = await JSZip.loadAsync(await bytes(await buildDocx(cv, defaultTemplate, { ...emptyRecruiterCover, notes })));
    const xml = await zip.file("word/document.xml")?.async("string");
    expect(xml).toContain("Note 99:");
    expect(xml?.match(/<w:sectPr>/g)).toHaveLength(2);
    expect(xml).not.toContain('<w:br w:type="page"');
    const coverXml = xml?.split("<w:sectPr>")[0] ?? "";
    const reservedHeight = [...coverXml.matchAll(/w:line="(\d+)"/g)].reduce((sum, match) => sum + Number(match[1]), 0);
    expect(reservedHeight).toBeLessThan(13000);
    expect(coverXml).toContain('w:lineRule="exact"');
  });
  it("exports a PDF without page numbers and with plain skill commas", async () => {
    const pdf = await PDFDocument.load(await bytes(await buildPdf(cv, defaultTemplate)));
    const text = pdf.context.enumerateIndirectObjects().flatMap(([, object]) => object instanceof PDFRawStream ? [new TextDecoder().decode(decodePDFRawStream(object).decode())] : []).join("\n");
    expect(text).toContain("(Page Test)");
    expect(text).toContain("(Social Media Planning, SEO, Hootsuite)");
    expect(text).not.toContain("(1 / 1)");
  });
  it("exports Word without page fields while preserving agency footer details", async () => {
    const zip = await JSZip.loadAsync(await bytes(await buildDocx(cv, { ...defaultTemplate, agencyName: "Test Agency" })));
    const footer = await zip.file("word/footer1.xml")?.async("string");
    const body = await zip.file("word/document.xml")?.async("string");
    expect(footer).toContain("Test Agency");
    expect(footer).not.toMatch(/w:instrText[^>]*>\s*(PAGE|NUMPAGES)\b/);
    expect(body).toContain("Social Media Planning, SEO, Hootsuite");
  });
});