
let musicFiles = [
    "music/Upward.mp3",
];

let startButton = document.getElementById("start-button");
let startMenu = document.getElementById("start-menu");
startButton.onclick = () => {
    startGame();
    startMenu.style.display = "none";

    let music = new Audio(musicFiles[0]);
    music.loop = true;
    music.volume = 0.3;
    music.play();
}