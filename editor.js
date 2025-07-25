const editorConfig = {
  type: Phaser.CANVAS,
  parent: "game",  // Changed from "editor" to match container
  width: 400,
  height: 600,
  backgroundColor: "#f0f0f0",
  scene: {
    preload, create, update
  }
};

const editorGame = new Phaser.Game(editorConfig);
let music, beatmap = [], holding = {};
let startTime = 0, isRecording = false;
let lanes, keyMap, laneColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];

function preload() {
  // Load assets if needed
}

function create() {
  // Create UI elements dynamically since they're not in HTML
  this.add.text(20, 20, 'Beatmap Editor', { fontSize: '24px', fill: '#000' });
  
  // Create music player controls
  const loadButton = this.add.rectangle(100, 80, 150, 40, 0x6666ff)
    .setInteractive()
    .on('pointerdown', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';
      input.onchange = (e) => {
        music = new Audio(URL.createObjectURL(e.target.files[0]));
      };
      input.click();
    });
  this.add.text(100, 80, 'Load Music', { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);
  
  const exportButton = this.add.rectangle(100, 140, 150, 40, 0x66ff66)
    .setInteractive()
    .on('pointerdown', () => {
      const blob = new Blob([JSON.stringify(beatmap)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "beatmap.json";
      a.click();
    });
  this.add.text(100, 140, 'Export Beatmap', { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);
  
  const testButton = this.add.rectangle(100, 200, 150, 40, 0xff6666)
    .setInteractive()
    .on('pointerdown', testPlayback);
  this.add.text(100, 200, 'Test Playback', { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);

  // Lane visuals (4 vertical lanes)
  lanes = this.add.group();
  for (let i = 0; i < 4; i++) {
    const lane = this.add.rectangle(100 * i + 50, 350, 80, 200, 0x333333, 0.2);
    lanes.add(lane);
  }

  // Key bindings (A/S/D/F)
  keyMap = {
    a: 0, s: 1, d: 2, f: 3
  };

  // Instructions
  this.add.text(200, 300, 'Press A/S/D/F to record notes\nHold keys for hold notes', 
    { fontSize: '16px', fill: '#000', align: 'center' }).setOrigin(0.5, 0);
}

function update() {
  if (!isRecording || !music) return;

  // Highlight lanes on keypress
  this.input.keyboard.on("keydown", (e) => {
    const lane = keyMap[e.key.toLowerCase()];
    if (lane !== undefined && !holding[lane]) {
      holding[lane] = this.time.now;
      lanes.getChildren()[lane].fillColor = laneColors[lane];
    }
  });

  this.input.keyboard.on("keyup", (e) => {
    const lane = keyMap[e.key.toLowerCase()];
    if (lane !== undefined && holding[lane]) {
      const duration = this.time.now - holding[lane];
      lanes.getChildren()[lane].fillColor = 0x333333;

      // Add to beatmap (tap or hold)
      if (duration < 200) {
        beatmap.push({ type: "tap", lane, time: Math.floor(holding[lane] - startTime) });
      } else {
        beatmap.push({ type: "hold", lane, time: Math.floor(holding[lane] - startTime), duration: Math.floor(duration) });
      }
      delete holding[lane];
    }
  });
}

function testPlayback() {
  if (beatmap.length === 0 || !music) return;
  music.currentTime = 0;
  music.play();
  startTime = editorGame.scene.scenes[0].time.now;
  isRecording = true;

  const scene = editorGame.scene.scenes[0];
  scene.time.delayedCall(0, () => {
    beatmap.forEach(note => {
      const laneObj = lanes.getChildren()[note.lane];
      const tile = scene.add.rectangle(laneObj.x, 100, 70, note.type === "hold" ? 10 : 50, laneColors[note.lane]);
      scene.tweens.add({
        targets: tile,
        y: 350,
        duration: 2000,
        ease: "Linear"
      });
    });
  });
}