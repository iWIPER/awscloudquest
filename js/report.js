/**
 * AWS Cloud Quest — end-of-game report (Markdown export and printable page).
 *
 * The game keeps a log of every question shown in a game; this module turns
 * it into a summary. summarize() and toMarkdown() are pure (no DOM) and are
 * tested in tests/report.test.js. The printable page (saved as PDF with the
 * browser's print dialog) is rendered by renderPrintable().
 *
 * Report: { t, hero, score, correct, misses, accuracy, level, maxStreak, seconds, log }
 * Log entry: { id, q, topic, answer, explanation, wrongPicks: [text],
 *              outcome: "first" | "late" | "lost" | "skipped", seconds }
 */
(function (root) {
  "use strict";

  /** Outcomes, in chart order. Colors are the reference status palette (see docs/DECISIONS.md). */
  const OUTCOMES = Object.freeze([
    { key: "first", label: "Acertou de primeira", color: "#0ca30c", mark: "✓" },
    { key: "late", label: "Acertou depois de errar", color: "#fab219", mark: "!" },
    { key: "lost", label: "O monstro chegou", color: "#d03b3b", mark: "✗" },
    { key: "skipped", label: "Pulou", color: "#8a8a86", mark: "»" },
  ]);

  const byKey = Object.fromEntries(OUTCOMES.map((o) => [o.key, o]));

  /** Counts per outcome plus totals. */
  function summarize(log) {
    const counts = Object.fromEntries(OUTCOMES.map((o) => [o.key, 0]));
    for (const entry of log) if (entry.outcome in counts) counts[entry.outcome] += 1;
    const answered = counts.first + counts.late + counts.lost;
    return {
      counts,
      total: log.length,
      answered,
      firstTryRate: answered ? Math.round((counts.first / answered) * 100) : 0,
    };
  }

  const pad = (n) => String(n).padStart(2, "0");
  /** Reports store `t` (ms timestamp); `date` is also accepted. */
  const dateOf = (game) => new Date(game.t !== undefined ? game.t : game.date);
  const formatDate = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const formatDuration = (s) => (s >= 60 ? `${Math.floor(s / 60)}:${pad(s % 60)}` : `${s}s`);

  /** Escapes characters that would break Markdown structure inside a line. */
  const md = (text) => String(text).replace(/\r?\n+/g, " ").replace(/([\\`*_[\]|<>])/g, "\\$1");

  /** Filename-safe timestamp of a report: 2026-10-22-1405. */
  function stamp(game) {
    const date = game instanceof Date ? game : dateOf(game);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
  }

  /**
   * Markdown report.
   * @param {object} game a report (see the top of this file)
   */
  function toMarkdown(game) {
    const s = summarize(game.log);
    const lines = [
      "# AWS Cloud Quest — Relatório da partida",
      "",
      `**Data:** ${formatDate(dateOf(game))}  `,
      `**Personagem:** ${game.hero === "female" ? "Mulher" : "Homem"}`,
      "",
      "## Resumo",
      "",
      "| Pontos | Acertos | Erros | Precisão | Nível | Melhor sequência | Tempo |",
      "|---:|---:|---:|---:|---:|---:|---:|",
      `| ${game.score} | ${game.correct} | ${game.misses} | ${game.accuracy}% | ${game.level} | ${game.maxStreak} | ${formatDuration(game.seconds)} |`,
      "",
      "## Perguntas",
      "",
      "| Resultado | Quantidade |",
      "|---|---:|",
      ...OUTCOMES.map((o) => `| ${o.mark} ${o.label} | ${s.counts[o.key]} |`),
      `| **Total** | **${s.total}** |`,
      "",
    ];

    const sections = [
      ["Errei ou não respondi a tempo", game.log.filter((e) => e.outcome === "lost" || e.outcome === "late")],
      ["Acertei de primeira", game.log.filter((e) => e.outcome === "first")],
      ["Pulei", game.log.filter((e) => e.outcome === "skipped")],
    ];

    for (const [title, entries] of sections) {
      if (entries.length === 0) continue;
      lines.push(`## ${title}`, "");
      entries.forEach((e, i) => {
        lines.push(`### ${i + 1}. ${byKey[e.outcome].mark} ${md(e.q)}`, "");
        if (e.topic) lines.push(`- **Tema:** ${md(e.topic)}`);
        if (e.wrongPicks.length) lines.push(`- **Você marcou:** ${e.wrongPicks.map(md).join("; ")}`);
        lines.push(`- **Resposta certa:** ${md(e.answer)}`);
        if (e.explanation) lines.push(`- **Por quê:** ${md(e.explanation)}`);
        lines.push("");
      });
    }

    lines.push("---", "", "_Gerado pelo AWS Cloud Quest. Perguntas de estudo; não são questões oficiais da AWS._", "");
    return lines.join("\n");
  }

  /** Inline SVG: one 100% bar split by outcome (part-to-whole), with 2px gaps and count labels. */
  function chartSvg(summary) {
    const width = 600;
    const height = 44;
    const gap = 2;
    const parts = OUTCOMES.filter((o) => summary.counts[o.key] > 0);
    if (summary.total === 0) return "";
    const usable = width - gap * (parts.length - 1);
    let x = 0;
    const rects = parts
      .map((o) => {
        const w = (summary.counts[o.key] / summary.total) * usable;
        const label =
          w >= 28
            ? `<text x="${x + w / 2}" y="28" text-anchor="middle" font-size="15" font-weight="700" fill="#1f1a24">${summary.counts[o.key]}</text>`
            : "";
        const rect = `<rect x="${x}" y="0" width="${w}" height="${height}" rx="4" fill="${o.color}"><title>${o.label}: ${summary.counts[o.key]}</title></rect>${label}`;
        x += w + gap;
        return rect;
      })
      .join("");
    return `<svg class="report-bar" viewBox="0 0 ${width} ${height}" role="img" aria-label="Resultado das perguntas">${rects}</svg>`;
  }

  /** Fills the printable report section. Bank text goes through textContent only. */
  function renderPrintable(container, game) {
    const s = summarize(game.log);
    const h = (tag, cls, text) => {
      const el = document.createElement(tag);
      if (cls) el.className = cls;
      if (text !== undefined) el.textContent = text;
      return el;
    };

    const header = h("header", "report-header");
    header.append(
      h("h1", "", "AWS Cloud Quest — Relatório da partida"),
      h("p", "report-meta", `${formatDate(dateOf(game))} · Personagem: ${game.hero === "female" ? "Mulher" : "Homem"}`)
    );

    const stats = h("dl", "report-stats");
    [
      ["Pontos", game.score],
      ["Acertos", game.correct],
      ["Erros", game.misses],
      ["Precisão", `${game.accuracy}%`],
      ["Nível", game.level],
      ["Melhor sequência", game.maxStreak],
      ["Tempo", formatDuration(game.seconds)],
    ].forEach(([label, value]) => {
      const cell = h("div");
      cell.append(h("dt", "", label), h("dd", "", String(value)));
      stats.append(cell);
    });

    const chart = h("section", "report-chart");
    chart.append(h("h2", "", `Perguntas (${s.total}) · ${s.firstTryRate}% de primeira`));
    const bar = h("div");
    bar.innerHTML = chartSvg(s); // our own markup: numbers and fixed labels only
    const legend = h("ul", "report-legend");
    OUTCOMES.forEach((o) => {
      const li = h("li");
      const swatch = h("span", "report-swatch", o.mark);
      swatch.style.background = o.color;
      li.append(swatch, ` ${o.label}: ${s.counts[o.key]}`);
      legend.append(li);
    });
    chart.append(bar, legend);

    const list = h("ol", "report-list");
    game.log.forEach((e) => {
      const outcome = byKey[e.outcome];
      const li = h("li", `report-item is-${e.outcome}`);
      const badge = h("span", "report-badge", `${outcome.mark} ${outcome.label}`);
      badge.style.borderColor = outcome.color;
      li.append(badge, h("p", "report-q", e.q));
      if (e.wrongPicks.length) li.append(h("p", "report-wrong", `Você marcou: ${e.wrongPicks.join("; ")}`));
      li.append(h("p", "report-a", `Resposta certa: ${e.answer}`));
      if (e.explanation) li.append(h("p", "report-why", `Por quê: ${e.explanation}`));
      list.append(li);
    });

    const footer = h("p", "report-footer", "Gerado pelo AWS Cloud Quest. Perguntas de estudo; não são questões oficiais da AWS.");
    container.replaceChildren(header, stats, chart, h("h2", "", "Todas as perguntas"), list, footer);
  }

  const api = Object.freeze({ OUTCOMES, summarize, toMarkdown, renderPrintable, stamp });

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.report = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
