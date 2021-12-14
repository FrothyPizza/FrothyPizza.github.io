let keys = [];

document.addEventListener('keydown', event => {
    keys[event.keyCode] = true;
});

document.addEventListener('keyup', event => {
    keys[event.keyCode] = false;
});

 
const RIGHT = 39;
const LEFT = 37;
const UP = 38;
const DOWN = 40;
const SPACE = 32;
const ESC = 27;

let canvas = document.getElementById('canvas');

canvas.width = 600;
canvas.height = 600;
let fullScreen = false;
let context = canvas.getContext('2d');




class Asteroid {
    constructor(x, y, radius, speed, direction, points) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speed = speed;
        this.direction = direction;
        this.points = points;
    }

    draw() {
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        context.strokeStyle = 'white';
        context.stroke();
    }

    update(delta) {
        this.x += this.speed * delta * Math.cos(this.direction * Math.PI / 180);
        this.y += this.speed * delta * Math.sin(this.direction * Math.PI / 180);

        this.wrap();
    }

    wrap() {
        if (this.x > canvas.width + this.radius) {
            this.x = -this.radius;
        } else if (this.x < -this.radius) {
            this.x = canvas.width + this.radius;
        }

        if (this.y > canvas.height + this.radius) {
            this.y = -this.radius;
        } else if (this.y < -this.radius) {
            this.y = canvas.height + this.radius;
        }
    }

}




function rotatePointAroundPoint(x, y, cx, cy, angle) {
    let radians = (Math.PI / 180) * angle;
    let cos = Math.cos(radians);
    let sin = Math.sin(radians);
    let nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
    let ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return {x: nx, y: ny};
}

function circlesColliding(circle1, circle2) {
    let dx = circle1.x - circle2.x;
    let dy = circle1.y - circle2.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    return distance < circle1.radius + circle2.radius;
}

class Ship {
    constructor(x, y, size, speed, rotationSpeed, direction) {
        this.x = x;
        this.y = y;
        this.xVel = 0;
        this.yVel = 0;
        this.size = size;
        this.speed = speed;
        this.rotationSpeed = -rotationSpeed;
        this.direction = direction;   
    }

    
    draw() {
        let point1 = {x: this.size, y: 0};
        let point2 = {x: -this.size, y: -this.size/2};
        let point3 = {x: -this.size, y: this.size/2};

        point1 = rotatePointAroundPoint(point1.x, point1.y, 0, 0, this.direction);
        point2 = rotatePointAroundPoint(point2.x, point2.y, 0, 0, this.direction);
        point3 = rotatePointAroundPoint(point3.x, point3.y, 0, 0, this.direction);

        context.beginPath();
        context.moveTo(point1.x + this.x, point1.y + this.y);
        context.lineTo(point2.x + this.x, point2.y + this.y);
        context.lineTo(point3.x + this.x, point3.y + this.y);
        context.closePath();
        context.strokeStyle = 'white';
        context.stroke();

    }

    handleInput(delta) {
        if (keys[RIGHT]) {
            this.direction += delta * this.rotationSpeed;
        }
        if (keys[LEFT]) {
            this.direction -= delta * this.rotationSpeed;
        }
        if (keys[UP]) {
            this.xVel += this.speed * Math.cos(this.direction * (Math.PI / 180)) * delta;
            this.yVel += -this.speed * Math.sin(this.direction * (Math.PI / 180)) * delta;
        }
    }

    wrap() {
        if (this.x > canvas.width + this.size) {
            this.x = -this.size;
        } else if (this.x < -this.size) {
            this.x = canvas.width + this.size;
        }

        if (this.y > canvas.height + this.size) {
            this.y = -this.size;
        } else if (this.y < -this.size) {
            this.y = canvas.height + this.size;
        }
    }

    update(delta) {
        this.x += this.xVel * delta;
        this.y += this.yVel * delta;

        this.wrap();
    }

}

class Bullet {
    constructor(x, y, size, speed, direction) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.direction = direction;

        this.timeAlive = 0;

    }

    draw() {
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        context.strokeStyle = 'white';
        context.stroke();
    }

    update(delta) {
        this.x += this.speed * delta * Math.cos(this.direction);
        this.y += -this.speed * delta * Math.sin(this.direction);

        this.wrap();
        this.timeAlive += delta;
    }

    wrap() {
        if (this.x > canvas.width + this.size) {
            this.x = -this.size;
        } else if (this.x < -this.size) {
            this.x = canvas.width + this.size;
        }

        if (this.y > canvas.height + this.size) {
            this.y = -this.size;
        } else if (this.y < -this.size) {
            this.y = canvas.height + this.size;
        }

    }
}



const ASTEROID_TYPES = [
    { radius: 20, speed: 150, points: 5 },
    { radius: 40, speed: 75, points: 10 },
    { radius: 80, speed: 37.5, points: 15 }
];



class Game {
    constructor() {        
        this.restart();
        

    }

    
    restart() {
        this.SHOTS_PER_SECOND = 4;
        this.ASTEROIDS_PER_SECOND = 0.5;
        this.STARTING_ASTEROIDS = 5;

        
        this.asteroids = [];
        this.bullets = [];
        this.ship = new Ship(canvas.width/2, canvas.height/2, 20, 300, 100, 0);
        this.spawnAsteroids(this.STARTING_ASTEROIDS);

        this.score = 0;
        this.highScore = 0;
        this.shootTimer = this.SHOTS_PER_SECOND;
        this.asteroidTimer = this.ASTEROIDS_PER_SECOND;

        if(localStorage.getItem('highscore') === null) {
            localStorage.setItem('highscore', this.score);
        } else {
            if(localStorage.getItem('highscore') < this.score) {
                localStorage.setItem('highscore', this.score);
            }
            this.highScore = localStorage.getItem('highscore');
        }
    }


