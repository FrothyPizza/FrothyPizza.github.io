



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

let projectMenu = document.getElementById("project-menu");
let backToProjectsMenuButton = document.getElementById("back-to-start-from-projects-button");
let newProjectButton = document.getElementById("new-project-button");
let projectListStatus = document.getElementById("project-list-status");
let projectListContainer = document.getElementById("project-list-container");

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
    projectMenu.style.display = "none";
    canvas.style.display = "block";
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
    showProjectMenu();
}

// Opens a local draft (new or existing) into the editor. Shared by "New Map"
// and picking a card from the project list.
function openProject(project) {
    currentProjectId = project.id;
    // Projects are shared objects in the list; copy so editing one (which
    // pads the map as you approach its edges) cannot corrupt the stored copy.
    map = project.map.slice();
    undoStack = [];
    redoStack = [];

    endRun();
    stopEditingPublishedMap();
    trackEvent("editor_start");
    restartGame();
    helpButton.style.display = "block";
    saveButton.style.display = "block";
    publishButton.style.display = "block";
    clearButton.style.display = "block";
    blockSelectionBar.style.display = "flex";

    LEVEL_EDITOR_MODE = true;
    projectMenu.style.display = "none";
    hideMenu();
}

function createNewProject() {
    const name = prompt("Name your new map:", "Untitled Map");
    if (name === null) return;
    openProject(createProject(name.trim() || "Untitled Map", ["S", "#"]));
}

function buildProjectCard(project) {
    const card = el("div", "map-container");

    const header = el("div", "map-header");
    const info = el("div", "map-info");
    info.append(el("h2", "map-name", project.name));
    info.append(el("p", "map-stats", "Edited " + formatRelativeTime(project.updatedAt)));
    header.append(info);
    card.append(header);

    // Shape the preview to the map instead of always being square, same as
    // the published-map cards in the Find list.
    const preview = document.createElement("canvas");
    const cols = project.map[0].length;
    const rows = project.map.length;
    const scale = Math.min(400 / cols, 400 / rows);
    preview.width = Math.max(80, Math.round(cols * scale));
    preview.height = Math.max(80, Math.round(rows * scale));
    preview.title = "Open " + project.name;
    card.append(preview);
    preview.addEventListener("click", () => openProject(project));

    const actions = el("div", "map-actions");
    const openButton = el("button", "small-button", "Open");
    openButton.addEventListener("click", () => openProject(project));
    const deleteButton = el("button", "small-button danger-button", "Delete");
    deleteButton.addEventListener("click", () => {
        if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
        deleteProject(project.id);
        refreshProjectList();
    });
    actions.append(openButton, deleteButton);
    card.append(actions);

    // Borrows the global map/view/context, so it has to run after the canvas
    // is in the document and sized.
    drawMapOnSmallCanvas(preview, project.map);

    return card;
}

function refreshProjectList() {
    migrateLegacyMapIfNeeded();

    const projects = loadProjects().slice().sort((a, b) => b.updatedAt - a.updatedAt);
    projectListContainer.textContent = "";

    if (!projects.length) {
        projectListStatus.textContent = "You have no maps yet. Create one to get started.";
        return;
    }
    projectListStatus.textContent = "";

    const fragment = document.createDocumentFragment();
    for (const project of projects) fragment.append(buildProjectCard(project));
    projectListContainer.append(fragment);
}

function showProjectMenu() {
    startMenu.style.display = "none";
    projectMenu.style.display = "block";
    canvas.style.display = "none";
    document.querySelector("html").classList.add("scroll");
    window.scrollTo(0, 0);
    refreshProjectList();
}

function hideProjectMenu() {
    projectMenu.style.display = "none";
    startMenu.style.display = "flex";
    canvas.style.display = "block";
    document.querySelector("html").classList.remove("scroll");
    window.scrollTo(0, 0);
}

newProjectButton.onclick = createNewProject;
backToProjectsMenuButton.onclick = hideProjectMenu;



function loadMap(record) {
    // Server maps are shared objects in loadedMaps; copy so that playing one
    // (which pads the map as you approach its edges) cannot corrupt the list.
    map = record.map.slice();
    player.hardRestart();
    stopEditingPublishedMap();
    currentProjectId = null;
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

// The map list is narrower than the window, so the start menu behind it stayed
// visible and you could still click Create while browsing maps. Swap the two
// rather than stacking them.
function showMapFinder() {
    startMenu.style.display = "none";
    mapFinderContainer.style.display = "block";
    // The list is narrower than the window, so without this the running game
    // (and its FPS readout) showed either side of it.
    canvas.style.display = "none";
    document.querySelector("html").classList.add("scroll");
    window.scrollTo(0, 0);
}

function hideMapFinder() {
    mapFinderContainer.style.display = "none";
    startMenu.style.display = "flex";
    canvas.style.display = "block";
    // Leaving this on left the page scrollable with nothing to scroll.
    document.querySelector("html").classList.remove("scroll");
    window.scrollTo(0, 0);
}

findButton.onclick = showMapFinder;

// A share link opens straight into the list. Clearing the filter is now the
// "Show all maps" button, so Back just closes the list like it does otherwise.
if(urlParams.get("map") || urlParams.get("user")) {
    findButton.click();
}


// Back undoes the step you actually took: out of a creator's maps first, and
// only then out of the map list entirely.
backButton.onclick = () => {
    if (viewIsFiltered()) setView({}, true);
    else hideMapFinder();
};

clearButton.onclick = () => {
    if(!confirm("Are you sure you want to clear the map?")) return;
    map = ["S", "#"];
    undoStack = [];
    redoStack = [];
    restartGame();
}

function saveMap() {
    unpadMap();
    // A no-op when nothing is open, e.g. saving while editing an
    // already-published map (currentProjectId is null there).
    updateProjectMap(currentProjectId, map);
}
saveButton.onclick = () => {
    saveMap();
}

publishButton.onclick = () => {
    publishMap();
}



goToMenuButton.onclick = () => {
    // Otherwise a publish started before leaving keeps polling in the
    // background, and re-entering the editor and flying to the win block
    // with editor tools fires it -- publishing without actually beating it.
    stopPublishWatcher(true);

    paused = true;
    pauseDisplay.style.display = "none";
    endRun();

    document.getElementById("side-buttons").style.display = "none";
    hideMapFinder();

    if(LEVEL_EDITOR_MODE) {
        saveMap();
    }

    // The start menu covers the whole screen, so these being left visible
    // never showed -- until a narrower panel (Find, or the project list) was
    // opened on top of it and the editor's bar peeked out from behind.
    helpButton.style.display = "none";
    saveButton.style.display = "none";
    publishButton.style.display = "none";
    clearButton.style.display = "none";
    blockSelectionBar.style.display = "none";
    document.getElementById('help-page-container').classList.remove('open');
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
