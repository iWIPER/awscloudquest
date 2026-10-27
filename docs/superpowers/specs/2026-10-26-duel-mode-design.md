# Duel mode (1 × 1) — design

## Intent

Two people who study together (the author and his girlfriend, and her study community) want a fun, competitive way to drill the same CLF-C02 questions. One player creates a room, sends a link, the friend joins, and they answer the same questions at the same time. The first correct answer shoots the other player, Wild West style.

## Goals

- Create a room, share a link, wait, and start automatically when the friend joins.
- Same question bank, same question and option order on both screens.
- Each player sees themselves on the left and the opponent on the right, using the existing characters.
- 10 or 20 lives each, chosen by the room creator. First correct answer wins the round and the other loses a life.
- Penalize guessing. A wrong answer locks that player's answers for the rest of the round.
- A Wild West look and sound: duel street, "PROCURADO" posters, western music, gunshots.
- Rematch in the same room, with a running score.
- Each player gets a report: the duel result plus the normal "Desempenho por área".

## Non-goals

- Matchmaking with strangers, rankings or accounts.
- More than two players.
- Cheat-proofing. Friends play with friends.

## Anti-goals

- No backend to run, no account to create and no build step. The site stays on GitHub Pages.
- No new runtime library. The networking code is written in the project.
- The solo game must keep working exactly as it does now, including from `file://`.

## Constraints

- GitHub Pages is static, so a public relay carries the messages. The design uses **public MQTT brokers over secure WebSocket** (`wss://broker.hivemq.com:8884/mqtt` first, `wss://broker.emqx.io:8084/mqtt` as fallback). Both were checked to answer from a browser. No account is needed.
- The relay is public and unencrypted at the application level. The room id is random (about 60 bits) and only lives in the link. Names, answers and results go through the relay; nothing else does.
- If no broker answers, the duel screen says so. The solo game is unaffected.

## How it works (decided)

### Flow

1. Start card → **Duelo** opens the duel setup: name, character, **Criar sala**.
2. The host sees the waiting screen: a "PROCURADO" poster with their name, the link (`…/#duelo=<room>`), **Copiar link**, **Compartilhar**, and a 5-minute expiry countdown.
3. The friend opens the link → duel setup in join mode (name, character, **Entrar**).
4. When both are in, the second poster appears, then a 10-second countdown with a clock tick, then "SAQUE!" and Round 1.
5. Rounds until someone has 0 lives.
6. Victory scene: the winner puts the gun away, walks to the middle, climbs a podium beside a Brazil flag on a pole, jumps for joy and says a victory line. Then the screen darkens with "<NOME> VENCEU!" until a tap. In a draw both climb a wide podium: "<A> E <B> EMPATARAM!".
7. End card: room score (e.g. Wilk 2 × 1 Josiane), **Revanche**, **Relatório (PDF)**, **.md**, **Sair da sala**. Leaving shows "<Nome> saiu da sala" on the other screen.

### Round rules

- One round = one question. A "Round N" banner opens it.
- Time limit: the solo travel-time formula (`THINK_SECONDS + chars / READ_CHARS_PER_SEC`, ×level factor, + long-read bonus). The level goes up every 3 rounds.
- First correct answer: the shooter fires, the other loses 1 life and says "ai!". The shooter raises a taunt sign ("HA HA HA! Sou mais forte!").
- Wrong answer: that player's answers lock until the round ends. The other player can still answer.
- If the other player then answers correctly, the player who missed loses a life.
- Both wrong, or time runs out with no correct answer: both lose 1 life, and the next round starts.
- Both reach 0 in the same round: a draw. Nobody gets the room trophy.
- Each round opens with a "ROUND N" presentation and a drum hit, then the question.
- Both players tap "Pronto!" before the first countdown.

### Fairness and authority

- The room creator (host) is the referee. It picks each question and option order, starts rounds and decides results.
- Each answer carries the time from when that player's screen showed the question. The host waits a short grace window (350 ms) after the first correct answer it receives, then awards the round to the smallest time. Network delay does not decide the round.

### Presence and expiry

- Heartbeat every 5 s. If the other player is silent for 15 s, the match pauses with a 2-minute countdown. If they come back, the round starts over; if not, the room closes. A browser that loses the relay reconnects by itself.
- An empty waiting room expires after 5 minutes.

### Report

Each player's report is the normal one built from their own answers: `first` (won the round), `late` (correct but slower), `lost` (wrong or timeout). A duel header goes on top: "Você venceu a Josiane! Rounds 10 × 4 · vidas no fim 6 × 0 · placar da sala 2 × 1". It is saved in the history like a solo game, with mode "Duelo".

## Left to the builder

- Message format and topic names.
- Exact art of the western scenery, posters, podium and flag (inline SVG, as in the rest of the game).
- The western tune (original, synthesized, soft) and the sound effects.
- How the smoke test runs the duel without the public broker. The local transport uses `BroadcastChannel` between two pages.
