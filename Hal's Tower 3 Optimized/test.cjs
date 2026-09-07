// Run with: node "Hal's Tower 3 Optimized/test.cjs"
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const original = path.join(__dirname, "../Hal's Tower 3");

function game(optimized, saves = new Map()) {
    let now = 100000;
    let writes = 0;
    let resizes = 0;
    const callbacks = [];
    const listeners = {};
    const context = new Proxy({}, { get: (_, key) => key === 'measureText'
        ? () => ({width: 50}) : () => {} });
    const elements = new Map();
    function element(id) {
        if(!elements.has(id)) {
            let width = 800, height = 600;
            elements.set(id, {
                style: {}, classList: {toggle() {}}, getContext: () => context,
                get width() { return width; }, set width(value) { width = value; resizes++; },
                get height() { return height; }, set height(value) { height = value; resizes++; }
            });
        }
        return elements.get(id);
    }
    const sandbox = {
        console, Math, Image: class { complete = true; },
        Date: {now: () => now}, performance: {now: () => now - 100000},
        navigator: {userAgent: 'desktop'},
        localStorage: {
            getItem: key => saves.has(key) ? saves.get(key) : null,
            setItem: (key, value) => { saves.set(key, String(value)); writes++; }
        },
        document: {
            hidden: false, documentElement: {clientWidth: 800, clientHeight: 600},
            getElementById: element, addEventListener: (event, fn) => { listeners[event] = fn; }
        },
        requestAnimationFrame: fn => callbacks.push(fn),
        addEventListener() {}, setInterval() {}
    };
    sandbox.window = sandbox;
    const ctx = vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(original, 'map.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(optimized ? __dirname : original, 'app.js'), 'utf8'), ctx);
    return {
        run: code => vm.runInContext(code, ctx), saves, listeners, sandbox,
        time: value => { now = 100000 + value; },
        frame: value => { now = 100000 + value; assert.ok(callbacks.length); callbacks.shift()(value); },
        writes: () => writes, resizes: () => resizes
    };
}

function state(g) {
    return g.run(`JSON.stringify({player, map, projectiles, view})`);
}

// Compare unchanged gameplay at the original timer's effective 4 ms step.
const old = game(false), fast = game(true);
for(const g of [old, fast]) g.run('view.x = player.x - 400; view.y = player.y - 300;');
for(let tick = 1; tick <= 5000; tick++) {
    for(const g of [old, fast]) {
        g.time(tick * 4);
        g.run(`keys = {ArrowUp: true, ArrowRight: ${tick % 600 < 300}, ArrowLeft: ${tick % 600 >= 300}};`);
    }
    old.run('player.update(4); handlePlayerCollisions(player); updateMap(player, 4); updateView(player);');
    fast.run('updateLoop(4);');
    assert.equal(state(fast), state(old), `gameplay at tick ${tick}`);
}
assert.deepEqual(fast.saves, old.saves);

// Exercise every tile type at each collision edge, with either gravity and
// both jump states. Compare all player fields, projectiles, map and saves.
const types = old.run('Object.values(MAP_BLOCK_TYPES)');
for(const type of types) for(const gravity of [800, -800]) {
    for(const jump of [false, true]) for(const [x, y] of [[100, 76], [100, 149], [76, 100], [149, 100], [110, 110]]) {
        for(const g of [old, fast]) {
            g.run(`Object.assign(player, {x:${x}, y:${y}, gravity:${gravity}, yVel:${gravity / 4},
                xVel:10, speedUpTimer:0, highJumpTimer:0, gravityChangingTimer:0});
                keys = {ArrowUp:${jump}};
                collidePlayerWithBlock(player, ${JSON.stringify(type)}, 100, 100);`);
        }
        assert.equal(state(fast), state(old), `tile ${type}, gravity ${gravity}, jump ${jump}, ${x},${y}`);
        assert.deepEqual(fast.saves, old.saves);
    }
}

// Repeated checkpoint contact must not repeatedly write the same save.
fast.run("player.x = 110; player.y = 110; collidePlayerWithBlock(player, MAP_BLOCK_TYPES.checkpoint, 100, 100);");
const before = fast.writes();
fast.run('for(let i=0; i<1500; i++) collidePlayerWithBlock(player, MAP_BLOCK_TYPES.checkpoint, 100, 100);');
assert.equal(fast.writes(), before);
fast.run('player.gravity = -player.gravity; collidePlayerWithBlock(player, MAP_BLOCK_TYPES.checkpoint, 100, 100);');
assert.equal(fast.writes() - before, 3);

// Saves are interchangeable in both directions, including inverted gravity.
for(const optimized of [false, true]) {
    const loaded = game(optimized, new Map(fast.saves));
    assert.equal(loaded.run('player.spawnX'), Number(fast.saves.get('spawnX3')));
    assert.equal(loaded.run('player.gravity'), Number(fast.saves.get('gravity3')));
    assert.equal(loaded.run('player.deaths'), Number(fast.saves.get('deaths3')));
    assert.equal(loaded.run('JSON.stringify(player.acquiredCheckpoints)'), fast.saves.get('checkpoints3'));
}

// Display refresh rate must not change the number of physics steps or motion.
let reference;
for(const fps of [20, 30, 60, 120, 144]) {
    const g = game(true);
    g.run('startGame(); keys.ArrowUp = true;');
    g.frame(0);
    const initialResizes = g.resizes();
    for(let i=1; i<=fps*4; i++) g.frame(i*1000/fps);
    const snapshot = g.run('JSON.stringify({x:player.x, y:player.y, yVel:player.yVel, deaths:player.deaths})');
    if(reference) assert.equal(snapshot, reference, `${fps} FPS trajectory`);
    reference = snapshot;
    assert.equal(g.resizes(), initialResizes, 'canvas is not resized every frame');
    g.sandbox.document.documentElement.clientWidth = 1024;
    g.frame(4010);
    assert.equal(g.resizes(), initialResizes + 1);
    g.sandbox.document.hidden = true;
    g.listeners.visibilitychange();
    const position = g.run('player.y');
    g.frame(5000);
    g.sandbox.document.hidden = false;
    g.listeners.visibilitychange();
    g.frame(60000);
    assert.equal(g.run('player.y'), position, 'no background catch-up');
    g.frame(61000);
    assert.ok(g.run('accumulator < PHYSICS_STEP_MS'), 'bounded catch-up after a stall');
}

// All relative resources in the new entry page resolve to existing files.
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
for(const [, resource] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.ok(fs.existsSync(path.resolve(original, resource)), resource);
}
const originalHtml = fs.readFileSync(path.join(original, 'index.html'), 'utf8');
const prompt = originalHtml.match(/<script>([\s\S]*?)<\/script>/)[1];
for(const accept of [false, true]) {
    let destination;
    vm.runInNewContext(prompt, {
        confirm: message => { assert.match(message, /saved progress/); return accept; },
        location: {search: '?test=1', hash: '#test', replace: url => { destination = url; }}
    });
    assert.equal(destination, accept ? "../Hal's Tower 3 Optimized/?test=1#test" : undefined);
}
console.log('Passed: gameplay replay, every tile/gravity/jump collision, save compatibility, checkpoint writes, 20–144 FPS, resize, background/stall handling, asset paths, accept/cancel prompt.');
