# Cutscene System

A lightweight timeline runner can now play serialized `.cutscene` files on top of the existing scene stack. The goal is to make authored sequences data-driven so that future actions (dialog, camera moves, scripted fights, etc.) can be layered in without touching gameplay systems.

## File structure

Cutscene files live in `assets/cutscenes/` and are ordinary JSON objects saved with the `.cutscene` extension so the loader can distinguish them. A file exposes three optional keys:

| Key | Type | Description |
| --- | --- | --- |
| `name` | `string` | Friendly label, currently unused at runtime. |
| `blockGameplay` | `boolean` | If `true` (default) player inputs are suppressed while the scene continues simulating. Set to `false` to allow inputs during the sequence. |
| `requires` | `string[]` | Symbolic entity names that must be bound when the cutscene is started. A warning will log if any reference is missing. |
| `actions` | `object[]` | Ordered list of actions. Each action exposes a `type` (or `action`) field plus any data needed by that handler. |

Example: `assets/cutscenes/saloon.cutscene`.

```json
{
  "name": "Saloon - Wake Up",
  "blockGameplay": true,
  "requires": ["Player"],
  "actions": [
    { "type": "fade", "direction": "out", "duration": 30, "hold": 15 },
    {
      "type": "dialogue",
      "speaker": "Theo",
      "text": "Where am I...?",
      "hold": 120,
      "box": { "x": 10, "y": 130, "width": 180, "height": 40 }
    },
    {
      "type": "move",
      "entity": "Player",
      "relative": true,
      "path": [
        { "x": 0, "y": 0, "t": 0 },
        { "x": 40, "y": 40, "t": 30 },
        { "x": 80, "y": 20, "t": 60 }
      ]
    }
  ]
}
```

## Supported actions

- `wait`: pauses for `duration` (frames) before continuing.
- `fade`: animates a full-screen overlay. Supports `direction` (`in`/`out`), `from`, `to`, `duration`, `hold`, and `color`.
- `move`: animates an entity along a timed `path`. Each node needs `x`, `y`, and `t` (frame). Set `relative` to start from the entity's current position. Velocity is derived if the entity has a `Velocity` component.
- `setVelocity`: instantly updates an entity's velocity (`amount.x`, `amount.y`).
- `setAnimation`: targets an entity with an `AnimatedSprite` component, switches it to `animation` (or `anim`/`state`), and optionally tweaks playback: `speed`/`frameDelay` sets the raw frame delay, `fps` forces a frames-per-second target, `speedMultiplier`/`playbackRate` scales relative speed (>1 == faster), `pause`/`resume` toggles playback, `restart` rewinds, and `direction` can be `left`/`right`/`-1`/`1`.
- `addStunnedBirds`: spawns the Stunned Birds VFX on the referenced `entity` by calling `ECS.Helpers.addStunnedBirdsToEntity`. The helper automatically binds the sprite to the entity and registers it with the current scene.
- `shakeOnce`: fires the existing `shakeScreen` helper once using `amount` pixels.
- `dialogue`: Dispatches a `dialogue` event (`text`, `speaker`, `portrait`) and holds for `hold` frames **after** the line finishes animating in. Text now reveals character-by-character by default; tweak speed with `charsPerFrame` (float, default `1`), or disable animation with `typewriter: false` / `instantText: true`. Supports inline textbox styling via either a `box` object or legacy shortcut fields (`boxX`, `boxY`, `boxWidth`, `boxHeight`). Box properties include `x`, `y`, `width`, `height`, `padding`, `lineGap`, `background`, `borderColor`, `borderWidth`, `textColor`, `speakerColor`, `align`, and `highlight` (all optional). Defaults come from `CutscenePlayer` but can also be overridden globally through `scene.playCutscene(..., options)`.

Handlers live in `js/cutscene/cutscenePlayer.js`. Add new entries to `actionFactories` to expose more behaviors.

## Runtime API

```js
// Create from loaded data
const cutscene = Cutscene.fromKey('saloon', { Player: playerEntity }, {
  onDialogue: ({ text, speaker }) => DialogueUI.show(text, speaker),
  onComplete: () => console.log('Cutscene finished!')
});

// LevelScene helper (see js/scene.js)
this.playCutscene('saloon', { Player: this.player });
```

`Cutscene.Player` automatically tracks effects (e.g., fade overlay), exposes `isActive()`, `isFinished()`, and can be drawn via `player.draw(context)` after the render pass. `scene.playCutscene(...)` now injects the active scene into the cutscene options so any actions that need a scene reference (like `addStunnedBirds`) can register entities without extra plumbing.

## Scene integration

`LevelScene.update()` now checks for an active cutscene before running gameplay systems. Blocking cutscenes temporarily zero-out input so entities remain animated/physical but the player cannot interfere; non-blocking ones run alongside full gameplay. `draw()` overlays the fade effect after the ECS render and, when a dialogue action is active, uses the scene's bitmap text renderer to paint the configured textbox (falling back to canvas text if the font asset has not loaded yet).

To start a sequence from any scene, call `scene.playCutscene(keyOrScript, refs, options)` and pass any entity references the script expects.
