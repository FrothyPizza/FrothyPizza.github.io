# Boss encounters

**Status: implemented.** The Gatekeeper fights you in [The Gatehouse](../src/data/levels/gatehouse.js).
`tests/bosses.test.js` covers it (26 tests), and the classic arena is unaffected
— the differential suite is still 23/23.

This document is both the design and the guide to extending it.

---

## The problem a boss poses

The existing enemy model is deliberately thin: an enemy walks, turns at walls,
falls into the pit, comes back enraged, and dies. It has no state, no phases and
no relationship to the arena. A boss needs all three, plus something the base
game has none of: an **encounter lifecycle** — a beginning, a middle with
escalation, and an end the rest of the game reacts to.

And one hard constraint: it must be **invisible to the classic arena**. The
differential suite compares that arena frame-for-frame against the original, so
every piece of boss machinery is gated on data no arena entity carries.

---

## How it fits without disturbing anything

Four decisions carry all the weight:

**1. The system is appended, never inserted.** `bossSystem` runs *after*
`animation`, the only slot where the original eight systems observe exactly what
they observed before. Its first two lines are:

```js
const encounter = world.find('bossEncounter');
if (!encounter) return;
```

A level without a `boss` key never executes another line of it.

**2. Damage reuses the existing system in both directions.** The boss carries
`Health` and `PlayerDamager` like any enemy, so weapons hurt it and it hurts you
through `damageCollisions` — untouched. Hazards are just `Bounds` +
`PlayerDamager` with no sprite. There is no second damage path to keep in sync.

**3. Death is read, not duplicated.** When health runs out, `damageCollisions`
strips `playerDamager`. The encounter watches for that and transitions to
`DEFEATED`. It then zeroes the knockback velocity the damage system applied,
because a boss should collapse where it stood rather than be flung across the
arena.

**4. Boss randomness draws from a second stream.** `world.auxRandom` is
independent of `world.random`, which the seeded parity tests drive. Summoning an
enemy cannot shift what the classic arena rolls.

---

## The lifecycle

```
DORMANT ──trigger──▶ INTRO ──▶ ACTIVE ◀──▶ VULNERABLE ──▶ DEFEATED ──▶ CLEARED
                                 │              │
                                 └── PHASE_UP ──┘
```

| State | What happens | Exit |
| --- | --- | --- |
| `DORMANT` | Boss does not exist. Normal spawning continues. | trigger met (`{type:'time',ms}` or `{type:'score',value}`) |
| `INTRO` | Spawning suspended, existing enemies flushed, boss fades in over `introMs`. No hitbox, no contact damage. Player input stays live. | fade completes |
| `ACTIVE` | Pattern loop: cooldown → wind-up → active. Armoured: only the small core hitbox. | a pattern with `endsVulnerable`, or a phase threshold |
| `VULNERABLE` | Stunned for `vulnerableMs`. The **full body** becomes the hitbox. | timer expires, or a phase threshold |
| `PHASE_UP` | Invulnerable transition: `playerDamager` removed, tint shifts, animation speed scales, pattern set swaps. | `phaseUpMs` elapses |
| `DEFEATED` | Collapse animation for `defeatMs`. Hazards cleared, 250ms hitstop. | timer expires |
| `CLEARED` | Boss removed, HUD released, ordinary spawning resumed. | — |

All of it is wall-clock, like every other timer in the game.

### Armour instead of a damage multiplier

The original design called for a damage multiplier during `VULNERABLE`, which
would have meant touching `damageCollisions`. Instead the boss swaps **hitbox
size**: a 10x12 armoured core while attacking, the full 24x26 body while stunned.
Same effect on the fight, no change to the damage system, and it reads better —
you can see when the opening is.

---

## Telegraphs

A boss that hits without warning reads as unfair at 176x144, where the player is
6x8 pixels and the whole arena is one screen. Every attack gets a telegraph, and
the telegraph is a real entity rendered through the same path as everything else.

| Attack | Wind-up | Read |
| --- | --- | --- |
| `sweep` | 560 ms | A 2px cyan bar along the floor line. Jump it. Leaves the boss winded. |
| `slam` | 700 ms | A 3px amber marker on the ground where you were standing. Move. Leaves the boss winded. |
| `beam` | 900 ms | A 1px pink line at the height you were standing. Change altitude. Leaves the boss winded. |
| `summon` | 320 ms | No marker — it calls two ordinary enemies in through the pipes. |

Rules, enforced by tests:

- **Minimum 500 ms wind-up** for anything that damages
  (`no attack is faster than the 500ms telegraph floor`).
