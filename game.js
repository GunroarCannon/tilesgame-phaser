class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        this.NUM_LANES = 4;
        this.LANE_WIDTH = 0;
        this.LANE_HEIGHT = 0;
        this.LANE_COLOR = 0xb0f2b4; // Light green
        this.TILE_COLOR = 0x000000; // Black
        this.NOTE_SPEED = 300; // pixels per second
        this.keyBindings = ['A', 'S', 'D', 'F'];
        this.notes = [];
        this.activeNotes = [];
        this.music = null;
        this.musicFadeTween = null;
        this.MISS_FADE_DURATION = 300;
        this.RESTORE_VOLUME_DURATION = 300;
        this.MUSIC_VOLUME = 1;
        this.HIT_WINDOW = 120; // ms
    }

    preload() {
        this.load.json('beatmap', 'assets/bt.json');
        this.load.audio('music', 'assets/default.wav');
    }

    create() {
        this.LANE_WIDTH = this.game.config.width / this.NUM_LANES;
        this.LANE_HEIGHT = this.game.config.height;

        this.createLanes();
        this.loadBeatmap();
        this.createSeparators();

        this.input.keyboard.on('keydown', (event) => this.handleInput(event.key.toUpperCase()));
        this.input.on('pointerdown', (pointer) => this.handleTouch(pointer));
    }

    createLanes() {
        for (let i = 0; i < this.NUM_LANES; i++) {
            this.add.rectangle(
                i * this.LANE_WIDTH + this.LANE_WIDTH / 2,
                this.LANE_HEIGHT / 2,
                this.LANE_WIDTH,
                this.LANE_HEIGHT,
                this.LANE_COLOR
            ).setOrigin(0.5);
        }
    }

    createSeparators() {
        for (let i = 1; i < this.NUM_LANES; i++) {
            this.add.rectangle(
                i * this.LANE_WIDTH,
                this.LANE_HEIGHT / 2,
                2,
                this.LANE_HEIGHT,
                0xffffff
            ).setOrigin(0.5);
        }
    }

    loadBeatmap() {
        const beatmap = this.cache.json.get('beatmap');
        this.notes = beatmap.notes.map(note => ({ ...note, spawned: false }));

        this.music = this.sound.add('music', { volume: this.MUSIC_VOLUME });
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
        for (const note of this.notes) {
            if (!note.spawned && note.time <= currentTime + this.getTravelTime()) {
                this.createNoteSprite(note);
                note.spawned = true;
            }
        }
    }

    createNoteSprite(note) {
        const yPos = -50;
        const noteHeight = note.type === 'hold' ? 80 : 50;

        const sprite = this.add.rectangle(
            note.lane * this.LANE_WIDTH + this.LANE_WIDTH / 2,
            yPos,
            this.LANE_WIDTH,
            noteHeight,
            this.TILE_COLOR
        ).setOrigin(0.5);

        sprite.setData('note', note);
        this.activeNotes.push(sprite);
    }

    getTravelTime() {
        return (this.LANE_HEIGHT * 0.8) / this.NOTE_SPEED * 1000;
    }

    handleInput(key) {
        const lane = this.keyBindings.indexOf(key);
        if (lane !== -1) this.attemptHit(lane);
    }

    handleTouch(pointer) {
        const lane = Math.floor(pointer.x / this.LANE_WIDTH);
        if (lane >= 0 && lane < this.NUM_LANES) {
            this.attemptHit(lane);
        }
    }

    attemptHit(lane) {
        const hitZoneY = this.LANE_HEIGHT * 0.8;
        const currentTime = this.music.seek * 1000;

        for (const sprite of this.activeNotes) {
            const note = sprite.getData('note');

            if (note.lane === lane) {
                const timeDiff = Math.abs(currentTime - note.time);

                if (timeDiff <= this.HIT_WINDOW||true) {
                    this.hitNote(sprite);
                    return;
                } else {
                    this.missNote(sprite);
                    return;
                }
            }
        }

        // If no note was hit at all
        this.triggerGameOver();
    }

    hitNote(sprite) {
        this.tweens.add({
            targets: sprite,
            scale: 1.2,
            alpha: 0,
            duration: 200,
            onComplete: () => sprite.destroy()
        });

        this.activeNotes = this.activeNotes.filter(s => s !== sprite);
        this.restoreMusicVolume();
    }

    missNote(sprite) {
        this.tweens.add({
            targets: sprite,
            tint: 0xff0000,
            duration: 100,
            yoyo: true,
            onComplete: () => sprite.destroy()
        });

        this.activeNotes = this.activeNotes.filter(s => s !== sprite);
        this.fadeMusic();
        this.triggerGameOver();
    }

    fadeMusic() {
        this.musicFadeTween?.stop();
        this.musicFadeTween = this.tweens.add({
            targets: this.music,
            volume: 0.2,
            duration: this.MISS_FADE_DURATION
        });
    }

    restoreMusicVolume() {
        if (this.music.volume < this.MUSIC_VOLUME) {
            this.musicFadeTween?.stop();
            this.musicFadeTween = this.tweens.add({
                targets: this.music,
                volume: this.MUSIC_VOLUME,
                duration: this.RESTORE_VOLUME_DURATION
            });
        }
    }

    triggerGameOver() {
        this.music.stop();

        const overlay = this.add.rectangle(
            this.game.config.width / 2,
            this.game.config.height / 2,
            this.game.config.width,
            this.game.config.height,
            0x000000,
            0.6
        ).setOrigin(0.5);

        this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2,
            'GAME OVER',
            { fontSize: '48px', fill: '#fff' }
        ).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.restart();
        });

        this.input.keyboard.once('keydown', () => {
            this.scene.restart();
        });
    }

    update(time, delta) {
        const speedPerFrame = (this.NOTE_SPEED * delta) / 1000;

        for (const sprite of this.activeNotes) {
            sprite.y += speedPerFrame;

            if (sprite.y >= this.LANE_HEIGHT) {
                this.missNote(sprite);
                break;
            }
        }
    }
}
