# The compatibility contract

This game must feel *identical* to [Samurai Slasher](../../Samurai%20Slasher/).
Not "close", not "modernised" — identical, frame for frame and pixel for pixel.

This document is the contract. If you are about to change anything in
`src/systems/`, `src/factories/`, `src/world/components.js` or `src/core/`, read
it first, then run `node tests/run.js differential`.

---

## The rule

> The original source is the specification. Where this document and the original
> disagree, the original wins — and the tests will say so.

`tests/harness/oracle.js` loads the original's unmodified files into a Node `vm`
and runs them. Every parity assertion compares against *that*, not against a
transcribed expectation. See [testing.md](testing.md).

---

## Invariants

### Frame shape

Native resolution **176x144**. Application ticker capped at **`maxFPS = 63`**
(PIXI turns that into a 15.873ms minimum frame interval). A 60Hz display clears
that gate every frame and yields `deltaTime === 1.0`.

Two tickers, as in the original:

| Ticker | Drives | Capped? | Stopped by hitstop? |
| --- | --- | --- | --- |
| application | gameplay systems (NORMAL), renderer (LOW) | yes, 63fps | **yes** |
| animation | every `AnimatedSprite` (HIGH) | no | **no** |

The original got this split by accident — `new PIXI.Application()` creates its
own ticker, while `AnimatedSprite` always attaches to `Ticker.shared`. The
consequence is load-bearing: during the 250ms hitstop on death, the screen
freezes but animations keep advancing. `src/core/ticker.js` reproduces it.

### System order

```
mapCollisions → damageCollisions → crateCollisions → enemySpawner
              → physics → playerInput → enemyBehavior → animation
              [→ bossSystem]
```

`bossSystem` is appended, not inserted, and returns immediately unless the level
declares a boss — so for the classic arena the pipeline is exactly the eight
above. Anything new goes at the end for the same reason.

Collision resolution runs *before* the input that moves the player and *before*
the integration that moves everything, so the collision flags any system reads
are one frame old. Reordering changes the feel of the game. Enforced by
`src/systems/index.js` and covered by the differential suite (swapping `physics`
and `playerInput` fails all 23 parity tests).

### No delta time in gameplay

`deltaTime` is consumed by exactly one thing: animation frame advance
(`_currentTime += animationSpeed * deltaTime`). Gameplay adds velocity once per
tick, gravity once per tick, and moves the player by `speed` px per tick.

**Do not** introduce a fixed-step accumulator, delta-scaled movement, or
"framerate independence". The game is framerate dependent by design and its
tuning assumes it.

### Rounding

- `position.y` is rounded to a whole pixel **every tick**, at the end of physics.
- `position.x` is **never** rounded — it stays fractional (enemies move at 0.25,
  0.3333 and 0.5 px/frame).
- Sprite placement rounds: `sprite.x = round(position.x - offset.x)`.
- Text position is **not** rounded (the HUD readouts sit on fractional x/y).
- Bitmap glyphs floor their destination, as Echoes did.

### Wall-clock timing

These are wall-clock, not frame counts, and must stay that way:

| Thing | Duration |
| --- | --- |
| jump hold window | 170 ms |
| hitstop on death | 250 ms |
| respawn after death | 1600 ms |
| corpse cleanup | 1000 ms |
| hurt-flash reset | 200 ms |
| drill re-hit interval | 50 ms |
| projectile lifetime | 2000 ms |
| spawn cadence | 2000 ms, decaying by 5 per spawn to a 750 ms floor |
| spawn burst | 400 ms cadence for 1000 ms, on a 10% roll |

They run through `src/core/timers.js` and `src/core/clock.js`, which read a
single `TimeSource`. With no pausing, `TimeSource.now()` *is* `performance.now()`,
so live behaviour is unchanged.

### Frame-counted timing

Not everything is wall-clock, and the split matters:

- Attack recovery is gated on the **weapon's animation finishing**, not a timer.
- Throwables use a **frame counter** (`framesSinceLastAttack`), 18 frames for the
  shuriken, 20 for the cannon.
- Weapon hitboxes stay live for a **frame count** (`framesEnabled`: 4 by default,
  0 for the held shuriken, 10000 for a thrown one, 1e9 for the drill).

### RNG call order

The seeded differential tests drive both runtimes from one stream, so the *order
and count* of `random()` calls is part of the contract. In the spawner:

```
[guarded by tempSpawnDelay === spawnDelay]  bigEnemyChance roll
[only if that passed]                        brute roll, then bat roll
                                             burst roll
                                             enemy facing roll (in the factory)
```

A second, independent stream (`world.auxRandom`) exists for systems that draw
randomness *outside* the original's code paths — the boss system is the only
current user. Drawing from the main stream there would shift everything the
parity tests compare.

Weapon swaps draw once per rejection-loop attempt. Crate re-rolls draw once per
attempt until the new spot is ≥64px from the old one. A cannon shot draws twice
per pellet (x scatter, then y). Killing an enemy with a non-sprite damager draws
once for the knockback direction.

---

## Preserved quirks

These are bugs. They are kept because they are *felt*, and the parity tests fail
if you fix them.

### 1. The first-frame sweep

`Position` snapshots `last` at construction. Blueprints that assign
`position.vec` afterwards — the player does — leave `last` at `(0, 0)`. On the
entity's first frame the vertical collision sweep therefore walks the whole
distance from its spawn position back to y=0, and the player snaps onto the
first platform it finds along that path rather than falling from the spawn point.

