

const ECS = {
	Components: {},
	Blueprints: {},
	Systems: {},
	Helpers: {},
	
	// entityID: entity
	entities: {},
    cache: {},
    invalidateCache: function() {
        this.cache = {};
    },
	register: function(entity) {
		this.entities[entity.id] = entity;
        this.invalidateCache();
	},
	removeEntity: function(id) {
		// console.log(this.entities[id].components);
		// this.entities[id].components.forEach(name => {
		// 	this.entities[id].removeComponent(name);
		// });
		if(!this.entities[id]) return;
		this.entities[id].destroy();
		delete this.entities[id];
        this.invalidateCache();
		//console.log("Entities: " + Object.entries(this.entities).length);
	},

    removeAllEntities: function() {
        Object.keys(this.entities).forEach(id => {
            this.removeEntity(id);
        });
    },

	getEntitiesWithComponents: function(...components) {
        const key = components.sort().join(',');
        if (this.cache[key]) return this.cache[key];

		const result = Object.values(this.entities).filter(entity => {
			return components.every(comp => entity.has(comp));
		});
        this.cache[key] = result;
        return result;
	}
};

ECS.Helpers.serializeEntity = function(entity) {
    const data = {
        id: entity.id,
        blueprint: entity.blueprint,
        components: []
    };

    entity.components.forEach(compName => {
        const comp = entity[compName];
        const compData = {
            name: compName,
            props: {}
        };

        // Copy properties
        for (let key in comp) {
            if (typeof comp[key] === 'function') continue;
            if (key === 'image' || key === 'offscreenCanvas' || key === 'offscreenContext') continue; // Skip render objects
            
            // Handle BoundEntities specifically
            if (compName === 'BoundEntities' && key === 'entitiesWithOffsets') {
                 compData.props[key] = comp[key].map(item => ({
                     entityId: item.entity.id,
                     offsetX: item.offsetX,
                     offsetY: item.offsetY
                 }));
                 continue;
            }

            compData.props[key] = comp[key];
        }
        data.components.push(compData);
    });

    return data;
};

ECS.Helpers.deserializeEntity = function(data) {
    const entity = new ECS.Entity();
    entity.id = data.id; // Restore ID
    if (data.blueprint) {
        entity.blueprint = data.blueprint;
        if (ECS.Blueprints[data.blueprint + 'Interact']) {
            entity.interactWith = ECS.Blueprints[data.blueprint + 'Interact'];
        }
    }

    data.components.forEach(compData => {
        const CompClass = ECS.Components[compData.name];
        if (CompClass) {
            let comp;
            if (compData.name === 'AnimatedSprite') {
                 if (compData.props.jsonData) {
                     comp = new ECS.Components.AnimatedSprite(compData.props.jsonData, compData.props.currentAnimation || "Idle");
                 } else {
                     comp = new CompClass(); 
                 }
            } else {
                try {
                    comp = new CompClass();
                } catch(e) {
                    comp = new CompClass({});
                }
            }

            // Restore properties
            for (let key in compData.props) {
                // Special handling for Clock objects
                if (comp[key] && comp[key].constructor && comp[key].constructor.name === 'Clock') {
                    // If the target property is a Clock, we need to restore its internal state
                    // Assuming Clock has a way to set its time or we just copy the properties
                    // If compData.props[key] is just the object structure of the clock
                    Object.assign(comp[key], compData.props[key]);
                    // Re-attach prototype methods if they were lost during serialization (though Object.assign usually keeps the target's prototype)
                    // The issue is likely that compData.props[key] is a plain object, and Object.assign copies properties but comp[key] is already a Clock instance.
                    // However, if comp[key] was overwritten by a plain object in a previous step (if I didn't have this check), that would be bad.
                    // But here I am assigning TO comp[key] which IS a Clock instance (created in the constructor above).
                    // So comp[key] remains a Clock instance, and we just update its properties (startTime).
                } else {
                    comp[key] = compData.props[key];
                }
            }
            
            entity.addComponent(comp);
        }
    });

    return entity;
};

ECS.Helpers.fixupEntityReferences = function(entity, allEntities) {
    if (entity.has('BoundEntities')) {
        const be = entity.BoundEntities;
        if (be.entitiesWithOffsets && Array.isArray(be.entitiesWithOffsets)) {
            for(let i=0; i<be.entitiesWithOffsets.length; i++) {
                const item = be.entitiesWithOffsets[i];
                if (item.entityId !== undefined && !item.entity) {
                    item.entity = allEntities[item.entityId];
                }
            }
            be.entitiesWithOffsets = be.entitiesWithOffsets.filter(item => item.entity);
        }
    }
};