export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Show loading text
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
            fontFamily: '"Press Start 2P"',
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        // Load original assets
        this.load.image('sky', 'assets/sky.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });

        // Since we don't have a bomb.png or sounds, we can generate a texture for the bomb
        // We will do this in create(), but we need to wait for preload to finish.
    }

    create() {
        // Generate a bomb texture programmatically
        const g = this.make.graphics({x: 0, y: 0, add: false});
        
        // Bomb body (black circle)
        g.fillStyle(0x000000, 1);
        g.fillCircle(10, 10, 10);
        
        // Bomb highlight (grey arc)
        g.lineStyle(2, 0x888888, 1);
        g.beginPath();
        g.arc(8, 8, 5, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(270));
        g.strokePath();

        // Bomb fuse (orange/yellow)
        g.lineStyle(2, 0xffa500, 1);
        g.beginPath();
        g.moveTo(10, 0);
        g.lineTo(15, -5);
        g.strokePath();
        
        g.fillStyle(0xffff00, 1);
        g.fillCircle(16, -6, 2);

        g.generateTexture('bomb', 24, 24);

        // Generate player animations here so they're available globally
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        
        this.anims.create({
            key: 'turn',
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20
        });
        
        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        // Proceed to Menu Scene
        this.scene.start('MenuScene');
    }
}
