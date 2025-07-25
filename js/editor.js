class EditorScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EditorScene' });
        
        // Editor constants
        this.NUM_LANES = 4;
        this.LANE_WIDTH = 0;
        this.LANE_COLORS = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
        this.NOTE_TYPES = {
            TAP: 'tap',
            HOLD: 'hold'
        };
        
        // Editor state
        this.notes = [];
        this.currentMusic = null;
        this.isPlaying = false;
        this.playbackStartTime = 0;
        this.selectedLane = 0;
        this.selectedNoteType = this.NOTE_TYPES.TAP;
    }

    create() {
        // Calculate lane dimensions
        this.LANE_WIDTH = this.game.config.width / this.NUM_LANES;
        
        // Create UI
        this.createUI();
        
        // Create lanes
        this.createLanes();
        
        // Set up input
        this.setupInput();
    }
    
    createUI() {
        // Create control panel
        this.controlPanel = this.add.rectangle(
            this.game.config.width / 2,
            50,
            this.game.config.width - 40,
            80,
            0x333333
        ).setOrigin(0.5);
        
        // Add buttons
        this.addButton(100, 50, 'Load Music', () => this.openFileDialog('music'));
        this.addButton(250, 50, 'Play/Pause', () => this.togglePlayback());
        this.addButton(400, 50, 'Add Note', () => this.addNoteAtCurrentTime());
        this.addButton(550, 50, 'Export', () => this.exportBeatmap());
        this.recordingText = this.add.text(
    50, 130,
    'Recording: OFF',
    { fontSize: '18px', fill: '#ff0000' }
);

        // Note type selector
        this.noteTypeText = this.add.text(
            650, 30,
            'Note Type: TAP',
            { fontSize: '16px', fill: '#fff' }
        );
        
        this.addButton(650, 60, 'Toggle Type', () => this.toggleNoteType());
        
        // Current time display
        this.timeDisplay = this.add.text(
            this.game.config.width - 100, 50,
            '0:00',
            { fontSize: '24px', fill: '#fff' }
        ).setOrigin(0.5);
        
        // Create file input (hidden)
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = 'audio/*';
        this.fileInput.style.display = 'none';
        document.body.appendChild(this.fileInput);
        
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e, 'music'));
    }
    
    createLanes() {
        this.lanes = [];
        this.laneHighlights = [];
        
        for (let i = 0; i < this.NUM_LANES; i++) {
            const lane = this.add.rectangle(
                i * this.LANE_WIDTH + this.LANE_WIDTH / 2,
                this.game.config.height / 2,
                this.LANE_WIDTH,
                this.game.config.height,
                this.LANE_COLORS[i],
                0.1
            ).setOrigin(0.5);
            
            const highlight = this.add.rectangle(
                i * this.LANE_WIDTH + this.LANE_WIDTH / 2,
                this.game.config.height / 2,
                this.LANE_WIDTH,
                this.game.config.height,
                this.LANE_COLORS[i],
                0
            ).setOrigin(0.5);
            
            this.lanes.push(lane);
            this.laneHighlights.push(highlight);
        }
    }
    addButton(x, y, text, callback) {
    const btn = this.add.text(x, y, text, { 
        fontSize: '16px', 
        fill: '#fff',
        backgroundColor: '#555',
        padding: { x: 10, y: 5 }
    }).setOrigin(0.5);

    btn.setInteractive();
    btn.on('pointerdown', (pointer, localX, localY, event) => {
        event.stopPropagation();  // prevent pointer events from bubbling
        callback();
    });

    return btn;
}

    
    openFileDialog(type) {
        this.fileInput.accept = type === 'music' ? 'audio/*' : '.json';
        this.fileInput.click();
    }
    
   handleFileSelect(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    if (type === 'music') {
        const url = URL.createObjectURL(file);
        this.loadMusic(url, file.name);
    }
}

   loadMusic(url, name) {
    if (this.currentMusic) {
        this.currentMusic.destroy();
    }

    // Generate a unique key each time to avoid conflicts
    const key = 'music_' + Date.now();

    this.load.audio(key, url);
    this.load.once('complete', () => {
        this.currentMusic = this.sound.add(key);
        console.log('Music loaded:', key);
    });
    this.load.start();
}

    
    togglePlayback() {
        if (!this.currentMusic) return;
        
        if (this.isPlaying) {
            this.currentMusic.pause();
            this.isPlaying = false;
        } else {
            if (this.currentMusic.isPaused) {
                this.currentMusic.resume();
            } else {
                this.currentMusic.play();
            }
            this.playbackStartTime = Date.now() - (this.currentMusic.seek * 1000);
            this.isPlaying = true;
        }
        this.recordingText.setText(`Recording: ${this.isPlaying ? 'ON' : 'OFF'}`);
this.recordingText.setColor(this.isPlaying ? '#00ff00' : '#ff0000');

    }
    
    toggleNoteType() {
        this.selectedNoteType = this.selectedNoteType === this.NOTE_TYPES.TAP ? 
            this.NOTE_TYPES.HOLD : this.NOTE_TYPES.TAP;
        this.noteTypeText.setText(`Note Type: ${this.selectedNoteType.toUpperCase()}`);
    }
    
    setupInput() {
        // Keyboard input
        this.input.keyboard.on('keydown', (event) => {
            const keyMap = {
                'a': 0, 's': 1, 'd': 2, 'f': 3,
                '1': 0, '2': 1, '3': 2, '4': 3
            };
            
            if (keyMap.hasOwnProperty(event.key)) {
                this.selectedLane = keyMap[event.key];
                this.highlightLane(this.selectedLane);
                
                if (this.isPlaying) {
                    this.addNoteAtCurrentTime();
                }
            } else if (event.key === ' ') {
                this.addNoteAtCurrentTime();
            }
        });
        
        // Touch input
        this.input.on('pointerdown', (pointer) => {
            const lane = Math.floor(pointer.x / this.LANE_WIDTH);
            if (lane >= 0 && lane < this.NUM_LANES) {
                this.selectedLane = lane;
                this.highlightLane(lane);
                
                if (this.isPlaying) {
                    this.addNoteAtCurrentTime();
                }
            }
        });
    }
    
    highlightLane(lane) {
        // Reset all highlights
        for (const highlight of this.laneHighlights) {
            highlight.fillAlpha = 0;
        }
        
        // Highlight selected lane
        this.laneHighlights[lane].fillAlpha = 0.2;
        
        // Fade out highlight
        this.tweens.add({
            targets: this.laneHighlights[lane],
            fillAlpha: 0,
            duration: 300
        });
    }
    
    addNoteAtCurrentTime() {
        if (!this.currentMusic || !this.isPlaying) return;
        
        const currentTime = this.currentMusic.seek * 1000; // in ms
        
        const newNote = {
            time: currentTime,
            lane: this.selectedLane,
            type: this.selectedNoteType,
            duration: this.selectedNoteType === this.NOTE_TYPES.HOLD ? 500 : 0 // default hold duration
        };
        
        this.notes.push(newNote);
        this.visualizeNote(newNote);
    }
    
    visualizeNote(note) {
        const yPos = this.game.config.height * 0.8;
        const noteHeight = note.type === this.NOTE_TYPES.TAP ? 30 : 60;
        
        const noteSprite = this.add.rectangle(
            note.lane * this.LANE_WIDTH + this.LANE_WIDTH / 2,
            yPos,
            this.LANE_WIDTH * 0.9,
            noteHeight,
            this.LANE_COLORS[note.lane]
        ).setOrigin(0.5);
        
        // Add to scene for visualization
        this.tweens.add({
            targets: noteSprite,
            alpha: 0.6,
            duration: 200,
            yoyo: true,
            onComplete: () => noteSprite.destroy()
        });
    }
    
    exportBeatmap() {
        if (!this.currentMusic) {
            alert('Please load music first');
            return;
        }
        
        // Sort notes by time
        this.notes.sort((a, b) => a.time - b.time);
        
        const beatmap = {
            music: this.currentMusic.key,
            notes: this.notes
        };
        this.showTemporaryMessage('Beatmap Exported!');

        // Create download link
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(beatmap, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "beatmap.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);
    }
    showTemporaryMessage(message) {
    const msg = this.add.text(
        this.game.config.width / 2,
        150,
        message,
        { fontSize: '20px', fill: '#ffffff', backgroundColor: '#000000' }
    ).setOrigin(0.5);

    this.time.delayedCall(1500, () => msg.destroy());
}

    update() {
        if (this.currentMusic && this.isPlaying) {
            // Update time display
            const currentTime = this.currentMusic.seek;
            const minutes = Math.floor(currentTime / 60);
            const seconds = Math.floor(currentTime % 60).toString().padStart(2, '0');
            this.timeDisplay.setText(`${minutes}:${seconds}`);
            
            // Visualize playback position
            this.visualizePlayback();
        }
    }
    
    visualizePlayback() {
        // Draw a line at the current playback position
        if (this.playbackLine) {
            this.playbackLine.destroy();
        }
        
        this.playbackLine = this.add.rectangle(
            this.game.config.width / 2,
            this.game.config.height * 0.8,
            this.game.config.width,
            2,
            0xffffff
        ).setOrigin(0.5);
    }
}