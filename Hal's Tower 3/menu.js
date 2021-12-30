



let nowPlaying = document.getElementById("now-playing-container");
let nowPlayingText = document.getElementById("now-playing");
nowPlaying.style.opacity = 0;

let musicFiles = [
    {src: "music/Upward.mp3", name: "Upward", artist: "Ethan Hill"},
];



document.getElementById("skin-menu-button").onclick = () => {
    document.getElementById("skin-select-menu").classList.toggle("slide-in-from-top");
}

document.querySelectorAll(".skin").forEach(skin => {
    skin.onclick = () => {
        player.loadSkin(skin.src);
        document.getElementById("skin-select-menu").classList.toggle("slide-in-from-top");
    }
});

document.getElementById("side-buttons").style.display = "none";


let startButton = document.getElementById("start-button");
let startMenu = document.getElementById("start-menu");
startButton.onclick = () => {
    startGame();
    startMenu.style.display = "none";

    document.getElementById("side-buttons").style.display = "flex";

    let music = new Audio(musicFiles[0].src);
    music.loop = true;
    music.volume = 0.3;
    music.play();

    showNowPlaying(`<i>${musicFiles[0].name}</i> - ${musicFiles[0].artist}`, 5000);

}

let pauseButton = document.getElementById("pause-button");
pauseButton.onclick = () => {
    if(confirm("Are you sure you would like to restart the game?")) {
        localStorage.clear();
        location.reload();
    }   
}

function showNowPlaying(text, popupTime) {
    nowPlayingText.innerHTML = text;
    unfade(nowPlaying);
    setTimeout(() => {
        fade(nowPlaying);
    }, popupTime);

}


window.onload = () => {
    if(DEVELOPER_MODE) {
        startGame();
        startMenu.style.display = "none";
    }

    unfade(document.getElementById("hals-tower-3-image"), 0.03);
    setTimeout(() => {
        unfade(document.getElementById("start-button"), 1);
    }, 800);
}


document.addEventListener('keydown', event => {
    canvas.style.cursor = "none"; 
});

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
