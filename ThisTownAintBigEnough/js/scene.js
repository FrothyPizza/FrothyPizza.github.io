// Base Scene class for managing game scenes

class Scene {
    constructor() {
        this.entities = {};

        // Bitmap font rendering setup
        this.charWidth = 4;
        this.charHeight = 8;
        this.bitmapFontImage = this.resolveBitmapFontImage();
        this.bitmapFontMap = this.createBitmapFontMap();
        this.offScreenCanvas = document.createElement('canvas');
        this.offScreenCanvas.width = this.charWidth;
        this.offScreenCanvas.height = this.charHeight;
        this.offScreenContext = this.offScreenCanvas.getContext('2d');
        this.glyphCache = {};

        // Simple fade helpers retained from the legacy engine
        this.fadeFrame = 0;
        this.isFading = false;
        this.fadeDuration = 60;
        this.timeToStayFullyFaded = 0;
        this.fadeColor = 'white';
    }

    resolveBitmapFontImage() {
        if (typeof Loader === 'undefined' || !Loader.images) {
            return null;
        }
        return Loader.images['font4x8.png'] || Loader.images['font.png'] || null;
    }

    // Called when scene becomes active
    init() {
        // Override in subclasses
    }

    // Update scene logic
    update(map) {
        // Override in subclasses
    }

    // Draw the scene
    draw(context) {
        // Override in subclasses
    }

    // Called when scene is being switched away from
    cleanup() {
        // Clean up all entities
        Object.keys(this.entities).forEach(id => {
            ECS.removeEntity(id);
        });
        this.entities = {};
    }

    // Add an entity to the scene
    addEntity(entity) {
        ECS.register(entity);
        this.entities[entity.id] = entity;
        return entity;
    }

    // Remove an entity from the scene
    removeEntity(id) {
        ECS.removeEntity(id);
        delete this.entities[id];
    }

    // Get entity by id
    getEntity(id) {
        return this.entities[id];
    }

    // Get all entities
    getEntities() {
        return Object.values(this.entities);
    }

    createSaveState() {
        const state = {
            entities: []
        };

        const entities = this.getEntities();
        entities.forEach(e => {
            if (!e.has('DoNotSave')) {
                state.entities.push(ECS.Helpers.serializeEntity(e));
            }
        });

        this.savedState = JSON.stringify(state);
        console.log("State saved. Entities:", entities.length);
    }

    loadSaveState() {
        if(!this.savedState) return;

        const state = JSON.parse(this.savedState);
        
        // Cleanup existing
        this.cleanup();

        // Restore
        let maxId = 0;
        state.entities.forEach(data => {
            const entity = ECS.Helpers.deserializeEntity(data);
            this.addEntity(entity);
            if(entity.id > maxId) maxId = entity.id;
        });
        
        // Update ID index to prevent collisions
        if (ECS.idIndex <= maxId) {
            ECS.idIndex = maxId + 1;
        }

        // Fixup references
        this.getEntities().forEach(entity => {
             ECS.Helpers.fixupEntityReferences(entity, this.entities);
             
             // Re-assign player reference if this is a LevelScene
             if (this.player && entity.has('PlayerState')) {
                 this.player = entity;
             }
        });
        
        console.log("State loaded.");
        this.onStateLoaded();
    }

    // Hook called after a save state is loaded
    onStateLoaded() {
        // Override in subclasses
    }
}

Scene.prototype.startFade = function(fadeDuration, timeToStayFullyFaded, targetColor) {
    this.isFading = true;
    this.fadeFrame = 0;
    this.fadeDuration = fadeDuration || this.fadeDuration;
    this.timeToStayFullyFaded = timeToStayFullyFaded || this.timeToStayFullyFaded;
    if (targetColor) {
        this.fadeColor = targetColor;
    }
};

Scene.prototype.drawFade = function(context) {
    if (!this.isFading) {
        return;
    }
    this.fadeFrame++;
    const alpha = Math.min(1, this.fadeFrame / Math.max(1, this.fadeDuration));
    context.save();
    context.globalAlpha = alpha;
    context.fillStyle = this.fadeColor || 'white';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    context.restore();
    if (this.fadeFrame >= this.fadeDuration + this.timeToStayFullyFaded) {
        this.isFading = false;
    }
};

