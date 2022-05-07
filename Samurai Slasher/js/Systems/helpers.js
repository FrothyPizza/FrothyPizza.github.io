

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