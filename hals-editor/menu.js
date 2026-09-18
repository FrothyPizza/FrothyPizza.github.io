



let nowPlaying = document.getElementById("now-playing-container");
nowPlaying.style.display = "none";
let nowPlayingText = document.getElementById("now-playing");
nowPlaying.style.opacity = 0;

let musicFiles = [
    {src: "music/Upward.mp3", name: "Upward", artist: "Ethan Hill"},
];



document.getElementById("skin-menu-button").onclick = () => {
    document.getElementById("skin-select-menu").classList.toggle("slide-in-from-top");
}
document.getElementById("skin-menu-button").style.display = "none";

document.querySelectorAll(".skin").forEach(skin => {
    skin.onclick = () => {
        player.loadSkin(skin.src);
        document.getElementById("skin-select-menu").classList.toggle("slide-in-from-top");
    }
});
canvas.addEventListener("mousedown", () => {
    if(!document.getElementById("skin-select-menu").classList.contains("slide-in-from-top")) {
        document.getElementById("skin-select-menu").classList.toggle("slide-in-from-top");
    }
});

addKeyPressListener("Escape", () => {
    if(!document.getElementById("skin-select-menu").classList.contains("slide-in-from-top")) {
        document.getElementById("skin-select-menu").classList.toggle("slide-in-from-top");
    }
});


document.getElementById("side-buttons").style.display = "none";






let startEditorButton = document.getElementById("start-editor-button");
let startMenu = document.getElementById("start-menu");

let findButton = document.getElementById("open-map-finder-button");
let mapFinderContainer = document.getElementById("loaded-map-menu");

let backButton = document.getElementById("back-to-start-button");
let goToMenuButton = document.getElementById("goto-menu-button");

let pauseButton = document.getElementById("pause-button");
let pauseDisplay = document.getElementById("pause-display");

let publishButton = document.getElementById("publish-button");
let saveButton = document.getElementById("save-button");
let clearButton = document.getElementById("clear-button");

function hideMenu() {
    startMenu.style.display = "none";
    mapFinderContainer.style.display = "none";
    paused = false;
    document.getElementById("side-buttons").style.display = "flex";
    document.querySelector("html").classList.remove("scroll");
}

window.onbeforeunload = function () {
    if(LEVEL_EDITOR_MODE && !paused) {
        return "Do you really want to close?";
    }
};



let gameStartedOnce = false;
startEditorButton.onclick = () => {
    // if(!gameStartedOnce) {
    //     startGame();

    //     let music = new Audio(musicFiles[0].src);
    //     music.loop = true;
    //     music.volume = 0.3;
    //     music.play();
    //     showNowPlaying(`<i>${musicFiles[0].name}</i> - ${musicFiles[0].artist}`, 5000);

    //     gameStartedOnce = true;
    // } else {
    //     restartGame();
    // }
    // A half-written or hand-edited localStorage entry used to throw here and
    // leave the Create button doing nothing at all.
    map = ["S", "#"];
    try {
        const saved = JSON.parse(localStorage.getItem("map"));
        if (Array.isArray(saved) && saved.length && typeof saved[0] === "string") {
            map = saved;
        }
    } catch (err) {
        console.warn("Saved map was unreadable; starting a new one.", err);
    }

    endRun();
    restartGame();
    helpButton.style.display = "block";
    saveButton.style.display = "block";
    publishButton.style.display = "block";
    clearButton.style.display = "block";
    blockSelectionBar.style.display = "flex";


    LEVEL_EDITOR_MODE = true;
    hideMenu();
}



function loadMap(record) {
    // Server maps are shared objects in loadedMaps; copy so that playing one
    // (which pads the map as you approach its edges) cannot corrupt the list.
    map = record.map.slice();
    player.hardRestart();
    beginRun(record);
    hideMenu();
    helpButton.style.display = "none";
    publishButton.style.display = "none";   
    saveButton.style.display = "none";
    blockSelectionBar.style.display = "none";
    clearButton.style.display = "none";
    document.getElementById('help-page-container').classList.remove('open');
    pauseGame(false);
    LEVEL_EDITOR_MODE = false;   
}


// urlParams is declared in communication.js, which loads first.

findButton.onclick = () => {
    mapFinderContainer.style.display = "block";
    document.querySelector("html").classList.add("scroll");
}

// A share link opens straight into the list. Clearing the filter is now the
// "Show all maps" button, so Back just closes the list like it does otherwise.
if(urlParams.get("map") || urlParams.get("user")) {
    findButton.click();
}


backButton.onclick = () => {
    mapFinderContainer.style.display = "none";
}

clearButton.onclick = () => {
    if(!confirm("Are you sure you want to clear the map?")) return;
    map = ["S", "#"];
    undoStack = [];
    redoStack = [];
    restartGame();
}

function saveMap() {
    unpadMap();
    localStorage.setItem("map", JSON.stringify(map));
}
saveButton.onclick = () => {
    saveMap();
}

publishButton.onclick = () => {
    publishMap();
}



goToMenuButton.onclick = () => {
    paused = true;
    pauseDisplay.style.display = "none";
    endRun();

    document.getElementById("start-menu").style.display = "flex";
    document.getElementById("side-buttons").style.display = "none";

    mapFinderContainer.style.display = "none";

    if(LEVEL_EDITOR_MODE) {
        saveMap();
    }
}

let helpButton = document.getElementById("help-button");
helpButton.onclick = () => {
    document.getElementById('help-page-container').classList.toggle('open');
}

pauseDisplay.style.display = "none";
function pauseGame(shouldPause) {
    if(typeof shouldPause != "boolean") {
        paused = !paused;
        pauseButton.className = paused ? "paused" : "";
        pauseDisplay.style.display = paused ? "block" : "none";
    } else {
        paused = shouldPause;
        pauseDisplay.style.display = paused ? "block" : "none";
        // This used to set the class to the literal strings "none"/"block",
        // so the paused styling never came back after an explicit pause.
        pauseButton.className = paused ? "paused" : "";
    }
}
pauseButton.onclick = pauseGame;


function showNowPlaying(text, popupTime) {
    nowPlayingText.innerHTML = text;
    unfade(nowPlaying);
    setTimeout(() => {
        fade(nowPlaying);
    }, popupTime);

}


window.onload = () => {
    // if(LEVEL_EDITOR_MODE) {
    //     startGame();
    //     startMenu.style.display = "none";
    // }

    // unfade(document.getElementById("hals-tower-3-image"), 0.03);
    document.getElementById("hals-tower-3-image").style.display = "none";
    setTimeout(() => {
        unfade(startEditorButton, 1);
    }, 100);
}


// document.addEventListener('keydown', event => {
    
//     //canvas.style.cursor = "none"; 
//     setTimeout(() => {
//         if(!mouse.leftDown && !mouse.rightDown) {
//             canvas.style.cursor = "none";
//         }
//     }, 100);
// });

document.addEventListener('mousemove', event => {
    canvas.style.cursor = "default";
});




function unfade(element, speed=0.03) {
    var op = 0.1;  // initial opacity
    element.style.display = 'flex';
    var timer = setInterval(function () {
        if (op >= 1){
            clearInterval(timer);
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op += op * speed;
    }, 10);
}
function fade(element, speed=0.1) {
    var op = 1;  // initial opacity
    var timer = setInterval(function () {
        if (op <= 0.1){
            clearInterval(timer);
            element.style.display = 'none';
        }
        element.style.opacity = op;
        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
        op -= op * speed;
    }, 50);
}

function hide(element) {
    element.style.opacity = 0;
}
