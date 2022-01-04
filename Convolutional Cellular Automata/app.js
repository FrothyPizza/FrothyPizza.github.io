

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
    leftDown: false,
    rightDown: false,
};

document.addEventListener('mousemove', event => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
});

document.addEventListener('mousedown', event => {
    if(event.button == 0) {
        mouse.leftDown = true;
    } else if(event.button == 2) {
        mouse.rightDown = true;
    }
});

document.addEventListener('mouseup', event => {
    if(event.button == 0) {
        mouse.leftDown = false;
    } else if(event.button == 2) {
        mouse.rightDown = false;
    }
});

document.addEventListener('contextmenu', event => event.preventDefault());





let canvas = document.getElementById('canvas');

canvas.width = document.documentElement.clientWidth;
canvas.height = document.documentElement.clientHeight;
let context = canvas.getContext('2d');


let cellSize = 10;
let gridWidth = canvas.width / cellSize;
let gridHeight = canvas.height / cellSize;
let grid = [];


let filter = [
    [0.68, -0.9,  0.68],
    [-0.9, -0.66, -0.9],
    [0.68, -0.9,  0.68]
]



function activation(x) {
    return -1/Math.pow(2, (0.6*Math.pow(x, 2)))+1;
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

function randomizeGrid() {
    resetGrid();
    for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridHeight; j++) {
            grid[i][j] = Math.floor(Math.random() * 2);
        }
    }
}

// the filter is a 3x3 matrix
// e.g. 
// [0.68, -0.9,  0.68],
// [-0.9, -0.66, -0.9],
// [0.68, -0.9,  0.68]
function updateGrid(filter) {


    let saveGrid = [];
    for (let i = 0; i < gridWidth; i++) {
        saveGrid[i] = [];
        for (let j = 0; j < gridHeight; j++) {
            saveGrid[i][j] = grid[i][j];
        }
    }


    for (let i = 1; i < gridWidth-1; i++) {
        for (let j = 1; j < gridHeight-1; j++) {
            // apply the filter
            let sum = 0;
            for (let k = 0; k < 3; k++) {
                for (let l = 0; l < 3; l++) {
                    sum += filter[2-l][k] * saveGrid[i+k-1][j+l-1];
                }
            }
            grid[i][j] = activation(sum);
        }
    }
}



function drawGrid() {
    

}



function drawGrid() {
    context.fillStyle = '#000000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < gridWidth; i++) {
        for (let j = 0; j < gridHeight; j++) {
            if (grid[i][j] > 0) {
                // set the fill style to have alpha
                context.fillStyle = 'rgba(0, 228, 128, ' + Math.abs(grid[i][j]) + ')';
                context.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
            }
        }
    }
    context.fill();
}


let controlsContainer = document.getElementById('controlsContainer');
let controls = document.getElementById('controls');
let pauseButton = document.getElementById('pause');
let presetSelect = document.getElementById('presets');
let resetButton = document.getElementById('reset');
let stepButton = document.getElementById('step');
let randomizeButton = document.getElementById('randomize');
let speedSlider = document.getElementById('speed');
let speedValue = document.getElementById('speedValue');
let brushSizeSlider = document.getElementById('brushSize');
let ruleSelect = document.getElementById('ruleSelect');
let cellSizeSlider = document.getElementById('size');
let cellSizeValue = document.getElementById('cellSize');
let activationFunction = document.getElementById('activationFunction');
let activationSelect = document.getElementById('activationFunctionPresets');
let optionsButton = document.getElementById('optionsButton');
let brushType = document.getElementById('brushType');
let evenFrames = document.getElementById('evenFrames');
// let symmetryCheck = document.getElementById('symmetry');

optionsButton.onclick = () => {
    if(controls.style.display == 'none') {
        controls.style.display = 'flex';
    } else {
        controls.style.display = 'none';
    }
}


activationFunction.value = activation.toString();
activationFunction.onchange = () => {
    let funcStr = activationFunction.value;
    // remove the function name and the parentheses
    funcStr = funcStr.substring(funcStr.indexOf('{')+1, funcStr.lastIndexOf('}'));
    // replace instances of x with arguments[0]
    funcStr = funcStr.replace(/x/g, 'arguments[0]');


    activation = Function(funcStr);

    // console.log(activationFunction.innerHTML.toString());

}




let htmlFliterGrid = [
    [document.getElementById('tl'), document.getElementById('tm'), document.getElementById('tr')],
    [document.getElementById('ml'), document.getElementById('mm'), document.getElementById('mr')],
    [document.getElementById('bl'), document.getElementById('bm'), document.getElementById('br')]
];

for(let i = 0; i < 3; i++) {
    for(let j = 0; j < 3; j++) {
        htmlFliterGrid[i][j].value = filter[j][i];
        htmlFliterGrid[i][j].onchange = () => {
            filter[j][i] = parseFloat(htmlFliterGrid[i][j].value);
        }
    }
}






