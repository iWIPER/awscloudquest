# Adding questions

All questions live in [`data/questions.js`](../data/questions.js). It is a plain JavaScript file that sets `window.QUESTIONS` to a list of objects. It is a script rather than JSON so the game also works when `index.html` is opened directly from disk.

## Format

```js
{
  id: "vpc-nacl-stateless",        // optional
  topic: "Redes",                  // optional
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
| `answer` | yes | The correct option, as a letter (`"A"`–`"F"`, any case) or a 0-based index (`0` = first option). |
| `explanation` | no | Why the answer is right. Shown when a life is lost and on Game Over. Strongly recommended. |
| `topic` | no | Short label shown as a tag above the question. |
| `id` | no | Stable identifier. If missing, one is derived from the question text. Per-question review stats are keyed by id, so set one if you expect to edit the text later. |
| `note` | no | Maintainer note (for example, "answer key under review"). The game ignores it. |

The game **never** changes, infers or generates answers. What is in this file is exactly what the player sees.

## Adding a question on github.com

1. Open [`data/questions.js`](../data/questions.js) and click the pencil (✏️) icon.
2. Copy an existing `{ ... },` block, including the trailing comma.
3. Paste it right before the final `];` and edit it.
4. Commit. CI validates the bank. If a question is invalid, the **CI** check turns red and lists what is wrong.

## Validating locally

```bash
node scripts/validate-questions.mjs
# ✔ 59 valid questions in data/questions.js (58 with 4 options, 1 with 5 options)
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

Two input formats are accepted:

- **The game's own format:** a JSON array of `{ id?, topic?, q, options, answer, explanation? }`.
- **Practice-exam export:** `{ "perguntas": [ { "numero", "pergunta", "alternativas": [{ "letra", "texto" }], "corretas": ["B"], "explicacao", "aviso" } ] }`. Ids become `<prefix>-<numero>`, and `aviso` is kept as `note`.

The importer copies answer keys exactly as given. It skips questions with more than one correct answer (not supported yet, see the roadmap), questions whose id or text is already in the bank, and anything that fails validation. Imported items that carry a note are listed at the end so you can review their answer keys.

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
- Keep one idea per question. Multi-answer questions ("choose two") are not supported yet.
