const SERVER_URL = "https://Samurai-Slasher-High-Scores-1.frothypizza.repl.co";

function post(url, body) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
}

const highScoreOl = document.getElementById("high-scores"); 




function postScore(score) {
	if(!playerName) {
		console.log("no name");
		return;
	}
	// console.log("Posting score");
	post(SERVER_URL + "/score", {
	    name: playerName,
	    score: score
	});
	// }).then(x => x.text()).then(console.log);
	fetchScores();
}

function fetchScores() {
	fetch(SERVER_URL + "/scores")
		.then(x => x.json())
		.then(x => {
			// console.log(x);
			highScoreOl.innerHTML = "";
			x.forEach(s => {
				if(s.name.length > 40) s.name = s.name.substring(0, 40);
				let li = document.createElement("li");
				li.innerHTML = `${s.name}: ${s.score}`
				highScoreOl.appendChild(li);
			})
		});
}

let playerName = "";
// if(!localStorage.getItem("samname") 
// 	|| localStorage.getItem("samname") == ""
//     || localStorage.getItem("samname") == "undefined"
// 	|| localStorage.getItem("samname") == "null") {
// 	let name = prompt("Enter your name. It will PERMANENTLY be locked in.\nYou can (and should) have the same name on multiple devices.");
// 	localStorage.setItem("samname", name);
// 	playerName = name;
// } else {
// 	playerName = localStorage.getItem("samname");
// }
// if(localStorage.getItem("samhighscore")) {
// 	postScore(localStorage.getItem("samhighscore"));
// }
// fetchScores();
// setInterval(() => {
// 	fetchScores();
// }, 5000);

