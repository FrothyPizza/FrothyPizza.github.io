

// 2d-vector utility class for basic vector operations; can add any two objects with x and y properties
let Vec2 = {
    add: function(v1, v2) {
        return {x: v1.x + v2.x, y: v1.y + v2.y};
    },

    subtract: function(v1, v2) {
        return {x: v1.x - v2.x, y: v1.y - v2.y};
    },

    scalar(v, s) {
        return {x: v.x * s, y: v.y * s};
    }

};

