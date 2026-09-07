# Samurai Slasher 2 implementation delegation

Use Claude Opus 5 with high effort. You are the sole coding implementer; Codex delegates and performs visual/browser testing.

## Scope
Already on codex/samurai-slasher-2-refactor. NEVER read, checkout, diff or otherwise inspect the stale local samurai-slasher-2 branch or .worktrees. Original Samurai Slasher is strictly read-only. Build in Samurai Slasher 2; its existing assets directory is empty but preserve any existing files. Add sequel entry in games.html. Do not commit, publish, install dependencies or modify unrelated files.

## Requirements
Deeply audit original source first. Full maintainable refactor, not a wrapper around copied ECS. Vanilla JS modules with explicit world ownership, cohesive systems and data-driven factories/registries. Preserve all original enemies, weapons, drops and mechanics. All six weapons, all enemy types. Inspect Echoes/js/scene/scene.js bitmap text and its font image for reuse.

EXACT gameplay compatibility: native canvas 176x144, ticker maxFPS 63, map collision -> damage collision -> crate collision -> spawn -> physics -> input -> enemy behavior -> animation order. NO delta time, accumulator, retuning or normalization. Preserve per-frame rounding, original collision quirks, render position sampling order, jump hold, attack recovery, actual PIXI animation timing semantics, wall-clock timers for spawning/hitstop/damage delays. Lifecycle bugs can be fixed without changing live gameplay. Characterize before changing.

Everything visible must render within a native 176x144 pixel buffer: HUD, menus, text, touch buttons, effects. Integer nearest-neighbor upscale with letterboxing, integer raster alignment, no browser-font/DOM overlay text. Keep fractional simulation coordinates where original does; round only as original render does. Minimal beautiful on-theme title menu, level select, pause/resume/retry/back, resilient asset loading. Include classic original arena and at least one second playable data-driven level proving extension; collision and art must align. Keep original visual assets locally copied so sequel stands alone.

## Architecture and documentation
Add AGENTS.md, CLAUDE.md, README.md and docs for architecture, exact compatibility contract, adding enemies/weapons/levels/bosses, commands, agent workflow and ambitious future roadmap. Actual extensibility without huge speculative abstractions. Boss extension plan with phased implementation, encounter lifecycle, telegraphs, tests and art budgets. Document known compatibility quirks explicitly.

## Verification
Write meaningful Node tests including original-source VM differential harness with seeded randomness, fake matching clock and input sequences vs new runtime: movement, held/tapped jumping, ceilings/walls/grounding, all six attacks/projectiles/recovery, enemy behavior/damage, crates, reset and stale timer safety, rendering positions/order. Do not claim exact parity merely because constants match. Use original as oracle; do not rewrite an expected copy of new algorithm. Test menu transitions/level registry/scaling and timer cleanup. Run tests and fix failures. Supply a simple local HTTP serving command/script for Codex to run visual tests. No browser testing necessary from you: Codex owns that.

Begin with compatibility audit, implement fully, validate and fix, report progress and finish with exact changes, test commands/results and honest limitations. You are authorized to write the new game, docs, tests, games.html and optional sequel icon and run local tests. No need to stop at a plan.