*Where:* `src/world/components.js` (`Position`), `src/systems/map-collisions.js`.

### 2. Stale `thing.x` during the tile scan

The collision probe samples `position.x` **once**, before scanning tiles. Any
horizontal correction applied mid-scan is invisible to the remaining tiles that
frame.

### 3. `thing.y` leaks out of the vertical sweep

After the inner interpolation loop, `thing.y` still holds the last interpolated
value. The horizontal tests for that tile then run against it — not against the
entity's actual y.

### 4. Landing cancels wall collision for the rest of the frame

Once `hitGround` or `topHit` is set, `continue` skips the horizontal tests for
**every remaining tile**. You cannot be pushed out of a wall on a frame you
landed.

### 5. The ground is not continuous

A player resting exactly on a platform has `thing.y + height === blockY`, which
fails the strict `>` test — so `grounded` is false. Gravity accumulates until
`round(y + vy)` gains a pixel, at which point the sweep catches the floor and
snaps back. The result is that `grounded` is true roughly every fourth frame, and
jump input only takes on those frames. This is why the original's jump feels
slightly "sticky".

### 6. `enragedSpeed` ignores enemy type

`EnemyBehavior` computes `enragedSpeed = this.speed * 2` in its constructor, from
the base `0.5`. Registry overrides assign `speed` *after* construction, so
`enragedSpeed` stays `1.0` for every enemy. Every enraged enemy — grunt, brute,
bat or stalker — moves at exactly 1.0 px/frame.

### 7. The high-score readout does not refresh mid-run

`crateCollisions` looked for a component name that never existed
(`has("samhighscore")` when the component is `highscore`), so the HUD's high
score only updates when the level is rebuilt. The stored value is correct
throughout; only the on-screen text is stale.

*Where:* `src/systems/crate-collisions.js`, with a comment saying so.

### 8. The animation guard is dead

`animation` tested `!entity.grounded` — a property that lives on
`entity.mapCollider`, not the entity — so it was always true. Animation is chosen
purely from vertical velocity. The dead guard is dropped rather than "fixed",
because reading the real flag would change which animation plays.

### 9. The weapon flicker

Turning around hides the weapon sprite for exactly one rendered frame
(`visible = false`, restored by a 0ms timer). It was a hack around a stale
transform. It is visible, so it is preserved.

### 10. `offsetX` is always zero

The map-collision `offsetX` term only applies to entities with a plain `sprite`,
and nothing with a map collider has one. Kept because deleting it would be a
silent behaviour change if a future entity ever did.

### 11. Enraged enemies re-enter inside a wall

The pipe re-entry point `(64, 7)` overlaps the solid tile at column 8, row 1. The
enemy spawns embedded and is pushed out by the next collision pass.

### 12. Enemy `Default` frames are unused

Several sheets carry a `Default` tag in `meta.frameTags`, but PIXI 6 only reads
the top-level `animations` block — which the author hand-wrote and which starts
at `Run`. So enemies animate from their run cycle, and `meta.frameTags` is dead
data throughout.

---

## Intentional deviations

Three things are *not* identical, all of them deliberate and none of them
gameplay.

### Text rendering

The original drew the HUD with `PIXI.Text` — an Arial glyph atlas rasterised at
320px and scaled down by 0.0625. This game blits a 4x8 bitmap atlas instead,
because the brief requires everything to live inside the pixel buffer with no
browser fonts.

Position, anchor, z-order and content are identical and *are* compared by the
differential tests; only glyph rasterisation and the `scale` field differ. The
snapshot adapter excludes `scaleX` for text nodes and says why.

### Lifecycle cleanup

Three leaks are fixed. None is observable during a live run — which is why the
differential suite still passes — and all are observable after teardown, which
`tests/lifecycle.test.js` checks:

1. **Sprites stayed on the shared ticker forever.** The original never detached
   them, so every dead enemy kept ticking for the life of the page.
   `AnimatedSprite.destroy()` now stops the player.
2. **Timers survived a restart.** `setTimeout` callbacks from a dead run kept
   firing into the next one. Timers are now owned by the world and cancelled on
   teardown.
3. **`removeComponent` threw on a missing component.** Now a no-op.

### Pausing

The original had no pause. This game pauses by freezing the `TimeSource`, which
suspends every gameplay stopwatch and every pending wall-clock callback together
— so nothing catches up in a burst on resume. With no pausing, behaviour is
identical.

---

## What the tests cannot pin

Honesty about coverage:

- **`COLLISION_MARGIN` between 2 and 4** is behaviourally inert during ordinary
  play, because the vertical sweep is 1px-granular and nothing moves more than
  1px horizontally per frame. It *is* pinned by the forced-state scenarios in
  `differential: collision edge cases`, which place a hitbox 4.5px inside a wall
  — a state normal play cannot reach.
- **Sub-frame ticker rebasing.** When the animation ticker's listener list goes
  empty and refills, real PIXI rebases its clock to the instant of the re-add.
  Under the fixed 60Hz test clock that is a no-op, so the suite cannot
  distinguish it. In a browser it is a sub-millisecond difference in animation
  phase.
- **Audio.** Sound calls are routed through a service and silenced in tests. The
  *call sites* match the original; the mixing does not affect gameplay.
- **Real-browser frame pacing.** Everything is verified at a fixed 60Hz. Variable
  refresh rates, background-tab throttling and vsync jitter are not simulated.
