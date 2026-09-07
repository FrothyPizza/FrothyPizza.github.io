# Samurai Slasher 2

A rebuild of [Samurai Slasher](../Samurai%20Slasher/) — same game, different bones.

The original is a 176x144 arena slasher built on PIXI 6 with a hand-rolled ECS,
a dozen ambient globals and one hard-coded level. This is a full re-architecture
of it: vanilla ES modules, explicit world ownership, data-driven registries for
weapons/enemies/levels, an in-buffer pixel UI, and a second playable arena — with
**frame-exact gameplay compatibility** verified against the original source.

Nothing in `../Samurai Slasher/` is modified. It is read-only reference material
and, in the test suite, the oracle.

---

## Play it

```bash
node "Samurai Slasher 2/tools/serve.js"        # serves the repo root on :8765
```

Then open <http://127.0.0.1:8765/Samurai%20Slasher%202/index.html>.

A real HTTP origin is required — the game is ES modules, so `file://` will not
work.

**Controls.** Arrows (or `J`/`K`) to move, `Z`/`D` to jump, `X`/`F` to attack,
`Esc` to pause. On touch devices the four on-screen buttons appear automatically;
they are drawn *inside* the pixel buffer, not over it.

---

## Commands

| Command | What it does |
| --- | --- |
| `node tools/serve.js [port]` | Static server for the repo root (default 8765). |
| `node tests/run.js` | The whole test suite (~6s, no dependencies). |
| `node tests/run.js differential` | Just the parity tests against the original. |
| `node tests/run.js menu` | Just the scene/menu flow tests. |
| `node tools/make-icon.js` | Regenerates the Games-page icon from the game's own art. |

`npm test` and `npm run serve` are aliases for the first two. There are no
dependencies to install — `package.json` exists only to set `"type": "module"`
and to name those scripts.

---

## What's here

| Path | |
| --- | --- |
| `src/core/` | Engine: clock, timers, tickers, animation, display list, renderer, input, assets. Knows nothing about Samurai Slasher. |
| `src/world/` | `World`, `Entity`, components. The ownership boundary. |
| `src/systems/` | The eight gameplay systems in the original's order, plus the appended boss system. |
| `src/data/` | Registries: weapons, enemies, bosses, touch buttons, levels. Data only. |
| `src/factories/` | Registry records → entities. |
| `src/game/` | Shell: scenes, menus, level runtime, derived tile art. |
| `tests/` | The suite, including the VM oracle that runs the original. |
| `tools/` | Local server, icon generator, a tiny PNG codec. |
| `assets/` | Art, audio and the 4x8 bitmap font, copied in so the sequel stands alone. |

## Docs

| | |
| --- | --- |
| [Architecture](docs/architecture.md) | How the pieces fit, and what each one owns. |
| [Compatibility contract](docs/compatibility.md) | **Read before touching gameplay.** Exactly what must not change, and the catalogue of preserved quirks. |
| [Extending](docs/extending.md) | Recipes: add a weapon, an enemy, a level. |
| [Testing](docs/testing.md) | How the differential harness works; how to add tests; known limits. |
| [Bosses](docs/bosses.md) | The Gatekeeper: lifecycle, telegraph rules, and how to add another. |
| [Roadmap](docs/roadmap.md) | Where this could go. Not implemented. |
| [AGENTS.md](AGENTS.md) | Working rules for agents (and humans in a hurry). |

---

## The two things that make this different from a rewrite

**1. It is frame-exact, and that is checked, not asserted.**
`tests/differential.test.js` loads the original's unmodified source into a Node
`vm`, wires it to a fake DOM, a fake clock, a seeded `Math.random` and a PIXI
stub, then runs it and this game side by side on the same inputs — comparing
every entity's position, velocity, collision flags, timers and animation state,
*and* the full render list, once per frame.

There is no delta time, no accumulator, no retuning. Movement is a per-frame
position write; jump-hold and spawn cadence are wall-clock; `position.y` is
rounded every tick and `position.x` is not. The original's collision oddities
are reproduced deliberately and documented, not cleaned up.

**2. Everything is inside the 176x144 buffer.**
HUD, menus, level select, pause, touch controls, the loading bar. All of it is
drawn into a 176x144 backing canvas with a 4x8 bitmap font, then blitted to the
display at a whole-number scale with integer letterbox offsets. There is no DOM
text anywhere and no fractional scaling — a source pixel is always an exact
square block of device pixels.

---

## Status

Implemented: three arenas, all six weapons, all four enemies, one boss
encounter, crates, scoring, per-level high scores, title/level-select/pause/
retry, touch controls, and the test suite (124 tests).

Not implemented (documented as plans only): everything in the
[roadmap](docs/roadmap.md).
