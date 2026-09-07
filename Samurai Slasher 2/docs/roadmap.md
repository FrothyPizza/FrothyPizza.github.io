# Roadmap

**Everything here is a plan except item 5, which shipped.** It is ordered by how
much each item is worth relative to what it costs, and written so that any single
entry could be picked up on its own.

The constraint that governs all of it: **the classic arena must stay
byte-identical to the original.** Every feature below is either gated on level
data the arena does not carry, or lives entirely outside the simulation.

---

## Near term — things the architecture is already waiting for

### 1. Per-level enemy rosters
The spawner currently rolls a fixed 0–3. A `spawner.roster` array on the level
would let new arenas use new enemies without touching the arena's RNG stream.
Small, unblocks everything in "content".
*Cost: an afternoon. Risk: low — additive, gated on level data.*

### 2. A forkable RNG
`world.random.fork()` returning an independent stream. Needed before any feature
that draws randomness in a new place, because the parity tests depend on the
main stream's call order. This is the prerequisite for bosses, weather, and
procedural levels.
*Cost: an afternoon. Risk: low.*

### 3. Options: audio toggle, and a "classic pacing" switch
Volume and mute, stored per-device. Plus a switch that swaps the sequel's
slightly-tuned `pipeworks` spawner for the arena's original cadence, for players
who want the original's exact difficulty everywhere.
*Cost: a day. Risk: none — shell only.*

### 4. A run summary
The original snapped straight back into a new run 1600 ms after death. Keep that
as the default, but show the score, the best, and "NEW BEST" on the death frames
— drawn into the buffer, no extra input required.
*Cost: a day. Risk: low, but it touches the death path, so parity tests are the
gate.*

---

## Medium term — new play

### 5. ~~Bosses~~ — done
The Gatekeeper fights you in The Gatehouse. See [bosses.md](bosses.md) for the
lifecycle, telegraph rules and how to add another. Still open from that plan:
boss music, a defeat reward, moving bosses, and boss-specific hit feedback.

### 6. Weapon behaviours beyond the six
The registry already supports throwables, projectiles and the drill's pogo. The
obvious next axes: a **chargeable** weapon (hold attack, release for a bigger
hitbox), a **multi-hit** weapon (several `framesEnabled` windows in one
animation), and a **shield** (a weapon that blocks instead of damaging).

Each needs one new optional field and one branch in `playerInput`. Gate new
weapons out of the arena's drop bag with a per-level `weaponBag` override, or the
seeded parity tests break.
*Cost: 1–2 days each. Risk: medium — `playerInput` is on the hot path.*

### 7. Arena mutators
Modifiers a level can declare: crumbling platforms (`_` tiles that vanish after
N steps), a rising floor, wind. Each is a component plus a branch in an existing
system, gated on level data.
*Cost: 2–3 days for the first, less after. Risk: medium — they touch collision.*

### 8. More arenas
The derived tile-art pipeline means a new arena is a 22x18 character grid and a
registry line. The bottleneck is design, not code: five to eight hand-designed
arenas with distinct movement problems (verticality, tight corridors, a single
long floor) would triple the game's content for very little engineering.
*Cost: an evening each. Risk: none.*

---

## Longer term — bigger swings

### 9. A run structure
Arenas chained into a run: three arenas, escalating spawn cadence, a boss at the
end, one weapon choice between stages. Turns a score-attack game into something
with a shape, without changing what happens second to second.

Needs: a run controller above `PlayScene`, persistence of run state, and a
between-stage scene. All shell work — the simulation is untouched.
*Cost: a week. Risk: low technically, high in design.*

### 10. Replays and ghosts
The simulation is already deterministic given (seed, input sequence) — that is
exactly what the differential harness exploits. Recording inputs makes replays
nearly free:

- **Replays.** Store seed + per-frame input bitmask. A 3-minute run is ~11 KB
  before compression.
- **Ghosts.** Replay a best run alongside the live one, tinted and at 50% alpha.
- **Verified scores.** A leaderboard entry that can be re-simulated server-side.

The blocker is that `Math.random` is only injected in tests; the live game passes
the platform generator. Seeding the live game is a two-line change and would make
every run reproducible.
*Cost: 3–4 days for replays, a week with ghosts. Risk: low — it rides on
machinery that already exists and is already tested.*

### 11. A level editor
The map is a character grid and the art is derived from it. An in-browser editor
that paints tiles, previews collision, and exports a level definition is
plausible in a few days. It would make arena design a thing the author can do in
a browser instead of by counting characters.
*Cost: a week. Risk: low — a separate page, no coupling to the game.*

### 12. Netplay-shaped multiplayer
Deterministic lockstep is a real option for a game with this simulation model: no
delta time, fixed order, one RNG stream. Two players, rollback-free lockstep,
input delay of 2–3 frames.

This is honestly a large project — matchmaking, transport, desync detection — and
it is listed because the *simulation* is unusually well suited to it, not because
it is close.
*Cost: weeks. Risk: high.*

---

## Explicitly not planned

- **Delta-time / framerate-independent physics.** It would break the game's feel
  and every parity guarantee. See [compatibility.md](compatibility.md).
- **A rendering engine dependency.** The renderer is ~250 lines of Canvas2D and
  does exactly what this game needs. PIXI was a liability here, not an asset.
- **Higher resolution.** 176x144 is the game.
- **Changing the classic arena.** It is the reference. New ideas go in new
  arenas.

---

## Health of the thing

Worth tracking as features land:

| | Now |
| --- | --- |
| Differential parity tests | 23, all green |
| Total tests | 124 |
| Playable arenas | 3 |
| Boss encounters | 1 |
| Runtime dependencies | 0 |
| Dev dependencies | 0 |
| Suite runtime | ~6 s |
| Source files | 46 modules |

If parity tests ever start being edited to accommodate a feature rather than to
record a deliberate decision, that is the signal the project has drifted.
