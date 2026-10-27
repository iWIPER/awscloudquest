/**
 * AWS Cloud Quest — automatic topic classification.
 *
 * New questions do not need a hand-picked `topic`: this module reads the
 * question and picks the study-guide topic whose keywords match best. It is
 * deterministic (same question, same topic) and has no dependencies.
 *
 * Score = 3 × matches in the correct answer + 2 × matches in the question
 *       + 1 × matches in the explanation. Ties go to the topic listed first.
 * A `topic` written in the bank always wins over the classifier.
 *
 * Pure logic: used by the game (questions without a topic), by
 * scripts/import-questions.mjs and by the tests.
 */
(function (root) {
  "use strict";

  const WEIGHTS = Object.freeze({ answer: 3, question: 2, explanation: 1 });

  /** Lowercase, without accents, single spaces, padded so \b-like matching works with spaces. */
  function plain(text) {
    return ` ${String(text || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()} `;
  }

  /** How many times a keyword (already plain) appears as whole words in a plain text. */
  function count(haystack, needle) {
    let n = 0;
    let at = haystack.indexOf(needle);
    while (at !== -1) {
      n++;
      at = haystack.indexOf(needle, at + needle.length - 1);
    }
    return n;
  }

  /** Prepares the guide's keywords once: { topic, keywords: [" plain keyword "] }[]. */
  function compile(guide) {
    return Object.entries((guide && guide.topics) || {}).map(([topic, info]) => ({
      topic,
      keywords: (info.keywords || []).map((k) => plain(k)).filter((k) => k.trim().length > 0),
    }));
  }

  /**
   * Scores every topic for a question.
   * @param {{ q: string, options: string[], answer: number|string, explanation?: string }} question
   *   `answer` may be an index or the answer text itself.
   * @returns {{ topic: string, score: number }[]} best first (score > 0 only)
   */
  function rank(question, compiled) {
    const indexes = Array.isArray(question.answers) ? question.answers : typeof question.answer === "number" ? [question.answer] : [];
    const answerText = indexes.length ? indexes.map((i) => question.options[i]).join(" ") : question.answer;
    const parts = {
      answer: plain(answerText),
      question: plain(question.q),
      explanation: plain(question.explanation),
    };
    return compiled
      .map(({ topic, keywords }, order) => {
        let score = 0;
        for (const keyword of keywords) {
          for (const [part, weight] of Object.entries(WEIGHTS)) score += weight * count(parts[part], keyword);
        }
        return { topic, score, order };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || a.order - b.order)
      .map(({ topic, score }) => ({ topic, score }));
  }

  /** Best topic for a question, or null when no keyword matches. */
  function classify(question, compiled) {
    const best = rank(question, compiled)[0];
    return best ? best.topic : null;
  }

  /** Topic to use: the bank's own `topic` if it is a known one, otherwise the classifier's. */
  function topicOf(question, guide, compiled) {
    if (question.topic && guide && guide.topics && guide.topics[question.topic]) return question.topic;
    return classify(question, compiled);
  }

  const api = Object.freeze({ WEIGHTS, plain, compile, rank, classify, topicOf });

  const NS = (root.AwsCloudQuest = root.AwsCloudQuest || {});
  NS.topics = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
