const SERVER_URL = "https://Samurai-Slasher-High-Scores.frothypizza.repl.co";

function post(url, body) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
}

const nameInput = document.getElementById("name-entry");
const highScoreOl = document.getElementById("high-scores");
let playerName = "";
nameInput.oninput = (val) => {
	playerName = nameInput.value;
}

function postScore(score) {
	if(!playerName) {
		console.log("no name");
		return;
	}
	console.log("Posting score");
	post(SERVER_URL + "/score", {
	    name: playerName,
	    score: score
	}).then(x => x.text()).then(console.log);
	fetchScores();
}

function fetchScores() {
	fetch(SERVER_URL + "/scores")
		.then(x => x.json())
		.then(x => {
			console.log(x);
			highScoreOl.innerHTML = "";
			x.forEach(s => {
				let li = document.createElement("li");
				li.innerHTML = `${s.name}: ${s.score}`
				highScoreOl.appendChild(li);
			})
		});
}

fetchScores();
setInterval(() => {
	fetchScores();
}, 5000);