    spawnAsteroids(number) {
        for (let i = 0; i < number; i++) {
            this.addAsteroidFromEdge();
        }

    }

    draw() {
        this.ship.draw();


        for(let asteroid of this.asteroids) {
            asteroid.draw();
        }


        for(let bullet of this.bullets) {
            bullet.draw();
        }

        context.font = '20px Arial';
        context.fillStyle = 'white';
        context.fillText(`Score: ${this.score}`, 10, 30);

        context.fillText(`High Score: ${this.highScore}`, 10, 60);



    }

    update(delta) {
        this.handleInput(delta);
        this.ship.handleInput(delta);
        this.ship.update(delta);

        for(let asteroid of this.asteroids) {
            asteroid.update(delta);
        }

        this.asteroidTimer += delta;
        if (this.asteroidTimer > 1 / this.ASTEROIDS_PER_SECOND) {
            this.asteroidTimer = 0;
            this.addAsteroidFromEdge();
        }
		if(this.asteroids.length < 3) {
			for(let i = 0; i < 3; ++i) {
				this.spawnAsteroids(3);
			}
		}


        for(let bullet of this.bullets) {
            bullet.update(delta);
            if(bullet.timeAlive > 2) {
                let index = this.bullets.indexOf(bullet);
                this.bullets.splice(index, 1);
            }
        }

        this.checkCollisions();

        if(this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highscore', this.highScore);
        }
    }


    checkCollisions() {
        for(let asteroid of this.asteroids) {
            if (circlesColliding({x: this.ship.x, y: this.ship.y, radius: this.ship.size/2}, asteroid)) {
                this.restart();
            }
        }

        for(let i = this.bullets.length - 1; i >= 0; i--) {
            let bullet = this.bullets[i];
            for(let asteroid of this.asteroids) {
                if (circlesColliding({x: bullet.x, y: bullet.y, radius: bullet.size/2}, asteroid)) {
                    if(asteroid.radius !== ASTEROID_TYPES[0].radius) {
                        let newType = 0;
                        if(asteroid.radius === ASTEROID_TYPES[2].radius) {
                            newType = 1;
                        }

                        this.asteroids.push(new Asteroid(asteroid.x, asteroid.y, ASTEROID_TYPES[newType].radius, 
                            ASTEROID_TYPES[newType].speed, asteroid.direction-30, ASTEROID_TYPES[newType].points));
                        this.asteroids.push(new Asteroid(asteroid.x, asteroid.y, ASTEROID_TYPES[newType].radius, 
                            ASTEROID_TYPES[newType].speed, asteroid.direction+30, ASTEROID_TYPES[newType].points));
                    }

                    this.score += asteroid.points;
                    this.asteroids.splice(this.asteroids.indexOf(asteroid), 1);
                    this.bullets.splice(i, 1);
                    
                }
            }

        }

    }

    shoot() {
        if(this.shootTimer > 1/this.SHOTS_PER_SECOND) {
            let bullet = new Bullet(this.ship.x, this.ship.y, 5, 500, this.ship.direction * (Math.PI / 180));
            this.bullets.push(bullet);
            this.shootTimer = 0;
        }
    }

    handleInput(delta) {
        this.shootTimer += delta;
        if (keys[SPACE]) {
            this.shoot();
        }

        this.ship.handleInput(delta);
    }

    addAsteroid() {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;

        let type = Math.floor(Math.random() * 3);
        let asteroid = new Asteroid(x, y, ASTEROID_TYPES[type].radius, ASTEROID_TYPES[type].speed, Math.random() * 360, ASTEROID_TYPES[type].points);

        this.asteroids.push(asteroid);
    }

    addAsteroidFromEdge() {
        let side = Math.floor(Math.random() * 4);

        let type = Math.floor(Math.random() * 3);


        let x = 0;
        let y = 0;

        if(side === 0) {
            x = Math.random() * canvas.width;
            y = -ASTEROID_TYPES[type].radius;
        }
        if(side === 1) {
            x = canvas.width + ASTEROID_TYPES[type].radius;
            y = Math.random() * canvas.height;
        }
        if (side > 2 && side < 3) {
            x = Math.random() * canvas.width;
            y = canvas.height + asteroid.size;
        }

        let asteroid = new Asteroid(x, y, ASTEROID_TYPES[type].radius, ASTEROID_TYPES[type].speed, Math.random() * 360, ASTEROID_TYPES[type].points);

        this.asteroids.push(asteroid);
    }
}


homeButton.addEventListener('click', () => {
    window.location.href= "../index.html";
});







            
let game = new Game();

let lastTime = 0;
function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);

    if(fullScreen) {
        canvas.width = document.documentElement.clientWidth;
        canvas.height = document.documentElement.clientHeight;
    }


    // Update
    let deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    game.update(deltaTime);

    // Draw
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    game.draw();



    homeButton.style.position = "absolute";
    canvasPosition = canvas.getBoundingClientRect();
    homeButton.style.top = canvasPosition.top + "px";
    homeButton.style.left = canvasPosition.left + canvas.width - homeButton.width + "px";
    
}


gameLoop(0);