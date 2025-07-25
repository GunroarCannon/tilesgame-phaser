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

        // Lives (with count)
        this.add.image(this.scale.width - 120, 60, 'heart').setScale(0.6);
        this.add.text(this.scale.width - 80, 48, `x${playerLives}`, {
            fontSize: '32px',
            fontFamily: 'Arial Black',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 4
        });

        // ========== Scroll Panel ==========
        const scrollPanel = this.add.container(0, 300); // <-- Y offset here
        const maskGraphics = this.add.graphics();
        maskGraphics.fillRect(0, 0, this.scale.width, this.scale.height - 300);
        const mask = maskGraphics.createGeometryMask();
        scrollPanel.setMask(mask);

        let y = 0;
        for (let i=1;i<100;i++){
        for (let song of songs) {
            const panel = this.createSongPanel(song.displayName+i);
            panel.y = y;
            scrollPanel.add(panel);
            y += 200;
        }}

        // Scroll wheel
        this.input.on('wheel', (_, __, ___, dy) => {
            scrollPanel.y -= dy * 0.6;
            scrollPanel.y = Phaser.Math.Clamp(scrollPanel.y, -y + (this.scale.height - 200), 300);
        });
    }

    createSongPanel(title) {
        const container = this.add.container(this.scale.width / 2, 0);
        const bg = this.add.graphics();
        bg.fillStyle(0xffffff, 0.15);
        bg.lineStyle(2, 0xffffff, 1);
        bg.fillRoundedRect(-450, -80, 900, 160, 30);
        bg.strokeRoundedRect(-450, -80, 900, 160, 30);
        container.add(bg);

        const text = this.add.text(-400, -20, title, {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffffff'
        });
        container.add(text);

        return container;
    }

    createGradientBackground() {
        const rt = this.textures.createCanvas('gradientBg', this.scale.width, this.scale.height);
        const ctx = rt.getContext();
        const gradient = ctx.createLinearGradient(0, 0, 0, this.scale.height);
        gradient.addColorStop(0, '#9ae5ff');
        gradient.addColorStop(1, '#d29aff');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.scale.width, this.scale.height);
        rt.refresh();
        this.add.image(0, 0, 'gradientBg').setOrigin(0);
    }
}
