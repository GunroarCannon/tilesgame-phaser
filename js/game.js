class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        this.lastHit = 0

        this.NUM_LANES = 4;
        this.LANE_WIDTH = 0;
        this.LANE_COLORS = [0x1FAB3B]; // Nigerian Green (moderately saturated)
        this.NOTE_COLOR = 0x000000;
        this.NOTE_SPEED = 500; // Faster speed
        this.KEY_BINDINGS = ['A', 'S', 'D', 'F'];
        this.HIT_ZONE_Y = 500;
        this.HIT_WINDOW = 120;
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
            this.add.rectangle(
                i * this.LANE_WIDTH + this.LANE_WIDTH / 2,
                this.game.config.height / 2,
                this.LANE_WIDTH,
                this.game.config.height,
                this.LANE_COLORS[0],
                0.2
            ).setOrigin(0.5);

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
        const rawBeatmap = this.cache.json.get('beatmap');
        this.notes = this.processBeatmap(rawBeatmap.notes);

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

    processBeatmap(notes) {
        // Remove excess notes at the same timestamp across lanes
        const groupedByTime = {};
        for (let note of notes) {
            groupedByTime[note.time] = groupedByTime[note.time] || [];
            groupedByTime[note.time].push(note);
        }

        const processed = [];
        for (const time in groupedByTime) {
            const noteGroup = groupedByTime[time];
            if (noteGroup.length > 2) {
                // Keep only first 2
                processed.push(...noteGroup.slice(0,2));
            } else {
                processed.push(...noteGroup);
            }
        }
        return processed.map(note => ({ ...note, spawned: false, hit: false }));
    }

    spawnNotes() {
        const currentTime = this.music.seek * 1000;
        const travelTime = this.getTravelTime();

        for (const note of this.notes) {
            if (!note.spawned && (note.time - 500) <= currentTime + travelTime) {
                this.createNoteSprite(note);
                note.spawned = true;
            }
        }
    }

    createNoteSprite(note) {
        const laneX = note.lane * this.LANE_WIDTH + this.LANE_WIDTH / 2;
        const height = this.LANE_WIDTH * 0.5 * 2;//80;  // Taller than wide
        const width = this.LANE_WIDTH * 0.95;

        let overlapCount = this.activeNotes.filter(
            n => n.getData('note').lane === note.lane && Math.abs(n.y - (-height/2)) < height
        ).length;

        const sprite = this.add.rectangle(laneX, -height / 2, width, height, this.NOTE_COLOR)
            .setOrigin(0.5)
            .setData('note', note);

        if (overlapCount > 0) {
            // Combo tile
            sprite.setData('combo', overlapCount + 1);
            const comboText = this.add.text(sprite.x, sprite.y, `x${overlapCount + 1}`, {
                fontSize: '20px',
                color: '#ffffff'
            }).setOrigin(0.5);
            sprite.setData('comboText', comboText);
        }

        this.activeNotes.push(sprite);

        
    }

    getTravelTime() {
        return (this.HIT_ZONE_Y / this.NOTE_SPEED) * 1000;
    }

    handleInput(key) {
        if (this.gameOver) return;
        const lane = this.KEY_BINDINGS.indexOf(key);
        if (lane !== -1) this.attemptHit(lane);
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
            if (note.hit || note.lane !== lane) continue;

            const currentTime = this.music.seek * 1000;
            const timeDiff = Math.abs(currentTime - note.time);

            if (timeDiff <= this.HIT_WINDOW || true) {
                note.hit = true;
                this.juicyHit(sprite);
                this.lastHit=Date.now()/1000; 

                if (this.waitingForInput) {
                    this.music.setVolume(1);//--.resume();
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
        const comboText = sprite.getData('comboText');

        this.tweens.add({
            targets: sprite,
            scale: 1.3,
            alpha: 0,
            duration: 200,
            onComplete: () => sprite.destroy()
        });

        if (comboText) {
            this.tweens.add({
                targets: comboText,
                alpha: 0,
                duration: 200,
                onComplete: () => comboText.destroy()
            });
        }

        this.activeNotes = this.activeNotes.filter(s => s !== sprite);
    }

    update(time, delta) {
        if (this.gameOver) return;
        const speedPerFrame = (this.NOTE_SPEED * delta) / 1000;
        if ((Date.now()/1000)-this.lastHit>.5){
            this.music.setVolume(0);
        }
        else {
            this.music.setVolume(1);
        }
        //console.log(this.lastHit);

       // console.log(this.lastHit-Date.now()/1000);
        this.activeNotes.forEach(sprite => {
            sprite.y += speedPerFrame;

            const comboText = sprite.getData('comboText');
            if (comboText) comboText.y = sprite.y;

            if (sprite.y >= this.game.config.height) {
                this.triggerGameOver();
            }
        });
    }
 addGlossyEffect(sprite) {
        const gloss = this.add.rectangle(sprite.x, sprite.y - sprite.height / 4, sprite.width * 0.8, sprite.height * 0.1, 0xffffff, 0.3)
            .setOrigin(0.5);

        this.tweens.add({
            targets: gloss,
            alpha: 0,
            duration: 300,
            onComplete: () => gloss.destroy()
        });
    }
    createParticleTexture() {
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(10, 10, 10);
        graphics.generateTexture('particle', 20, 20);
        graphics.destroy();
    }


    triggerGameOver() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.music.pause();

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
