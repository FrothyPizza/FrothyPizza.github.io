const SERVER_URL = "https://hals-tower-editor-server.frothypizza.repl.co";

function post(url, body) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
}


// post(SERVER_URL + "/maps", {
//     name: "Cool",
//     creator: "Hal",
//     password: "good map",
//     map: [
//         " RRRRRRRRRRRRRRRRRRRRRRRRRRRRR",
//         "    C  R                     R",
//         "    #  RFfFfFf               R",
//         "    R  R R                   R",
//         "    R  R R    f              R",
//         "    R  R R       C           R",
//         "     B   R       #           R",
//         "     R   R                   R",
//         "     R   R                   R",
//         "      R  R            D *    R",
//         "      RB R                  S#",
//         "RRRRRRRRRRRRRRRRRRRRRRR RRRR##",
//         "                       U      "
//     ]   
//     // map: mapMain
// }).then(x => x.text()).then(console.log);

function publishMap() {
    if(!confirm("Are you sure you want to publish this map? It cannot be edited once uploaded, and you must beat it before it can be uploaded.")) return;
    
    player.hardRestart();
    LEVEL_EDITOR_MODE = false;
    flyMode = false;
    hideMenu();
    helpButton.style.display = "none";
    publishButton.style.display = "none";   
    saveButton.style.display = "none";
    blockSelectionBar.style.display = "none";
    clearButton.style.display = "none";
    document.getElementById("side-buttons").style.display = "none";
    document.getElementById('help-page-container').classList.remove('open');
    pauseGame(false);
    unpadMap();

    // wait until player.hasWon is true
    let interval = setInterval(() => {
        if(player.hasWon) {
            clearInterval(interval);

            let name = prompt("Congragulations for winning!\nWhat is the name of the map?");
            let creator = prompt("What is your name?");

            console.log("Posting");
    
            post(SERVER_URL + "/maps", {
                name: name,
                creator: creator,
                password: "abc",
                map: map
            }).then(x => x.text()).then((res) => {
                console.log(res);
                location.reload();
            });

            
        }
    }, 0);
}

// post(SERVER_URL + "/maps", {
//     name: "test0",
//     creator: "test2 user",
//     password: "password123",
//     map: [
//             "########",
//             "#   R  #",
//             "# R    #",
//             "#   R  #",
//             "########",
//             "#   R  #",
//             "########",
//             "#    R #",            
//             "#   R  #",
//             "########",
//             "#    R #",
//             "########",
//         ]
//     //map: mapMain
// });

if(!localStorage.getItem("votedMaps")) {
    localStorage.setItem("votedMaps", '');
}

let loadedMaps = [];
fetch(SERVER_URL + "/maps")
    .then(x => x.json())
    .then(x => {
        loadedMaps = x;
        // sort by upvotes
        loadedMaps.sort((a, b) => {
            return b.upvotes - a.upvotes;
        });

        document.getElementById("loaded-maps-container").innerHTML = "";
        //console.log(loadedMaps); 
        for(let i = 0; i < loadedMaps.length; i++) {
            let map = loadedMaps[i];
            //let map = testMap;

            let mapElement = document.createElement("div");
            mapElement.classList.add("map-container");
            mapElement.innerHTML = `
                <div class="upvote-container" id="${map.name + 'votecontainer'}">
                    <div class="vote-buttons">
                        <button class="upvote-button" id="${map.name + 'up'}">&uarr;</button>
                        <button class="downvote-button" id="${map.name + 'down'}">&darr;</button>
                    </div>
                    <p class="upvote-count" id="${map.name + 'votes'}">${map.upvotes - map.downvotes}</p>
                </div>
                <div class="map-info">
                    <h2 class="map-name">${map.name}</h2>
                    <p class="map-creator">${map.creator}</p>
                </div>
                <canvas id="map-${i}" width="${400}" height="${400}"></canvas>
            `;
            document.getElementById("loaded-maps-container").appendChild(mapElement);
            if(localStorage.getItem("votedMaps").includes(map.name)) {
                document.getElementById(`${map.name + 'up'}`).style.border = "none";
                document.getElementById(`${map.name + 'up'}`).style.color = "black";
                document.getElementById(`${map.name + 'down'}`).style.border = "none";
                document.getElementById(`${map.name + 'down'}`).style.color = "black";
            }

            document.getElementById(`map-${i}`).addEventListener("click", () => {
                loadMap(map);
            });

            document.getElementById(`${map.name + 'up'}`).addEventListener("click", () => {
                voteMap(map, 1);
            });

            document.getElementById(`${map.name + 'down'}`).addEventListener("click", () => {
                voteMap(map, -1);
            });


            //console.log(document.getElementById(`map-${i}`));
            drawMapOnSmallCanvas(document.getElementById(`map-${i}`), map.map);
        }

        
    });

function voteMap(map, vote) {
    if(!localStorage.getItem("votedMaps")) {
        localStorage.setItem("votedMaps", '');
    }

    if(localStorage.getItem("votedMaps").includes(map.name)) {
        return;
    }

    post(SERVER_URL + "/upvote", {
        name: map.name,
        vote: vote
    }).then(x => x.text()).then(console.log);

    localStorage.setItem("votedMaps", localStorage.getItem("votedMaps") + " " + map.name);

    let upvoteCount = document.getElementById(`${map.name + 'votes'}`);
    upvoteCount.innerHTML = parseInt(upvoteCount.innerHTML) + vote;
}
