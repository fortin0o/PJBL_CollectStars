export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        // Background
        this.add.image(400, 300, 'sky');
        
        // Semi-transparent overlay to make text pop
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.5);
        overlay.fillRect(0, 0, 800, 600);

        const titleText = this.add.text(400, 150, 'COLLECT STARS', {
            fontFamily: '"Press Start 2P"',
            fontSize: '40px',
            fill: '#ffd700',
            stroke: '#ff8c00',
            strokeThickness: 6,
            shadow: { offsetX: 4, offsetY: 4, color: '#000', fill: true }
        }).setOrigin(0.5);

        // Tween for title to float
        this.tweens.add({
            targets: titleText,
            y: 140,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Play Button
        const playBtn = this.createButton(400, 300, 'PLAY', () => {
            this.scene.start('PlayScene');
        });

        // High Score display
        const highScore = localStorage.getItem('collectStars_highScore') || 0;
        this.add.text(400, 450, `HIGH SCORE: ${highScore}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        // Instructions
        this.add.text(400, 520, 'Use ARROWS or TOUCH to move & jump\nCollect stars, avoid bombs!', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            fill: '#aaaaaa',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);
    }

    createButton(x, y, text, onClick) {
        const bg = this.add.graphics();
        const drawBg = (color) => {
            bg.clear();
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(x - 100, y - 25, 200, 50, 10);
            bg.lineStyle(4, 0xffffff, 1);
            bg.strokeRoundedRect(x - 100, y - 25, 200, 50, 10);
        };
        drawBg(0x3366cc);

        const btnText = this.add.text(x, y, text, {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const container = this.add.container(0, 0, [bg, btnText]);
        container.setSize(200, 50);
        
        // Make it interactive by creating a zone
        const zone = this.add.zone(x, y, 200, 50).setInteractive({ useHandCursor: true });
        
        zone.on('pointerover', () => {
            drawBg(0x5588ee);
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });

        zone.on('pointerout', () => {
            drawBg(0x3366cc);
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        zone.on('pointerdown', () => {
            drawBg(0x1144aa);
            container.y += 2;
        });

        zone.on('pointerup', () => {
            drawBg(0x5588ee);
            container.y -= 2;
            onClick();
        });
        
        return container;
    }
}
