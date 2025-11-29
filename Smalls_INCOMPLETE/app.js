// app.js

// some confusing code that makes it so that if the monitor is 60 fps, then the game will run using requestAnimationFrame at 60 fps
// otherwise, the game will run at 60 fps using setInterval, since requestAnimationFrame uses the monitor's refresh rate
function startGameloop() {
  const getFPS = () =>
    new Promise((resolve) =>
      requestAnimationFrame((t1) =>
        requestAnimationFrame((t2) => resolve(1000 / (t2 - t1)))
      )
    );

  let is60FPS = true;
  function setFPS() {
    getFPS().then((fps) => {
      // console.log("detected fps: " + fps);
      is60FPS = !(fps > 80 || fps < 30);
    });
  }
  setTimeout(() => {
    setFPS();
    setInterval(() => {
      setFPS();
    }, 1000);
  }, 100);

  let u = () => {
    if (is60FPS) update();
    requestAnimationFrame(u);
  };
  requestAnimationFrame(u);

  setInterval(() => {
    if (!is60FPS) update();
  }, 1000 / 60);
}

function init() {
  GlobalState.sceneManager = new SceneManager();

  // Load the MenuScene
  const menuScene = new MenuScene();
  menuScene.init();
  GlobalState.sceneManager.setScene(menuScene);

  startGameloop();
}

let GAME_FROZEN = false;
function freezeFrame(frames) {
  GAME_FROZEN = true;
  setFrameTimeout(() => {
    GAME_FROZEN = false;
  }, frames);
}

// add key down listener and the n    Loader.playMusic('TenseBase.mp3', true, 0.5);
let playmusictostartgame = function () {};
window.addEventListener(
  "keydown",
  (e) => {
    //Loader.playMusic('TenseBase.mp3', true, 0.5);
    //Loader.playSound("explosion.wav", 0.08);

    //Loader.playSound("shotgunshot.wav", 0.3);
    // Test sound here

    // remove this event listener after first key press
  },
  { once: true }
);

// Main Game Loop
function update() {
  if (typeof updateGamepadInputs === "function") {
    updateGamepadInputs();
  }

  context.fillStyle = CONSTANTS.BACKGROUND_COLOR;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.fillStyle =
    "rgba(0, 0, 0, " + CONSTANTS.BACKGROUND_COLOR_DARKEN_ALPHA + ")";
  context.fillRect(0, 0, WIDTH, HEIGHT);

  // draw "sun" in desert scene
  if (GlobalState.sceneManager && GlobalState.sceneManager.currentScene instanceof DesertScene) {
    const scene = GlobalState.sceneManager.currentScene;
    const progress = 1 - (scene.framesToCompletion / scene.totalFrames);

    const startX = 32;
    const endX = 90;
    const startY = 16;
    const endY = HEIGHT - 44;

    // Linear movement for now, effectively an arc if we consider the sky dome
    const x = startX + (endX - startX) * progress;
    const y = startY + (endY - startY) * progress;

    // Color interpolation from #FDB813 (253, 184, 19) to #FF4500 (255, 69, 0)
    const r = Math.floor(253 + (255 - 253) * progress);
    const g = Math.floor(184 + (69 - 184) * progress);
    const b = Math.floor(19 + (0 - 19) * progress);
    const a = 0.7 - (0.4 * progress); // Ends at 0.8

    context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
    context.beginPath();
    context.arc(x, y, 12, 0, Math.PI * 2);
    context.fill();
  }


  if (!GAME_FROZEN) {
    if (GlobalState.sceneManager) {
      GlobalState.sceneManager.update();
      context.view.update(16);
    }
  }
  if (GlobalState.sceneManager) {
    GlobalState.sceneManager.draw(context);
  }

  // Draw Score
  if (GlobalState.sceneManager && GlobalState.sceneManager.currentScene && GlobalState.sceneManager.currentScene.player && GlobalState.sceneManager.currentScene.player.has('PlayerState')) {
      const scene = GlobalState.sceneManager.currentScene;
      const score = scene.player.PlayerState.score;
      
      const label = "SCORE: ";
      const absScore = Math.abs(score);
      const sign = score < 0 ? '-' : '';
      const numberText = `${sign}${absScore.toString().padStart(6, '0')}`;
      
      const labelWidth = scene.measureBitmapTextWidth(label);
      const numberWidth = scene.measureBitmapTextWidth(numberText);
      const totalWidth = labelWidth + numberWidth;
      
      const startX = (40) - (totalWidth / 2);
      
      scene.drawBitmapText(context, label, startX, 4, 'left', 'white');
      scene.drawBitmapText(context, numberText, startX + labelWidth, 4, 'left', score < 0 ? 'maroon' : 'white');
  }

  // draw border around outside of screen
  context.strokeStyle = "black";
  context.lineWidth = 1;
  context.strokeRect(0, 0, WIDTH, HEIGHT);

  updateFrameTimeouts();
  APP_ELAPSED_FRAMES++;
}
