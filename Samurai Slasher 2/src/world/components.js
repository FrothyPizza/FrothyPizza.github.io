import { Vec2, vec2From } from '../core/vec2.js';
import { AnimatedSpriteNode, RectNode, SpriteNode, TextNode } from '../core/display.js';
import { Stopwatch } from '../core/clock.js';

/**
 * Components are plain data. Every value, default and quirk here is carried
 * over from `Samurai Slasher/js/Components.js`; changing any number changes
 * gameplay, so treat this file as part of the compatibility contract.
 */

/** Shared base for the original's `Vectory`: a Vec2 with x/y passthroughs. */
class VectorComponent {
	constructor(x, y) {
		this.vec = vec2From(x, y);
	}

	get x() {
		return this.vec.x;
	}

	set x(value) {
		this.vec.x = value;
	}

	get y() {
		return this.vec.y;
	}

	set y(value) {
		this.vec.y = value;
	}
}

export class Position extends VectorComponent {
	constructor(x, y) {
		super(x, y);
		// NOTE: `last` snapshots the *construction* position. Blueprints that
		// assign `position.vec` afterwards leave `last` at (0,0), which the
		// map-collision sweep depends on for the first frame. See
		// docs/compatibility.md ("first-frame sweep").
		this.last = this.vec.copy();
	}
}

export class Velocity extends VectorComponent {}

export class Health {
	constructor(value) {
		this.value = value || 2;
	}
}

export class Gravity {
	static defaultGravity = 0.15;
	static maxGravity = 4;

	constructor(gravity) {
		if (!gravity) this.vec = new Vec2(0, Gravity.defaultGravity);
		else if (gravity instanceof Vec2) this.vec = gravity.copy();
		else this.vec = new Vec2(0, gravity);
		this.maxGravity = Gravity.maxGravity;
	}

	get x() {
		return this.vec.x;
	}

	set x(value) {
		this.vec.x = value;
	}

	get y() {
		return this.vec.y;
	}

	set y(value) {
		this.vec.y = value;
	}
}

/** Static image attached to the scene. */
export class Sprite {
	constructor(texture, scene, centered = false) {
		this.node = new SpriteNode(texture);
		this.scene = scene;
		scene.addChild(this.node);
		this.offset = new Vec2(0, 0);
		if (centered) this.node.anchorX = 0.5;
		this.centered = centered;
	}

	destroy() {
		this.scene.removeChild(this.node);
	}
}

/**
 * Animated image. Timing is PIXI's (see core/animated-sprite.js); the centring
 * offset is computed from frame 0 of the sheet's *first* animation, exactly as
 * the original did.
 */
export class AnimatedSprite {
	constructor(sheet, scene, animationTicker, centered = false) {
		this.sheet = sheet;
		const firstName = sheet.firstAnimationName;
		this.node = new AnimatedSpriteNode(sheet.animations[firstName], animationTicker);
		this.currentAnimation = firstName;
		this.node.animationSpeed = 0.1;

		this.scene = scene;
		scene.addChild(this.node);
		this.node.play();

		this.offset = new Vec2(0, 0);

		if (centered) {
			this.node.anchorX = 0.5;
			this.offset.x = -this.node.width / 2;
		}
		this.centered = centered;
	}

	destroy() {
		this.scene.removeChild(this.node);
		// The original left every AnimatedSprite attached to PIXI's shared
		// ticker forever. Detaching is a leak fix; nothing reads a destroyed
		// sprite, so live gameplay is unaffected.
		this.node.stop();
	}

	setAnimation(name) {
		if (this.currentAnimation === name) return;
		if (!this.sheet.animations[name]) return;
		this.node.stop();
		this.node.setTextures(this.sheet.animations[name]);
		this.node.play();
		this.currentAnimation = name;
	}
}

/**
 * Bitmap text. The original used `PIXI.Text` with a browser font scaled down;
 * the sequel renders the 4x8 atlas instead so nothing escapes the pixel buffer.
 * Placement semantics (centre anchored, unrounded position, zIndex) are kept.
 */
export class Text {
	constructor(value, scene, { scale = 1, color = '#ffffff', zIndex = -2 } = {}) {
		this.node = new TextNode(String(value));
		this.node.scale = scale;
		this.node.color = color;
		this.node.zIndex = zIndex;
		this.scene = scene;
		scene.addChild(this.node);
	}

	get value() {
		return this.node.text;
	}

	set value(next) {
		this.node.text = String(next);
	}

	destroy() {
		this.scene.removeChild(this.node);
	}
}

/** Markers used by the HUD systems to find their text entities. */
export class Score {}
export class HighScore {}

export class PlayerController {
	constructor(time, enabled = true) {
		this.enabled = enabled;

		this.speed = 1;
		this.score = 0;

		this.jumpSpeed = 2.5;
		this.jumpReleaseMultiplier = 0.7;
		this.maxJumpHoldTime = 170;
		this.jumpHoldTimer = new Stopwatch(time);
		this.jumpHoldTimer.add(this.maxJumpHoldTime + 1000);
		this.hasCutJumpVelocity = false;
	}
}

