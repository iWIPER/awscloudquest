# Adding questions

All questions live in [`data/questions.js`](../data/questions.js). It is a plain JavaScript file that sets `window.QUESTIONS` to a list of objects. It is a script rather than JSON so the game also works when `index.html` is opened directly from disk.

## Format

```js
{
  id: "vpc-nacl-stateless",        // optional
  topic: "Redes e VPC",      // optional
  q: "As network ACLs de uma VPC são stateful ou stateless?",
  options: ["Stateful", "Stateless"],
  answer: "B",
  explanation: "Network ACLs são stateless: o tráfego de retorno precisa de uma regra própria.",
  note: "Checked against the VPC docs on 2026-10-21"   // optional, never shown
},
```

| Field | Required | Description |
|---|---|---|
| `q` | yes | Question text. Long scenario questions are fine: the panel scrolls, and the monster's travel time grows with the text length. |
| `options` | yes | 2 to 6 options. The order does not matter: options are shuffled every time the question is shown. |
| `answer` | yes | The correct option, as a letter (`"A"`–`"F"`, any case) or a 0-based index (`0` = first option). For "Selecione DUAS" questions, a list: `["A", "E"]` (fewer answers than options, no repeats). The player must mark all of them, and gets `MULTI_ANSWER_BONUS` (15 s) extra per additional answer. |
| `explanation` | no | Why the answer is right. Shown when a life is lost and on Game Over. Strongly recommended. |
| `topic` | no | One of the 20 topics in [`data/study-guide.js`](../data/study-guide.js). Leave it out and the classifier picks one (see below). |
| `id` | no | Stable identifier. If missing, one is derived from the question text. Per-question review stats are keyed by id, so set one if you expect to edit the text later. |
| `note` | no | Maintainer note (for example, "answer key under review"). The game ignores it. |

The game **never** changes, infers or generates answers. What is in this file is exactly what the player sees.

## Topics

**Desempenho por área** groups results the way the official score report does: by the four CLF-C02 domains of the [exam guide](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html), with their weights. Each topic belongs to one task statement of the guide, and its number shows on the question tag ("2.3 IAM e identidade").

| Domain (weight) | Topics (task statement) |
|---|---|
| Conceitos de nuvem (24%) | 1.1 Benefícios da nuvem, 1.2 Well-Architected, 1.3 Migração e CAF |
| Segurança e conformidade (30%) | 2.1 Responsabilidade compartilhada, 2.2 Proteção de dados, 2.2 Governança e auditoria, 2.3 IAM e identidade, 2.4 Detecção de ameaças e vulnerabilidades |
| Tecnologia e serviços de nuvem (34%) | 3.1 Implantação e operação, 3.2 Infraestrutura global, 3.3 Computação, 3.4 Banco de dados, 3.5 Redes e VPC, 3.6 Armazenamento, 3.7 Análise de dados, 3.7 IA e machine learning, 3.8 Integração e outros serviços |
| Faturamento, preços e suporte (12%) | 4.1 Preços e compras, 4.2 Gestão de custos, 4.3 Suporte e parceiros |

You do not have to set `topic`. When it is missing, `js/topics.js` matches the question against each topic's keywords (answer × 3, question × 2, explanation × 1) and picks the best score. The importer does the same and writes the topic into the file. `npm run validate` lists the questions it classified automatically, so you can review them, and rejects a `topic` that is not in the guide.

To add a topic or improve matching, edit `data/study-guide.js`: each topic has a `domain`, a `task` statement, `keywords`, `study` notes, `links`, and the easy mode's study hint (`tips` and a `map` of services).

## Adding a question on github.com

1. Open [`data/questions.js`](../data/questions.js) and click the pencil (✏️) icon.
2. Copy an existing `{ ... },` block, including the trailing comma.
3. Paste it right before the final `];` and edit it.
4. Commit. CI validates the bank. If a question is invalid, the **CI** check turns red and lists what is wrong.

## Validating locally

```bash
node scripts/validate-questions.mjs
# ✔ 201 valid questions in data/questions.js (166 with 4 options, 35 with 5 options)
```

It runs the same `normalize()` the game uses and exits with code 1 if anything is wrong:

```
✖ 2 problem(s) in data/questions.js:
  - Question #12 ("Qual serviço…"): invalid "answer" ("E"); use "A"–"D" or 0–3
  - Question #40 ("Qual serviço…"): duplicate question (same text as #7)
```

Question numbers count from 1, in file order.

## Bulk import from JSON

`scripts/import-questions.mjs` appends questions from a JSON file:

```bash
node scripts/import-questions.mjs my-bank.json --prefix sim02 --dry-run   # preview
node scripts/import-questions.mjs my-bank.json --prefix sim02             # write
npm run validate
```

Accepted input formats:

- **The game's own format:** a JSON array of `{ id?, topic?, q, options, answer, explanation? }`.
- **Practice-exam export, list of options:** `{ "perguntas": [ { "numero", "pergunta", "alternativas": [{ "letra", "texto" }], "corretas": ["B"], "explicacao", "aviso" } ] }`.
- **Practice-exam export, options by letter:** `{ "questoes": [ { "id", "pergunta", "alternativas": { "A": "…", "B": "…" }, "resposta": "A" | ["A", "C"] } ] }`, also with `resposta_correta` and a `revisao` review flag (`{ "gabarito_sugerido", "motivo" }`).

Ids become `<prefix>-<numero or id>`. Questions with several correct answers keep all of them. `aviso` and `revisao` become the `note`; the answer key itself is never changed.

The importer assigns a topic to each question and skips repeats: a question whose text is already in the bank (ignoring case and spaces) is left out, while a different question with the same answer is kept. It also skips anything that fails validation. Imported items that carry a note are listed at the end so you can review their answer keys.

## Common mistakes

| Symptom | Cause | Fix |
|---|---|---|
| `invalid "answer" ("E")` | The letter points past the last option | Count the options; 4 options means `"A"`–`"D"` |
| `invalid "answer" (4)` | Index counted from 1 | Indexes start at `0` |
| `"options" has 7 item(s)` | More than 6 options | Remove options; the screen has 6 colors (A–F) |
| `duplicate question` | Same text already in the bank (case and spaces are ignored) | Remove one or reword it |
| `duplicate id` | Two blocks share an `id` | Give each block its own id |
| `option C repeats another option` | Two options with the same text | Make every option distinct |
| `Could not load data/questions.js` + `SyntaxError` | Missing comma between blocks, unbalanced quotes or brackets | Check the line in the error; every block ends with `},` |
| Text with `"` breaks the file | Unescaped double quote inside a string | Write `\"` or use single quotes around the string |

## Writing good questions

- Base each answer on current AWS documentation and put the reasoning in `explanation`.
- Make the wrong options plausible. Options that are obviously wrong teach nothing.
- Prefer `answer: "B"` over indexes, because it matches what the editor sees.
- Keep one idea per question. For "choose two" questions, say it in the text ("Selecione DUAS.") and list both answers.
