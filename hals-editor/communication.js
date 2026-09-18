// Talks to the map server (hals-tower-editor-server).
//
// Set a different server without editing this file by running
//   localStorage.setItem("serverUrl", "http://localhost:3000")
// in the console. Clear it with localStorage.removeItem("serverUrl").

const DEFAULT_SERVER_URL = "https://hals-tower-editor-server-b1d4ea995624.herokuapp.com";
const SERVER_URL = (localStorage.getItem("serverUrl") || DEFAULT_SERVER_URL).replace(/\/+$/, "");

function post(url, body) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
}

// Reads the JSON body whether the request succeeded or not, so an error
// message from the server reaches the player instead of a generic failure.
async function requestJSON(url, options) {
    const response = await fetch(url, options);
    let body = null;
    try {
        const text = await response.text();
        body = text ? JSON.parse(text) : null;
    } catch (err) {
        body = null;
    }
    if (!response.ok) {
        const message = body && body.error ? body.error : `Server error (${response.status})`;
        throw new Error(message);
    }
    return body;
}

function postJSON(url, body) {
    return requestJSON(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
}

// Identifies this browser to the server so it can keep one vote per person per
// map. It is not a login -- it just means your votes survive and you can change
// your mind, instead of the old scheme where localStorage alone decided.
function getVoterToken() {
    let token = localStorage.getItem("voterToken");
    if (!token) {
        token = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
        localStorage.setItem("voterToken", token);
    }
    return token;
}

function getRememberedName() {
    return localStorage.getItem("playerName") || "";
}

function rememberName(name) {
    if (name) localStorage.setItem("playerName", name);
}

function formatTime(ms) {
    if (ms === null || ms === undefined) return "--:--";
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds - minutes * 60;
    return `${minutes}:${seconds.toFixed(2).padStart(5, '0')}`;
}


/* ------------------------------------------------------------------ *
 * Publishing
 * ------------------------------------------------------------------ */

// The old version started a 0 ms interval that polled forever and could never
// be cancelled, so backing out of a publish left it running for the rest of the
// session. This one polls at a sane rate and is cancellable.
let publishWatcher = null;

function cancelPublish(silent) {
    if (publishWatcher === null) return;
    clearInterval(publishWatcher);
    publishWatcher = null;
    if (!silent) showToast("Publish cancelled.");
    goToMenuButton.click();
}

function publishMap() {
    if (publishWatcher !== null) return;
    if (!confirm("Are you sure you want to publish this map?\n\nIt cannot be edited once uploaded, and you must beat it before it can be uploaded.")) return;

    saveMap();
    player.hardRestart();
    LEVEL_EDITOR_MODE = false;
    flyMode = false;
    hideMenu();
    helpButton.style.display = "none";
    publishButton.style.display = "none";
    saveButton.style.display = "none";
    blockSelectionBar.style.display = "none";
    clearButton.style.display = "none";
    document.getElementById('help-page-container').classList.remove('open');
    pauseGame(false);
    unpadMap();

    showToast("Beat your own map to publish it. Press Escape to cancel.", 6000);

    publishWatcher = setInterval(() => {
        if (!player.hasWon) return;

        clearInterval(publishWatcher);
        publishWatcher = null;

        const name = prompt("You beat it!\n\nWhat is this map called?");
        if (name === null) return cancelPublish(true);
        const creator = prompt("What is your name?", getRememberedName());
        if (creator === null) return cancelPublish(true);

        rememberName(creator);

        postJSON(SERVER_URL + "/maps", { name: name, creator: creator, map: map })
            .then(published => {
                alert(`"${published.name}" is published.`);
                // Drop back to the map list showing the new map rather than
                // reloading into the editor with the level still loaded.
                window.location.href = window.location.pathname + "?map=" + encodeURIComponent(published.name);
            })
            .catch(err => {
                alert("Could not publish: " + err.message);
                cancelPublish(true);
            });
    }, 100);
}

addKeyPressListener("Escape", () => {
    if (publishWatcher !== null) cancelPublish();
});


/* ------------------------------------------------------------------ *
 * Run timing and leaderboards
 * ------------------------------------------------------------------ */

let currentMapId = null;
let runStartedAt = null;
let runSubmitted = false;

// Starts the clock for a published map. Called from loadMap in menu.js.
function beginRun(mapRecord) {
    currentMapId = mapRecord.id === undefined ? null : mapRecord.id;
    runStartedAt = Date.now();
    runSubmitted = false;

    if (currentMapId !== null) {
        post(SERVER_URL + `/maps/${currentMapId}/play`, {}).catch(() => {});
    }
}

function endRun() {
    currentMapId = null;
    runStartedAt = null;
    runSubmitted = false;
}

// Polled from the game loop's win check. Submits once per run.
function submitRunIfWon() {
    if (runSubmitted || currentMapId === null || runStartedAt === null) return;
    if (!player.hasWon || LEVEL_EDITOR_MODE) return;

    runSubmitted = true;
    const timeMs = Date.now() - runStartedAt;
    const deaths = player.deaths;
    const mapId = currentMapId;

    // This is called from inside the draw pass. prompt() blocks, so let the
    // frame finish and the "YOU WIN!" text actually appear before asking.
    setTimeout(() => {
        const name = prompt(`You cleared it in ${formatTime(timeMs)} with ${deaths} death${deaths === 1 ? '' : 's'}!\n\nName for the leaderboard? (Cancel to skip)`, getRememberedName());
        if (name === null) return;
        rememberName(name);

        postJSON(SERVER_URL + `/maps/${mapId}/scores`, { player: name, timeMs: timeMs, deaths: deaths })
            .then(() => showToast("Score submitted."))
            .catch(err => showToast("Could not submit score: " + err.message, 5000));
    }, 0);
}

function getRunElapsedMs() {
    if (runStartedAt === null || currentMapId === null) return null;
    return Date.now() - runStartedAt;
}


/* ------------------------------------------------------------------ *
 * Map list
 * ------------------------------------------------------------------ */

// Each card draws a preview canvas of the whole map, and every map's block
// grid comes down with the list, so fetching all of them at once gets slow
// well before it gets expensive. Pull a page at a time instead.
const MAPS_PER_PAGE = 12;

let loadedMaps = [];
let myVotes = {};
let totalMaps = 0;

const mapsContainer = document.getElementById("loaded-maps-container");
const mapListStatus = document.getElementById("map-list-status");
const loadMoreButton = document.getElementById("load-more-button");
const searchInput = document.getElementById("map-search");
const sortSelect = document.getElementById("map-sort");

let urlParams = new URLSearchParams(window.location.search);

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    // textContent, never innerHTML: map names and creator names are typed by
    // players and used to be interpolated straight into markup.
    if (text !== undefined) node.textContent = text;
    return node;
}