export class MapCollider {
	constructor(enabled = true) {
		this.enabled = enabled;
		this.grounded = false;
		this.rightColliding = false;
		this.leftColliding = false;
		this.topColliding = false;
	}
}

export class TileCollisionMask {
	constructor(collisionMask, tileSize) {
		this.collisionMask = collisionMask;
		this.tileSize = tileSize || 8;
	}
}

/** Collision box. `x` goes negative when a weapon is flipped left. */
export class Bounds extends VectorComponent {
	constructor(width, height) {
		super(width, height);
		this.offset = new Vec2(0, 0);
	}
}

/** The entity (a weapon) carried by this entity (the player). */
export class BoundEntity {
	constructor(entityID, offsetX, offsetY) {
		this.id = entityID;
		this.offset = vec2From(offsetX, offsetY);
	}
}

export class EnemySpawner {
	constructor(spawnDelay, time) {
		this.spawnDelay = spawnDelay;
		this.tempSpawnDelay = spawnDelay;
		this.spawnTimer = new Stopwatch(time);
		this.spawnTimer.start();
	}
}

export class EnemyBehavior {
	constructor(direction, random) {
		this.direction = direction || (random() > 0.5 ? 1 : -1);
		this.speed = 0.5;
		this.enragedSpeed = this.speed * 2;
		this.enraged = false;
		this.hasTouchedGround = true;
	}
}

export class FlyingEnemy {
	constructor() {
		this.pulseStrength = 0.8;
	}
}

/** Marks an enemy that fell off the map and is re-entering through a pipe. */
export class PipeTraveller {
	constructor(spawnLocations) {
		this.spawnLocations = spawnLocations;
	}
}

export class EnemyDamager {
	constructor(damage) {
		this.damageDelay = 0;
		this.framesEnabled = 4;
		this.frames = 0;
		this.damage = damage || 1;
		this.enabled = true;
		this.name = '';
		this.damagedEntities = [];
	}
}

export class Throwable {
	constructor(attackDelay) {
		this.attackDelay = attackDelay || 20;
		this.framesSinceLastAttack = this.attackDelay;
		this.pierce = 2;
	}
}

/** Marker: the drill damages continuously and bounces the player upward. */
export class Drill {}

export class PlayerDamager {
	constructor(damage) {
		this.damage = damage || 1;
	}
}

export class Collectable {
	constructor(spawnLocations) {
		this.spawnLocations = spawnLocations;
	}

	getRandomLocation(random) {
		return this.spawnLocations[Math.floor(random() * this.spawnLocations.length)].copy();
	}
}

export class Button {
	constructor(type) {
		this.type = type;
		this.pressed = false;
	}
}

// ---------------------------------------------------------------------------
// Boss encounters.
//
// None of these components exist on any classic-arena entity, which is what
// lets the boss system be appended to the pipeline without changing a single
// frame of the original game. See docs/bosses.md.
// ---------------------------------------------------------------------------

/** A flat coloured rectangle in the scene — telegraphs, hazards, HUD bars. */
export class Rect {
	constructor(width, height, color, scene, { zIndex = 500, alpha = 1 } = {}) {
		this.node = new RectNode(width, height, color);
		this.node.zIndex = zIndex;
		this.node.alpha = alpha;
		this.scene = scene;
		scene.addChild(this.node);
	}

	destroy() {
		this.scene.removeChild(this.node);
	}
}

/**
 * The encounter controller. One per level that declares a boss; it owns the
 * state machine, not the boss entity itself, so the fight survives the boss
 * being mid-death-animation.
 */
export class BossEncounter {
	constructor(def, trigger, time) {
		this.def = def;
		this.trigger = trigger;
		this.state = 'dormant';
		this.bossId = null;
		this.phaseIndex = 0;
		this.patternIndex = -1;
		this.pattern = null;
		this.patternPhase = 'idle'; // idle | windUp | active | cooldown
		this.stateClock = new Stopwatch(time);
		this.patternClock = new Stopwatch(time);
		this.markX = 0;
		this.markY = 0;
		this.hudIds = [];
		this.hudFillId = undefined;
		this.spawnerId = null;
		this.spawnerDelay = 0;
	}
}

/** On the boss entity. Mirrors registry data plus per-fight mutable state. */
export class BossBehavior {
	constructor(def) {
		this.def = def;
		this.maxHealth = def.health;
		this.phase = 0;
		this.invulnerable = true;
	}
}

/** A short-lived warning. Destroyed the frame before its hazard appears. */
export class Telegraph {
	constructor(kind, ownerId, windUpMs, time) {
		this.kind = kind;
		this.ownerId = ownerId;
		this.windUpMs = windUpMs;
		this.clock = new Stopwatch(time);
	}
}

/** A damaging region with no sprite — a sweep bar, a shockwave, a beam. */
export class Hazard {
	constructor(ownerId, lifetimeMs, time) {
		this.ownerId = ownerId;
		this.lifetimeMs = lifetimeMs;
		this.clock = new Stopwatch(time);
	}
}
