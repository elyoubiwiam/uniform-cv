import type { CV, Template } from "./cv-schema";

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return [194, 81, 43];
  return [parseInt(m[1] ?? "00", 16), parseInt(m[2] ?? "00", 16), parseInt(m[3] ?? "00", 16)];
}

export function dateRange(a: string | null, b: string | null) {
  return [a, b].filter(Boolean).join(" – ");
}

export function contactLine(cv: CV, t: Template) {
  const parts = t.hideContactDetails || t.anonymise ? [cv.location] : [cv.location, cv.email, cv.phone, ...cv.links];
  return parts.filter(Boolean).join("  ·  ");
}

export function normUrl(u: string) {
  const v = u.trim();
  if (/^(https?:|mailto:|tel:)/i.test(v)) return v;
  if (/^[^\s@]+@[^\s@]+$/.test(v)) return `mailto:${v}`;
  return `https://${v}`;
}

export function headerLinks(cv: CV, t: Template) {
  if (t.hideContactDetails || t.anonymise) return [];
  return cv.hyperlinks.filter((h) => h.text.trim() && h.url.trim())
    .map((h) => ({ text: h.text, url: normUrl(h.url) }));
}

export function allLinks(cv: CV, t: Template) {
  const out = (cv.hyperlinks ?? []).filter((h) => h.text.trim() && h.url.trim()).map((h) => ({ text: h.text, url: normUrl(h.url) }));
  if (!t.hideContactDetails && !t.anonymise) {
    for (const l of cv.links) out.push({ text: l, url: normUrl(l) });
    if (cv.email) out.push({ text: cv.email, url: `mailto:${cv.email}` });
  }
  return out;
}

export type Seg = { text: string; url?: string };
export function linkSegments(str: string, links: { text: string; url: string }[]): Seg[] {
  const segs: Seg[] = [];
  let rest = str;
  while (rest) {
    let best: { i: number; l: { text: string; url: string } } | null = null;
    for (const l of links) {
      const i = rest.indexOf(l.text);
      if (i >= 0 && (!best || i < best.i || (i === best.i && l.text.length > best.l.text.length))) best = { i, l };
    }
    if (!best) { segs.push({ text: rest }); break; }
    if (best.i > 0) segs.push({ text: rest.slice(0, best.i) });
    segs.push({ text: best.l.text, url: best.l.url });
    rest = rest.slice(best.i + best.l.text.length);
  }
  return segs;
}

export function safeFileName(cv: CV, ext: string) {
  const base = (cv.fullName || "candidate").replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_|_$/g, "");
  return `${base}_CV.${ext}`;
}

/* ---------------- PDF ---------------- */