let mouseInMenu = false;
controlsContainer.onmouseenter = () => {
    mouseInMenu = true;
};
controlsContainer.onmouseleave = () => {
    mouseInMenu = false;
};


function paintGrid(x, y, brushSize, add, checkered) {
    let oddSize = brushSize % 2 == 1;
    let start = Math.floor(oddSize ? brushSize / 2 : brushSize / 2 - 1);
    let end = Math.floor(brushSize / 2);
    for (let i = x - start; i <= x + end; i++) {
        for (let j = y - start; j <= y + end; j++) {
            if(i % 2 ^ j % 2 && checkered) continue;
            if (i >= 0 && i < gridWidth && j >= 0 && j < gridHeight) {
                grid[i][j] = add ? 1 : 0;
            }
        }
    }
}



randomizeGrid();

let paused = false;
let steps = 0;
function updateAndRender(step=true) {

    if(evenFrames.checked) {
        if(steps % 2 == 0) {
            drawGrid();
        }
    } else {
        drawGrid();
    }

    // if(!paused && steps % 2 == 0 && evenFrames.checked) {
    //     drawGrid();

    // }
    if(!paused) {
        updateGrid(filter);
        ++steps;

    }

    window.setTimeout(updateAndRender, 1000/speedSlider.value);
}

updateAndRender();

window.setInterval(() => {
    let x = Math.floor(mouse.x / cellSize);
    let y = Math.floor(mouse.y / cellSize);
    if (mouse.leftDown && !mouseInMenu) {
        paintGrid(x, y, brushSizeSlider.value, true, brushType.value == 'checkered');
        // drawGrid();
        // if(evenFrames.checked) {
        //     if(steps % 2 == 0) {
        //         drawGrid();
        //     }
        // } else {
        //     drawGrid();
        // }
        ++steps;

        if(evenFrames.checked && steps % 2 == 0) {
            drawGrid();
        } else {
            drawGrid();
        }

    }
    if (mouse.rightDown && !mouseInMenu) {
        paintGrid(x, y, brushSizeSlider.value, false, brushType.value == 'checkered');
        ++steps;

        if(evenFrames.checked && steps % 2 == 0) {
            drawGrid();
        } else {
            drawGrid();
        }
    }
}, 1);

presetSelect.onchange = () => {
    if(presetSelect.value == 'Conway') {
        filter = [
            [1, 1, 1],
            [1, 9, 1],
            [1, 1, 1]
        ];
activation = function activation(x) {
    if (x == 3 || x == 11 || x == 12){
        return 1;
    }
    return 0;
}
        evenFrames.checked = false;
    }
    if(presetSelect.value == 'Worms') {
        filter = [
            [0.68, -0.9,  0.68],
            [-0.9, -0.66, -0.9],
            [0.68, -0.9,  0.68]
        ]
activation = function activation(x) {
    return -1/Math.pow(2, (0.6*Math.pow(x, 2)))+1;
}
        evenFrames.checked = true;
}
    if(presetSelect.value == 'Rule30') {
        filter = [
            [0, 0, 0],
            [0, 0, 0],
            [1, 2, 4]
        ];
activation = function activation(x) {
    if (x == 1 || x == 2 || x == 3 || x == 4)
        return 1;
    return 0;
}
        evenFrames.checked = true;
    }
    for(let i = 0; i < 3; i++) {
        for(let j = 0; j < 3; j++) {
            htmlFliterGrid[i][j].value = filter[i][j];
        }
    }
    activationFunction.value = activation.toString();
}




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
    updateGrid(filter);
    drawGrid();
    ++steps;
}

randomizeButton.onclick = () => {
    randomizeGrid();
}

resetButton.onclick = () => {
    resetGrid();
}



speedSlider.oninput = () => {
    speedValue.innerHTML = speedSlider.value;
}

brushSizeSlider.oninput = () => {
    brushSizeValue.innerHTML = brushSizeSlider.value;
}









activationSelect.onchange = () => {
    if(activationSelect.value == 'Inverse Gaussian') {
activation = function activation(x) {
    return -1/Math.pow(2, (Math.pow(x, 2)))+1;
}
    } else if(activationSelect.value == 'Tanh') {
activation = function activation(x) {
    return Math.tanh(x);
}
    } else if(activationSelect.value == 'Sigmoid') {
activation = function activation(x) {
    return 1 / (1 + Math.pow(Math.E, -4.9 * x));
}
    } else if(activationSelect.value == 'Absolute Value') {
activation = function activation(x) {
    return Math.abs(x);
}
    } else if(activationSelect.value == 'Linear') {
activation = function activation(x) {
    return x;
}
    }

    activationFunction.value = activation.toString();
}