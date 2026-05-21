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
        this.load.image('space_bg', 'assets/space_bg.png'); // New background
        this.load.image('ground', 'assets/ground.png'); // new ground tile
        this.load.image('enemy', 'assets/enemy.png'); // new enemy sprite
        this.load.image('star', 'assets/star.png');
        this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
        // Load generated textures (ground and enemy will be created programmatically)
        // No extra load needed for them.

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

        // Generate a spark texture for particles
        const sg = this.make.graphics({x: 0, y: 0, add: false});
        sg.fillStyle(0xffffff, 1);
        sg.fillCircle(4, 4, 4);
        sg.generateTexture('spark', 8, 8);

        // Power-up: Shield (Blue Circle)
        const shieldG = this.make.graphics({x: 0, y: 0, add: false});
        shieldG.lineStyle(3, 0x00ffff, 1);
        shieldG.strokeCircle(12, 12, 10);
        shieldG.fillStyle(0x0088ff, 0.6);
        shieldG.fillCircle(12, 12, 10);
        shieldG.generateTexture('powerup_shield', 24, 24);

        // Power-up: Boots (Green Square)
        const bootsG = this.make.graphics({x: 0, y: 0, add: false});
        bootsG.lineStyle(3, 0x00ff00, 1);
        bootsG.strokeRect(4, 4, 16, 16);
        bootsG.fillStyle(0x00aa00, 0.6);
        bootsG.fillRect(4, 4, 16, 16);
        bootsG.generateTexture('powerup_boots', 24, 24);

        // Power-up: Heart (Pink Diamond)
        const heartG = this.make.graphics({x: 0, y: 0, add: false});
        heartG.fillStyle(0xff00ff, 1);
        heartG.beginPath();
        heartG.moveTo(12, 2);
        heartG.lineTo(22, 12);
        heartG.lineTo(12, 22);
        heartG.lineTo(2, 12);
        heartG.closePath();
        heartG.fillPath();
        heartG.lineStyle(2, 0xffffff, 1);
        heartG.strokePath();
        heartG.generateTexture('powerup_heart', 24, 24);

        // Generate player animations here so they're available globally
        // Load generated textures (ground tile and enemy)
        // These assets will be placed in the assets folder as 'ground_tile.png' and 'enemy.png'
        // No procedural generation needed here; textures are loaded in preload.

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