export async function buildPdf(cv: CV, t: Template): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 50;
  const CW = W - M * 2;
  const accent = hexToRgb(t.accentColor);
  const ink: [number, number, number] = [30, 36, 48];
  const grey: [number, number, number] = [100, 108, 120];
  let y = M;
  const F = t.font === "times" ? "times" : "helvetica";
  const center = t.align === "center";
  const links = allLinks(cv, t);

  const ensure = (h: number) => {
    if (y + h > H - M - 20) {
      doc.addPage();
      y = M;
    }
  };

  const text = (str: string, size: number, opts: { bold?: boolean; color?: [number, number, number]; indent?: number; gap?: number; center?: boolean; url?: string } = {}) => {
    doc.setFont(F, opts.bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...(opts.color ?? ink));
    const lines = doc.splitTextToSize(str, CW - (opts.indent ?? 0)) as string[];
    const lh = size * 1.35;
    for (const line of lines) {
      ensure(lh);
      const x0 = opts.center ? M + (CW - doc.getTextWidth(line)) / 2 : M + (opts.indent ?? 0);
      doc.text(line, x0, y + size);
      if (opts.url) {
        const width = doc.getTextWidth(line);
        doc.setDrawColor(...accent);
        doc.setLineWidth(0.5);
        doc.line(x0, y + size + 1.5, x0 + width, y + size + 1.5);
        doc.link(x0, y, width, lh, { url: opts.url });
      }
      for (const l of links) {
        const idx = line.indexOf(l.text);
        if (idx < 0) continue;
        const x = x0 + doc.getTextWidth(line.slice(0, idx));
        const w = doc.getTextWidth(l.text);
        doc.setDrawColor(...accent);
        doc.setLineWidth(0.5);
        doc.line(x, y + size + 1.5, x + w, y + size + 1.5);
        doc.link(x, y, w, lh, { url: l.url });
      }
      y += lh;
    }
    y += opts.gap ?? 0;
  };

  // Header band
  if (t.logoDataUrl) {
    try {
      const props = doc.getImageProperties(t.logoDataUrl);
      const h = 28;
      const w = (props.width / props.height) * h;
      doc.addImage(t.logoDataUrl, M + CW - w, y - 6, w, h);
    } catch {
      /* ignore bad logo */
    }
  } else if (t.agencyName) {
    doc.setFont(F, "bold");
    doc.setFontSize(9);
    doc.setTextColor(...accent);
    doc.text(t.agencyName.toUpperCase(), M + CW, y + 6, { align: "right" });
  }

  if (center && (t.logoDataUrl || t.agencyName)) y += 24;
  text(cv.fullName || "Candidate", 24, { bold: true, center });
  if (cv.headline) text(cv.headline, 12, { color: accent, gap: 2, center });
  const contact = contactLine(cv, t);
  if (contact) text(contact, 9, { color: grey, center });
  for (const link of headerLinks(cv, t)) text(link.text, 9, { color: accent, center, url: link.url });
  y += 8;
  doc.setDrawColor(...accent);
  doc.setLineWidth(1.5);
  doc.line(M, y, M + CW, y);
  y += 18;

  // Never leave a heading at the bottom of a page: reserve room for the heading plus its first block.
  const section = (title: string, firstBlock = 40) => {
    ensure(36 + firstBlock);
    y += 6;
    doc.setFont(F, "bold");
    doc.setFontSize(10);
    doc.setTextColor(...accent);
    doc.text(title.toUpperCase(), M, y + 10, { charSpace: 1 });
    y += 16;
    doc.setDrawColor(220, 214, 204);
    doc.setLineWidth(0.5);
    doc.line(M, y, M + CW, y);
    y += 8;
  };

  if (cv.summary) {
    section("Profile", Math.min(4, (doc.splitTextToSize(cv.summary, CW) as string[]).length) * 13.5);
    text(cv.summary, 10, { gap: 4 });
  }

  if (cv.experience.length) {
    section("Experience", 64);
    for (const e of cv.experience) {
      ensure(50);
      const dr = dateRange(e.startDate, e.endDate);
      doc.setFont(F, "bold");
      doc.setFontSize(11);
      doc.setTextColor(...ink);
      const titleLines = doc.splitTextToSize(e.title, CW - 130) as string[];
      doc.text(titleLines[0] ?? "", M, y + 11);
      if (dr) {
        doc.setFont(F, "normal");
        doc.setFontSize(9);
        doc.setTextColor(...grey);
        doc.text(dr, M + CW, y + 11, { align: "right" });
      }
      y += 15;
      if (titleLines.length > 1) text(titleLines.slice(1).join(" "), 11, { bold: true });
      text([e.company, e.location].filter(Boolean).join(", "), 10, { color: accent, gap: 2 });
      for (const b of e.bullets) {
        ensure(14);
        doc.setFillColor(...grey);
        doc.circle(M + 4, y + 6.5, 1.3, "F");
        text(b, 10, { indent: 12 });
      }
      y += 8;
    }
  }

  if (cv.education.length) {
    section("Education", 44);
    for (const ed of cv.education) {
      ensure(36);
      const dr = dateRange(ed.startDate, ed.endDate);
      doc.setFont(F, "bold");
      doc.setFontSize(11);
      doc.setTextColor(...ink);
      doc.text((doc.splitTextToSize(ed.degree, CW - 130) as string[])[0] ?? "", M, y + 11);
      if (dr) {
        doc.setFont(F, "normal");
        doc.setFontSize(9);
        doc.setTextColor(...grey);
        doc.text(dr, M + CW, y + 11, { align: "right" });
      }
      y += 15;
      text(ed.institution, 10, { color: accent });
      if (ed.details) text(ed.details, 10);
      y += 6;
    }
  }

  const listSection = (title: string, items: string[]) => {
    if (!items.length) return;
    section(title, 28);
    text(items.join("  ·  "), 10, { gap: 4 });
  };
  listSection("Skills", cv.skills);
  listSection("Languages", cv.languages);
  listSection("Certifications", cv.certifications);

  // Footer on each page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont(F, "normal");
    doc.setFontSize(8);
    doc.setTextColor(...grey);
    const left = [t.agencyName, t.footerNote].filter(Boolean).join(" — ");
    if (left) doc.text(left, M, H - 28);
    doc.text(`${i} / ${pages}`, M + CW, H - 28, { align: "right" });
  }

  return doc.output("blob");
}

/* ---------------- Word ---------------- */

