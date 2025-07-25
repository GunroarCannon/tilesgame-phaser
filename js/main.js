class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        // Set up mode switching
        this.currentMode = 'game';
        
        // Create buttons
        this.gameModeBtn = document.getElementById('game-mode-btn');
        this.editorModeBtn = document.getElementById('editor-mode-btn');
        
        // Add event listeners
        this.gameModeBtn.addEventListener('click', () => this.switchMode('game'));
        this.editorModeBtn.addEventListener('click', () => this.switchMode('editor'));
        
        // Start with game mode
        this.switchMode('game');
    }
    
    switchMode(mode) {
        if (mode === this.currentMode) return;
        
        // Clean up current mode
        if (this.currentMode === 'game') {
            this.scene.stop('GameScene');
        } else {
            this.scene.stop('EditorScene');
        }
        
        // Start new mode
        if (mode === 'game') {
            this.scene.start('GameScene');
            this.gameModeBtn.classList.add('active');
            this.editorModeBtn.classList.remove('active');
        } else {
            this.scene.start('EditorScene');
            this.editorModeBtn.classList.add('active');
            this.gameModeBtn.classList.remove('active');
        }
        
        this.currentMode = mode;
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#000',
    scene: [MainScene, GameScene, EditorScene],
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    audio: {
        disableWebAudio: false
    }
};

const game = new Phaser.Game(config);