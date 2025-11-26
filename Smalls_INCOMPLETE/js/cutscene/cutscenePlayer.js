// Simple timeline-driven cutscene runner that plays serialized action lists
// The runner intentionally keeps logic minimal so new actions can be added quickly.

const Cutscene = (() => {
    const clamp01 = (value) => Math.max(0, Math.min(1, value));
    const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);
    const fallbackCanvasWidth = typeof WIDTH === 'number' ? WIDTH : 240;
    const fallbackCanvasHeight = typeof HEIGHT === 'number' ? HEIGHT : 160;

    const drawFallbackDialogue = (context, overlay) => {
        if (!context || !overlay) {
            return;
        }
        const defaults = {
            x: 4,
            y: fallbackCanvasHeight - 40,
            width: fallbackCanvasWidth - 8,
            height: 36,
            padding: 4,
            background: 'rgba(0, 0, 0, 0.75)',
            borderColor: 'white',
            borderWidth: 1,
            textColor: '#ffffff'
        };
        const box = { ...defaults, ...(overlay.box || {}) };
        context.save();
        context.fillStyle = box.background;
        context.fillRect(box.x, box.y, box.width, box.height);
        if (box.borderWidth > 0) {
            context.strokeStyle = box.borderColor;
            context.lineWidth = box.borderWidth;
            context.strokeRect(box.x, box.y, box.width, box.height);
        }
        const textX = box.x + box.padding;
        let cursorY = box.y + box.padding + 8;
        context.fillStyle = box.textColor;
        context.font = '8px monospace';
        if (overlay.speaker) {
            context.fillText(`${overlay.speaker}:`, textX, cursorY);
            cursorY += 10;
        }
        const availableWidth = box.width - box.padding * 2;
        const words = `${overlay.text || ''}`.split(' ');
        let currentLine = '';
        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            context.font = '8px monospace';
            const metrics = context.measureText(testLine);
            if (metrics.width > availableWidth && currentLine) {
                context.fillText(currentLine, textX, cursorY);
                cursorY += 10;
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine) {
            context.fillText(currentLine, textX, cursorY);
        }
        context.restore();
    };

    const noopHandler = () => ({
        update: () => true
    });

    const normalizeScript = (raw) => {
        if (!raw) {
            return { actions: [], requires: [], blockGameplay: true, meta: {} };
        }

        if (Array.isArray(raw)) {
            return { actions: raw, requires: [], blockGameplay: true, meta: {} };
        }

        const actions = raw.actions || raw.steps || raw.timeline || [];
        const requires = raw.requires || raw.entities || raw.refs || raw.entityRefs || [];
        return {
            actions: Array.isArray(actions) ? actions : [],
            requires: Array.isArray(requires) ? requires : Object.keys(requires || {}),
            blockGameplay: raw.blockGameplay !== false,
            meta: raw.meta || raw.metadata || {},
            fadeColor: raw.fadeColor
        };
    };

    const ensureType = (action) => {
        if (!action) {
            return null;
        }
        if (!action.type && action.action) {
            action.type = action.action;
        }
        return action.type ? action : null;
    };

    const samplePath = (path, time) => {
        if (!path.length) {
            return null;
        }
        const first = path[0];
        const last = path[path.length - 1];
        if (time <= (first.t || 0)) {
            return { x: first.x, y: first.y };
        }
        for (let i = 0; i < path.length - 1; i++) {
            const start = path[i];
            const end = path[i + 1];
            const startT = start.t || 0;
            const endT = end.t || startT + 1;
            if (time <= endT) {
                const span = endT - startT;
                const ratio = span === 0 ? 1 : (time - startT) / span;
                return {
                    x: start.x + (end.x - start.x) * ratio,
                    y: start.y + (end.y - start.y) * ratio
                };
            }
        }
        return { x: last.x, y: last.y };
    };

    const getEntity = (player, refName) => {
        if (!refName) {
            return null;
        }
        if (!player.entityRefs[refName]) {
            console.warn(`[Cutscene] Missing entity reference "${refName}"`);
            return null;
        }
        return player.entityRefs[refName];
    };

    const actionFactories = {
        addStunnedBirds: (player, action) => {
            const helper = ECS?.Helpers?.addStunnedBirdsToEntity;
            if (typeof helper !== 'function') {
                console.warn('[Cutscene] addStunnedBirds action requires ECS.Helpers.addStunnedBirdsToEntity.');
                return noopHandler();
            }
            const entity = getEntity(player, action.entity);
            if (!entity) {
                return noopHandler();
            }
            const scene = player.options?.scene || null;
            return {
                fired: false,
                update() {
                    if (this.fired) {
                        return true;
                    }
                    helper(entity, scene);
                    this.fired = true;
                    return true;
                }
            };
        },
        addComponent: (player, action) => {
            const entity = getEntity(player, action.entity);
            if (!entity) {
                return noopHandler();
            }
            return {
                fired: false,
                update() {
                    if (this.fired) {
                        return true;
                    }
                    const componentName = action.component;
                    if (typeof ECS !== 'undefined' && ECS.Components && ECS.Components[componentName]) {
                        const ComponentClass = ECS.Components[componentName];
                        const args = Array.isArray(action.args) ? action.args : (action.args !== undefined ? [action.args] : []);
                        entity.addComponent(new ComponentClass(...args));
                    } else {
                        console.warn(`[Cutscene] Component "${componentName}" not found.`);
                    }
                    this.fired = true;
                    return true;
                }
            };
        },
        wait: (player, action) => {
            const duration = Math.max(0, action.duration || action.frames || 0);
            return {
                elapsed: 0,
                update(delta) {
                    this.elapsed += delta;
                    return this.elapsed >= duration;
                }
            };
        },
        fade: (player, action) => {
            const duration = Math.max(1, action.duration || 30);
            const hold = Math.max(0, action.hold || 0);
            const fadeState = player.effects.fade;
            const startAlpha = typeof action.from === 'number' ? clamp01(action.from) : fadeState.alpha;
            const dir = action.direction || action.dir || (fadeState.alpha > 0.5 ? 'in' : 'out');
            const targetAlpha = typeof action.to === 'number'
                ? clamp01(action.to)
                : dir === 'in'
                    ? 0
                    : 1;
            const color = action.color || fadeState.color || '#000000';
            fadeState.color = color;
            return {
                elapsed: 0,
                update(delta) {
                    this.elapsed += delta;
                    const progress = clamp01(this.elapsed / duration);
                    fadeState.alpha = startAlpha + (targetAlpha - startAlpha) * progress;
                    if (this.elapsed >= duration + hold) {
                        fadeState.alpha = targetAlpha;
                        return true;
                    }
                    return false;
                }
            };
        },
        move: (player, action) => {
            const entity = getEntity(player, action.entity);
            if (!entity || !entity.Position) {
                return noopHandler();
            }
            const path = action.path || [];
            if (path.length < 2) {
                return noopHandler();
            }
            const origin = action.relative
                ? { x: entity.Position.x, y: entity.Position.y }
                : { x: 0, y: 0 };
                const adjustedPath = path
                    .map((point) => ({
                x: point.x + origin.x,
                y: point.y + origin.y,
                t: point.t || 0
                    }))
                    .sort((a, b) => (a.t || 0) - (b.t || 0));
            const totalDuration = adjustedPath[adjustedPath.length - 1].t || action.duration;
            if (!totalDuration) {
                console.warn('[Cutscene] Move action missing duration/path timing.');
                return noopHandler();
            }
            return {
                elapsed: 0,
                update(delta) {
                    this.elapsed = Math.min(totalDuration, this.elapsed + delta);
                    const sample = samplePath(adjustedPath, this.elapsed);
                    if (!sample) {
                        return true;
                    }
                    entity.Position.x = sample.x;
                    entity.Position.y = sample.y;
                    if (entity.Velocity) {
                        const prev = samplePath(adjustedPath, Math.max(0, this.elapsed - 1));
                        if (prev) {
                            entity.Velocity.x = sample.x - prev.x;
                            entity.Velocity.y = sample.y - prev.y;
                        }
                    }
                    return this.elapsed >= totalDuration;
                }
            };
        },
        moveOverride: (player, action) => {
            const entity = getEntity(player, action.entity);
            if (!entity || !entity.Position) {
                return noopHandler();
            }
            let path = action.path || [];
            
            // Handle single-point path (implicit start at t=0)
            if (path.length === 1) {
                if (action.relative) {
                    path = [{ x: 0, y: 0, t: 0 }, path[0]];
                } else {
                    path = [{ x: entity.Position.x, y: entity.Position.y, t: 0 }, path[0]];
                }
            }

            if (path.length < 2) {
                return noopHandler();
            }
            const origin = action.relative
                ? { x: entity.Position.x, y: entity.Position.y }
                : { x: 0, y: 0 };
            const adjustedPath = path
                .map((point) => ({
                    x: point.x + origin.x,
                    y: point.y + origin.y,
                    t: point.t || 0
                }))
                .sort((a, b) => (a.t || 0) - (b.t || 0));
            const totalDuration = adjustedPath[adjustedPath.length - 1].t || action.duration;
            if (!totalDuration) {
                console.warn('[Cutscene] MoveOverride action missing duration/path timing.');
                return noopHandler();
            }
            return {
                elapsed: 0,
                update(delta) {
                    this.elapsed = Math.min(totalDuration, this.elapsed + delta);
                    const sample = samplePath(adjustedPath, this.elapsed);
                    if (!sample) {
                        return true;
                    }
                    entity.Position.x = sample.x;
                    entity.Position.y = sample.y;
                    entity.Position.lastPos.x = sample.x;
                    entity.Position.lastPos.y = sample.y;
                    if (entity.Velocity) {
                        entity.Velocity.x = 0;
                        entity.Velocity.y = 0;
                    }
                    return this.elapsed >= totalDuration;
                }
            };
        },
        setVelocity: (player, action) => {
            const entity = getEntity(player, action.entity);
            if (!entity || !entity.Velocity) {
                return noopHandler();
            }
            const amount = action.amount || action.value || {};
            return {
                update() {
                    entity.Velocity.x = amount.x !== undefined ? amount.x : entity.Velocity.x;
                    entity.Velocity.y = amount.y !== undefined ? amount.y : entity.Velocity.y;
                    return true;
                }
            };
        },
        setAnimation: (player, action) => {
            const entity = getEntity(player, action.entity);
            if (!entity || !entity.AnimatedSprite) {
                return noopHandler();
            }
            const sprite = entity.AnimatedSprite;
            return {
                update() {
                    const animationName = action.animation || action.anim || action.state;
                    if (animationName) {
                        sprite.setAnimation(animationName);
                        if (action.restart) {
                            sprite.restartAnimation?.();
                        }
                    }

                    const baseFps = typeof APP_FPS === 'number' && APP_FPS > 0 ? APP_FPS : 60;
                    const toNumber = (value) => (isFiniteNumber(value) ? value : null);
                    const explicitSpeed = toNumber(action.speed ?? action.frameDelay ?? action.delay);
                    const fpsTarget = toNumber(action.fps ?? action.framesPerSecond);
                    const multiplier = toNumber(action.speedMultiplier ?? action.playbackRate ?? action.rate);
                    const hidden = action.hidden === true || action.hide === true;
                    sprite.hidden = hidden;

                    if (fpsTarget !== null && fpsTarget > 0) {
                        sprite.animationSpeed = Math.max(0.1, baseFps / fpsTarget);
                    }

                    if (explicitSpeed !== null) {
                        sprite.animationSpeed = Math.max(0.1, explicitSpeed);
                    }

                    if (multiplier !== null && multiplier !== 0) {
                        sprite.animationSpeed = Math.max(0.1, sprite.animationSpeed / multiplier);
                    }

                    if (action.pause === true) {
                        sprite.paused = true;
                    } else if (action.pause === false || action.resume === true) {
                        sprite.paused = false;
                    }

                    if (action.direction !== undefined) {
                        const dir = action.direction;
                        if (dir === 'left' || dir === -1) {
                            sprite.direction = -1;
                        } else if (dir === 'right' || dir === 1) {
                            sprite.direction = 1;
                        }
                    }

                    return true;
                }
            };
        },
        shakeOnce: (player, action) => ({
            fired: false,
            update() {
                if (!this.fired && typeof shakeScreen === 'function') {
                    shakeScreen(action.amount || 5);
                }
                this.fired = true;
                return true;
            }
        }),
        dialogue: (player, action) => {
            const hold = Math.max(0, action.hold || 120);
            return {
                holdElapsed: 0,
                fired: false,
                update(delta) {
                    if (!this.fired) {
                        const payload = {
                            text: action.text || '',
                            speaker: action.speaker || action.entity || null,
                            portrait: action.portrait || null
                        };
                        player.emit('dialogue', payload);
                        player.setDialogueOverlay(payload, action);
                        this.fired = true;
                    }
                    const fullyRevealed = player.advanceDialogueTypewriter(delta);
                    if (!fullyRevealed) {
                        return false;
                    }
                    this.holdElapsed += delta;
                    if (this.holdElapsed >= hold) {
                        player.clearDialogueOverlay();
                        return true;
                    }
                    return false;
                }
            };
        }
    };

    class CutscenePlayer {
        constructor(script, entityRefs = {}, options = {}) {
            this.script = normalizeScript(script);
            this.actions = this.script.actions
                .map((action) => (action ? { ...action } : null))
                .map(ensureType)
                .filter(Boolean);
            this.entityRefs = { ...entityRefs };
            this.options = options;
            this.effects = {
                fade: {
                    alpha: typeof options.initialFadeAlpha === 'number'
                        ? clamp01(options.initialFadeAlpha)
                        : 0,
                    color: this.script.fadeColor || options.fadeColor || '#000000'
                }
            };
            this.blocksGameplay = this.script.blockGameplay !== false;
            const baseWidth = typeof WIDTH === 'number' ? WIDTH : fallbackCanvasWidth;
            const baseHeight = typeof HEIGHT === 'number' ? HEIGHT : fallbackCanvasHeight;
            this.dialogueDefaults = {
                x: 4,
                y: baseHeight - 40,
                width: baseWidth - 8,
                height: 36,
                padding: 4,
                lineGap: 1,
                background: 'rgba(0, 0, 0, 0.75)',
                borderColor: 'white',
                borderWidth: 1,
                textColor: '#ffffff',
                speakerColor: '#ffdf73',
                align: 'left',
                highlight: ''
            };
            if (options.dialogueBoxDefaults) {
                this.dialogueDefaults = { ...this.dialogueDefaults, ...options.dialogueBoxDefaults };
            }
            this.dialogueOverlay = null;
            this.currentIndex = -1;
            this.currentHandler = null;
            this.finished = false;
            this.listeners = options.listeners || {};
            this.validateEntityRefs();
        }

        validateEntityRefs() {
            if (!this.script.requires.length) {
                return;
            }
            this.script.requires.forEach((name) => {
                if (!this.entityRefs[name]) {
                    console.warn(`[Cutscene] Expected entity ref "${name}" was not provided.`);
                }
            });
        }

        bindEntities(refs) {
            this.entityRefs = { ...this.entityRefs, ...refs };
            this.validateEntityRefs();
        }

        setDialogueOverlay(payload, action = {}) {
            const boxOverrides = action.box || action.textBox || {};
            const legacyOverrides = {};
            if (isFiniteNumber(action.boxX)) legacyOverrides.x = action.boxX;
            if (isFiniteNumber(action.boxY)) legacyOverrides.y = action.boxY;
            if (isFiniteNumber(action.boxWidth)) legacyOverrides.width = action.boxWidth;
            if (isFiniteNumber(action.boxHeight)) legacyOverrides.height = action.boxHeight;
            const styleKeys = ['padding', 'lineGap', 'background', 'borderColor', 'borderWidth', 'textColor', 'speakerColor', 'align', 'highlight'];
            const styleOverrides = {};
            styleKeys.forEach((key) => {
                if (action[key] !== undefined) {
                    styleOverrides[key] = action[key];
                }
            });
            const box = {
                ...this.dialogueDefaults,
                ...boxOverrides,
                ...legacyOverrides,
                ...styleOverrides
            };
            box.x = isFiniteNumber(box.x) ? box.x : this.dialogueDefaults.x;
            box.y = isFiniteNumber(box.y) ? box.y : this.dialogueDefaults.y;
            box.width = Math.max(8, isFiniteNumber(box.width) ? box.width : this.dialogueDefaults.width);
            box.height = Math.max(8, isFiniteNumber(box.height) ? box.height : this.dialogueDefaults.height);
            box.padding = Math.max(0, isFiniteNumber(box.padding) ? box.padding : this.dialogueDefaults.padding);
            box.lineGap = isFiniteNumber(box.lineGap) ? box.lineGap : this.dialogueDefaults.lineGap;
            if (!['left', 'center', 'right'].includes(box.align)) {
                box.align = this.dialogueDefaults.align;
            }
            const fullText = payload.text || '';
            const charsPerFrame = action.instantText || action.typewriter === false
                ? Infinity
                : Math.max(0.1, action.charsPerFrame || action.textSpeed || 1);
            this.dialogueOverlay = {
                text: action.instantText === true || action.typewriter === false ? fullText : '',
                fullText,
                speaker: payload.speaker || null,
                portrait: payload.portrait || null,
                box,
                typewriter: {
                    enabled: !(action.typewriter === false || action.instantText === true),
                    charsPerFrame,
                    visible: action.instantText === true || action.typewriter === false ? fullText.length : 0,
                    totalLength: fullText.length,
                    complete: action.instantText === true || action.typewriter === false || fullText.length === 0
                }
            };
        }

        clearDialogueOverlay() {
            this.dialogueOverlay = null;
        }

        advanceDialogueTypewriter(delta = 1) {
            if (!this.dialogueOverlay || !this.dialogueOverlay.typewriter) {
                return true;
            }
            const tw = this.dialogueOverlay.typewriter;
            if (!tw.enabled || tw.complete) {
                this.dialogueOverlay.text = this.dialogueOverlay.fullText;
                tw.complete = true;
                return true;
            }
            tw.visible += tw.charsPerFrame * delta;
            if (tw.visible >= tw.totalLength) {
                tw.visible = tw.totalLength;
                tw.complete = true;
            }
            const chars = Math.max(0, Math.floor(tw.visible));
            this.dialogueOverlay.text = this.dialogueOverlay.fullText.substring(0, chars);
            if (tw.complete) {
                this.dialogueOverlay.text = this.dialogueOverlay.fullText;
            }
            return tw.complete;
        }

        getEntity(refName) {
            return getEntity(this, refName);
        }

        emit(eventName, payload) {
            if (typeof this.options.onEvent === 'function') {
                this.options.onEvent(eventName, payload, this);
            }
            if (eventName === 'dialogue' && typeof this.options.onDialogue === 'function') {
                this.options.onDialogue(payload, this);
            }
            if (this.listeners[eventName]) {
                this.listeners[eventName](payload, this);
            }
        }

        startNextAction() {
            this.currentIndex += 1;
            if (this.currentIndex >= this.actions.length) {
                this.finish();
                return;
            }
            const action = this.actions[this.currentIndex];
            const factory = actionFactories[action.type];
            if (!factory) {
                console.warn(`[Cutscene] No handler for action type "${action.type}".`);
                this.startNextAction();
                return;
            }
            this.currentHandler = factory(this, action);
        }

        update(delta = 1) {
            if (this.finished) {
                return;
            }
            if (!this.currentHandler) {
                this.startNextAction();
            }
            if (!this.currentHandler) {
                return;
            }
            const done = this.currentHandler.update(delta);
            if (done) {
                this.currentHandler = null;
                this.startNextAction();
            }
        }

        draw(context, scene) {
            const fade = this.effects.fade;
            if (fade && fade.alpha > 0.001) {
                context.save();
                context.globalAlpha = clamp01(fade.alpha);
                context.fillStyle = fade.color || '#000000';
                context.fillRect(0, 0, WIDTH, HEIGHT);
                context.restore();
            }
            if (this.dialogueOverlay) {
                if (scene && typeof scene.drawDialogueBox === 'function') {
                    scene.drawDialogueBox(context, this.dialogueOverlay);
                } else {
                    drawFallbackDialogue(context, this.dialogueOverlay);
                }
            }
        }

        isActive() {
            return !this.finished;
        }

        isFinished() {
            return this.finished;
        }

        finish() {
            if (this.finished) {
                return;
            }
            this.finished = true;
            this.clearDialogueOverlay();
            if (typeof this.options.onComplete === 'function') {
                this.options.onComplete(this);
            }
        }

        skip() {
            this.finish();
        }
    }

    return {
        Player: CutscenePlayer,
        ActionHandlers: actionFactories,
        create(script, entityRefs, options) {
            return new CutscenePlayer(script, entityRefs, options);
        },
        fromKey(key, entityRefs, options) {
            if (!Loader || !Loader.cutscenes) {
                console.warn('Cutscene loader is not ready.');
                return null;
            }
            const script = Loader.cutscenes[key];
            if (!script) {
                console.warn(`Cutscene "${key}" was not preloaded.`);
                return null;
            }
            return new CutscenePlayer(script, entityRefs, options);
        }
    };
})();