export async function buildDocx(cv: CV, t: Template): Promise<Blob> {
  const d = await import("docx");
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, TabStopType, ImageRun, Footer, PageNumber, ExternalHyperlink } = d;
  const accent = t.accentColor.replace("#", "");
  const font = t.font === "times" ? "Georgia" : "Calibri";
  const links = allLinks(cv, t);
  const headAlign = t.align === "center" ? AlignmentType.CENTER : AlignmentType.LEFT;
  const runs = (str: string, o: { size: number; color?: string; bold?: boolean }) =>
    linkSegments(str, links).map((s) =>
      s.url
        ? new ExternalHyperlink({ link: s.url, children: [new TextRun({ text: s.text, ...o, color: accent, underline: {}, font })] })
        : new TextRun({ text: s.text, ...o, font }),
    );
  const children: InstanceType<typeof Paragraph>[] = [];

  if (t.logoDataUrl) {
    const logoDataUrl = t.logoDataUrl;
    try {
      const [meta = "", b64 = ""] = t.logoDataUrl.split(",");
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = rej;
        i.src = logoDataUrl;
      });
      const h = 36;
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new ImageRun({
              type: meta.includes("png") ? "png" : "jpg",
              data: bytes,
              transformation: { width: Math.round((img.width / img.height) * h), height: h },
            }),
          ],
        }),
      );
    } catch {
      /* ignore */
    }
  } else if (t.agencyName) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: t.agencyName.toUpperCase(), bold: true, size: 18, color: accent, font })],
      }),
    );
  }

  children.push(new Paragraph({ alignment: headAlign, children: [new TextRun({ text: cv.fullName || "Candidate", bold: true, size: 48, font })] }));
  if (cv.headline) children.push(new Paragraph({ alignment: headAlign, children: [new TextRun({ text: cv.headline, size: 24, color: accent, font })] }));
  const contact = contactLine(cv, t);
  const candidateLinks = headerLinks(cv, t);
  children.push(
    new Paragraph({
      spacing: { after: candidateLinks.length ? 60 : 200 },
      keepNext: candidateLinks.length > 0,
      alignment: headAlign,
      ...(!candidateLinks.length ? { border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: accent, space: 6 } } } : {}),
      children: runs(contact, { size: 18, color: "646C78" }),
    }),
  );
  candidateLinks.forEach((link, index) => children.push(new Paragraph({
    alignment: headAlign,
    keepNext: index < candidateLinks.length - 1,
    spacing: { after: index === candidateLinks.length - 1 ? 200 : 60 },
    ...(index === candidateLinks.length - 1 ? { border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: accent, space: 6 } } } : {}),
    children: [new ExternalHyperlink({ link: link.url, children: [new TextRun({ text: link.text, size: 18, color: accent, underline: {}, font })] })],
  })));

  const section = (title: string) =>
    children.push(
      new Paragraph({
        spacing: { before: 240, after: 100 },
        keepNext: true,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "DCD6CC", space: 4 } },
        children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 20, color: accent, characterSpacing: 20, font })],
      }),
    );
  const body = (text: string) => new Paragraph({ spacing: { after: 80 }, children: runs(text, { size: 20 }) });
  const titleRow = (title: string, dates: string) =>
    new Paragraph({
      tabStops: [{ type: TabStopType.RIGHT, position: 9000 }],
      spacing: { before: 120 },
      keepNext: true,
      children: [
        new TextRun({ text: title, bold: true, size: 22, font }),
        ...(dates ? [new TextRun({ text: `\t${dates}`, size: 18, color: "646C78", font })] : []),
      ],
    });

  if (cv.summary) {
    section("Profile");
    children.push(body(cv.summary));
  }
  if (cv.experience.length) {
    section("Experience");
    for (const e of cv.experience) {
      children.push(titleRow(e.title, dateRange(e.startDate, e.endDate)));
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          keepNext: true,
          children: [new TextRun({ text: [e.company, e.location].filter(Boolean).join(", "), size: 20, color: accent, font })],
        }),
      );
      for (const b of e.bullets)
        children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: runs(b, { size: 20 }) }));
    }
  }
  if (cv.education.length) {
    section("Education");
    for (const ed of cv.education) {
      children.push(titleRow(ed.degree, dateRange(ed.startDate, ed.endDate)));
      children.push(new Paragraph({ children: [new TextRun({ text: ed.institution, size: 20, color: accent, font })] }));
      if (ed.details) children.push(body(ed.details));
    }
  }
  for (const [title, items] of [
    ["Skills", cv.skills],
    ["Languages", cv.languages],
    ["Certifications", cv.certifications],
  ] as const) {
    if (!items.length) continue;
    section(title);
    children.push(body(items.join("  ·  ")));
  }

  const footerLeft = [t.agencyName, t.footerNote].filter(Boolean).join(" — ");
  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 } } },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                tabStops: [{ type: TabStopType.RIGHT, position: 9900 }],
                children: [
                  new TextRun({ text: footerLeft, size: 16, color: "646C78", font }),
                  new TextRun({ children: ["\t", PageNumber.CURRENT], size: 16, color: "646C78", font }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
