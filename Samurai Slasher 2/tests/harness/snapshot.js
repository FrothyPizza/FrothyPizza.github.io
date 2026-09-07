/**
 * Normalised state snapshots.
 *
 * Two adapters — one per runtime — read the *same* observable quantities into
 * the same shape so they can be compared field by field. The adapters only
 * navigate to values; they never compute or reconcile anything, so a
 * disagreement between the runtimes cannot be papered over here.
 *
 * Note what is compared: simulation state (positions, velocities, collision
 * flags, health, timers, RNG-derived facings) *and* render state (sprite
 * placement, z-order, tint, visibility, animation frame). Comparing only the
 * former would miss the render-sampling-order quirks entirely.
 */

const round = (value) => (typeof value === 'number' ? Number(value.toFixed(10)) : value);

function vec(v) {
	return v ? { x: round(v.x), y: round(v.y) } : null;
}

// ------------------------------------------------------------------ oracle

export function snapshotOracleWorld(oracle) {
	const entities = oracle.entities;
	const ids = Object.keys(entities)
		.map(Number)
		.sort((a, b) => a - b);
	return ids.map((id) => oracleEntity(entities[id]));
}

function oracleEntity(entity) {
	const out = {
		id: entity.id,
		components: entity.components.slice().sort(),
	};
	if (entity.position) {
		out.position = vec(entity.position.vec);
		out.last = vec(entity.position.last);
	}
	if (entity.velocity) out.velocity = vec(entity.velocity.vec);
	if (entity.gravity) out.gravity = vec(entity.gravity.vec);
	if (entity.bounds) {
		out.bounds = { ...vec(entity.bounds.vec), ox: round(entity.bounds.offset.x), oy: round(entity.bounds.offset.y) };
	}
	if (entity.health) out.health = round(entity.health.value);
	if (entity.mapCollider) {
		out.collider = {
			grounded: entity.mapCollider.grounded,
			left: entity.mapCollider.leftColliding,
			right: entity.mapCollider.rightColliding,
			top: entity.mapCollider.topColliding,
		};
	}
	if (entity.enemyBehavior) {
		out.behavior = {
			direction: entity.enemyBehavior.direction,
			speed: round(entity.enemyBehavior.speed),
			enragedSpeed: round(entity.enemyBehavior.enragedSpeed),
			enraged: entity.enemyBehavior.enraged,
			grounded: entity.enemyBehavior.hasTouchedGround,
		};
	}
	if (entity.enemyDamager) {
		out.damager = {
			enabled: entity.enemyDamager.enabled,
			frames: entity.enemyDamager.frames,
			framesEnabled: entity.enemyDamager.framesEnabled,
			damage: round(entity.enemyDamager.damage),
			name: entity.enemyDamager.name,
			hits: entity.enemyDamager.damagedEntities.slice(),
		};
	}
	if (entity.throwable) {
		out.throwable = {
			attackDelay: entity.throwable.attackDelay,
			since: entity.throwable.framesSinceLastAttack,
			pierce: entity.throwable.pierce,
		};
	}
	if (entity.playerController) {
		out.player = {
			score: entity.playerController.score,
			cutJump: entity.playerController.hasCutJumpVelocity,
			jumpHeld: round(entity.playerController.jumpHoldTimer.getElapsedTime()),
		};
	}
	if (entity.boundEntity) {
		out.bound = { id: entity.boundEntity.id, ox: round(entity.boundEntity.offset.x) };
	}
	if (entity.enemySpawner) {
		out.spawner = {
			delay: round(entity.enemySpawner.spawnDelay),
			temp: round(entity.enemySpawner.tempSpawnDelay),
			elapsed: round(entity.enemySpawner.spawnTimer.getElapsedTime()),
		};
	}
	if (entity.text) out.text = String(entity.text.textObj.text);
	if (entity.sprite) out.sprite = oracleDisplay(entity.sprite.sprite, entity.sprite.offset);
	if (entity.animatedSprite) {
		out.animated = {
			...oracleDisplay(entity.animatedSprite.sprite, entity.animatedSprite.offset),
			animation: entity.animatedSprite.currentAnimation,
			frame: entity.animatedSprite.sprite.currentFrame,
			currentTime: round(entity.animatedSprite.sprite._currentTime),
			speed: round(entity.animatedSprite.sprite.animationSpeed),
			loop: entity.animatedSprite.sprite.loop,
			playing: entity.animatedSprite.sprite.playing,
		};
	}
	return out;
}

function oracleDisplay(sprite, offset) {
	return {
		x: round(sprite.x),
		y: round(sprite.y),
		z: sprite.zIndex,
		scaleX: sprite.scale.x,
		tint: sprite.tint,
		visible: sprite.visible,
		anchorX: sprite.anchor.x,
		ox: round(offset.x),
		oy: round(offset.y),
	};
}

export function snapshotOracleRender(oracle) {
	return oracle.scene.renderList().map((node) => oracleNode(node));
}

function oracleNode(node) {
	// Text nodes compare on placement and content only. Glyph rasterisation is
	// the one intentional rendering deviation: the original scaled a browser
	// font down by 0.0625, the sequel blits a 4x8 bitmap atlas. See
	// docs/compatibility.md.
	if (node.text !== undefined) {
		return {
			kind: 'text',
			value: String(node.text),
			x: round(node.x),
			y: round(node.y),
			z: node.zIndex,
			visible: node.visible,
			anchorX: node.anchor.x,
			anchorY: node.anchor.y,
		};
	}
	return {
		kind: 'sprite',
		texture: node.texture ? node.texture.key : null,
		x: round(node.x),
		y: round(node.y),
		z: node.zIndex,
		scaleX: node.scale.x,
		tint: node.tint,
		visible: node.visible,
		anchorX: node.anchor.x,
	};
}

