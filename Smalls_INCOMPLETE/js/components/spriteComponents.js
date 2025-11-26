

// The above is an example of AnimatedSprite and Sprite classes along with sample JSON data for an animated sprite. IT is an OLD implementation and is kept for reference only.

// here, we define the ECS components related to sprites

ECS.Components.ViewLock = class ViewLock {
    constructor(enabled = true) {
        this.enabled = enabled ? true : false;
    }
}


ECS.Components.AnimatedSprite = class AnimatedSprite {
    constructor(jsonData, startingAnimation, animationSpeed) {
        this.jsonData = jsonData;
        this.image = Loader.images[jsonData.meta.image];

        this.width = jsonData.frames[0].frame.w;
        this.height = jsonData.frames[0].frame.h;



        this.tint = null;
        this.currentAnimationFrom = 0;
        this.currentAnimationTo = 0;
        this.currentFrame = 0;
        this.frameCount = 0;
        this.direction = 1;
        this.isBackwards = false;
        this.nextAnimation = "";
        this.paused = false;
        this.onAnimationComplete = null;
        this.rotation = 0; // rotation in degrees
        this.currentAnimation = "";
        this.hidden = false;

        this.setAnimation(startingAnimation);
        this.animationSpeed = animationSpeed ||
            this.jsonData.frames[0].duration / (1000 / APP_FPS);

        // store sequencer data if present
        this.sequencerData = jsonData.sequencerData || {};
        // console.log("AnimatedSprite sequencer data:", this.sequencerData);

        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.width;
        this.offscreenCanvas.height = this.height;
        this.offscreenContext = this.offscreenCanvas.getContext('2d');
    }

    setAnimation(animation) {
        if (this.currentAnimation === animation) return;
        this.currentAnimation = animation;
        for (let tag of this.jsonData.meta.frameTags) {
            if (tag.name === animation) {
                this.currentAnimationFrom = tag.from;
                this.currentAnimationTo = tag.to;
                this.currentFrame = this.currentAnimationFrom;
                break;
            }
        }
    }

    restartAnimation() {
        this.currentFrame = this.currentAnimationFrom;
    }

    setRotation(degrees) {
        this.rotation = degrees;
    }

    getSequencerDataForCurrentFrame(tagName) {
        // note, we could have multiple rects with the same tag in a single frame
        if (this.sequencerData[this.currentFrame]) {
            // filter rects by tagName
            const rects = this.sequencerData[this.currentFrame].rects.filter(rect => rect.tag === tagName);
            return rects;
        }
        return null;
    }
}

ECS.Components.Sprite = class Sprite {
    constructor(image, width, height) {
        this.image = image;
        this.width = width;
        this.height = height;
        this.tint = null;
    }
}


ECS.Components.LooksBackAndForthIntermittently = class LooksBackAndForthIntermittently {
    constructor(everyXFrames = 45) {
        this.everyXFrames = everyXFrames;
        
    }
}


/*
sequencerData example:{
    "0": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "1": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "2": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "3": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "4": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 12,
                "y": 11
            }
        ]
    },
    "5": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "6": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "7": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "8": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "9": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "10": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "11": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "12": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "13": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "14": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "15": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 9
            }
        ]
    },
    "16": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "17": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "18": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "19": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "20": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "21": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "22": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "23": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "24": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "25": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "26": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "27": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "28": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "29": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "30": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "31": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "32": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "33": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "34": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "35": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    },
    "36": {
        "rects": [
            {
                "tag": "hitbox",
                "x": 2,
                "y": 16,
                "w": 29,
                "h": 7
            },
            {
                "tag": "hitbox",
                "x": 10,
                "y": 8,
                "w": 13,
                "h": 10
            },
            {
                "tag": "hurtbox",
                "x": 6,
                "y": 16,
                "w": 20,
                "h": 7
            },
            {
                "tag": "hurtbox",
                "x": 8,
                "y": 8,
                "w": 16,
                "h": 11
            }
        ],
        "points": [
            {
                "tag": "spawnPoint",
                "x": 10,
                "y": 12
            }
        ]
    }
}*/


