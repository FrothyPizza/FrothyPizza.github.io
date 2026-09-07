# Extending the game

Four recipes. Each one is a data edit plus an asset; none requires touching a
system or a factory.

Before you start: `node tests/run.js` should be green. If it is not, fix that
first — you will not be able to tell your change from someone else's.

---

## Add a weapon

**1. Art.** Drop a sheet into `assets/images/weapons/`. It needs a PNG and a JSON
with a **top-level `animations`** block containing at least `Idle` and `Attack`:

```json
{
  "frames": { "0": { "frame": { "x": 0, "y": 0, "w": 28, "h": 16 } }, "…": {} },
  "animations": { "Idle": ["0", "1", "2"], "Attack": ["3", "4", "5"] },
  "meta": { "image": "naginata.png", "size": { "w": 168, "h": 16 } }
}
```

> `meta.frameTags` is ignored — PIXI 6 only ever read the top-level
> `animations` map, and this game matches it. If you export from Aseprite, add
> the `animations` block by hand as the original's author did.

**2. Register the sheet** in `src/core/assets.js`:

```js
export const SHEET_MANIFEST = {
  …,
  naginata: 'assets/images/weapons/naginata.json',
};
```

**3. Register the weapon** in `src/data/weapons.js`:

```js
naginata: {
  id: 'naginata',
  label: 'NAGINATA',
  weight: 3,                        // slots in the random drop bag
  sheet: 'naginata',
  damage: 2,
  bounds: { width: 30, height: 8, offsetX: 4, offsetYCentered: true },
  sprite: { offsetYFromHeight: true },
},
```

Field reference:

| Field | Meaning |
| --- | --- |
| `weight` | How many slots it takes in `WEAPON_BAG`. Higher = more common. |
| `damage` | Subtracted from enemy health per hit. |
| `bounds` | Hitbox. `offsetYCentered` sets `offset.y = -height / 2`. |
| `sprite.offsetYFromHeight` | `offset.y = spriteHeight / 2 + 4` — how melee weapons hang off the player. |
| `throwable` | `{ attackDelay }` in **frames**. Makes it fire projectiles instead of swinging. |
| `projectile` | `'shuriken'` or `'cannonball'`. |
| `drill` | `true` for continuous damage + the pogo bounce. |
| `damager` | Overrides `framesEnabled` / `damageDelay` / `enabled`. |

**4. Test.**

```bash
node tests/run.js levels        # asserts the registry shape and the drop bag
node tests/run.js differential  # asserts you did not disturb the existing six
```

Then add a parity scenario for it in `tests/differential.test.js` — copy the
weapon loop and add your id. The oracle cannot know about a new weapon, so a
scenario that equips it will fail; instead exercise it in a **non-differential**
test (see `tests/lifecycle.test.js` for the pattern of driving a world directly).

> **The drop bag is part of the compatibility contract.** Adding a weapon changes
> `WEAPON_BAG.length`, which changes what a seeded run draws. The parity tests
> pin the original six at their original weights
> (`tests/levels.test.js → 'the drop bag reproduces the original weights'`), so
> you must either update that test deliberately or gate new weapons behind a
> per-level opt-in. Do the latter if you care about parity.

---

## Add an enemy

**1. Art** in `assets/images/enemies/`, same JSON rules. The **first** animation
in the `animations` block is the one it plays and the one its centring offset is
computed from.

**2. Register the sheet** in `src/core/assets.js`.

**3. Append** to `src/data/enemies.js`:

```js
{
  id: 'wraith',
  label: 'WRAITH',
  sheet: 'wraith',
  animationSpeed: 0.08,
  health: 3,
  bounds: { width: 10, height: 10, offsetX: 1 },
  sprite: { offsetX: -2 },
  flying: true,          // adds FlyingEnemy: animation-driven upward pulses
  gravityY: 0.06,
  speed: 0.4,
},
```

**Append — do not insert.** The array index *is* the spawn "type" the spawner
rolls, and `tests/levels.test.js` pins the first four in order.

**4. Make it spawnable.** The spawner currently rolls types 0–3 via
`TYPE_ROLL` in `src/data/enemies.js`. To include a fifth you must widen that
roll, which changes the RNG stream and therefore breaks parity on the classic
arena. The safe pattern is a per-level roster:

```js
// in a level definition
spawner: { …, roster: [0, 1, 4] },
```

and have `enemySpawner` consult `level.spawner.roster` when present. Leave it
absent on `classic-arena` and parity is preserved.

