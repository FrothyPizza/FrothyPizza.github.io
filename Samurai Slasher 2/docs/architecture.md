# Architecture

## What was wrong with the original

The original is not badly *designed* so much as un-designed. Concretely:

- **Everything is ambient.** `ECS`, `app`, `gameScene`, `Globals`, `sounds`,
  `WEAPONS`, `isMobile`, `Inputs`, `localStorage` are all module-level globals
  that systems reach for directly. Nothing can be instantiated twice, which is
  why there is one level and no menu.
- **The ECS is a naming convention.** `addComponent` keys off
  `component.constructor.name`, so every component is coupled to its class name
  and to minification.
- **Content is code.** Enemies and weapons are `if` ladders in `Blueprints.js`.
  The map is a string array in `globals.js`. Adding either means editing a
  factory.
- **Lifetimes are implicit.** `setTimeout` callbacks and `AnimatedSprite`
  ticker registrations outlive the entities they belong to.
- **Rendering leaks into simulation.** Systems read and write `PIXI.Sprite`
  fields directly, so nothing runs headlessly and nothing is testable.

This rebuild addresses each of those without touching the arithmetic that makes
the game feel the way it does. See [compatibility.md](compatibility.md) for the
parts that were deliberately left alone.

---

## The shape

```
                      ┌──────────────────────────────────────┐
   requestAnimationFrame │              Game                 │
                      │  scenes · stage · hitstop · services  │
                      └───────────────┬──────────────────────┘
                                      │
                  ┌───────────────────┼───────────────────┐
                  │                   │                   │
            TitleScene         LevelSelectScene       PlayScene
                                                          │
                                                    ┌─────┴──────┐
                                                    │   World    │
                                                    └─────┬──────┘
                       entities · display list · timers · rng · audio ·
                       storage · assets · level definition · screen
                                                          │
                            runSystems(world) ── 8 systems in order, + bossSystem
```

### `src/core/` — the engine

No knowledge of Samurai Slasher. Could host a different game.

