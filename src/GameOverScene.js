export default class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.score = data.score || 0;
        this.win = data.win || false;
    }

    create() {
        // Dark background
        this.add.rectangle(400, 300, 800, 600, 0x000000);
        
        // Handle high score
        let highScore = localStorage.getItem('collectStars_highScore') || 0;
        let newHighScore = false;
        
        if (this.score > highScore) {
            highScore = this.score;
            localStorage.setItem('collectStars_highScore', highScore);
            newHighScore = true;
        }

        // Title Text
        const titleString = this.win ? 'YOU WIN!' : 'GAME OVER';
        const titleColor = this.win ? '#00ff00' : '#ff0000';
        
        this.add.text(400, 150, titleString, {
            fontFamily: '"Press Start 2P"',
            fontSize: '40px',
            fill: titleColor,
            stroke: '#ffffff',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Score Text
        this.add.text(400, 250, `SCORE: ${this.score}`, {
            fontFamily: '"Press Start 2P"',
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        // High Score Text
        const hsText = newHighScore ? 'NEW HIGH SCORE!' : `HIGH SCORE: ${highScore}`;
        const hsColor = newHighScore ? '#ffff00' : '#aaaaaa';
        
        this.add.text(400, 320, hsText, {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: hsColor
        }).setOrigin(0.5);

        // Restart Button
        this.createButton(400, 450, 'PLAY AGAIN', () => {
            this.scene.start('PlayScene', { level: 1, score: 0, lives: 3 });
        });
        
        // Menu Button
        this.createButton(400, 520, 'MAIN MENU', () => {
            this.scene.start('MenuScene');
        });
    }

    createButton(x, y, text, onClick) {
        const bg = this.add.graphics();
        const drawBg = (color) => {
            bg.clear();
            bg.fillStyle(color, 1);
            bg.fillRoundedRect(x - 125, y - 25, 250, 50, 10);
            bg.lineStyle(4, 0xffffff, 1);
            bg.strokeRoundedRect(x - 125, y - 25, 250, 50, 10);
        };
        drawBg(0xcc3333);

        const btnText = this.add.text(x, y, text, {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const container = this.add.container(0, 0, [bg, btnText]);
        container.setSize(250, 50);
        
        const zone = this.add.zone(x, y, 250, 50).setInteractive({ useHandCursor: true });
        
        zone.on('pointerover', () => {
            drawBg(0xee5555);
            this.tweens.add({
                targets: container,
                scaleX: 1.05,
                scaleY: 1.05,
                duration: 100
            });
        });

        zone.on('pointerout', () => {
            drawBg(0xcc3333);
            this.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 100
            });
        });

        zone.on('pointerdown', () => {
            drawBg(0xaa1111);
            container.y += 2;
        });

        zone.on('pointerup', () => {
            drawBg(0xee5555);
            container.y -= 2;
            onClick();
        });
        
        return container;
    }
}
