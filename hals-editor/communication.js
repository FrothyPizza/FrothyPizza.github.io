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

// Usage events the server cannot observe for itself. Plays, clears, publishes
// and votes are recorded by the routes that perform them, so they are not sent
// from here. Fire-and-forget: analytics must never interrupt the game.
function trackEvent(type, extra) {
    post(SERVER_URL + "/events",
        Object.assign({ type: type, client: getVoterToken() }, extra || {}))
        .catch(() => {});
}

// Which maps this browser published. Only used to decide whether to offer an
// Edit button -- the password is what actually authorises the edit, because
// anyone can put anything in localStorage.
function getMyMapIds() {
    try {
        const saved = JSON.parse(localStorage.getItem("myMaps"));
        return Array.isArray(saved) ? saved.filter(n => typeof n === "number") : [];
    } catch (err) {
        return [];
    }
}

function rememberMyMap(id) {
    const ids = getMyMapIds();
    if (ids.includes(id)) return;
    ids.push(id);
    try {
        localStorage.setItem("myMaps", JSON.stringify(ids));
    } catch (err) { /* private browsing; the password still works */ }
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

// Set while editing an already-published map, so the same "beat it to save"
// flow updates that map instead of creating a new one.
let editingMap = null;      // { id, name, password }

function isEditingPublishedMap() {
    return editingMap !== null;
}

function cancelPublish(silent) {
    if (publishWatcher === null) return;
    clearInterval(publishWatcher);
    publishWatcher = null;
    if (!silent) showToast("Publish cancelled.");
    goToMenuButton.click();
}

// Loads a published map back into the editor. The server checks the password
// before anything opens, so a faked localStorage entry gets you as far as the
// prompt and no further.
function editPublishedMap(record) {
    const password = prompt(`Enter the edit password for "${record.name}".`);
    if (password === null) return;
    if (!password) return showToast("You need the password to edit this map.");

    postJSON(SERVER_URL + `/maps/${record.id}/unlock`, { password: password })
        .then(unlocked => {
            editingMap = { id: unlocked.id, name: unlocked.name, password: password };
            map = unlocked.map.slice();
            endRun();
            restartGame();
            helpButton.style.display = "block";
            saveButton.style.display = "block";
            publishButton.style.display = "block";
            clearButton.style.display = "block";
            blockSelectionBar.style.display = "flex";
            LEVEL_EDITOR_MODE = true;
            hideMenu();
            publishButton.textContent = "Save";
            showToast(`Editing "${unlocked.name}". Saving replaces the published version.`, 6000);
        })
        .catch(err => showToast(err.message, 5000));
}

function stopEditingPublishedMap() {
    editingMap = null;
    publishButton.textContent = "Publish";
}

function publishMap() {
    if (publishWatcher !== null) return;
    if (isEditingPublishedMap()) {
        if (!confirm(`Save changes to "${editingMap.name}"?\n\nThis replaces the published version, and you have to beat it again first. Votes and leaderboard times are kept.`)) return;
    } else {
        if (!confirm("Are you sure you want to publish this map?\n\nYou must beat it before it can be uploaded.")) return;
    }

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

    showToast(
        isEditingPublishedMap()
            ? "Beat your edited map to save it. Press Escape to cancel."
            : "Beat your own map to publish it. Press Escape to cancel.",
        6000);

    publishWatcher = setInterval(() => {
        if (!player.hasWon) return;

        clearInterval(publishWatcher);
        publishWatcher = null;

        if (isEditingPublishedMap()) {
            const newName = prompt("You beat it!\n\nMap name:", editingMap.name);
            if (newName === null) return cancelPublish(true);

            postJSON(SERVER_URL + `/maps/${editingMap.id}/update`,
                { password: editingMap.password, map: map, name: newName,
                  client: getVoterToken() })
                .then(updated => {
                    alert(`"${updated.name}" has been updated.`);
                    stopEditingPublishedMap();
                    window.location.href = window.location.pathname +
                        "?map=" + encodeURIComponent(updated.name);
                })
                .catch(err => {
                    alert("Could not save: " + err.message);
                    cancelPublish(true);
                });
            return;
        }

        const name = prompt("You beat it!\n\nWhat is this map called?");
        if (name === null) return cancelPublish(true);
        const creator = prompt("What is your name?", getRememberedName());
        if (creator === null) return cancelPublish(true);

        // Optional on purpose: a blank password just means the map can never
        // be edited, which is how it behaved for everyone before this.
        const password = prompt(
            "Set an edit password for this map." + "\n\n" +
            "You need it to change the map later. Leave blank if you never want to edit it.");
        if (password === null) return cancelPublish(true);

        rememberName(creator);

        postJSON(SERVER_URL + "/maps",
            { name: name, creator: creator, map: map,
              password: password || undefined, client: getVoterToken() })
            .then(published => {
                if (published.editable) rememberMyMap(published.id);
                alert(published.editable
                    ? `"${published.name}" is published. Keep your password to edit it later.`
                    : `"${published.name}" is published. You set no password, so it cannot be edited.`);
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
        post(SERVER_URL + `/maps/${currentMapId}/play`, { client: getVoterToken() }).catch(() => {});
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

    // Report the clear now, not from the leaderboard submission: plenty of
    // people beat a map and then cancel the name prompt, and counting only
    // named submissions would make the completion rate look far worse than
    // it is.
    trackEvent("map_clear", { mapId: mapId, timeMs: timeMs, deaths: deaths });

    // This is called from inside the draw pass. prompt() blocks, so let the
    // frame finish and the "YOU WIN!" text actually appear before asking.
    setTimeout(() => {
        const name = prompt(`You cleared it in ${formatTime(timeMs)} with ${deaths} death${deaths === 1 ? '' : 's'}!\n\nName for the leaderboard? (Cancel to skip)`, getRememberedName());
        if (name === null) return;
        rememberName(name);

        postJSON(SERVER_URL + `/maps/${mapId}/scores`,
            { player: name, timeMs: timeMs, deaths: deaths, client: getVoterToken() })
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
const browserTitle = document.getElementById("map-browser-title");
const breadcrumb = document.getElementById("map-breadcrumb");

let urlParams = new URLSearchParams(window.location.search);

// Where in the list you are. Previously this lived only in the URL and a
// click on a creator reloaded the whole page, so you lost your place and the
// heading always said "Select a map" no matter what you were looking at.
const listView = {
    user: urlParams.get("user") || "",
    map: urlParams.get("map") || ""
};

function viewIsFiltered() {
    return !!(listView.user || listView.map);
}

// Moves to a new view without reloading, and records it in history so the
// browser's own Back button walks back out of a creator's maps.
function setView(next, push) {
    listView.user = next.user || "";
    listView.map = next.map || "";

    const query = new URLSearchParams();
    if (listView.user) query.set("user", listView.user);
    if (listView.map) query.set("map", listView.map);
    const url = window.location.pathname + (query.toString() ? "?" + query.toString() : "");
    if (push) history.pushState({ user: listView.user, map: listView.map }, "", url);
    else history.replaceState({ user: listView.user, map: listView.map }, "", url);

    paintNavigation();
    refreshMaps();
}

window.addEventListener("popstate", event => {
    const state = event.state || {};
    listView.user = state.user || "";
    listView.map = state.map || "";
    paintNavigation();
    refreshMaps();
});

// Heading, breadcrumb and Back button all say the same thing about where you
// are, so a filtered list no longer looks identical to the full one.
function paintNavigation() {
    // menu.js declares `backButton` and loads after this file, so referencing
    // that name here would hit its temporal dead zone.
    const backBtn = document.getElementById("back-to-start-button");
    breadcrumb.textContent = "";

    if (!viewIsFiltered()) {
        browserTitle.textContent = "All maps";
        backBtn.innerHTML = "&larr; Menu";
        backBtn.title = "Back to the main menu";
        return;
    }

    const root = el("a", "crumb-link", "All maps");
    root.href = window.location.pathname;
    root.addEventListener("click", e => {
        e.preventDefault();
        setView({}, true);
    });
    breadcrumb.append(root, el("span", "crumb-sep", " › "));

    if (listView.map) {
        browserTitle.textContent = listView.map;
        breadcrumb.append(el("span", "crumb-current", listView.map));
    } else {
        browserTitle.textContent = "Maps by " + listView.user;
        breadcrumb.append(el("span", "crumb-current", "by " + listView.user));
    }

    // Back should undo the step you actually took, not jump to the menu.
    backBtn.innerHTML = "&larr; All maps";
    backBtn.title = "Back to every map";
}

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
    // Votes and title are siblings in one flex row; nesting the title inside
    // the vote container is what made them overlap.
    const header = el("div", "map-header");

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
    creatorLink.addEventListener("click", e => {
        // Filter in place instead of reloading the page.
        e.preventDefault();
        searchInput.value = "";
        setView({ user: record.creator }, true);
    });
    info.append(creatorLink);

    const stats = el("p", "map-stats");
    stats.textContent = record.bestTimeMs === null
        ? "no clears yet"
        : `record ${formatTime(record.bestTimeMs)} by ${record.bestPlayer}`;
    info.append(stats);

    header.append(voteContainer, info);
    card.append(header);

    /* --- preview --- */
    // Shape the preview to the map instead of always being square: a square
    // buffer left a wide map floating in a band of empty card.
    const preview = document.createElement("canvas");
    const cols = record.map[0].length;
    const rows = record.map.length;
    const scale = Math.min(400 / cols, 400 / rows);
    // Towers are tall and narrow, so clamp before a preview becomes a sliver.
    preview.width = Math.max(80, Math.round(cols * scale));
    preview.height = Math.max(80, Math.round(rows * scale));
    preview.title = "Play " + record.name;
    card.append(preview);
    preview.addEventListener("click", () => loadMap(record));

    /* --- leaderboard --- */
    const actions = el("div", "map-actions");
    const scoresButton = el("button", "small-button", "Leaderboard");
    const shareButton = el("button", "small-button", "Copy link");
    actions.append(scoresButton, shareButton);
    // Offered only on maps this browser published. The password is what
    // actually authorises the edit, so the worst a faked localStorage entry
    // buys you is a prompt.
    if (record.editable && getMyMapIds().includes(record.id)) {
        const editButton = el("button", "small-button", "Edit");
        editButton.title = "Edit this map (needs your password)";
        editButton.addEventListener("click", () => editPublishedMap(record));
        actions.append(editButton);
    }

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
    // Share links and creator clicks pin the list to one creator or one map.
    if (listView.user) query.set("user", listView.user);
    if (listView.map) query.set("map", listView.map);
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

trackEvent("session_start");

paintNavigation();
setView({ user: listView.user, map: listView.map }, false);