| Module | Owns |
| --- | --- |
| `vec2.js` | The original's `Vec2`, arithmetic-identical. |
| `rng.js` | Seedable PRNG. Randomness is a service, never a global. |
| `clock.js` | `TimeSource` (pausable wall clock) and `Stopwatch` (the original's `Clock`). |
| `timers.js` | Owned `setTimeout` replacement with wall-clock semantics. |
| `ticker.js` | PIXI 6.2.2's `Ticker`, ported; plus `FrameDriver`, which owns both tickers. |
| `animated-sprite.js` | PIXI's `AnimatedSprite` frame timing, ported. |
| `display.js` | Retained scene graph: sprites, animated sprites, text, rects, containers. Pure data. |
| `textures.js` | Texture + spritesheet parsing, matching what PIXI 6 produced from these files. |
| `bitmap-font.js` | The 4x8 atlas from Echoes, with a corrected glyph table. |
| `renderer.js` | Canvas2D → 176x144 buffer → integer-scaled blit with letterboxing. |
| `input.js` | Keyboard/touch → four gameplay booleans + edge-triggered menu actions. |
| `assets.js` | Manifest and fault-tolerant loading. |
| `audio.js`, `storage.js` | Services, with silent/in-memory implementations for tests. |

The display list holding **no canvas state** is what makes the whole simulation —
including render ordering and sprite placement — runnable and assertable in Node.

### `src/world/` — the ownership boundary

`World` is the object the original's globals collapse into. It owns the entity
registry, the display container those entities draw into, the timer service their
callbacks are scheduled on, the RNG they draw from, the audio sink, the score
book, the level definition and the screen metrics.

Two levels can exist at once. A world can be built, run and destroyed without
touching a global. That single change is what makes menus, level select, retry
and headless tests possible.

`World.each(...names)` snapshots the id list before iterating and skips entities
deleted mid-loop — precisely the `for...in` semantics the original systems were
written against. That is not incidental fidelity; several systems mutate the
registry while iterating it.

### `src/systems/` — gameplay

Eight pure functions of `(world)`, run in the original's order by
`SYSTEM_PIPELINE`. Each is a transcription of its counterpart with the globals
replaced by `world.*` and the quirks annotated in place.

`bossSystem` is appended after them — the only slot where the original eight
still observe exactly what they observed before. It returns on its first line
unless the level declares a boss, so the classic arena never enters it. See
[bosses.md](bosses.md).

### `src/data/` — content

Weapons, enemies, bosses, touch buttons and levels are plain objects. No
behaviour.
`WEAPON_BAG` is derived from the weapon weights in declaration order, so a seeded
RNG picks what the original picked.

### `src/factories/` — data → entities

One factory per entity kind, each reading a registry record. No per-type `if`
ladders. Component *order* is preserved from the original blueprints because the
RNG stream and several derived offsets depend on it.

### `src/game/` — the shell

Scenes, menus, the level runtime (`createLevelWorld`, the sequel's `restart()`)
and `tile-art.js`.

`createLevelWorld` is the only place a level's entities are assembled — the play
scene, the retry path and the headless differential harness all call it. What the
tests verify is what ships.

---

## The frame

```
requestAnimationFrame(now)
└─ FrameDriver.frame(now)
   ├─ onBeforeFrame          wall-clock timers (run even during hitstop)
   ├─ application ticker     [capped at 63fps; stopped by hitstop]
   │  ├─ NORMAL  Game.tick   → scene.update() → runSystems(world)
   │  └─ LOW     Game.render → Renderer.render(stage)
   └─ animation ticker       [uncapped; never stopped]
      └─ HIGH    every playing AnimatedSprite advances one step
```

Three things about this are deliberate and load-bearing:

1. **Timers run before tickers**, matching the browser task queue. A 0ms timer
   scheduled during frame N fires at the start of frame N+1 — which is exactly
   the window the weapon-flicker hack relies on.
2. **Render is a LOW-priority listener on the gameplay ticker**, so hitstop
   freezes the picture as well as the simulation.
3. **Animation is on the other ticker**, so it does not.

## Rendering

One canvas, sized to the viewport in device pixels. Everything is drawn into a
176x144 backing buffer, then blitted:

```
scale   = max(1, floor(min(deviceWidth / 176, deviceHeight / 144)))
offsetX = floor((deviceWidth  - 176 * scale) / 2)
offsetY = floor((deviceHeight - 144 * scale) / 2)
```

Whole-number scale, integer offsets, `imageSmoothingEnabled = false`. Letterbox
bars are painted by the renderer inside the canvas rather than by CSS, so the
bars and the game share one pixel grid.

Draw order is the display list sorted by `zIndex`, ties in insertion order — a
stable sort over the current array, which is what PIXI's `_lastSortedIndex`
scheme amounts to. In practice: HUD text (-2), crate (-1), actors (0), **map art
(100)**, touch buttons (10000), pause overlay (20000). The map art drawing *over*
the actors is the original's arrangement, and the pipe art is transparent where
it needs to be.

Tints are PIXI multiplies, reproduced on cached offscreen canvases (there are
only two in the game: the hurt flash and the enraged red).

## Where the seams are

If you want to extend this, these are the places designed to be extended:

| Want to add | Touch |
| --- | --- |
| a weapon | `src/data/weapons.js` + a sheet in `src/core/assets.js` |
| an enemy | `src/data/enemies.js` + a sheet |
| a level | `src/data/levels/` + one line in its `index.js` |
| a boss | `src/data/bosses.js` + a sheet — see [bosses.md](bosses.md) |
| a system | `src/systems/index.js` — but read [compatibility.md](compatibility.md) first |
| a scene | `src/game/scenes/` + a transition on `Game` |

See [extending.md](extending.md) for the actual recipes.