let toastTimer = null;
function showToast(message, duration) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.style.display = "block";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.display = "none"; }, duration || 3000);
}

function buildMapCard(record) {
    const card = el("div", "map-container");

    /* --- votes --- */
    const voteContainer = el("div", "upvote-container");
    const voteButtons = el("div", "vote-buttons");
    const upButton = el("button", "upvote-button");
    upButton.innerHTML = "&uarr;";
    upButton.title = "Upvote";
    const downButton = el("button", "downvote-button");
    downButton.innerHTML = "&darr;";
    downButton.title = "Downvote";
    voteButtons.append(upButton, downButton);

    const voteCount = el("p", "upvote-count", String(record.score));
    voteContainer.append(voteButtons, voteCount);

    function paintVote() {
        const mine = myVotes[record.id] || 0;
        voteCount.textContent = String(record.score);
        upButton.classList.toggle("voted", mine === 1);
        downButton.classList.toggle("voted", mine === -1);
    }
    paintVote();

    // The server owns the totals. The old client guessed locally and never
    // reconciled, so two tabs or two devices disagreed forever.
    function castVote(direction) {
        upButton.disabled = downButton.disabled = true;
        postJSON(SERVER_URL + "/vote", {
            id: record.id,
            vote: direction,
            voter: getVoterToken()
        })
            .then(updated => {
                record.score = updated.score;
                record.upvotes = updated.upvotes;
                record.downvotes = updated.downvotes;
                myVotes[record.id] = updated.myVote;
                paintVote();
            })
            .catch(err => showToast("Vote failed: " + err.message))
            .finally(() => { upButton.disabled = downButton.disabled = false; });
    }

    upButton.addEventListener("click", () => castVote(1));
    downButton.addEventListener("click", () => castVote(-1));

    /* --- title block --- */
    const info = el("div", "map-info");
    info.append(el("h2", "map-name", record.name));

    const creatorLink = el("a", "map-creator", record.creator);
    creatorLink.href = "?user=" + encodeURIComponent(record.creator);
    creatorLink.title = "See every map by " + record.creator;
    info.append(creatorLink);

    const stats = el("p", "map-stats");
    stats.textContent = record.bestTimeMs === null
        ? "no clears yet"
        : `record ${formatTime(record.bestTimeMs)} by ${record.bestPlayer}`;
    info.append(stats);

    voteContainer.append(info);
    card.append(voteContainer);

    /* --- preview --- */
    const preview = document.createElement("canvas");
    preview.width = 400;
    preview.height = 400;
    preview.title = "Play " + record.name;
    card.append(preview);
    preview.addEventListener("click", () => loadMap(record));

    /* --- leaderboard --- */
    const actions = el("div", "map-actions");
    const scoresButton = el("button", "small-button", "Leaderboard");
    const shareButton = el("button", "small-button", "Copy link");
    actions.append(scoresButton, shareButton);
    card.append(actions);

    const board = el("div", "leaderboard");
    board.style.display = "none";
    card.append(board);

    let boardLoaded = false;
    scoresButton.addEventListener("click", () => {
        const showing = board.style.display !== "none";
        board.style.display = showing ? "none" : "block";
        if (showing || boardLoaded) return;

        board.textContent = "Loading...";
        requestJSON(SERVER_URL + `/maps/${record.id}/leaderboard`)
            .then(rows => {
                boardLoaded = true;
                board.textContent = "";
                if (!rows.length) {
                    board.append(el("p", "leaderboard-empty", "Nobody has cleared this yet."));
                    return;
                }
                const table = el("table", "leaderboard-table");
                for (const row of rows) {
                    const tr = document.createElement("tr");
                    tr.append(
                        el("td", "lb-rank", "#" + row.rank),
                        el("td", "lb-player", row.player),
                        el("td", "lb-time", formatTime(row.timeMs)),
                        el("td", "lb-deaths", row.deaths + "d")
                    );
                    table.append(tr);
                }
                board.append(table);
            })
            .catch(err => { board.textContent = "Could not load scores: " + err.message; });
    });

    shareButton.addEventListener("click", () => {
        const link = location.origin + location.pathname +
            "?map=" + encodeURIComponent(record.name) +
            "&user=" + encodeURIComponent(record.creator);
        navigator.clipboard.writeText(link)
            .then(() => showToast("Link copied."))
            .catch(() => showToast(link, 8000));
    });

    // drawMapOnSmallCanvas borrows the global map/view/context, so it has to
    // run after the canvas is in the document and sized.
    drawMapOnSmallCanvas(preview, record.map);

    return card;
}