> Inherited quirk worth knowing: `enragedSpeed` is fixed at 1.0 for every enemy,
> because it is computed from the base speed before your `speed` override is
> applied. See [compatibility.md](compatibility.md#6-enragedspeed-ignores-enemy-type).

---

## Add a level

**1. Write the definition** in `src/data/levels/`:

```js
export const foundry = {
  id: 'foundry',
  name: 'THE FOUNDRY',
  blurb: 'NO FLOOR, NO MERCY',
  order: 2,

  tileSize: 8,
  map: [ /* 22 rows of 22 chars */ ],

  background: { type: 'tiles', source: 'arena', zIndex: 100 },
  playerSpawn: { x: 86, y: 66 },
  spawner: { x: 88, y: -4, delay: 1500, mobileDelay: 1900, minDelay: 600,
             decayPerSpawn: 6, burstChance: 0.88, burstDelay: 360,
             burstDuration: 1000, bigEnemyChance: 0.55 },
  pipeSpawns: [{ x: 64, y: 7 }, { x: 108, y: 7 }],
  hud: { score: { x: 88, y: 44, scale: 2 }, highScore: { x: 88, y: 60, scale: 1 } },
  ceiling: -6,
};
```

**Map legend** (unchanged from the original):

| | |
| --- | --- |
| `#` | solid for everyone |
| `_` | solid for the player only — enemies fall through |
| `S` | crate spawn point (not solid) |
| ` ` | empty |

Constraints, all enforced by `tests/levels.test.js`:

- Every row the same length; at most 22x18 tiles (176x144 px).
- At least one `S`, each with a solid tile directly beneath it.
- `pipeSpawns` on-screen; HUD readouts inside the buffer.

**2. Register it** in `src/data/levels/index.js`:

```js
import { foundry } from './foundry.js';
const LEVELS = [classicArena, pipeworks, foundry].sort((a, b) => a.order - b.order);
```

That is the whole wiring. The level select reads the registry, so the new arena
appears with its name, blurb and best score automatically.

**3. Art.** Two options.

*Derived (recommended).* `background: { type: 'tiles', source: 'arena' }` cuts 8x8
pieces out of the original arena background and re-tiles them by 4-neighbour
pattern. Because the lookup key **is** the collision pattern, art and collision
cannot drift apart. Patterns not present in the reference map fall back to the
nearest by Hamming distance; `tests/levels.test.js` fails if more than 10% of
your tiles need that fallback, which is the signal to hand-draw instead.

*Authored.* `background: { type: 'image', key: 'foundryBg' }`, with a 176x*n* PNG
in the image manifest. You are then responsible for alignment — draw it on an 8px
grid against your map.

**4. Test.**

```bash
node tests/run.js levels
node tests/run.js lifecycle   # 'a second level runs on the same machinery'
```

Add your level to the lifecycle smoke test. Do **not** add it to the differential
suite: the oracle only knows the classic arena.

---

## Add a boss

Bosses have their own registry and their own appended system, so they never
touch the eight gameplay systems. The full recipe — registry fields, pattern
definitions, telegraph rules and the geometry check that stops you shipping an
unhittable boss — is in [bosses.md](bosses.md#adding-a-boss).

The short version: a sheet with `Idle`/`WindUp`/`Attack`/`Hurt`/`Defeat`, a
record in `src/data/bosses.js`, and `boss: { id, trigger }` on a level. Levels
without that key are completely unaffected.

---

## Add a system

Read [compatibility.md](compatibility.md) first, then think twice.

The eight-system order is the contract. If you need new behaviour:

- **Prefer a component + an existing system.** Most additions fit inside
  `enemyBehavior`.
- **If you must add a system, append it after `animation`.** Anything earlier
  changes what the existing systems observe, and every parity test will fail.
- **Gate it on a component no classic-arena entity has**, so the arena's frame is
  byte-identical.

Then run `node tests/run.js differential`. All 23 must stay green.

---

## Add a scene

1. Subclass `Scene` in `src/game/scenes/`. Implement `enter()`, `exit()`,
   `update()`, and `pumpTimers()` if you own timers.
2. Build display nodes in `enter()`; release them in `exit()`. `exit()` is
   guaranteed to run.
3. Add a transition method to `Game` (`showX()`), following `showTitle()`.
4. Everything you draw must fit 176x144 and use the bitmap font.
   `tests/menu.test.js → 'no menu node is positioned outside 176x144'` checks it
   for every scene the shell can reach.
