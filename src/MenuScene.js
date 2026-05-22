class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        // Space Background
        this.bg = this.add.tileSprite(0, 0, 800, 600, 'space_bg').setOrigin(0, 0);
        
        // Add some floating star particles in the background
        this.add.particles('star').createEmitter({
            x: { min: 0, max: 800 },
            y: { min: 0, max: 600 },
            speedY: { min: -10, max: -30 },
            speedX: { min: -10, max: 10 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 4000,
            frequency: 100
        });

        // Title text with a strong glow
        const titleText = this.add.text(400, 150, 'COLLECT STARS', {
            fontFamily: '"Press Start 2P"',
            fontSize: '48px',
            fill: '#ffffff',
            stroke: '#ff00ff',
            strokeThickness: 8,
            shadow: { offsetX: 0, offsetY: 0, color: '#00ffff', blur: 20, stroke: true, fill: true }
        }).setOrigin(0.5);

        // Tween for title to float gently
        this.tweens.add({
            targets: titleText,
            y: 135,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Play Button
        const playBtn = this.createButton(400, 300, 'START GAME', () => {
            this.scene.start('PlayScene', { level: 1, score: 0, lives: 3 });
        });

        // High Score display
        const highScore = localStorage.getItem('collectStars_highScore') || 0;
        this.add.text(400, 420, `HIGH SCORE: ${highScore}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: '#ffff00',
            shadow: { blur: 10, color: '#ff8800', fill: true }
        }).setOrigin(0.5);
        
        // Instructions
        this.add.text(400, 520, 'Use ARROWS or TOUCH to move\nCollect stars & avoid bombs!\nGrab Power-ups for an edge!', {
            fontFamily: '"Press Start 2P"',
            fontSize: '12px',
            fill: '#00ffff',
            align: 'center',
            lineSpacing: 12
        }).setOrigin(0.5);
    }

    update() {
        // Slowly scroll the background
        this.bg.tilePositionX += 0.5;
        this.bg.tilePositionY += 0.2;
    }

    createButton(x, y, text, onClick) {
        const bg = this.add.graphics();
        const drawBg = (color, glowColor) => {
            bg.clear();
            
            // Outer glow
            bg.lineStyle(8, glowColor, 0.4);
            bg.strokeRoundedRect(x - 125, y - 30, 250, 60, 15);
            
            // Inner box
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(x - 125, y - 30, 250, 60, 15);
            bg.lineStyle(4, 0xffffff, 1);
            bg.strokeRoundedRect(x - 125, y - 30, 250, 60, 15);
        };
        drawBg(0x330066, 0x00ffff);

        const btnText = this.add.text(x, y, text, {
            fontFamily: '"Press Start 2P"',
            fontSize: '22px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const container = this.add.container(0, 0, [bg, btnText]);
        container.setSize(250, 60);
        
        const zone = this.add.zone(x, y, 250, 60).setInteractive({ useHandCursor: true });
        
        zone.on('pointerover', () => {
            drawBg(0x6600aa, 0xff00ff);
            this.tweens.add({ targets: container, scaleX: 1.05, scaleY: 1.05, duration: 100 });
        });

        zone.on('pointerout', () => {
            drawBg(0x330066, 0x00ffff);
            this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 100 });
        });

        zone.on('pointerdown', () => {
            drawBg(0x110033, 0x00ffff);
            container.y += 4;
        });

        zone.on('pointerup', () => {
            drawBg(0x6600aa, 0xff00ff);
            container.y -= 4;
            onClick();
        });
        
        return container;
    }
}
