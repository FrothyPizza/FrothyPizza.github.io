ECS.idIndex = 0;

ECS.Entity = class Entity {
    constructor() {
        this.id = ECS.idIndex++;
        this.components = [];
    }

    addComponent(component) {
        this.components.push(component.constructor.name);
		this[component.constructor.name] = component;
    }

    removeComponent(name) {
		if(this[name].destroy)
			this[name].destroy();
		delete this[name];
        this.components.splice(this.components.indexOf(name), 1);
    }

	destroy() {
		this.components.forEach(c => {
			if(this[c].destroy) {
				this[c].destroy();
			}
		});
	}

	has(...components) {
		for(let i = 0; i < components.length; ++i) {
			if(!this.components.find(c => c == components[i]))
			   return false;
		}
		return true;
	}
}