- **A telegraph and its hazard never share a frame.** The telegraph is destroyed
  in the same call that creates the hazard
  (`a telegraph and its hazard must never share a frame`).
- **A telegraph has no hitbox at all** — no `bounds`, no `playerDamager`.
- **The target is marked when the wind-up starts**, so you can always walk out of
  it. The warning is honest.
- **Every phase contains at least one pattern that leaves the boss winded**
  (`every phase has a window in which the boss can be hurt`). Without that a
  phase only ever exposes the armoured core and the fight stalls — which is
  exactly what the first version did.
- Colour is never the only cue; each telegraph also differs in shape and
  position.

---

## The arena is part of the encounter

The Gatehouse geometry is derived from the player's reach, not chosen by eye —
and getting it wrong is silent, because everything still "works", you just can't
land a hit.

Standing on the floor the player's box is y 112–120 and the sword sweeps
y 108–124. `colliding()` uses strict inequalities, so boxes that merely *touch*
do not register. The boss sits at y=92 so its body spans 93–119 and its core
100–112 — both genuinely overlap the sword arc, and the sprite's feet land on the
floor line at 120.

Horizontally the body spans x 76–100 and the sword reaches from `player.x+7` to
`player.x+30`, so the player can stand clear of the boss's own hitbox and still
land hits. The fight is about spacing.

Three things this got wrong before the winnability test caught them:

1. The boss floated above every reachable attack arc.
2. The player respawned directly inside its hitbox, dying instantly on every retry.
3. A platform overhung the one spot worth standing on, so you could not jump the
   floor sweep from there.

None of those would have been caught by testing the state machine alone.

---

## Adding a boss

**1. Art.** One sheet in `assets/images/enemies/`, with a top-level `animations`
block containing `Idle`, `WindUp`, `Attack`, `Hurt` and `Defeat`. The shipped
Gatekeeper is 192x140 — twenty 32x28 frames — which is the budget to aim at: no
new palette entries beyond the arena's purple/cyan and the enemy magenta.

**2. Register the sheet** in `src/core/assets.js`.

**3. Add the record** to `src/data/bosses.js`:

```js
warden: {
  id: 'warden', name: 'THE WARDEN', sheet: 'bossWarden',
  health: 12, contactDamage: 1, animationSpeed: 0.12,
  spawn: { x: 72, y: 92 }, floorY: 120,
  bounds:     { width: 24, height: 26, offsetX: 4,  offsetY: 1 },
  coreBounds: { width: 10, height: 12, offsetX: 11, offsetY: 8 },
  introMs: 1500, phaseUpMs: 700, vulnerableMs: 1100, defeatMs: 900,
  phases: [
    { at: 1.0, patterns: ['sweep', 'summon'], tint: 0xffffff },
    { at: 0.6, patterns: ['sweep', 'slam'],   tint: 0xffcccc, speedScale: 1.25 },
  ],
},
```

**4. Point a level at it**: `boss: { id: 'warden', trigger: { type: 'time', ms: 9000 } }`.

**5. Check the geometry against the player's reach.** Work out where the player
will stand, what the sword covers from there, and confirm the boxes overlap by
more than zero. Then run the winnability test.

**6. Test.** `node tests/run.js bosses` — the registry tests apply to every
registered boss automatically. Add a winnability case for the new one.

### Adding a pattern

Add a record to `PATTERNS` and a style to `TELEGRAPH_STYLE`. A pattern is
`{ telegraph, windUpMs, activeMs, cooldownMs, hazard, endsVulnerable, summons }`;
`hazard.anchor` is `'floor'` (the boss's floor line) or `'marked'` (where the
player was when the wind-up began). Keep `windUpMs >= 500`.

---

## Health of the encounter

| | |
| --- | --- |
| Boss tests | 26 |
| Differential parity tests | 23, unaffected |
| Systems changed | 0 — `bossSystem` is appended |
| Lines added to `damageCollisions` | 0 |
| Boss art | 192x140, 20 frames, one sheet |
| Perfect-play fight length | ~10 s |

---

## Still not implemented

- **Boss music or a defeat fanfare.** The encounter reuses the existing hit and
  powerup sounds.
- **A defeat reward.** Beating the Gatekeeper returns the arena to normal
  spawning; it does not end the level or grant anything.
- **Multiple bosses per level**, or a boss rush.
- **Boss-specific player feedback** — no damage numbers, no hit-spark, no
  screen shake beyond the existing hitstop.
- **Moving bosses.** The Gatekeeper holds station and turns to face you; it does
  not walk, leap or teleport. Movement would need the boss to carry a
  `MapCollider`, which is a deliberate omission today.
