/**
 * AWS Cloud Quest — end-of-game report: performance by area, Markdown and PDF.
 *
 * The game keeps a log of every question shown in a game; this module turns
 * it into a summary. analyzeAreas(), toMarkdown() and toPdf() are pure (no DOM)
 * and are tested in tests/report.test.js. buildAreas() renders the
 * "Desempenho por área" screen.
 *
 * Report: { t, mode, modeLabel, hero, score, correct, misses, accuracy, level, maxStreak, seconds, log }
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

  // In a duel the same outcomes read differently: there is no monster, and
  // "skipped" means the rival answered first.
  const DUEL_LABELS = Object.freeze({
    first: "Acertou",
    late: "Acertou depois de errar",
    lost: "Errou ou o tempo acabou",
    skipped: "O adversário foi mais rápido",
  });

  /** Outcome list (and lookup) with labels for this game: solo or duel. */
  function outcomesFor(game) {
    const list = game.duel ? OUTCOMES.map((o) => ({ ...o, label: DUEL_LABELS[o.key] })) : OUTCOMES;
    return { list, byKey: Object.fromEntries(list.map((o) => [o.key, o])) };
  }

  /**
   * Duel summary lines, from the player's point of view:
   * game.duel = { opponent, won, rounds: {me, rival}, lives: {me, rival}, score: {me, rival} }.
   */
  function duelHeadline(game) {
    const d = game.duel;
    if (d.won === null) return `Empate com ${d.opponent}!`;
    return d.won ? `Você venceu o duelo contra ${d.opponent}!` : `${d.opponent} venceu o duelo.`;
  }

  function duelDetails(game) {
    const d = game.duel;
    return `Rounds ganhos ${d.rounds.me} × ${d.rounds.rival} · Vidas no fim ${d.lives.me} × ${d.lives.rival} · Placar da sala ${d.score.me} × ${d.score.rival}`;
  }

  // ── Performance by area ─────────────────────────────────────────────
  /** Ratings by first-try hit rate, best first. Colors: reference status palette. */
  const RATINGS = Object.freeze([
    { key: "great", min: 80, label: "Ótimo", color: "#0ca30c", mark: "✓" },
    { key: "good", min: 60, label: "Bom", color: "#fab219", mark: "•" },
    { key: "attention", min: 40, label: "Atenção", color: "#ec835a", mark: "!" },
    { key: "weak", min: 0, label: "Precisa estudar", color: "#d03b3b", mark: "✗" },
  ]);
  const SKIPPED_ONLY = Object.freeze({ key: "skipped", label: "Pulou tudo", color: "#8a8a86", mark: "»" });
  const STRONG_MIN = 80; // strengths: first-try rate ≥ 80%
  const WEAK_BELOW = 60; // places to improve: first-try rate < 60% (or only skipped)
  const OTHER = "Outros";

  const ratingFor = (pct) => RATINGS.find((r) => pct >= r.min);

  /** Adds pct and rating to a { answered, correct, skipped } counter. */
  function score(area) {
    const pct = area.answered ? Math.round((area.correct / area.answered) * 100) : null;
    return { ...area, pct, rating: pct === null ? SKIPPED_ONLY : ratingFor(pct) };
  }

  /**
   * Performance by exam domain and topic.
   * A question counts as right only when hit on the first try; "acertou depois de
   * errar" and "o monstro chegou" count as wrong; skips are listed but not scored.
   * @param {object[]} log   report log entries
   * @param {object}   guide window.STUDY_GUIDE ({ domains, topics })
   */
  function analyzeAreas(log, guide) {
    const topicInfo = (guide && guide.topics) || {};
    const topics = new Map();
    for (const entry of log) {
      const name = entry.topic && topicInfo[entry.topic] ? entry.topic : OTHER;
      if (!topics.has(name)) {
        topics.set(name, {
          topic: name,
          // Shown name: the official task number first ("2.3 IAM e identidade").
          label: name !== OTHER && topicInfo[name].task ? `${topicInfo[name].task} ${name}` : name,
          domain: name === OTHER ? OTHER : topicInfo[name].domain,
          answered: 0,
          correct: 0,
          skipped: 0,
          missed: [],
          study: name === OTHER ? [] : topicInfo[name].study || [],
          links: name === OTHER ? [] : topicInfo[name].links || [],
        });
      }
      const t = topics.get(name);
      if (entry.outcome === "skipped") t.skipped += 1;
      else t.answered += 1;
      if (entry.outcome === "first") t.correct += 1;
      else t.missed.push(entry);
    }

    const scored = [...topics.values()].map(score);
    const domainOrder = [...((guide && guide.domains) || []), OTHER];
    const domains = domainOrder
      .map((domain) => {
        const list = scored.filter((t) => t.domain === domain).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
        if (list.length === 0) return null;
        const sum = (key) => list.reduce((acc, t) => acc + t[key], 0);
        const weight = guide && guide.weights ? guide.weights[domain] : undefined;
        const label = weight ? `${domain} (${weight}% da prova)` : domain;
        return { ...score({ domain, answered: sum("answered"), correct: sum("correct"), skipped: sum("skipped") }), label, topics: list };
      })
      .filter(Boolean);

    const strengths = scored.filter((t) => t.pct !== null && t.pct >= STRONG_MIN).sort((a, b) => b.pct - a.pct || b.answered - a.answered);
    const weaknesses = scored
      .filter((t) => t.pct === null || t.pct < WEAK_BELOW)
      .sort((a, b) => (a.pct ?? -1) - (b.pct ?? -1) || b.missed.length - a.missed.length);

    return { domains, strengths, weaknesses, total: log.length };
  }

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

  /** Exam tag of a question's topic: "2.3 IAM e identidade · Segurança e conformidade" (the bare name without a guide). */
  function examTag(topic, guide) {
    const info = guide && guide.topics && guide.topics[topic];
    if (!info) return topic;
    return `${info.task ? `${info.task} ` : ""}${topic} · ${info.domain}`;
  }

  /** Summary figures. A duel has no streak, so it shows the rounds played instead. */
  function summaryCells(game, { short = false } = {}) {
    return [
      ["Pontos", game.score],
      ["Acertos", game.correct],
      ["Erros", game.misses],
      ["Precisão", `${game.accuracy}%`],
      ["Nível", game.level],
      game.duel ? ["Rounds", game.log.length] : [short ? "Sequência" : "Melhor sequência", game.maxStreak],
      ["Tempo", formatDuration(game.seconds)],
    ];
  }

  const fraction = (a) => (a.pct === null ? `pulou ${a.skipped}` : `${a.correct}/${a.answered}`);
  const percent = (a) => (a.pct === null ? "—" : `${a.pct}%`);

  /** "Desempenho por área" section of the Markdown report (empty when there is no guide). */
  function areasMarkdown(game, guide) {
    if (!guide || game.log.length === 0) return [];
    const a = analyzeAreas(game.log, guide);
    const lines = [
      "## Desempenho por área",
      "",
      `_Acerto de primeira por área do exame ${guide.exam ? guide.exam.name : ""}, nas ${a.total} perguntas desta partida. ` +
        `Ótimo: 80% ou mais · Bom: 60–79% · Atenção: 40–59% · Precisa estudar: abaixo de 40%._`,
      "",
      "| Área | Acertos | % | Situação |",
      "|---|---:|---:|---|",
    ];
    for (const d of a.domains) {
      lines.push(`| **${md(d.label)}** | **${fraction(d)}** | **${percent(d)}** | **${d.rating.mark} ${d.rating.label}** |`);
      for (const t of d.topics) lines.push(`| ↳ ${md(t.label)} | ${fraction(t)} | ${percent(t)} | ${t.rating.mark} ${t.rating.label} |`);
    }
    lines.push("");

    lines.push("### ✓ Pontos fortes", "");
    if (a.strengths.length) a.strengths.forEach((t) => lines.push(`- **${md(t.label)}**: ${t.pct}% (${fraction(t)})`));
    else lines.push("- Nenhuma área com 80% ou mais nesta partida.");
    lines.push("");

    lines.push("### ✗ Onde melhorar", "");
    if (a.weaknesses.length === 0) lines.push("- Nenhuma área abaixo de 60% nesta partida. Mandou bem!", "");
    for (const t of a.weaknesses) {
      lines.push("<details>", `<summary><strong>${md(t.label)}</strong>: ${percent(t)} (${fraction(t)}) · ${t.rating.label}</summary>`, "");
      if (t.missed.length) {
        lines.push("**O que você errou:**", "");
        t.missed.forEach((e) => lines.push(`- ${md(e.q)} → **Resposta certa:** ${md(e.answer)}`));
        lines.push("");
      }
      if (t.study.length) {
        lines.push("**O que estudar:**", "");
        t.study.forEach((item) => lines.push(`- ${md(item)}`));
        lines.push("");
      }
      if (t.links.length) lines.push(`**Links oficiais:** ${t.links.map((l) => `[${md(l.label)}](${l.url})`).join(" · ")}`, "");
      lines.push("</details>", "");
    }
    return lines;
  }

  /**
   * Markdown report.
   * @param {object} game  a report (see the top of this file)
   * @param {object} [guide] window.STUDY_GUIDE, for the "Desempenho por área" section
   */
  function toMarkdown(game, guide) {
    const s = summarize(game.log);
    const outcomes = outcomesFor(game);
    const lines = [
      game.duel ? "# AWS Cloud Quest — Relatório do duelo" : "# AWS Cloud Quest — Relatório da partida",
      "",
      ...(game.duel ? [`## ${md(duelHeadline(game))}`, "", duelDetails(game), ""] : []),
      `**Data:** ${formatDate(dateOf(game))}  `,
      `**Personagem:** ${game.hero === "female" ? "Mulher" : "Homem"}${game.modeLabel ? `  \n**Modo:** ${game.modeLabel}` : ""}`,
      "",
      "## Resumo",
      "",
      `| ${summaryCells(game).map(([label]) => label).join(" | ")} |`,
      "|---:|---:|---:|---:|---:|---:|---:|",
      `| ${summaryCells(game).map(([, value]) => value).join(" | ")} |`,
      "",
      ...areasMarkdown(game, guide),
      "## Perguntas",
      "",
      "| Resultado | Quantidade |",
      "|---|---:|",
      ...outcomes.list.map((o) => `| ${o.mark} ${o.label} | ${s.counts[o.key]} |`),
      `| **Total** | **${s.total}** |`,
      "",
    ];

    // In a duel, "skipped" means the rival answered first.
    const titles = game.duel
      ? ["Errei ou o tempo acabou", "Acertei", "O adversário foi mais rápido"]
      : ["Errei ou não respondi a tempo", "Acertei de primeira", "Pulei"];
    const sections = [
      [titles[0], game.log.filter((e) => e.outcome === "lost" || e.outcome === "late")],
      [titles[1], game.log.filter((e) => e.outcome === "first")],
      [titles[2], game.log.filter((e) => e.outcome === "skipped")],
    ];

    for (const [title, entries] of sections) {
      if (entries.length === 0) continue;
      lines.push(`## ${title}`, "");
      entries.forEach((e, i) => {
        lines.push(`### ${i + 1}. ${outcomes.byKey[e.outcome].mark} ${md(e.q)}`, "");
        if (e.topic) lines.push(`- **Tema do exame:** ${md(examTag(e.topic, guide))}`);
        if (e.wrongPicks.length) lines.push(`- **Você marcou:** ${e.wrongPicks.map(md).join("; ")}`);
        lines.push(`- **Resposta certa:** ${md(e.answer)}`);
        if (e.explanation) lines.push(`- **Por quê:** ${md(e.explanation)}`);
        lines.push("");
      });
    }

    lines.push("---", "", "_Gerado pelo AWS Cloud Quest. Perguntas de estudo; não são questões oficiais da AWS._", "");
    return lines.join("\n");
  }

  /**
   * "Desempenho por área" as DOM (game screen and printable report).
   * interactive = true: weak areas are buttons that open their study plan;
   * false (print): everything is expanded. Text goes through textContent only.
   */
  function buildAreas(analysis, { interactive = false } = {}) {
    const h = (tag, cls, text) => {
      const el = document.createElement(tag);
      if (cls) el.className = cls;
      if (text !== undefined) el.textContent = text;
      return el;
    };

    function row(name, area, cls) {
      const line = h("div", `area-row ${cls}`);
      const bar = h("span", "area-bar");
      const fill = h("span", "area-fill");
      fill.style.width = `${area.pct ?? 0}%`;
      fill.style.background = area.rating.color;
      bar.append(fill);
      const badge = h("span", "area-badge", `${area.rating.mark} ${area.rating.label}`);
      badge.style.borderColor = area.rating.color;
      line.append(h("span", "area-name", name), bar, h("span", "area-pct", `${percent(area)} · ${fraction(area)}`), badge);
      return line;
    }

    const section = h("section", "areas");
    for (const d of analysis.domains) {
      const block = h("div", "area-domain");
      block.append(row(d.label, d, "is-domain"));
      d.topics.forEach((t) => block.append(row(t.label, t, "is-topic")));
      section.append(block);
    }

    const strong = h("div", "areas-strong");
    strong.append(h("h3", "", "✓ Pontos fortes"));
    const strongList = h("ul");
    if (analysis.strengths.length) analysis.strengths.forEach((t) => strongList.append(h("li", "", `${t.label}: ${t.pct}% (${fraction(t)})`)));
    else strongList.append(h("li", "", "Nenhuma área com 80% ou mais nesta partida."));
    strong.append(strongList);

    const weak = h("div", "areas-weak");
    weak.append(h("h3", "", "✗ Onde melhorar"));
    if (analysis.weaknesses.length === 0) weak.append(h("p", "", "Nenhuma área abaixo de 60% nesta partida. Mandou bem!"));
    analysis.weaknesses.forEach((t, i) => {
      const item = h("div", "weak-item");
      const title = `${t.label} · ${percent(t)} (${fraction(t)}) · ${t.rating.label}`;
      const body = h("div", "weak-body");
      body.id = `weak-${i}`;
      if (t.missed.length) {
        body.append(h("h4", "", "O que você errou"));
        const ul = h("ul");
        t.missed.forEach((e) => {
          const li = h("li");
          li.append(h("span", "weak-q", e.q), h("span", "weak-a", `Resposta certa: ${e.answer}`));
          ul.append(li);
        });
        body.append(ul);
      }
      if (t.study.length) {
        body.append(h("h4", "", "O que estudar"));
        const ul = h("ul");
        t.study.forEach((s) => ul.append(h("li", "", s)));
        body.append(ul);
      }
      if (t.links.length) {
        const p = h("p", "weak-links");
        p.append("Links oficiais: ");
        t.links.forEach((l, k) => {
          const a = h("a", "", l.label);
          a.href = l.url;
          a.target = "_blank";
          a.rel = "noopener";
          if (k) p.append(" · ");
          p.append(a);
        });
        body.append(p);
      }
      if (interactive) {
        const button = h("button", "weak-toggle", title);
        button.type = "button";
        button.setAttribute("aria-expanded", "false");
        button.setAttribute("aria-controls", body.id);
        button.style.borderColor = t.rating.color;
        body.hidden = true;
        button.addEventListener("click", () => {
          const open = button.getAttribute("aria-expanded") !== "true";
          button.setAttribute("aria-expanded", String(open));
          body.hidden = !open;
        });
        item.append(button, body);
      } else {
        const heading = h("h4", "weak-title", title);
        heading.style.borderColor = t.rating.color;
        item.append(heading, body);
      }
      weak.append(item);
    });

    const columns = h("div", "areas-summary");
    columns.append(strong, weak);
    section.append(columns);
    return section;
  }

  /**
   * The report as a real PDF file (A4), built with js/pdf.js: summary, performance
   * by area with a study plan for weak areas, outcome chart and every question.
   * @returns {Uint8Array}
   */
  function toPdf(game, guide, pdfLib = root.AwsCloudQuest && root.AwsCloudQuest.pdf) {
    const doc = pdfLib.createDocument({ title: "AWS Cloud Quest — Relatório da partida", author: "AWS Cloud Quest" });
    const W = doc.PAGE.width;
    const H = doc.PAGE.height;
    const M = 42; // margin
    const CW = W - 2 * M; // content width
    const INK = "#2b1240";
    const MUTED = "#5b5266";
    const LINE = "#ddd5e6";
    let top = 0;

    function newPage() {
      doc.addPage();
      top = M;
    }
    function ensure(height) {
      if (top + height > H - M - 16) newPage();
    }
    /** Wrapped paragraph; returns its height. */
    function paragraph(text, { x = M, width = CW, size = 10, bold = false, color = INK, gap = 3 } = {}) {
      const lines = doc.wrap(text, width, size, bold);
      const lh = size * 1.32;
      lines.forEach((line) => {
        ensure(lh);
        top += lh;
        doc.text(x, top - lh * 0.22, line, { size, bold, color });
      });
      top += gap;
    }
    function heading(text, size = 14) {
      ensure(size * 3);
      top += size * 0.8;
      paragraph(text, { size, bold: true, gap: 4 });
    }
    /** Small caps label kept on the same page as at least `keep` points of what follows it. */
    function label(text, keep = 36) {
      ensure(keep);
      paragraph(text, { x: M + 10, width: CW - 10, size: 8, bold: true, color: MUTED, gap: 1 });
    }
    function bar(x, y, width, pct, color) {
      doc.rect(x, y, width, 7, "#eee8f3");
      if (pct > 0) doc.rect(x, y, (width * pct) / 100, 7, color);
    }

    newPage();
    const s = summarize(game.log);
    const outcomes = outcomesFor(game);
    paragraph(game.duel ? "AWS Cloud Quest — Relatório do duelo" : "AWS Cloud Quest — Relatório da partida", { size: 20, bold: true, gap: 2 });
    if (game.duel) {
      paragraph(duelHeadline(game), { size: 15, bold: true, color: game.duel.won ? "#0b7a0b" : "#b3261e", gap: 1 });
      paragraph(duelDetails(game), { size: 10, gap: 2 });
    }
    const meta = `${formatDate(dateOf(game))} · Personagem: ${game.hero === "female" ? "Mulher" : "Homem"}${game.modeLabel ? ` · Modo: ${game.modeLabel}` : ""}`;
    paragraph(meta, { size: 10, color: MUTED, gap: 10 });

    // Summary tiles
    const tiles = summaryCells(game, { short: true });
    const tileW = (CW - 6 * 6) / 7;
    tiles.forEach(([label, value], i) => {
      const x = M + i * (tileW + 6);
      doc.strokeRect(x, top, tileW, 42, LINE);
      doc.text(x + (tileW - doc.textWidth(label, 8)) / 2, top + 14, label, { size: 8, color: MUTED });
      const v = String(value);
      doc.text(x + (tileW - doc.textWidth(v, 15, true)) / 2, top + 33, v, { size: 15, bold: true });
    });
    top += 54;

    // Performance by area
    if (guide && game.log.length) {
      const a = analyzeAreas(game.log, guide);
      heading("Desempenho por área");
      paragraph(`Acerto de primeira por área do exame${guide.exam ? ` ${guide.exam.name}` : ""}. Ótimo: 80% ou mais · Bom: 60–79% · Atenção: 40–59% · Precisa estudar: abaixo de 40%.`, { size: 8.5, color: MUTED, gap: 6 });
      const colName = M + 6;
      const colBar = M + CW * 0.42;
      const barW = CW * 0.25;
      const colPct = colBar + barW + 10;
      const colRating = M + CW - 90;
      for (const d of a.domains) {
        ensure(22 + d.topics.length * 16);
        const rows = [{ name: d.label, area: d, bold: true, indent: 0 }, ...d.topics.map((t) => ({ name: t.label, area: t, bold: false, indent: 12 }))];
        doc.strokeRect(M, top, CW, rows.length * 16 + 8, LINE);
        top += 4;
        rows.forEach(({ name, area, bold, indent }) => {
          top += 16;
          const base = top - 4.5;
          doc.text(colName + indent, base, name, { size: 9, bold });
          bar(colBar, base - 7, barW, area.pct ?? 0, area.rating.color);
          doc.text(colPct, base, `${percent(area)} · ${fraction(area)}`, { size: 9, bold });
          doc.rect(colRating, base - 8, 4, 10, area.rating.color);
          doc.text(colRating + 8, base, `${area.rating.label}`, { size: 8.5, bold: true });
        });
        top += 10;
      }

      heading("Pontos fortes", 12);
      if (a.strengths.length) a.strengths.forEach((t) => paragraph(`+ ${t.label}: ${t.pct}% (${fraction(t)})`, { size: 10, gap: 1 }));
      else paragraph("Nenhuma área com 80% ou mais nesta partida.", { size: 10, color: MUTED });

      heading("Onde melhorar", 12);
      if (a.weaknesses.length === 0) paragraph("Nenhuma área abaixo de 60% nesta partida. Mandou bem!", { size: 10, color: MUTED });
      for (const t of a.weaknesses) {
        ensure(60);
        top += 4;
        doc.rect(M, top, 4, 16, t.rating.color);
        doc.text(M + 10, top + 12, `${t.label} · ${percent(t)} (${fraction(t)}) · ${t.rating.label}`, { size: 11, bold: true });
        top += 20;
        if (t.missed.length) {
          label("O QUE VOCÊ ERROU");
          t.missed.forEach((e) => {
            paragraph(`• ${e.q}`, { x: M + 14, width: CW - 14, size: 9, gap: 0 });
            paragraph(`Resposta certa: ${e.answer}`, { x: M + 22, width: CW - 22, size: 9, bold: true, color: "#006300", gap: 3 });
          });
        }
        if (t.study.length) {
          label("O QUE ESTUDAR");
          t.study.forEach((item) => paragraph(`• ${item}`, { x: M + 14, width: CW - 14, size: 9, gap: 1 }));
        }
        if (t.links.length) {
          label("LINKS OFICIAIS (clique para abrir)", 14 + 12 * Math.min(t.links.length, 3));
          t.links.forEach((l) => {
            ensure(14);
            top += 12;
            const label = `${l.label} — ${l.url}`;
            const shown = doc.wrap(label, CW - 14, 8.5)[0];
            doc.text(M + 14, top - 2.5, shown, { size: 8.5, color: "#1d4ed8" });
            doc.link(M + 14, top - 11, Math.min(CW - 14, doc.textWidth(shown, 8.5)), 12, l.url);
          });
          top += 4;
        }
        top += 6;
      }
    }

    // Outcome chart: one 100% bar
    heading(`Perguntas (${s.total}) · ${s.firstTryRate}% de primeira`, 12);
    if (s.total > 0) {
      ensure(50);
      let x = M;
      const parts = outcomes.list.filter((o) => s.counts[o.key] > 0);
      const usable = CW - 2 * (parts.length - 1);
      parts.forEach((o) => {
        const w = (s.counts[o.key] / s.total) * usable;
        doc.rect(x, top, w, 22, o.color);
        const label = String(s.counts[o.key]);
        if (w > 18) doc.text(x + (w - doc.textWidth(label, 10, true)) / 2, top + 15, label, { size: 10, bold: true });
        x += w + 2;
      });
      top += 34;
      let lx = M;
      outcomes.list.forEach((o) => {
        const label = `${o.label}: ${s.counts[o.key]}`;
        doc.rect(lx, top - 8, 9, 9, o.color);
        doc.text(lx + 13, top, label, { size: 8.5 });
        lx += 13 + doc.textWidth(label, 8.5) + 16;
      });
      top += 8;
    }

    // Every question
    heading("Todas as perguntas", 12);
    game.log.forEach((e, i) => {
      ensure(50);
      const o = outcomes.byKey[e.outcome];
      top += 4;
      doc.rect(M, top, 4, 12, o.color);
      doc.text(M + 10, top + 10, `${i + 1}. ${o.label}${e.topic ? ` · ${examTag(e.topic, guide)}` : ""}`, { size: 8.5, bold: true, color: MUTED });
      top += 14;
      paragraph(e.q, { x: M + 10, width: CW - 10, size: 9.5, bold: true, gap: 1 });
      if (e.wrongPicks.length) paragraph(`Você marcou: ${e.wrongPicks.join("; ")}`, { x: M + 10, width: CW - 10, size: 9, color: "#a12626", gap: 1 });
      paragraph(`Resposta certa: ${e.answer}`, { x: M + 10, width: CW - 10, size: 9, bold: true, color: "#006300", gap: 1 });
      if (e.explanation) paragraph(`Por quê: ${e.explanation}`, { x: M + 10, width: CW - 10, size: 9, color: "#3d3546", gap: 4 });
    });

    // Footer with page numbers on every page
    const total = doc.pageCount();
    const pagesText = (n) => `Gerado pelo AWS Cloud Quest · Perguntas de estudo, não são questões oficiais da AWS · Página ${n} de ${total}`;
    for (let n = 1; n <= total; n++) {
      doc.goToPage(n);
      doc.line(M, H - M + 4, W - M, H - M + 4, LINE);
      doc.text(M, H - M + 16, pagesText(n), { size: 7.5, color: MUTED });
    }
    return doc.build();
  }

  const api = Object.freeze({ OUTCOMES, RATINGS, summarize, analyzeAreas, buildAreas, toMarkdown, toPdf, stamp });

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.report = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
