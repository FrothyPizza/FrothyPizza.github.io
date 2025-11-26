// loader.js

const Loader = {
  images: {},
  fonts: {},
  spriteSheets: {},
  levels: {},
  tilesetImage: null,
  tilesetData: null,
  gameWorld: null,
  audio: {},
  music: {},
  activeMusic: {},
  audioContext: null,
  cutscenes: {},

  load: async function () {
    let promises = [];
    for (let i = 0; i < arguments.length; i++) {
      let src = arguments[i];
      let ext = src.split(".").pop().toLowerCase();
      if (ext === "png" || ext === "jpg" || ext === "jpeg" || ext === "gif") {
        promises.push(this.loadImage(src));
      } else if (ext === "json") {
        promises.push(this.loadSpriteSheet(src));
      } else if (ext === "tmx") {
        promises.push(this.loadMap(src));
      } else if (ext === "tsx") {
        promises.push(this.loadTileset(src));
      } else if (ext === "world") {
        promises.push(this.loadWorld(src));
      } else if (ext === "js") {
        promises.push(this.loadSpriteSheetJS(src));
      } else if (ext === "ttf") {
        // console.log("Loading font: " + src);
        promises.push(this.loadFont(src));
      } else if (ext === "wav" || ext === "mp3" || ext === "m4a") {
        promises.push(this.loadAudio(src));
      } else if (ext === "cutscene") {
        promises.push(this.loadCutscene(src));
      } else {
        console.warn("Unknown file type: " + ext);
      }
    }

    await Promise.all(promises);
  },

  loadMap: function (src) {
    return new Promise((resolve, reject) => {
      fetch(src)
        .then((response) => response.text())
        .then((data) => {
          let parser = new DOMParser();
          let xml = parser.parseFromString(data, "text/xml");
          // console.log("Loaded map:", xml);
          let map = new Map(xml);
          this.levels[src.split("/").pop().split(".")[0]] = map;
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  loadTileset: function (src) {
    return new Promise((resolve, reject) => {
      fetch(src)
        .then((response) => response.text())
        .then((data) => {
          let parser = new DOMParser();
          let xml = parser.parseFromString(data, "text/xml");
          this.tilesetData = xml;
          this.tilesetData.getTileClass = function (tileId) {
            let tile = this.querySelector(`tile[id="${tileId - 1}"]`);
            if (tile) {
              let type = tile.getAttribute("type");
              return type;
            }
            return "empty";
          };
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  loadWorld: function (src) {
    return new Promise((resolve, reject) => {
      fetch(src)
        .then((response) => response.text())
        .then((data) => {
          this.gameWorld = JSON.parse(data);
          resolve();
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  loadImage: function (src) {
    return new Promise((resolve, reject) => {
      let img = new Image();
      img.src = src;
      img.onload = () => {
        this.images[this.removePath(src)] = img;
        resolve();
      };
      img.onerror = () => {
        reject();
      };
    });
  },

  loadSpriteSheet: function (src) {
    return new Promise((resolve, reject) => {
      fetch(src)
        .then((response) => response.json())
        .then((data) => {
          let img = new Image();
          let path = src.split("/");
          this.spriteSheets[path.pop().split(".")[0]] = data;
          path = path.join("/");
          img.src = path + "/" + data.meta.image;
          img.onload = () => {
            this.images[data.meta.image] = img;

            // load the frame-by-frame collision data if present
            data.sequencerData = data.meta.sequencerData || {};
            // console.log("Sequencer data loaded for spritesheet:", src, data.sequencerData);

            resolve();
          };

          img.onerror = () => {
            reject();
          };
        })
        .catch((error) => {
          reject(error);
        });
    });
  },

  loadFont: function (src) {
    return new Promise((resolve, reject) => {
      let font = new FontFace(src, `url(${src})`);
      font
        .load()
        .then((loadedFace) => {
          document.fonts.add(loadedFace);
          this.fonts[src] = loadedFace;
          // console.log("Font loaded: " + src);
          resolve();
        })
        .catch((error) => {
          reject();
        });
    });
  },

  loadSpriteSheetJS: function (src) {
    return new Promise((resolve, reject) => {
      // console.log("Loading spritesheet: " + src);
      let img = new Image();
      let path = src.split("/");
      let name = path.pop().split(".")[0];
      this.spriteSheets[name] = window[name];
      path = path.join("/");
      img.src = path + "/" + this.spriteSheets[name].meta.image;
      img.onload = () => {
        this.images[this.spriteSheets[name].meta.image] = img;
        resolve();
      };
      img.onerror = () => {
        reject();
      };
    });
  },

  // load .cutscene files, which contain a json object like:
  /*[
    { "type": "fade", "duration": 45, "hold": 0 },               // fade in
    { "type": "move", "entity": "Player", "path": [
          { "x": 100, "y": 200, "t":   0 },
          { "x": 220, "y": 180, "t": 60 },                       // 1 s later
          { "x": 300, "y": 180, "t": 90 }
      ]
    },...*/
  loadCutscene: async function (src) {
    // console.log("Loading cutscene:", src);
    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(
          `Failed to load ${src}: ${response.status} ${response.statusText}`
        );
      }
      // Automatically parses the JSON
      const cutscene = await response.json();

      // Extract the base name (e.g. "intro" from "path/to/intro.cutscene")
      const key = src
        .split("/")
        .pop()
        .replace(/\.cutscene$/, "");

      this.cutscenes[key] = cutscene;
      // console.log(`Loaded cutscene "${key}"`, cutscene);
    } catch (error) {
      console.error("Error loading cutscene:", error);
      throw error;
    }
  },

  initAudioContext: function () {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
  },

  loadAudio: function (src) {
    this.initAudioContext();
    return new Promise((resolve, reject) => {
      fetch(src)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => this.audioContext.decodeAudioData(arrayBuffer))
        .then((audioBuffer) => {
          this.audio[this.removePath(src)] = audioBuffer;
          resolve();
        })
        .catch((error) => {
          console.error(error);
          reject(`Error loading audio: ${src}`);
        });
    });
  },

  removePath: function (src) {
    let path = src.split("/");
    return path.pop();
  },

  playSound: function (name, volume = 1) {
    if (this.audio[name]) {
      this.initAudioContext();
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
      const source = this.audioContext.createBufferSource();
      source.buffer = this.audio[name];
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      source.start(0);
    } else {
      console.warn(`Sound "${name}" not found.`);
    }
  },

  playSoundRepeat: function (name, volume, repeatTimes) {
    if (this.audio[name]) {
      this.initAudioContext();
      const play = (times) => {
        if (times <= 0) return;
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audio[name];
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = volume;
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.onended = () => play(times - 1);
        source.start(0);
      };
      play(repeatTimes);
    } else {
      console.warn(`Sound "${name}" not found.`);
    }
  },

  playMusic: function (name, volume = 1, restart = true) {
    this.initAudioContext();
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }
    console.log(
      `Playing music: ${name}, volume: ${volume}, restart: ${restart}`
    );

    // Stop other music
    for (let key in this.activeMusic) {
      if (key !== name) {
        try {
          this.activeMusic[key].source.stop();
        } catch (e) {}
        delete this.activeMusic[key];
      }
    }

    if (this.activeMusic[name]) {
      if (!restart) {
        this.activeMusic[name].gain.gain.value = volume;
        return; // Already playing
      }
      // Stop to restart
      try {
        this.activeMusic[name].source.stop();
      } catch (e) {}
      delete this.activeMusic[name];
    }

    if (this.audio[name]) {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.audio[name];
      source.loop = true;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      source.start(0);

      this.activeMusic[name] = { source: source, gain: gainNode };
    } else {
      console.warn(`Music ${name} not found.`);
    }
  },

  setCurrentMusicVolume: function (volume) {
    for (let key in this.activeMusic) {
      this.activeMusic[key].gain.gain.value = volume;
    }
  },

  setCurrentMusicSpeed: function (speed) {
    for (let key in this.activeMusic) {
      this.activeMusic[key].source.playbackRate.value = speed;
    }
  },

  decreaseCurrentMusicVolume: function (value) {
    for (let key in this.activeMusic) {
      let newVol = this.activeMusic[key].gain.gain.value - value;
      if (newVol < 0) newVol = 0;
      this.activeMusic[key].gain.gain.value = newVol;
    }
  },
};

// console.log("AAAA");

document.body.onload = () => {
  setTimeout(() => {
    Loader.load(
      "assets/fonts/font.png",
      "assets/fonts/font4x8.png",

      "assets/images/player/Theo.json",
      "assets/images/aseprite/cowboy/Smalls.json",

      "assets/images/enemies/CharonSequenced01.json",

      "assets/images/cowboy/KnifeOutlaw.json",
      "assets/images/cowboy/StunnedBirds.json",
      "assets/images/cowboy/exclamation.json",
      "assets/images/cowboy/MadSheriff.json",
      "assets/images/cowboy/Bottle.json",
      "assets/images/cowboy/Deputy.json",
      "assets/images/cowboy/Gun.json",
      "assets/images/cowboy/Bullet.json",
      "assets/images/cowboy/BulletSmall.json",
      "assets/images/cowboy/Lasso.json",
      "assets/images/cowboy/BigHat.json",
      "assets/images/cowboy/BigHatHat.json",
      "assets/images/cowboy/GunBigHat.json",
      "assets/images/cowboy/BigHatSmallHatProjectile.json",
      
      "assets/cutscenes/saloon/saloon.cutscene",
      "assets/cutscenes/saloon/saloon_start_part_2.cutscene",
      "assets/cutscenes/saloon/saloon_abridged.cutscene",
      "assets/cutscenes/saloon/saloon_boss.cutscene",
      "assets/cutscenes/saloon/saloon_boss_appearance.cutscene",
      "assets/cutscenes/saloon/saloon_items_collected.cutscene",

      "assets/cutscenes/desert/desert_initial.cutscene",
      "assets/cutscenes/desert/desert_level_start.cutscene",
      "assets/cutscenes/big_hat/big_hat_initial.cutscene",
      "assets/cutscenes/big_hat/big_hat_level_start.cutscene",

      // "tiled/GameJamSpriteSheet.tsx",
      // "tiled/new-tiles.png",
      // "tiled/GameJamSpriteSheet.png",
      "tiled/CowboyTilemap.tsx",
      "tiled/CowboyTilemap.png",
      "tiled/levels/game_world.world",

      "assets/music/cowboy/DrabBarFast.mp3",
      "assets/music/cowboy/RagAttackFinished.mp3",
      "assets/music/cowboy/TenseBase.mp3",

      // "assets/music/Bones and Demons -Decending baseline.mp3",

      "assets/sfx/cowboy/bottlebounce.wav",
      "assets/sfx/cowboy/gruntthrow.wav",
      "assets/sfx/cowboy/guncock.wav",
      "assets/sfx/cowboy/gunshot.wav",
      "assets/sfx/cowboy/explosion.wav",

      "assets/sfx/sam/powerup2.wav",
      "assets/sfx/sam/damage.wav",
      "assets/sfx/sam/hit.wav",
      "assets/sfx/sam/jump.wav",
      "assets/sfx/sam/playerDamage.wav",
      "assets/sfx/sam/powerup.wav",
      "assets/sfx/sam/dash01.wav",

      "assets/sfx/Slash.wav"
    ).then(() => {
      let levels = [];
      for (let i = 0; i < Loader.gameWorld.maps.length; i++) {
        levels.push("tiled/levels/" + Loader.gameWorld.maps[i].fileName);
      }
      Loader.tilesetImage = Loader.images["CowboyTilemap.png"];

      Loader.load(...levels).then(() => {
        init();
      });
    });
  }, 100);
};

if (!localStorage.getItem("VERSION")) {
  localStorage.clear();
  localStorage.setItem("VERSION", CONSTANTS.VERSION);
}
