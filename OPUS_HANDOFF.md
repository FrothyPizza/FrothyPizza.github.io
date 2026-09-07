# Continue Samurai Slasher 2 — Opus handoff

You are taking over an unfinished refactor. Continue to completion; do not restart from scratch.

## User's request and hard constraints

Repo: C:\Users\froth\Documents\GitHub\FrothyPizza.github.io

The original Samurai Slasher is messy, poorly programmed, and has a bad ECS attempt. Fully refactor it into a maintainable Samurai Slasher 2 in a new directory and add its own entry to the Games page (games.html). Do not modify the original. Eliminate poor practices and global coupling; provide clear, genuinely extensible ownership/modules rather than just wrapping the old ECS. Add a minimal, polished, on-theme menu and level select. Support multiple levels and future enemies, weapons, bosses, and features. Add agentic coding documentation, extension recipes and ambitious future planning. Bosses are an extension/roadmap requirement, not necessarily a required implemented boss in this initial refactor.

- MUST preserve pixel-perfect and frame-perfect physics and handling. No delta-time physics, fixed-step accumulator, retuning or normalization. Preserve original gameplay, all original enemies and weapons, update order, rounding, collision quirks, attack/recovery timing and jump behavior. Clean lifecycle defects without changing live gameplay.
- EVERYTHING rendered by the game must fit its native 176x144 pixel buffer: menus, HUD, text, touch controls, effects, sprites. Use bitmap text, integer raster alignment, nearest-neighbor whole-number upscaling and letterboxing. Preserve fractional simulation positions where the original does. No high-resolution DOM text overlays or antialiased fonts.
- Reference Echoes/js/scene/scene.js and Echoes/assets/fonts/font4x8.png for bitmap text.
- NEVER read, checkout, diff, inspect or use the old local branch named samurai-slasher-2. It is stale. Also avoid .worktrees and any stale checkout. Only use original Samurai Slasher source as the reference.
- A fresh branch was required before work and is already created: codex/samurai-slasher-2-refactor. Stay on it; do not recreate it or discard untracked work.
- User explicitly required coding via Claude CLI using Opus 5 at high effort. Codex was only a delegator and browser/art tester. You are the Opus coding implementer. If another orchestrator is driving you, all code/test implementation must stay in Opus 5 high CLI sessions. Keep orchestration context efficient: brief milestones, inspect detailed output only for specific failures, do not flood context with full transcripts.

## Current state: stopped for clean handoff on 2026-09-07

The delegated Opus process was stopped intentionally for this handoff, not because it failed. Saved session ID:
0d7377c6-1b41-47a6-b57f-69bfe0cc6a72

Prefer resuming this session because it contains the extensive compatibility audit and implementation reasoning. An initial interactive session encountered connection-refused inside Codex's sandbox. Non-interactive execution outside that network restriction worked. --help confirmed --model, --effort and -p. Initial acceptEdits mode blocked some shell commands; restarting with explicit allowedTools fixed that.

Use from repository root:
claude --resume 0d7377c6-1b41-47a6-b57f-69bfe0cc6a72 --model claude-opus-5 --effort high --permission-mode acceptEdits --allowedTools "Read,Write,Edit,Glob,Grep,Bash,PowerShell"

Then ask it to read this handoff and continue. For non-interactive use, add -p "Read OPUS_HANDOFF.md and finish the implementation, verification and documentation. Preserve all constraints."

Existing root spec: SAMURAI_SLASHER_2_SPEC.md. Read it too. It contains the detailed delegated acceptance criteria.

