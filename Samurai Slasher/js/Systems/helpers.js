

ECS.Helpers.setPlayerWeapon = (entities, player, weaponName) => {
	let oldWeaponEntity = entities[player.boundEntity.id];
	let newWeapon = weaponName;
	if(!weaponName) {
		do {
			newWeapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
		} while(newWeapon == oldWeaponEntity.enemyDamager.name);
	}

	ECS.removeEntity(oldWeaponEntity.id);
	let newWeaponEnt = ECS.Blueprints.weapon(newWeapon);

	if(player.animatedSprite.sprite.scale.x == -1) {
		newWeaponEnt.animatedSprite.sprite.scale.x = -1;
		player.boundEntity.offset.x = -Math.abs(player.boundEntity.offset.x);
		newWeaponEnt.bounds.offset.x = -Math.abs(newWeaponEnt.bounds.offset.x);
		newWeaponEnt.bounds.x = -Math.abs(newWeaponEnt.bounds.x);
	}
	ECS.register(newWeaponEnt);
	player.boundEntity.id = newWeaponEnt.id;
}

ECS.Helpers.setPlayerDirection = (entities, player, dir) => {
	let boundEntity = entities[player.boundEntity.id];
	if(boundEntity.has("drill")) {
		boundEntity.animatedSprite.offset.x = dir * Math.abs(boundEntity.animatedSprite.offset.x);
		boundEntity.animatedSprite.sprite.scale.x = dir;
		return;
	}
	if(dir == 1) {
		player.animatedSprite.sprite.scale.x = 1;
		if(boundEntity.animatedSprite.sprite && boundEntity.animatedSprite.sprite.scale.x !== 1) {
			boundEntity.animatedSprite.sprite.scale.x = 1;
			boundEntity.animatedSprite.offset.x = -Math.abs(boundEntity.animatedSprite.offset.x);
			player.boundEntity.offset.x = Math.abs(player.boundEntity.offset.x);
			boundEntity.bounds.offset.x = Math.abs(boundEntity.bounds.offset.x);
			boundEntity.bounds.x = Math.abs(boundEntity.bounds.x);
		}
	}
	else if(dir == -1) {
		player.animatedSprite.sprite.scale.x = -1;
		if(boundEntity.animatedSprite.sprite && boundEntity.animatedSprite.sprite.scale.x !== -1) {
			boundEntity.animatedSprite.sprite.scale.x = -1;
			boundEntity.animatedSprite.offset.x = Math.abs(boundEntity.animatedSprite.offset.x);
			player.boundEntity.offset.x = -Math.abs(player.boundEntity.offset.x);
			boundEntity.bounds.offset.x = -Math.abs(boundEntity.bounds.offset.x);
			boundEntity.bounds.x = -Math.abs(boundEntity.bounds.x);
		}
	}
}