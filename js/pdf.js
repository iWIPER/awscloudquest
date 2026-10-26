/**
 * AWS Cloud Quest — minimal PDF writer.
 *
 * Builds PDF 1.4 files in the browser, without libraries, so reports download
 * as real PDFs instead of going through the print dialog. Supports what the
 * report needs: A4 pages, text in the standard Helvetica fonts (no embedding;
 * WinAnsi encoding covers Portuguese), word wrapping, filled rectangles,
 * lines and clickable links.
 *
 * Pure logic (no DOM): build() returns the file as a Uint8Array, so it is
 * covered by tests/pdf.test.js in Node.
 */
(function (root) {
  "use strict";

  const PAGE = Object.freeze({ width: 595.28, height: 841.89 }); // A4 in points

  // Advance widths (1/1000 em) of the standard fonts for ASCII 32–126 (Adobe AFM metrics).
  const WIDTHS = {
    regular: [
      278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556,
      556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
      667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556,
      556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
    ],
    bold: [
      278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556,
      556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
      667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611,
      611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
    ],
  };

  // Characters outside ASCII that WinAnsi has, with their byte code.
  const WIN_ANSI = { "€": 0x80, "‚": 0x82, "„": 0x84, "…": 0x85, "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "™": 0x99 };
  // Characters with no WinAnsi code, replaced by close equivalents.
  const FALLBACK = { "✓": "+", "✗": "x", "✖": "x", "↳": "-", "→": "->", "≥": ">=", "≤": "<=", "▾": "v", "▲": "^", "▼": "v", " ": " " };

  /** Text → array of WinAnsi byte codes (unknown characters become "?"). */
  function encode(text) {
    const out = [];
    for (const raw of String(text)) {
      const ch = FALLBACK[raw] !== undefined ? FALLBACK[raw] : raw;
      for (const c of ch) {
        const code = c.codePointAt(0);
        if (code >= 32 && code <= 126) out.push(code);
        else if (WIN_ANSI[c] !== undefined) out.push(WIN_ANSI[c]);
        else if (code >= 0xa0 && code <= 0xff) out.push(code);
        else out.push(63); // "?"
      }
    }
    return out;
  }

  /** Width of one byte code in 1/1000 em. Accented letters use their base letter. */
  function charWidth(code, bold) {
    const table = bold ? WIDTHS.bold : WIDTHS.regular;
    if (code >= 32 && code <= 126) return table[code - 32];
    if (code >= 0xc0 && code <= 0xff) {
      const base = String.fromCharCode(code).normalize("NFD")[0].charCodeAt(0);
      if (base >= 32 && base <= 126) return table[base - 32];
    }
    return { 0x96: 556, 0x97: 1000, 0x95: 350, 0x85: 1000, 0xb7: 278, 0xba: 365, 0xaa: 370, 0xb0: 400 }[code] || 556;
  }

  /** Width of a string in points. */
  function textWidth(text, size, bold = false) {
    return (encode(text).reduce((sum, code) => sum + charWidth(code, bold), 0) * size) / 1000;
  }

  /** Splits text into lines no wider than `width` points (long words are cut). */
  function wrap(text, width, size, bold = false) {
    const lines = [];
    for (const paragraph of String(text).split(/\n/)) {
      let line = "";
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        const candidate = line ? `${line} ${word}` : word;
        if (textWidth(candidate, size, bold) <= width) {
          line = candidate;
          continue;
        }
        if (line) lines.push(line);
        line = word;
        while (textWidth(line, size, bold) > width && line.length > 1) {
          let cut = line.length - 1;
          while (cut > 1 && textWidth(line.slice(0, cut), size, bold) > width) cut--;
          lines.push(line.slice(0, cut));
          line = line.slice(cut);
        }
      }
      lines.push(line);
    }
    return lines;
  }

  /** PDF literal string from WinAnsi codes: (...) with escapes for (, ), \ and non-ASCII bytes. */
  function literal(text) {
    return `(${encode(text)
      .map((code) => {
        if (code === 40 || code === 41 || code === 92) return `\\${String.fromCharCode(code)}`;
        if (code < 32 || code > 126) return `\\${code.toString(8).padStart(3, "0")}`;
        return String.fromCharCode(code);
      })
      .join("")})`;
  }

  /** "#rrggbb" → "r g b" in 0–1, for PDF color operators. */
  function rgb(hex) {
    const n = parseInt(hex.replace("#", ""), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => (v / 255).toFixed(3)).join(" ");
  }

  const num = (v) => (Math.round(v * 100) / 100).toString();

  /**
   * Creates a document. Coordinates are in points from the TOP-left corner
   * (converted to PDF's bottom-left origin internally).
   */
  function createDocument({ title = "", author = "" } = {}) {
    const pages = [];
    let page = null;

    function addPage() {
      page = { ops: [], links: [] };
      pages.push(page);
      return pages.length;
    }

    const y = (top) => PAGE.height - top;

    return {
      PAGE,
      addPage,
      pageCount: () => pages.length,
      /** Makes page n (1-based) the drawing target again, e.g. to add footers at the end. */
      goToPage(n) {
        page = pages[n - 1];
      },
      textWidth,
      wrap,
      /** Draws one line of text; `top` is the baseline position from the top. */
      text(x, top, text, { size = 10, bold = false, color = "#1f1a24" } = {}) {
        page.ops.push(`BT /${bold ? "F2" : "F1"} ${num(size)} Tf ${rgb(color)} rg ${num(x)} ${num(y(top))} Td ${literal(text)} Tj ET`);
      },
      rect(x, top, width, height, color) {
        page.ops.push(`${rgb(color)} rg ${num(x)} ${num(y(top + height))} ${num(width)} ${num(height)} re f`);
      },
      strokeRect(x, top, width, height, color, lineWidth = 0.8) {
        page.ops.push(`${num(lineWidth)} w ${rgb(color)} RG ${num(x)} ${num(y(top + height))} ${num(width)} ${num(height)} re S`);
      },
      line(x1, top1, x2, top2, color, lineWidth = 0.8) {
        page.ops.push(`${num(lineWidth)} w ${rgb(color)} RG ${num(x1)} ${num(y(top1))} m ${num(x2)} ${num(y(top2))} l S`);
      },
      /** Clickable area that opens `url`. */
      link(x, top, width, height, url) {
        page.links.push({ x, top, width, height, url });
      },

      /** Serializes the document. Returns the file bytes. */
      build() {
        const objects = []; // index i holds object number i + 1
        const add = (body) => objects.push(body) && objects.length;

        const catalog = add(null);
        const pagesId = add(null);
        const fontRegular = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
        const fontBold = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
        const info = add(`<< /Title ${literal(title)} /Author ${literal(author)} /Producer (AWS Cloud Quest) >>`);

        const pageIds = pages.map((p) => {
          const stream = p.ops.join("\n");
          const contents = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
          const annots = p.links.map((l) =>
            add(
              `<< /Type /Annot /Subtype /Link /Border [0 0 0] /Rect [${num(l.x)} ${num(y(l.top + l.height))} ${num(l.x + l.width)} ${num(y(l.top))}] ` +
                `/A << /S /URI /URI ${literal(l.url)} >> >>`
            )
          );
          return add(
            `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE.width} ${PAGE.height}] ` +
              `/Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${contents} 0 R` +
              (annots.length ? ` /Annots [${annots.map((a) => `${a} 0 R`).join(" ")}]` : "") +
              " >>"
          );
        });

        objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
        objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

        // Every byte of the file is < 256 (non-ASCII text is octal-escaped), so string length = byte length.
        let out = "%PDF-1.4\n%âãÏÓ\n";
        const offsets = [];
        objects.forEach((body, i) => {
          offsets.push(out.length);
          out += `${i + 1} 0 obj\n${body}\nendobj\n`;
        });
        const xref = out.length;
        out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
        out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
        out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

        const bytes = new Uint8Array(out.length);
        for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
        return bytes;
      },
    };
  }

  const api = Object.freeze({ PAGE, encode, textWidth, wrap, createDocument });

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.pdf = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