// Appends one page's worth of cards rather than rebuilding the list, so the
// previews already on screen are not redrawn every time you load more.
function appendMapCards(records) {
    const fragment = document.createDocumentFragment();
    for (const record of records) fragment.append(buildMapCard(record));
    mapsContainer.append(fragment);
}

function paintListStatus() {
    if (!totalMaps) {
        mapListStatus.textContent = "No maps found.";
        loadMoreButton.style.display = "none";
        return;
    }
    mapListStatus.textContent = loadedMaps.length < totalMaps
        ? `Showing ${loadedMaps.length} of ${totalMaps} maps`
        : `${totalMaps} map${totalMaps === 1 ? '' : 's'}`;
    loadMoreButton.style.display = loadedMaps.length < totalMaps ? "inline-block" : "none";
}

function listQuery() {
    const query = new URLSearchParams();
    query.set("sort", sortSelect.value);
    if (searchInput.value.trim()) query.set("q", searchInput.value.trim());
    // Share links pin the list to one creator or one map.
    if (urlParams.get("user")) query.set("user", urlParams.get("user"));
    if (urlParams.get("map")) query.set("map", urlParams.get("map"));
    return query;
}

// Reads the page and the match count together. The count is a header so the
// body stays a plain array, which is what the old server returned.
async function fetchMapPage(offset) {
    const query = listQuery();
    query.set("limit", String(MAPS_PER_PAGE));
    query.set("offset", String(offset));

    const response = await fetch(SERVER_URL + "/maps?" + query.toString());
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch (err) { body = null; }
    if (!response.ok) {
        throw new Error(body && body.error ? body.error : `Server error (${response.status})`);
    }

    const header = response.headers.get("X-Total-Count");
    return {
        maps: body || [],
        // An older server sends no header; fall back to what we can see.
        total: header === null ? offset + (body ? body.length : 0) : Number(header)
    };
}

