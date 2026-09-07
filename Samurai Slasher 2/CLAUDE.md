# Claude Code notes

Read **[AGENTS.md](AGENTS.md)** first — it is the working contract and it applies
here in full. This file adds only what is specific to running Claude Code in this
directory.

---

## Orientation, in one minute

This is a rebuild of `../Samurai Slasher/` that must stay **frame-exact** with it.
The test suite proves that by running the original's unmodified source as an
oracle inside a Node `vm`. That is the unusual thing about this project, and it
is the thing to keep in mind before every gameplay edit.

```bash
node tests/run.js                  # 124 tests, ~6s, no dependencies
node tests/run.js differential     # the 23 that compare against the original
node tools/serve.js                # http://127.0.0.1:8765/Samurai%20Slasher%202/index.html
```

---

## Before editing

- `src/systems/**`, `src/factories/**`, `src/world/components.js`,
  `src/core/{ticker,animated-sprite,clock,timers}.js` — **read
  [docs/compatibility.md](docs/compatibility.md) first.** These are the files the
  parity contract lives in.
- `src/data/**`, `src/game/scenes/**`, `docs/**`, `tests/**` — ordinary code,
  edit freely.
- `../Samurai Slasher/**` — **never**. Read-only, and the test oracle.

## After editing

Always run the suite. For gameplay changes, run the differential suite and quote
the count. For anything visual, say plainly that you did not verify it in a
browser unless you did.

---

## Search notes

- The eight gameplay systems are one file each in `src/systems/`, named after
  their original counterparts (`mapCollisions` → `map-collisions.js`).
- Original source for comparison is at `../Samurai Slasher/js/Systems/*.js`.
- Every preserved quirk has a comment at its site, so
  `grep -rn "Quirk\|preserved\|NOTE:" src/` finds them all.
- The bundled PIXI is minified; `tools/peek-pixi.js` used to exist for spelunking
  it and has been removed. If you need it again, the technique was:
  read `../Samurai Slasher/js/lib/pixi.min.js` as one string and slice around an
  `indexOf` of a distinctive token.

## Things that look like bugs and are not

Twelve of them, catalogued in
[docs/compatibility.md](docs/compatibility.md#preserved-quirks). The ones most
likely to trip you up while reading code:

- `Position.last` is `(0, 0)` for the player on frame one — deliberate.
- `thing.x` and `thing.y` go stale inside the tile scan — deliberate.
- `grounded` is only true every few frames while standing still — deliberate.
- `enragedSpeed` is 1.0 for every enemy type — deliberate.
- The high-score HUD does not update mid-run — deliberate.
- The weapon sprite vanishes for one frame when you turn — deliberate.

If you are about to "clean up" any of those, don't.

## Two real bugs that were fixed

Both were found by tooling, and both are worth knowing about because they are the
kind of thing that hides:

- **The bitmap font table.** Echoes' character string omits `#`, `&`, `(` and
  `)`, which shifts every later glyph — its `<`, `=`, `>` render as `(`, `)`,
  `+`. `src/core/bitmap-font.js` uses a table read off the actual atlas instead.
  Pinned by `tests/renderer.test.js`.
- **PIXI's `_requestId` guard.** An early version of the test harness's ticker
  omitted it, so every `AnimatedSprite.play()` rebased the shared ticker's clock
  and silently skipped a frame of animation. Caught by the differential suite on
  frame 0.

---

## Style

Match the surrounding code: tabs, single quotes, no semicolon-free style, JSDoc
block comments on modules explaining *why* rather than *what*. Comments in this
codebase carry the compatibility rationale — they are load-bearing, so keep them
accurate rather than tidy.
