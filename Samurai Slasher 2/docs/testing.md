# Testing

```bash
node tests/run.js                 # everything (~6s)
node tests/run.js differential    # just the parity suite
node tests/run.js menu            # just one suite (substring match)
```

124 tests, no dependencies, no test framework beyond `tests/framework.js`
(~100 lines).

---

## The differential harness

This is the part that matters. Everything else is ordinary unit testing.

**The oracle is the original game.** Not a transcription of it, not a table of
expected values — the actual files in `../Samurai Slasher/js`, unmodified, loaded
into a Node `vm` and executed.

```
tests/harness/
  fake-env.js    deterministic clock + setTimeout queue + 60Hz frame schedule
  pixi-stub.js   PIXI 6.2.2, transcribed: Ticker, Container, Sprite,
                 AnimatedSprite, Text, Application, loader
  node-assets.js the real JSON sheets and real PNG headers, off disk
  oracle.js      the vm context: fake DOM, fake clock, seeded Math.random
  subject.js     the new runtime, wired to the same fake services
  snapshot.js    two adapters → one comparable shape, plus a differ
```

### How a scenario runs

```js
for each frame:
    now = t0 + (frame + 1) * (1000 / 60)

    oracle.setInputs(state)          // writes the original's `Inputs` globals
    subject.setInputs(state)         // writes the new InputState

    env.advanceTo(now)               // fires the oracle's setTimeout queue
    oracle.tick(now)                 // app ticker, then shared ticker
    subject.tick(now)                // timers, app ticker, then animation ticker

    compare(worldSnapshot)           // every entity, field by field
    compare(renderSnapshot)          // the full draw list, in order
```

Both sides get their own `mulberry32` seeded with the same value. Identical logic
consumes identical draws, so the streams stay in lockstep — and diverge loudly
the moment one side makes an extra call.

Entity ids are aligned by seeding the subject's counter from the oracle's
`ECS.idIndex` at arena build time, so ids match 1:1 and the comparison is direct.

### What is compared

**Simulation:** id, component list, position, `position.last`, velocity, gravity,
bounds and offsets, health, all four collision flags, enemy direction/speed/
enrage state, damager enabled/frames/damage/hit list, throwable counters, player
score, jump-hold elapsed, bound-weapon id, spawner delays and elapsed time, HUD
text.

**Render:** the sorted draw list — texture identity, x, y, zIndex, scaleX, tint,
visibility, anchor, and for animated sprites the animation name, frame index,
`_currentTime`, speed, loop flag and playing state.

The render snapshot is taken from a `LOW`-priority listener on each side's
application ticker — the exact slot PIXI's renderer occupied — so it captures
what a real frame would have drawn, including the one-frame lag between logic and
displayed animation frame.

### Why 60Hz

At `1000/60` ms per frame, PIXI's `deltaTime` is exactly `1.0`
(`16.666… × 0.06`), which is what the original saw on a normal display, and it
clears the `maxFPS = 63` gate (a 15.873ms floor) every frame.

### Scripted mutations

Some states are gated behind seeded randomness (which weapon dropped, where the
crate landed) or are unreachable in normal play. Scenarios can apply identical
mutations to both sides before a frame:

| Helper | For |
| --- | --- |
| `setWeapon(name)` | Testing a specific weapon deterministically. |
| `teleportPlayer(x, y)` | Reaching a specific part of the map. |
| `moveCrateTo(x, y)` | Forcing a pickup. |
| `setPlayerState({x, y, vx, vy})` | Collision states play cannot produce. |

The last one is what makes the grounding inequality (`velocity.y >= 0`) and the
4px collision margin testable at all — see below.

---

## Coverage assertions

A green parity run is worthless if the scenario never reached the state it claims
to test. Every scenario therefore asserts on what it observed:

```js
const seen = expectParity({ frames: 420, seed: 2, inputs: HOLD({ rightDown: true }) }, '…');
assert(seen.wallHits > 0, 'player never reached a wall — scenario is vacuous');
```

`runScenario` tracks frames rendered, hitstop frames, enemies spawned and killed,
bats seen, projectiles in flight, weapons equipped, attacks started, grounded/
ceiling/wall contacts, max score and restarts.

