let keys = [];

document.addEventListener('keydown', event => {
    keys[event.key] = true;
});

document.addEventListener('keyup', event => {
    keys[event.key] = false;
});

let mouse = {
    x: 0,
    y: 0,
    down: false
};

document.addEventListener('mousemove', event => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
});

document.addEventListener('mousedown', event => {
    mouse.down = true;
});

document.addEventListener('mouseup', event => {
    mouse.down = false;
});




let canvas = document.getElementById('canvas');

canvas.width = document.documentElement.clientWidth;
canvas.height = document.documentElement.clientHeight;
let context = canvas.getContext('2d');


let cellSize = 10;
let gridWidth = canvas.width / cellSize;
let gridHeight = canvas.height / cellSize;
let grid = [];
let rule = [[2, 3], [3]];






// input string
// i.e. 23/3
function parseRule(rule) {
    let parsedRule = [];
    let ruleSplit = rule.split('/');

    for (let i = 0; i < ruleSplit.length; i++) {
        let ruleArray = ruleSplit[i].split('');
        parsedRule.push(ruleArray);
    }

    // convert to numbers
    for (let i = 0; i < parsedRule.length; i++) {
        for (let j = 0; j < parsedRule[i].length; j++) {
            parsedRule[i][j] = parseInt(parsedRule[i][j]);
        }
    }

    return parsedRule;
}
    

function resetGrid() {
    canvas.width = document.documentElement.clientWidth;
    canvas.height = document.documentElement.clientHeight;
    gridWidth = canvas.width / cellSize;
    gridHeight = canvas.height / cellSize;
    grid = [];
    for (let i = 0; i < gridWidth; i++) {
        grid[i] = [];
        for (let j = 0; j < gridHeight; j++) {
            grid[i][j] = 0;
        }
    }
}

// rule is [[surviveAmounts], [birthAmounts]]
// Conway's Game of Life: [[2, 3], [3]]
function updateGrid(rule) {
    let survieAmounts = rule[0];
    let birthAmounts = rule[1];

    let saveGrid = [];
    for (let i = 0; i < gridWidth; i++) {
        saveGrid[i] = [];
        for (let j = 0; j < gridHeight; j++) {
            saveGrid[i][j] = grid[i][j];
        }
    }


    for (let i = 1; i < gridWidth-1; i++) {
        for (let j = 1; j < gridHeight-1; j++) {
            let neighbors = saveGrid[i-1][j-1] + saveGrid[i][j-1] + saveGrid[i+1][j-1] + 
                            saveGrid[i-1][j] +                      saveGrid[i+1][j] + 
                            saveGrid[i-1][j+1] + saveGrid[i][j+1] + saveGrid[i+1][j+1];
            if (saveGrid[i][j] == 1) {
                let survive = false;
                for(let k = 0; k < survieAmounts.length; k++) {
                    if(neighbors == survieAmounts[k]) {
                        survive = true;
                        break;
                    } 
                }
                if(!survive) {
                    grid[i][j] = 0;
                }
            } else {
                for(let k = 0; k < birthAmounts.length; k++) {
                    if(neighbors == birthAmounts[k]) {
                        grid[i][j] = 1;
                        break;
                    }
                }
            }
        }
    }
}

function drawGrid() {
    context.fillStyle = darkModeCheck.checked ? '#000000' : '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = darkModeCheck.checked ? '#ffffff' : '#000000';
    context.beginPath();
    for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridHeight; j++) {
            if (grid[i][j] == 1) {
                // context.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
                context.rect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
        }
    }
    context.fill();
}


let controlsContainer = document.getElementById('controlsContainer');
let pauseButton = document.getElementById('pause');
let ruleInput = document.getElementById('ruleset');
let resetButton = document.getElementById('reset');
let stepButton = document.getElementById('step');
let randomizeButton = document.getElementById('randomize');
let speedSlider = document.getElementById('speed');
let speedValue = document.getElementById('speedValue');
let brushSizeSlider = document.getElementById('brushSize');
let darkModeCheck = document.getElementById('darkMode');
let ruleSelect = document.getElementById('ruleSelect');
let cellSizeSlider = document.getElementById('size');
let cellSizeValue = document.getElementById('cellSize');


let mouseInMenu = false;
controlsContainer.onmouseenter = () => {
    mouseInMenu = true;
};
controlsContainer.onmouseleave = () => {
    mouseInMenu = false;
};


function paintGrid(x, y, brushSize) {
    let oddSize = brushSize % 2 == 1;
    let start = Math.floor(oddSize ? brushSize / 2 : brushSize / 2 - 1);
    let end = Math.floor(brushSize / 2);
    for (let i = x - start; i <= x + end; i++) {
        for (let j = y - start; j <= y + end; j++) {
            if (i >= 0 && i < gridWidth && j >= 0 && j < gridHeight) {
                grid[i][j] = 1;
            }
        }
    }
}



resetGrid()

let paused = false;
function updateAndRender(step=true) {


    if(!paused) {
        updateGrid(rule);
    }
    drawGrid();


    window.setTimeout(updateAndRender, 1000/speedSlider.value);
}

updateAndRender();

window.setInterval(() => {

    if (mouse.down && !mouseInMenu) {
        let x = Math.floor(mouse.x / cellSize);
        let y = Math.floor(mouse.y / cellSize);
        paintGrid(x, y, brushSizeSlider.value);
        drawGrid();

    }
}, 1);


cellSizeSlider.oninput = () => {
    cellSize = cellSizeSlider.value;
    cellSizeValue.innerHTML = cellSizeSlider.value;
    resetGrid();
}


pauseButton.onclick = () => {
    if (pauseButton.innerHTML == 'Pause') {
        pauseButton.innerHTML = 'Play';
    } else {
        pauseButton.innerHTML = 'Pause';
    }
    paused = !paused;
}

resetButton.onclick = () => {
    resetGrid()
}

stepButton.onclick = () => {
    updateGrid(rule);
    drawGrid();
}

randomizeButton.onclick = () => {
    resetGrid();
    for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridHeight; j++) {
            grid[i][j] = Math.random() > 0.5 ? 1 : 0;
        }
    }
}

resetButton.onclick = () => {
    resetGrid();
}

ruleInput.onchange = () => {
    rule = parseRule(ruleInput.value);
}

ruleSelect.onchange = () => {
    ruleInput.value = ruleSelect.value;
    rule = parseRule(ruleSelect.value);
}

speedSlider.oninput = () => {
    speedValue.innerHTML = speedSlider.value;
}

brushSizeSlider.oninput = () => {
    brushSizeValue.innerHTML = brushSizeSlider.value;
}

darkModeCheck.onchange = () => {
    localStorage.setItem('darkMode', darkModeCheck.checked);
    drawGrid();
}
if(localStorage.getItem('darkMode') == 'true') {
    darkModeCheck.checked = true;
} else {
    darkModeCheck.checked = false;
}