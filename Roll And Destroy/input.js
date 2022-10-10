let Inputs = {
    leftPressed: false,
    rightPressed: false,
    jumpPressed: false,
    shootPressed: false,
    buildPressed: false,
    rollPressed: false,
}

let keys = [];
document.addEventListener('keydown', event => {
    keys[event.key] = true;

	if(event.key == "ArrowLeft" || event.key == "a")
		Inputs.leftPressed = true;
	if(event.key == "ArrowRight" || event.key == "d")
		Inputs.rightPressed = true;
	if(event.key == "z" || event.key == "w" || event.key == "ArrowUp")
		Inputs.jumpPressed = true;
    if(event.key == "q")
        Inputs.rollPressed = true;
    // if(event.key == "x")
	// 	Inputs.shootPressed = true;


});
document.addEventListener('keyup', event => {
    keys[event.key] = false;

    if(event.key == "ArrowLeft" || event.key == "a")
        Inputs.leftPressed = false;
    if(event.key == "ArrowRight" || event.key == "d")
        Inputs.rightPressed = false;
    if(event.key == "z" || event.key == "w" || event.key == "ArrowUp")
        Inputs.jumpPressed = false;
    if(event.key == "x")
        Inputs.shootPressed = false;
    if(event.key == "q")
        Inputs.rollPressed = false;
});

let mouse = {
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
    down: false,
    right: false,
}

document.addEventListener('mousemove', e => {
    mouse.lastX = mouse.x;
    mouse.lastY = mouse.y;
    mouse.x = e.clientX - canvas.getBoundingClientRect().left;
    mouse.y = e.clientY - canvas.getBoundingClientRect().top;

    mouse.x = Math.floor(mouse.x / CELL_SIZE);
    mouse.y = Math.floor(mouse.y / CELL_SIZE);

});

document.addEventListener('mousedown', e => {
    mouse.down = e.button === 0;
    mouse.right = e.button === 2;

    Inputs.shootPressed = mouse.down;
    Inputs.buildPressed = mouse.right;
});

document.addEventListener('mouseup', e => {
    if(e.button === 0) {
        mouse.down = false;
        Inputs.shootPressed = false;
    }
    if(e.button === 2) {
        mouse.right = false;
        Inputs.buildPressed = false;
    }

    
});