// Bumped on every refresh so a slow earlier request cannot overwrite a newer
// one's results, and so a "load more" from a stale filter is discarded.
let refreshToken = 0;

function refreshMaps() {
    const token = ++refreshToken;
    mapsContainer.textContent = "";
    loadedMaps = [];
    totalMaps = 0;
    mapListStatus.textContent = "Loading maps...";
    loadMoreButton.style.display = "none";

    Promise.all([
        fetchMapPage(0),
        requestJSON(SERVER_URL + "/votes?voter=" + encodeURIComponent(getVoterToken())).catch(() => ({}))
    ])
        .then(([page, votes]) => {
            if (token !== refreshToken) return;
            loadedMaps = page.maps;
            totalMaps = page.total;
            myVotes = votes || {};
            appendMapCards(page.maps);
            paintListStatus();
        })
        .catch(err => {
            if (token !== refreshToken) return;
            mapListStatus.textContent = "Could not reach the map server: " + err.message;
        });
}

function loadMoreMaps() {
    const token = refreshToken;
    loadMoreButton.disabled = true;
    loadMoreButton.textContent = "Loading...";

    fetchMapPage(loadedMaps.length)
        .then(page => {
            if (token !== refreshToken) return;
            loadedMaps = loadedMaps.concat(page.maps);
            totalMaps = page.total;
            appendMapCards(page.maps);
            paintListStatus();
        })
        .catch(err => showToast("Could not load more maps: " + err.message))
        .finally(() => {
            loadMoreButton.disabled = false;
            loadMoreButton.textContent = "Load more";
        });
}

loadMoreButton.addEventListener("click", loadMoreMaps);

let searchDebounce = null;
searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(refreshMaps, 250);
});
sortSelect.addEventListener("change", refreshMaps);

document.getElementById("clear-filter-button").addEventListener("click", () => {
    window.location.href = window.location.pathname;
});

// Only show the "showing one creator / one map" notice when a share link put
// us there.
if (urlParams.get("user") || urlParams.get("map")) {
    const filter = document.getElementById("map-filter-notice");
    filter.style.display = "flex";
    document.getElementById("map-filter-text").textContent =
        urlParams.get("user")
            ? "Maps by " + urlParams.get("user")
            : "Map: " + urlParams.get("map");
}

refreshMaps();