These are not decoration. Two scenarios were silently vacuous when the assertions
were added: the bat test's seed never spawned a bat, and the crate test parked
the crate on the wrong tile and never scored.

---

## Mutation results

The suite was validated by deliberately breaking things and confirming it
notices. Current results:

| Mutation | Caught |
| --- | --- |
| `Math.round` → `Math.floor` on `position.y` | yes — 1 test, at frame 4 |
| system order: `physics` ↔ `playerInput` | yes — all 23 parity tests |
| jump hold 170ms → 160ms | yes — all 23 parity tests |
| grounding `velocity.y >= 0` → `> 0` | yes — 1 test (via forced state) |
| `COLLISION_MARGIN` 4 → 3 | yes — 1 test (via forced state) |

The last two were **not** caught by the original scenario set, because ordinary
play never produces `velocity.y === 0` at collision time (gravity has always
nudged it positive) and never penetrates a wall by more than 1px. The
`differential: collision edge cases` block exists specifically to force those
states. That is the honest version of "the tests pin these constants".

---

## The other suites

| File | What it holds down |
| --- | --- |
| `animation-parity.test.js` | The shipped `AnimationPlayer`/`Ticker` vs the harness's independent PIXI transcription, over 2000 randomised steps including negative playback and mid-playback swaps. |
| `ticker.test.js` | 63fps gating, deltaTime scaling, priority order, the linked-list re-add semantics, hitstop rebasing. |
| `timers.test.js` | Deadline ordering, task-queue re-entrancy, cancellation, pause semantics. |
| `levels.test.js` | Registry validation, the arena map byte-for-byte, crate placement, derived tile-art alignment, weapon bag and enemy order. |
| `menu.test.js` | Scene flow end to end, pause/resume/retry, teardown, and that nothing escapes 176x144. |
| `renderer.test.js` | Integer scaling and letterboxing across many viewport sizes, the bitmap glyph table, z-order. |
| `lifecycle.test.js` | The three leaks the refactor fixed — including a test that asserts the *original* leaks where this does not. |
| `bosses.test.js` | The encounter: registry invariants, the state machine, the telegraph contract, phases, defeat, teardown, and a deterministic winnability run. |

### Why `pixi-stub.js` is written twice

`src/core/animated-sprite.js` and `tests/harness/pixi-stub.js` implement the same
PIXI algorithm independently. That duplication is deliberate: if the harness
imported the shipped port, `animation-parity.test.js` would be comparing a module
to itself and would catch nothing. Both were transcribed from
`../Samurai Slasher/js/lib/pixi.min.js`, with the minified source quoted in
comments so the transcription can be audited.

The stub found a real bug this way. An early version omitted PIXI's `_requestId`
guard in `_requestIfNeeded`, so every `AnimatedSprite.play()` rebased the shared
ticker's clock and silently skipped that frame's animation dispatch. The
differential suite caught it on frame 0.

---

## Adding a test

**For gameplay:** add a scenario to `tests/differential.test.js`. Pick inputs
that reach the behaviour, then add a coverage assertion proving they did. Never
write an expected value by hand — the oracle is the expectation.

**For engine or shell behaviour:** the other suites. `tests/harness/shell.js`
gives you a headless `Game` with a recording renderer; `tests/harness/subject.js`
gives you a headless world you can step frame by frame.

**When you break parity intentionally** (a new weapon in the bag, a new enemy in
the spawn roll): say so in the commit, update the pinning test deliberately, and
prefer gating the change behind a per-level opt-in so the classic arena stays
byte-identical.

---

## Not covered

- **Browser rendering.** Nothing here rasterises pixels. Canvas output, tint
  compositing, nearest-neighbour behaviour and real letterboxing need eyes on a
  browser at desktop and phone sizes.
- **Audio.** Silenced in tests. Call sites match the original; mixing is unverified.
- **Real frame pacing.** Everything runs at a fixed 60Hz. Variable refresh,
  background-tab throttling and vsync jitter are not simulated.
- **Touch input end to end.** The hit-testing maths is tested; actual
  `TouchEvent` plumbing is not.
- **Asset loading failures.** The loader's fallback path is written but only
  exercised by hand.