/*
class AnimatedSprite {
    constructor(jsonData, startingAnimation, animationSpeed) {
        this.jsonData = jsonData;
        this.image = Loader.images[jsonData.meta.image];

        this.width = jsonData.frames[0].frame.w;
        this.height = jsonData.frames[0].frame.h;

        this.tint = null;
        this.currentAnimationFrom = 0;
        this.currentAnimationTo = 0;
        this.currentFrame = 0;
        this.frameCount = 0;
        this.direction = 1;
        this.isBackwards = false;
        this.nextAnimation = "";
        this.paused = false;
        this.onAnimationComplete = null;
        this.rotation = 0; // rotation in degrees

        this.setAnimation(startingAnimation);
        this.animationSpeed = animationSpeed ||
            this.jsonData.frames[0].duration / (1000 / APP_FPS);

        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.width;
        this.offscreenCanvas.height = this.height;
        this.offscreenContext = this.offscreenCanvas.getContext('2d');
    }

    setAnimation(animation) {
        if (this.currentAnimation === animation) return;
        this.currentAnimation = animation;
        for (let tag of this.jsonData.meta.frameTags) {
            if (tag.name === animation) {
                this.currentAnimationFrom = tag.from;
                this.currentAnimationTo = tag.to;
                this.currentFrame = this.currentAnimationFrom;
                break;
            }
        }
    }

    restartAnimation() {
        this.currentFrame = this.currentAnimationFrom;
    }

    setRotation(degrees) {
        this.rotation = degrees;
    }

    draw(context, x, y) {
        x = Math.round(x);
        y = Math.round(y);

        // cull off-screen
        if (x + this.width < context.view.x || x > context.view.x + context.canvas.width ||
            y + this.height < context.view.y || y > context.view.y + context.canvas.height) {
            return;
        }

        // draw frame into offscreen canvas
        let frame = this.jsonData.frames[this.currentFrame];
        this.offscreenContext.clearRect(0, 0, this.width, this.height);
        this.offscreenContext.drawImage(
            this.image,
            frame.frame.x, frame.frame.y, frame.frame.w, frame.frame.h,
            0, 0, frame.frame.w, frame.frame.h
        );
        if (this.tint) {
            this.offscreenContext.fillStyle = this.tint;
            this.offscreenContext.globalCompositeOperation = 'source-atop';
            this.offscreenContext.fillRect(0, 0, frame.frame.w, frame.frame.h);
            this.offscreenContext.globalCompositeOperation = 'source-over';
        }

        if (this.paused) return;

        // compute effective scale for horizontal flipping
        let scaleX = this.isBackwards ? -1 : 1;
        scaleX *= this.direction;

        // apply rotation before flip
        context.save();
        const cx = x - context.view.x + this.width / 2;
        const cy = y - context.view.y + this.height / 2;
        context.translate(cx, cy);
        // rotate first
        context.rotate(this.rotation * Math.PI / 180);
        // then apply horizontal flip
        context.scale(scaleX, 1);
        context.drawImage(
            this.offscreenCanvas,
            -this.width / 2,
            -this.height / 2
        );
        context.restore();

        this.incrementAnimationFrame();
    }

    incrementAnimationFrame() {
        this.frameCount++;
        if (this.frameCount >= this.animationSpeed) {
            this.frameCount = 0;
            this.currentFrame++;
            if (this.currentFrame > this.currentAnimationTo) {
                this.currentFrame = this.currentAnimationFrom;
                if (this.onAnimationComplete) this.onAnimationComplete();
                if (this.nextAnimation) {
                    this.setAnimation(this.nextAnimation);
                    this.nextAnimation = "";
                }
            }
        }
    }
}

// Simple static sprite
class Sprite {
    constructor(image, width, height) {
        this.image = image;
        this.width = width;
        this.height = height;
        this.tint = null;
    }

    draw(context, x, y) {
        x = Math.round(x);
        y = Math.round(y);

        if (this.tint) {
            context.fillStyle = this.tint;
            context.globalCompositeOperation = 'source-atop';
            context.fillRect(x - context.view.x, y - context.view.y, this.width, this.height);
            context.globalCompositeOperation = 'source-over';
        }
        context.drawImage(this.image, x - context.view.x, y - context.view.y);
    }
}

// Example JSON data
/*
{ "frames": [
   {
    "filename": "player 0.aseprite",
    "frame": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 1.aseprite",
    "frame": { "x": 8, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 2.aseprite",
    "frame": { "x": 16, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 3.aseprite",
    "frame": { "x": 24, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 4.aseprite",
    "frame": { "x": 32, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 5.aseprite",
    "frame": { "x": 40, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 6.aseprite",
    "frame": { "x": 48, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 7.aseprite",
    "frame": { "x": 56, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 8.aseprite",
    "frame": { "x": 64, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   },
   {
    "filename": "player 9.aseprite",
    "frame": { "x": 72, "y": 0, "w": 8, "h": 8 },
    "rotated": false,
    "trimmed": false,
    "spriteSourceSize": { "x": 0, "y": 0, "w": 8, "h": 8 },
    "sourceSize": { "w": 8, "h": 8 },
    "duration": 200
   }
 ],
 "meta": {
  "app": "http://www.aseprite.org/",
  "version": "1.3-dev",
  "image": "testplayer.png",
  "format": "RGBA8888",
  "size": { "w": 80, "h": 8 },
  "scale": "1",
  "frameTags": [
   { "name": "Default", "from": 0, "to": 0, "direction": "forward" },
   { "name": "Idle", "from": 1, "to": 3, "direction": "forward" },
   { "name": "Run", "from": 4, "to": 7, "direction": "forward" },
   { "name": "Fall", "from": 8, "to": 8, "direction": "forward" },
   { "name": "Jump", "from": 9, "to": 9, "direction": "forward" }
  ]
 }
}

*/

