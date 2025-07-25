class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        // Constants
        this.NUM_LANES = 4;
        this.LANE_WIDTH = 0;
        this.LANE_COLORS = [0xB6E2A1];  // Soft pastel green
        this.NOTE_COLOR = 0x000000; // Black
        this.NOTE_SPEED = 300; // pixels per second
        this.KEY_BINDINGS = ['A', 'S', 'D', 'F'];
        this.HIT_ZONE_Y = 500;
        this.HIT_WINDOW = 120; // ms
    }

    preload() {
        this.load.json('beatmap', 'assets/bt.json');
        this.load.audio('music', 'assets/default.wav');
    }

    create() {
        this.LANE_WIDTH = this.game.config.width / this.NUM_LANES;
        this.activeNotes = [];
        this.notes = [];
        this.gameOver = false;

        this.createLanes();
        this.loadBeatmap();

        this.input.keyboard.on('keydown', (e) => this.handleInput(e.key.toUpperCase()));
        this.input.on('pointerdown', (pointer) => this.handlePointer(pointer));
    }

    createLanes() {
        for (let i = 0; i < this.NUM_LANES; i++) {
            // Lane background
            this.add.rectangle(
                i * this.LANE_WIDTH + this.LANE_WIDTH / 2,
                this.game.config.height / 2,
                this.LANE_WIDTH,
                this.game.config.height,
                this.LANE_COLORS[0],
                0.2
            ).setOrigin(0.5);

            // White separator line
            if (i > 0) {
                this.add.rectangle(
                    i * this.LANE_WIDTH,
                    this.game.config.height / 2,
                    2,
                    this.game.config.height,
                    0xffffff
                ).setOrigin(0.5);
            }
        }
    }

    loadBeatmap() {
        const beatmap = this.cache.json.get('beatmap');
        this.notes = beatmap.notes.map(note => ({ ...note, spawned: false, hit: false }));

        this.music = this.sound.add('music');
        this.music.play();
        this.startTime = this.time.now;

        this.time.addEvent({
            delay: 10,
            loop: true,
            callback: this.spawnNotes,
            callbackScope: this
        });
    }

    spawnNotes() {
        const currentTime = this.music.seek * 1000;
        const travelTime = this.getTravelTime();

        for (const note of this.notes) {
            if (!note.spawned && (note.time-500) <= currentTime + travelTime) {
                this.createNoteSprite(note);
                note.spawned = true;
            }
        }
    }
createNoteSprite(note) {
    const height = note.type === 'hold' ? 100 : 60;
    const sprite = this.add.rectangle(
        note.lane * this.LANE_WIDTH + this.LANE_WIDTH / 2,
        -height / 2,
        this.LANE_WIDTH * 0.8,
        height,
        this.NOTE_COLOR
    ).setOrigin(0.5);

    sprite.setData('note', note);
    this.activeNotes.push(sprite);

    // Pause music until input is received
    if (!this.waitingForInput) {
        this.music.pause();
        this.waitingForInput = true;
    }
}

    getTravelTime() {
        return (this.HIT_ZONE_Y / this.NOTE_SPEED) * 1000;
    }

    handleInput(key) {
        if (this.gameOver) return;
        const lane = this.KEY_BINDINGS.indexOf(key);
        if (lane === -1) return;
        this.attemptHit(lane);
    }

    handlePointer(pointer) {
        if (this.gameOver) return;
        const lane = Math.floor(pointer.x / this.LANE_WIDTH);
        this.attemptHit(lane);
    }
    attemptHit(lane) {
    if (this.gameOver) return;

    for (const sprite of this.activeNotes) {
        const note = sprite.getData('note');
        if (note.hit) continue;

        if (note.lane !== lane) {
            this.triggerGameOver();
            return;
        }

        const currentTime = this.music.seek * 1000;
        const timeDiff = Math.abs(currentTime - note.time);

        if (timeDiff <= this.HIT_WINDOW||true) {
            note.hit = true;
            this.juicyHit(sprite);

            if (this.waitingForInput) {
                this.music.resume();
                this.waitingForInput = false;
            }

            return;
        } else {
            this.triggerGameOver();
            return;
        }
    }
}

    juicyHit(sprite) {
        this.tweens.add({
            targets: sprite,
            scale: 1.3,
            alpha: 0,
            duration: 200,
            onComplete: () => sprite.destroy()
        });
        this.activeNotes = this.activeNotes.filter(s => s !== sprite);
    }

    update(time, delta) {
        if (this.gameOver) return;
        const speedPerFrame = (this.NOTE_SPEED * delta) / 1000;

        this.activeNotes.forEach(sprite => {
            sprite.y += speedPerFrame;

            if (sprite.y >= this.game.config.height) {
                this.triggerGameOver();
            }
        });
    }

    triggerGameOver() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.music.pause();

        // Simple popup
        const popup = this.add.rectangle(
            this.game.config.width / 2,
            this.game.config.height / 2,
            300,
            150,
            0x000000,
            0.8
        ).setOrigin(0.5);

        this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2 - 30,
            'Game Over',
            { fontSize: '28px', fill: '#fff' }
        ).setOrigin(0.5);

        this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2 + 20,
            'Click to Restart',
            { fontSize: '18px', fill: '#ccc' }
        ).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });
    }
}
