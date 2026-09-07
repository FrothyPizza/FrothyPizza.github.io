/**
 * Entities are bags of named components, addressed by the same lowercase names
 * the original derived from `component.constructor.name`. Naming them
 * explicitly (rather than reflecting over class names) keeps systems readable
 * and survives minification.
 */
export class Entity {
	constructor(id) {
		this.id = id;
		this.components = [];
	}

	add(name, component) {
		if (this[name] !== undefined) this.remove(name);
		this.components.push(name);
		this[name] = component;
		return component;
	}

	remove(name) {
		const component = this[name];
		// The original threw here when the component was already gone; being
		// tolerant is a lifecycle fix that cannot change live gameplay.
		if (component === undefined) return;
		if (component.destroy) component.destroy();
		delete this[name];
		const index = this.components.indexOf(name);
		if (index !== -1) this.components.splice(index, 1);
	}

	has(...names) {
		for (let i = 0; i < names.length; ++i) {
			if (this[names[i]] === undefined) return false;
		}
		return true;
	}

	destroy() {
		for (const name of this.components) {
			const component = this[name];
			if (component && component.destroy) component.destroy();
		}
	}
}