At the handoff checkpoint:
- Original Samurai Slasher has no tracked changes. games.html is still unchanged.
- Samurai Slasher 2 is new/untracked and contains package.json, assets, src, tools.
- Initially its assets directory already existed but was empty. Preserve whatever is there now.
- Implemented files exist for core clocks/timers/RNG, PIXI-compatible ticker and animation, textures/assets, bitmap font, pixel display/renderer, input/audio/storage.
- There are world/entity/components modules, factories, weapon/enemy/button registries, level registry with classic-arena.js and pipeworks.js.
- Systems exist for collision/map collision, damage, crates, spawning, physics, player input, enemy behavior and animation. The latest milestone was implementing factories. Files may be incomplete; inspect before assuming they are finished.
- NO playable index.html existed at the last checkpoint. Menu/app wiring, full testing, documentation and Games integration still need completion.
- NO passing parity test results have been reported. Do not claim finished or verified.
- Root logs samurai-claude-session.jsonl and samurai-claude-implementation.jsonl hold full output. Do NOT load whole logs into context. The resumed session already has the audit. Read only targeted errors/tails if needed.
- tools/peek-pixi.js is temporary audit tooling; clean up temporary inspection files when appropriate. Keep session logs out of any eventual commit. Nothing has been committed or published.

## Compatibility findings to retain and verify

Original canvas 176x144, app.ticker.maxFPS = 63. Gameplay system order:
mapCollisions -> damageCollisions -> crateCollisions -> enemySpawner -> physics -> input -> enemyBehavior -> animation.

Physics samples rounded sprite coordinates before integrating position. It saves previous position, adds velocity, applies gravity and caps it, then rounds Y. Input runs after physics. Jump hold and some attack delays use wall-clock timers, while movement is per-frame. Collision scan order and strict inequalities matter. Do not simplify these based solely on aesthetics.

The audit found two PIXI tickers: app ticker for gameplay/rendering, shared ticker for AnimatedSprite. Hitstop stops app updates but animation continues. Original animation timing is elapsed-time based internally; preserving that existing behavior is distinct from introducing delta-time physics. Attack completion callbacks and bat frame-change impulses depend on it. The current ticker/animation modules aim to reproduce this; independently verify against bundled original PIXI, including listener mutation order.

## Work remaining and acceptance criteria

1. Finish a clean, coherent modular implementation, preserving all original content and exact classic-arena behavior. Review whether current entity/components design truly fixes the old architectural problems instead of renaming them.
2. Complete playable browser entry, on-theme pixel menus, level select, at least two playable levels, pause/resume/retry/back flow, touch controls, robust loading and timer/listener cleanup. Keep level art aligned with collision maps.
3. Add meaningful automated differential tests using original source as a VM oracle with matching seeded randomness, fake clock, frame schedule and input sequences. Cover movement, jumps, walls/ceilings/grounding, all weapons and recovery/projectiles, enemies/bat animation, crates, death/reset, stale callbacks and rendered positions. Also test level/menu/scaling/lifecycle behavior. Do not substitute constant comparisons for parity tests. Execute tests and fix failures; accurately document remaining limits.
4. Perform browser testing: load original and sequel, inspect native-pixel rendering and integer scaling at desktop and narrow/mobile sizes, exercise menus and both levels, movement/jump/attack, pause/retry, console errors and missing assets. The original was visually inspected at localhost and had no captured console errors; the sequel has NOT been browser-tested.
5. Add AGENTS.md and CLAUDE.md plus README and architecture/compatibility/extension/testing docs. Explain how agents add enemies, weapons, levels and bosses safely. Include phased ambitious roadmap with boss encounters, telegraphs, lifecycle, art budgets, regression strategy and acceptance criteria. Clearly distinguish actual features from planned ones.
6. Add Games entry without changing/removing original entry. Check final diff and confirm original untouched. Remove/archive temporary orchestration artifacts appropriately. Do not commit or publish without a subsequent request.

## Local testing environment

Node is available on PATH (v22.16.0). Python is not on PATH, but bundled executable is:
C:\Users\froth\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe

Codex started a local repo-root server at http://127.0.0.1:8765 using:
& 'C:/Users/froth/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe' -m http.server 8765 --bind 127.0.0.1

It may still be running; check before starting another. Original URL: http://127.0.0.1:8765/Samurai%20Slasher/index.html. Sequel URL after entry exists: http://127.0.0.1:8765/Samurai%20Slasher%202/index.html.

The user is running low on Codex usage. Continue directly in Opus, keep progress compact, and finish the authorized work instead of asking them to re-explain the project.
