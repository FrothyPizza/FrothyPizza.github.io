# Working rules

For coding agents, and for humans who want the short version.

---

## The one thing that matters

**This game must stay frame-exact with [Samurai Slasher](../Samurai%20Slasher/).**

There is a test suite that proves it by running the original's source as an
oracle. Before you claim any gameplay change works:

```bash
node tests/run.js differential     # 23 tests, must be 23/23
```

If those fail, your change is wrong — not the tests. Read
[docs/compatibility.md](docs/compatibility.md) and try again.

---

## Hard rules

1. **Never modify `../Samurai Slasher/`.** It is read-only reference and the test
   oracle. `git status` on it must stay empty.
2. **No delta time in gameplay.** No accumulator, no fixed-step loop, no
   framerate independence, no "normalising" a constant. The game is framerate
   dependent by design.
3. **Do not retune.** Every number in `src/world/components.js`,
   `src/data/weapons.js`, `src/data/enemies.js` and `classic-arena.js` came from
   the original. Changing one is a gameplay change, and needs to be a deliberate,
   stated decision — not a cleanup.
4. **Do not "fix" a documented quirk.** [docs/compatibility.md](docs/compatibility.md)
   catalogues twelve of them. They are load-bearing. Each one has a comment at
   its site saying so.
5. **Everything renders inside 176x144.** Bitmap font only. No DOM text, no
   overlays, no browser fonts, no fractional scaling.
6. **Do not reorder the system pipeline.** See `src/systems/index.js`. Append
   after `animation` if you truly must add one.
7. **Do not disturb the RNG call order.** The parity tests drive both runtimes
   from one seeded stream. An extra or reordered `random()` call diverges
   everything. If you need randomness in new code, draw from `world.auxRandom`.
8. **Nothing reaches for a global.** Services come from `world.*` or are injected
   through a constructor. This is what makes two levels, a pause menu and
   headless tests possible.

---

## Before you start

```bash
node tests/run.js      # should be 124 passed, 0 failed
```

If it is not green on a clean checkout, stop and fix that first. You will not be
able to tell your breakage from the existing breakage.

---

## Where things live

| I want to change… | Go to | Read first |
| --- | --- | --- |
| a weapon / enemy / level | `src/data/` | [extending.md](docs/extending.md) |
| a boss, or a boss pattern | `src/data/bosses.js` | [bosses.md](docs/bosses.md) |
| how an entity is assembled | `src/factories/factories.js` | [compatibility.md](docs/compatibility.md) |
| gameplay behaviour | `src/systems/` | [compatibility.md](docs/compatibility.md) — **carefully** |
| menus, pause, level select | `src/game/scenes/` | [architecture.md](docs/architecture.md) |
| rendering, input, timing | `src/core/` | [compatibility.md](docs/compatibility.md) |
| tests | `tests/` | [testing.md](docs/testing.md) |

---

## The workflow

### Adding content (weapon, enemy, level)

This is the common case and it should not require touching a system.

1. Follow the recipe in [docs/extending.md](docs/extending.md).
2. Add the asset to the manifest in `src/core/assets.js`.
3. Add the record to the registry in `src/data/`.
4. `node tests/run.js levels` — the registry validators will catch a malformed
   record.
5. `node tests/run.js differential` — proves you did not disturb the arena.
6. Look at it in a browser. The tests do not rasterise pixels.

**If your addition changes the arena's RNG stream** (a new weapon in the drop
bag, a new enemy in the spawn roll), parity will break — correctly. Gate it
behind per-level data so the arena is unaffected. If you genuinely intend to
change the arena, say so explicitly and update the pinning test as a deliberate
act.

### Changing gameplay

1. **Characterise before changing.** Write a differential scenario that captures
   the current behaviour and passes. Only then change the code.
2. Make the change.
3. `node tests/run.js differential`. If it fails, you have found either a bug in
   your change or an undocumented quirk. Work out which before proceeding.
4. If it is a quirk, document it in
   [docs/compatibility.md](docs/compatibility.md) and add a comment at the site.

### Fixing a lifecycle bug

Allowed, and welcome — the refactor already fixed three. The test is:

> Does it change anything observable *during* a live run?

If yes, it is not a lifecycle fix, it is a gameplay change. If no, fix it, add a
test in `tests/lifecycle.test.js`, and note it under "Intentional deviations" in
[docs/compatibility.md](docs/compatibility.md).

---

## Verifying your work

**Tests are necessary but not sufficient.** They run headless: no canvas, no real
input, no real frame pacing. What they cannot see:

- whether anything actually *looks* right,
- canvas tint compositing and nearest-neighbour filtering,
- letterboxing at real window sizes,
- touch input plumbing,
- console errors on load.

So: run the server and look.

```bash
node tools/serve.js
```

- <http://127.0.0.1:8765/Samurai%20Slasher%202/index.html>
- <http://127.0.0.1:8765/Samurai%20Slasher/index.html> (side by side, for feel)

Check: no console errors; the buffer is crisply scaled with even letterbox bars;
title → level select → all three arenas → pause → retry → back all work; the
Gatekeeper arrives, telegraphs read clearly and it can be beaten; movement, jump
and attack feel like the original; a narrow/mobile viewport shows the touch
buttons inside the buffer.

---

## Reporting

Be specific and be honest.

- Say **what you ran** and **what it printed**. "124 passed, 0 failed" beats
  "tests pass".
- If you did not run something, say so. Do not describe browser behaviour you did
  not observe.
- If a test is green because the scenario never reached the state it claims, that
  is a bug in the test. Two scenarios in this suite were silently vacuous until
  coverage assertions were added; assume yours might be too.
- Constants matching is not parity. The oracle is the only evidence that counts.

---

## Things that will bite you

- **`const`/`let` in the oracle's VM.** The original declares `app`, `ECS`,
  `gameScene`, `Inputs` with `const`/`let`, which never become properties of the
  global object. `tests/harness/oracle.js` reaches them by evaluating an
  expression, not by reading `context.x`.
- **Spritesheet `animations`, not `meta.frameTags`.** PIXI 6 only read the
  top-level `animations` block. The frame tags in these JSONs are dead data.
- **The first animation in the sheet** determines a sprite's centring offset.
  Reordering the `animations` block moves sprites.
- **`world.each()` snapshots ids** before iterating, matching `for...in`. Several
  systems mutate the registry while looping; a live iterator would visit
  entities the original never did.
- **The ticker is a linked list on purpose.** A listener that removes and re-adds
  itself mid-dispatch — which every attack animation does on completion — gets
  visited again in the same pass. An array snapshot loses that.
- **`tests/harness/pixi-stub.js` is deliberately duplicated** from
  `src/core/animated-sprite.js`. Do not "deduplicate" them; the cross-check test
  would then be comparing a module to itself.