// ----------------------------------------------------------------- subject

export function snapshotSubjectWorld(world) {
	const ids = Array.from(world.entities.keys()).sort((a, b) => a - b);
	return ids.map((id) => subjectEntity(world.entities.get(id)));
}

function subjectEntity(entity) {
	const out = {
		id: entity.id,
		components: entity.components.slice().sort(),
	};
	if (entity.position) {
		out.position = vec(entity.position.vec);
		out.last = vec(entity.position.last);
	}
	if (entity.velocity) out.velocity = vec(entity.velocity.vec);
	if (entity.gravity) out.gravity = vec(entity.gravity.vec);
	if (entity.bounds) {
		out.bounds = { ...vec(entity.bounds.vec), ox: round(entity.bounds.offset.x), oy: round(entity.bounds.offset.y) };
	}
	if (entity.health) out.health = round(entity.health.value);
	if (entity.mapCollider) {
		out.collider = {
			grounded: entity.mapCollider.grounded,
			left: entity.mapCollider.leftColliding,
			right: entity.mapCollider.rightColliding,
			top: entity.mapCollider.topColliding,
		};
	}
	if (entity.enemyBehavior) {
		out.behavior = {
			direction: entity.enemyBehavior.direction,
			speed: round(entity.enemyBehavior.speed),
			enragedSpeed: round(entity.enemyBehavior.enragedSpeed),
			enraged: entity.enemyBehavior.enraged,
			grounded: entity.enemyBehavior.hasTouchedGround,
		};
	}
	if (entity.enemyDamager) {
		out.damager = {
			enabled: entity.enemyDamager.enabled,
			frames: entity.enemyDamager.frames,
			framesEnabled: entity.enemyDamager.framesEnabled,
			damage: round(entity.enemyDamager.damage),
			name: entity.enemyDamager.name,
			hits: entity.enemyDamager.damagedEntities.slice(),
		};
	}
	if (entity.throwable) {
		out.throwable = {
			attackDelay: entity.throwable.attackDelay,
			since: entity.throwable.framesSinceLastAttack,
			pierce: entity.throwable.pierce,
		};
	}
	if (entity.playerController) {
		out.player = {
			score: entity.playerController.score,
			cutJump: entity.playerController.hasCutJumpVelocity,
			jumpHeld: round(entity.playerController.jumpHoldTimer.getElapsedTime()),
		};
	}
	if (entity.boundEntity) {
		out.bound = { id: entity.boundEntity.id, ox: round(entity.boundEntity.offset.x) };
	}
	if (entity.enemySpawner) {
		out.spawner = {
			delay: round(entity.enemySpawner.spawnDelay),
			temp: round(entity.enemySpawner.tempSpawnDelay),
			elapsed: round(entity.enemySpawner.spawnTimer.getElapsedTime()),
		};
	}
	if (entity.text) out.text = String(entity.text.value);
	if (entity.sprite) out.sprite = subjectDisplay(entity.sprite.node, entity.sprite.offset);
	if (entity.animatedSprite) {
		out.animated = {
			...subjectDisplay(entity.animatedSprite.node, entity.animatedSprite.offset),
			animation: entity.animatedSprite.currentAnimation,
			frame: entity.animatedSprite.node.currentFrame,
			currentTime: round(entity.animatedSprite.node.player._currentTime),
			speed: round(entity.animatedSprite.node.animationSpeed),
			loop: entity.animatedSprite.node.loop,
			playing: entity.animatedSprite.node.player.playing,
		};
	}
	return out;
}

function subjectDisplay(node, offset) {
	return {
		x: round(node.x),
		y: round(node.y),
		z: node.zIndex,
		scaleX: node.scaleX,
		tint: node.tint,
		visible: node.visible,
		anchorX: node.anchorX,
		ox: round(offset.x),
		oy: round(offset.y),
	};
}

export function snapshotSubjectRender(scene) {
	return scene.renderList().map((node) => subjectNode(node));
}

function subjectNode(node) {
	if (node.text !== undefined) {
		return {
			kind: 'text',
			value: String(node.text),
			x: round(node.x),
			y: round(node.y),
			z: node.zIndex,
			visible: node.visible,
			anchorX: node.anchorX,
			anchorY: node.anchorY,
		};
	}
	return {
		kind: 'sprite',
		texture: node.texture ? node.texture.key : null,
		x: round(node.x),
		y: round(node.y),
		z: node.zIndex,
		scaleX: node.scaleX,
		tint: node.tint,
		visible: node.visible,
		anchorX: node.anchorX,
	};
}

// ------------------------------------------------------------------ diffing

/** Returns a list of human-readable differences, deepest path first. */
export function diff(expected, actual, prefix = '') {
	const problems = [];
	walk(expected, actual, prefix, problems);
	return problems;
}

function walk(a, b, path, problems) {
	if (Array.isArray(a) || Array.isArray(b)) {
		if (!Array.isArray(a) || !Array.isArray(b)) {
			problems.push(`${path}: array/non-array mismatch`);
			return;
		}
		if (a.length !== b.length) problems.push(`${path}.length: oracle ${a.length} vs subject ${b.length}`);
		for (let i = 0; i < Math.max(a.length, b.length); ++i) walk(a[i], b[i], `${path}[${i}]`, problems);
		return;
	}
	if (a && b && typeof a === 'object' && typeof b === 'object') {
		const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
		for (const key of keys) walk(a[key], b[key], path ? `${path}.${key}` : key, problems);
		return;
	}
	if (!Object.is(a, b)) {
		problems.push(`${path}: oracle ${format(a)} vs subject ${format(b)}`);
	}
}

function format(value) {
	if (value === undefined) return '<missing>';
	if (typeof value === 'string') return JSON.stringify(value);
	return String(value);
}