Scene.prototype.wrapText = function(text, maxWidth) {
    if (!text) {
        return [];
    }
    const limit = maxWidth <= 0 ? Number.MAX_SAFE_INTEGER : maxWidth;
    const lines = [];
    const segments = `${text}`.split(/\n/);
    segments.forEach((segment, segmentIndex) => {
        const words = segment.split(' ');
        let currentLine = '';
        words.forEach(word => {
            const testLine = currentLine === '' ? word : `${currentLine} ${word}`;
            const testWidth = this.measureBitmapTextWidth(testLine);
            if (testWidth > limit && currentLine !== '') {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });
        if (currentLine !== '') {
            lines.push(currentLine);
        }
        if (segmentIndex < segments.length - 1) {
            lines.push('');
        }
    });
    return lines;
};

Scene.prototype.measureBitmapTextWidth = function(text) {
    if (!text) {
        return 0;
    }
    let width = 0;
    for (let i = 0; i < text.length; i++) {
        const glyph = this.bitmapFontMap[text[i]] || this.bitmapFontMap[' '];
        width += glyph ? glyph.width : this.charWidth;
    }
    return width;
};

Scene.prototype.drawBitmapText = function(context, text, x, y, align = 'left', color = '', highlight = '') {
    if (!text || !context) {
        return;
    }
    if (!this.bitmapFontImage) {
        context.save();
        context.fillStyle = color || 'white';
        context.font = `${this.charHeight}px monospace`;
        context.textAlign = align;
        context.fillText(text, x, y + this.charHeight);
        context.restore();
        return;
    }

    let offsetX = 0;
    const textWidth = this.measureBitmapTextWidth(text);
    if (align === 'center') {
        offsetX -= textWidth / 2;
    } else if (align === 'right') {
        offsetX -= textWidth;
    }

    const ensureGlyphCacheCanvas = (width, height) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
    };

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const glyph = this.bitmapFontMap[char] || this.bitmapFontMap[' '];
        if (!glyph) {
            continue;
        }

        if (highlight) {
            context.fillStyle = highlight;
            context.fillRect(x + offsetX - 1, y - 1, glyph.width + 1, glyph.height + 1);
        }

        const cacheKey = `${char}_${color || 'default'}`;
        if (!this.glyphCache[cacheKey]) {
            this.offScreenCanvas.width = glyph.width;
            this.offScreenCanvas.height = glyph.height;
            this.offScreenContext.clearRect(0, 0, glyph.width, glyph.height);
            this.offScreenContext.drawImage(
                this.bitmapFontImage,
                glyph.x, glyph.y, glyph.width, glyph.height,
                0, 0, glyph.width, glyph.height
            );
            if (color) {
                this.offScreenContext.globalCompositeOperation = 'source-in';
                this.offScreenContext.fillStyle = color;
                this.offScreenContext.fillRect(0, 0, glyph.width, glyph.height);
                this.offScreenContext.globalCompositeOperation = 'source-over';
            }
            const canvasCopy = ensureGlyphCacheCanvas(glyph.width, glyph.height);
            canvasCopy.getContext('2d').drawImage(this.offScreenCanvas, 0, 0);
            this.glyphCache[cacheKey] = canvasCopy;
        }

        context.drawImage(
            this.glyphCache[cacheKey],
            0, 0, glyph.width, glyph.height,
            Math.floor(x + offsetX), Math.floor(y),
            glyph.width, glyph.height
        );

        offsetX += glyph.width;
    }
};

Scene.prototype.drawDialogueBox = function(context, overlay) {
    if (!overlay || !context) {
        return;
    }
    const defaults = {
        x: 4,
        y: HEIGHT - 40,
        width: WIDTH - 8,
        height: 36,
        padding: 2,
        lineGap: 1,
        background: 'rgba(0, 0, 0, 0.75)',
        borderColor: 'white',
        borderWidth: 1,
        textColor: '#ffffff',
        speakerColor: '#ffdf73',
        align: 'left',
        highlight: ''
    };

    const box = { ...defaults, ...(overlay.box || {}) };
    const text = overlay.text || '';
    const speaker = overlay.speaker || '';

    context.save();
    context.fillStyle = box.background;
    context.fillRect(box.x, box.y, box.width, box.height);
    if (box.borderWidth > 0) {
        context.strokeStyle = box.borderColor;
        context.lineWidth = box.borderWidth;
        context.strokeRect(box.x, box.y, box.width, box.height);
    }
    context.restore();

    const contentWidth = Math.max(0, box.width - box.padding * 2);
    const contentHeight = Math.max(0, box.height - box.padding * 2);
    const lineHeight = this.charHeight + box.lineGap;
    let cursorY = box.y + box.padding;

    if (speaker) {
        this.drawBitmapText(context, speaker, box.x + box.padding, cursorY, 'left', box.speakerColor);
        cursorY += lineHeight;
    }

    const lines = this.wrapText(text, contentWidth);
    const remainingHeight = Math.max(0, box.y + box.padding + contentHeight - cursorY);
    const availableLines = Math.max(1, Math.floor(remainingHeight / lineHeight));
    const anchorX = (alignMode => {
        if (alignMode === 'center') {
            return box.x + box.padding + contentWidth / 2;
        }
        if (alignMode === 'right') {
            return box.x + box.padding + contentWidth;
        }
        return box.x + box.padding;
    })(box.align);
    for (let i = 0; i < lines.length && i < availableLines; i++) {
        this.drawBitmapText(
            context,
            lines[i],
            anchorX,
            cursorY,
            box.align,
            box.textColor,
            box.highlight
        );
        cursorY += lineHeight;
    }
};

Scene.prototype.createBitmapFontMap = function() {
    const chars = ` ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,''''''?!@_*   :$%+-/:;<=>              `;
    const charArray = chars.split('');
    const fontMap = {};
    for (let i = 0; i < charArray.length; i++) {
        const char = charArray[i];
        fontMap[char] = {
            x: i * this.charWidth,
            y: 0,
            width: this.charWidth,
            height: this.charHeight
        };
    }
    return fontMap;
};
