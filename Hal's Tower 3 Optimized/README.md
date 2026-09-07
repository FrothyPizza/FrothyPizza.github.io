# Hal's Tower 3 Optimized

Open `index.html` through the same website as the original game. Both versions
use the existing `spawnX3`, `spawnY3`, `gravity3`, `deaths3`, `checkpoints3` and
`verson` localStorage keys. No migration is needed; checkpoints and deaths saved
in either version are available in the other in the same browser/site origin.
As before, the save records the checkpoint, not the player's current position.

The HTML base URL shares the original map, menu, stylesheet, images and music.
Only the gameplay script is forked. The original entry page adds an optional
redirect prompt; Cancel continues to the original game.

## Performance changes

- One animation-frame callback batches fixed 4 ms physics steps (250 UPS).
  The original used a 250 Hz interval with six passes per callback; five passes
  generally received almost no elapsed time. The small step retains the original
  effective integration interval and collision margins for fast projectiles.
- Collision rules, movement constants, camera smoothing, map, launcher behavior,
  and power-up durations are retained. Each batched step gets its own wall-clock
  timestamp so timer checks still progress between physics steps.
- Checkpoint saves write immediately when the spawn or gravity changes, instead
  of repeatedly writing identical values while touching the checkpoint.
- The canvas backing buffer is resized only when viewport dimensions change.
- Out-of-map projectiles are removed instead of indexing a missing map row.
- Hidden tabs stop physics; returning does not replay time spent away. Effects
  still expire in wall-clock time. Catch-up after a foreground stall is limited
  to 100 ms per frame to avoid an unbounded backlog. This deliberately changes
  background/stall handling, not active gameplay rules.

## Verification

Run from the repository root:

```sh
node "Hal's Tower 3 Optimized/test.cjs"
```

Tests compare a 5,000-step gameplay replay against the original at 4 ms, every
tile's collisions in both gravity directions with and without jumping, save
interchange, duplicate checkpoint writes, simulated 20–144 FPS, resize behavior,
background/stall handling and shared asset paths. These checks do not replace
playtesting on the affected school Chromebooks; no Chrome-update cause or actual
Chromebook speedup has been established.
