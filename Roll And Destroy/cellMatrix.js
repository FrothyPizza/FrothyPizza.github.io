class CellMatrix {
    constructor() {
        this.width = WIDTH;
        this.height = HEIGHT;
        this.gravity = 0.07;
        this.cells = [];
        this.init();
    }

    init() {
        for(let y = 0; y < this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                let cell = new Cell(x, y);
                this.set(x, y, cell);
            }
        }
        // create barriers around the edges
        for(let y = 0; y < this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                if(x == 0 || x == this.width - 1 || y == 0 || y == this.height - 1) {
                    this.cells[y * this.width + x] = new Barrier(x, y);
                }
            }
        }

        for(let y = this.height - 40; y < this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                let cell = new Wall(x, y);
                this.set(x, y, cell);
            }
        }

    }

    get(x, y) {
        // return this.cells[mod(x, this.width) + mod(y, this.height) * this.width];
        if(x < 0) x = 0;
        if(x >= this.width) x = this.width - 1;
        if(y < 0) y = 0;
        if(y >= this.height) y = this.height - 1;
        return this.cells[y * this.width + x];
    }

    set(x, y, cell) {
        // this.cells[mod(x, this.width) + mod(y, this.height) * this.width] = cell;
        // cell.x = mod(x, this.width);
        // cell.y = mod(y, this.height);
        
        if(x <= 0) x = 1;
        if(x >= this.width - 1) x = this.width - 2;
        if(y <= 0) y = 1;
        if(y >= this.height - 1) y = this.height - 2;
        this.cells[y * this.width + x] = cell;
        cell.x = x;
        cell.y = y;
    }

    swap(x1, y1, x2, y2) {
        let cell1 = this.get(x1, y1);
        let cell2 = this.get(x2, y2);
        this.set(x1, y1, cell2);
        this.set(x2, y2, cell1);
    }


    getNeighbors(x, y) {
        return {
            left: this.get(x - 1, y),
            right: this.get(x + 1, y),
            up: this.get(x, y - 1),
            down: this.get(x, y + 1),
            upLeft: this.get(x - 1, y - 1),
            upRight: this.get(x + 1, y - 1),
            downLeft: this.get(x - 1, y + 1),
            downRight: this.get(x + 1, y + 1)
        };
    }

    getNeighborArray(x, y) {
        let neighbors = this.getNeighbors(x, y);
        let arr = [];
        for(let key in neighbors) {
            arr.push(neighbors[key]);
        }
        return arr;
    }

    getNeighborPositions(x, y) {
        return [
            { x: x - 1, y: y },
            { x: x + 1, y: y },
            { x: x, y: y - 1 },
            { x: x, y: y + 1 },
            { x: x - 1, y: y - 1 },
            { x: x + 1, y: y - 1 },
            { x: x - 1, y: y + 1 },
            { x: x + 1, y: y + 1 }
        ];
    }

    explode(x, y, radius, strength=1) {
        // get points of perimeter of box
        let points = [];
        for(let i = -radius; i <= radius; i++) {
            points.push({ x: x + i, y: y - radius });
            points.push({ x: x + i, y: y + radius });
            points.push({ x: x - radius, y: y + i });
            points.push({ x: x + radius, y: y + i });
        }


        for(let i = 0; i < points.length; i++) {
            let line = bresenham(x, y, points[i].x, points[i].y);
            let stopped = false;
            for(let j = 0; j < line.length; j++) {
                let cell = this.get(line[j].x, line[j].y);

                // if distance is less than radius, apply force
                let distance = Math.sqrt(Math.pow(line[j].x - x, 2) + Math.pow(line[j].y - y, 2));
                if(distance > radius) break;

                
                if(cell.toughness < strength && !stopped) {
                    if(cell.specific == 'water') {
                        this.set(line[j].x, line[j].y, new Smoke(line[j].x, line[j].y));
                        continue;
                    }

                    if(cell.specific == 'smoke') {
                        continue;
                    }

                    // destroy cell
                    this.set(line[j].x, line[j].y, 
                        Math.random() > 0.1
                        ? new ExplosionSpark(line[j].x, line[j].y)
                        : new Empty(line[j].x, line[j].y)
                    );

                    if(Math.random() < 0.05) {
                        this.set(line[j].x, line[j].y, new Fire(line[j].x, line[j].y));
                        let d = distance === 0 ? 1 : distance;
                        this.get(line[j].x, line[j].y).velocity = {
                            x: (line[j].x - x) / d,
                            y: (line[j].y - y) / d
                        };
                    }
                } else {
                    if(stopped && cell.toughness < strength) break;
                    stopped = true;
                    cell.darken(0.8);
                    if(Math.random() < 0.1) break;
                }

            }
        }

        
    }

    
    update() {
        
        let xIterations = [];
        for(let x = 0; x < this.width; x++) {
            xIterations.push(x);
        }




        for(let y = this.height - 1; y >= 0; y--) {
        //for(let y of yIterations) {
            for(let i = xIterations.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1));
                let temp = xIterations[i];
                xIterations[i] = xIterations[j];
                xIterations[j] = temp;
            }
            for(let x of xIterations) {
                let cell = this.get(x, y);
                
                if(!cell.hasBeenUpdated)
                    cell.step(this);
                cell.hasBeenUpdated = true;
            }

        }


        for(let y = this.height - 1; y >= 0; y--) {
            for(let x = 0; x < this.width; x++) {
                let cell = this.get(x, y);
                cell.hasBeenUpdated = false;
            }
        }
    }


    

    
    draw() {
        let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        let data = imageData.data;
        for(let y = 0; y < this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                let cell = this.get(x, y);

                let index = (x + y * this.width) * 4;
                data[index] = cell.color.r;
                data[index + 1] = cell.color.g;
                data[index + 2] = cell.color.b;
                data[index + 3] = 255;
            }
        }
        context.putImageData(imageData, 0, 0);
    }
}
