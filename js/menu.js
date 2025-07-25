class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        this.load.json('songs', 'assets/songs.json');
        this.load.image('heart', 'assets/ui/heart.png');
    }

    create() {
        this.createGradientBackground();

        const playerLives = 3;
        const playerLevel = 2;
        const songs = this.cache.json.get('songs');

        // === Player Stats Panel ===
        const statsBg = this.add.graphics();
        statsBg.fillStyle(0xffffff, 0.25);
        statsBg.fillRoundedRect(20, 20, this.scale.width - 40, 100, 25);

        this.add.text(40, 45, `Level: ${playerLevel}`, {
            fontSize: '34px',
            fontFamily: 'Arial Black',
            color: '#ffffff'
        });

        this.add.image(this.scale.width - 140, 70, 'heart').setScale(0.6);
        this.add.text(this.scale.width - 100, 58, `x${playerLives}`, {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#ffffff',
            stroke: '#000',
            strokeThickness: 4
        });
// === Scroll Panel ===
const scrollPanel = this.add.container(0, 140);
const maskGraphics = this.make.graphics({ add: false });
maskGraphics.fillStyle(0xffffff);
maskGraphics.fillRect(0, 140, this.scale.width, this.scale.height - 140);
const mask = new Phaser.Display.Masks.GeometryMask(this, maskGraphics);
scrollPanel.setMask(mask);

let y = 0;
for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    const panel = this.createSongPanel(song.displayName, i);
    panel.y = y;
    scrollPanel.add(panel);
    y += 220;
}

const maxScroll = Math.max(140, -y + (this.scale.height - 200));  // ✅ Clamp based on content height

this.input.on('wheel', (_, __, ___, dy) => {
    scrollPanel.y -= dy * 0.6;
    scrollPanel.y = Phaser.Math.Clamp(scrollPanel.y, maxScroll, 140);
});

    }

    createSongPanel(title, index) {
        const container = this.add.container(this.scale.width / 2, 0);
        const width = 900;
        const height = 160;

        // === Gradient Panel Background ===
        const key = `panel-bg-${index}`;
        if (!this.textures.exists(key)) {
            const rt = this.textures.createCanvas(key, width, height);
            const ctx = rt.getContext();
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#ffffff22');
            gradient.addColorStop(1, '#ccffff11');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            rt.refresh();
        }

        const bgImage = this.add.image(0, 0, key).setDisplaySize(width, height);
        const border = this.add.graphics();
        border.lineStyle(2, 0xffffff, 0.4);
        border.strokeRoundedRect(-width / 2, -height / 2, width, height, 30);

        container.add(bgImage);
        container.add(border);

        // === Title Text ===
        const titleText = this.add.text(-width / 2 + 40, -30, title, {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffffff'
        });
        container.add(titleText);

        // === Play Button ===
        const buttonWidth = 150;
        const buttonHeight = 60;
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x9afccf, 0.9);
        buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 20);

        const playText = this.add.text(0, 0, '▶ Play', {
            fontSize: '26px',
            fontFamily: 'Arial Black',
            color: '#003333'
        }).setOrigin(0.5);

        const playBtn = this.add.container(width / 2 - 120, 0, [buttonBg, playText])
            .setSize(buttonWidth, buttonHeight)
            .setInteractive({ useHandCursor: true });

        playBtn.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0xb7ffe2, 1);
            buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 20);
        });
        playBtn.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0x9afccf, 0.9);
            buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 20);
        });

        playBtn.on('pointerdown', () => {
            this.tweens.add({
                targets: container,
                scale: 1.1,
                alpha: 0,
                duration: 300,
                ease: 'Cubic.easeInOut',
                onComplete: () => {
                    this.scene.start('GameScene', { song: title });
                }
            });
        });

        container.add(playBtn);

        return container;
    }
    
    createGradientBackground() {
    const rt = this.textures.createCanvas('gradientBg', this.scale.width, this.scale.height);
    const ctx = rt.getContext();
    const gradient = ctx.createLinearGradient(0, 0, 0, this.scale.height);
    gradient.addColorStop(0, '#aab8ff'); // Light lavender-blue
    gradient.addColorStop(1, '#cbbdff'); // Pale purple
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.scale.width, this.scale.height);
    rt.refresh();
    this.add.image(0, 0, 'gradientBg').setOrigin(0);}
}
