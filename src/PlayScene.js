export default class PlayScene extends Phaser.Scene {
    constructor() {
        super('PlayScene');
    }

    create() {
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        
        // Background
        this.add.image(400, 300, 'sky');
        
        // Platforms
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        this.platforms.create(600, 400, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(750, 220, 'ground');
        
        // Player
        this.player = this.physics.add.sprite(100, 450, 'dude');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        
        // Stars
        this.stars = this.physics.add.group({
            key: 'star',
            repeat: 11,
            setXY: { x: 12, y: 0, stepX: 70 }
        });
        
        this.stars.children.iterate((child) => {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });
        
        // Bombs
        this.bombs = this.physics.add.group();
        
        // UI
        this.scoreText = this.add.text(16, 16, 'SCORE: 0', { 
            fontFamily: '"Press Start 2P"', fontSize: '20px', fill: '#000' 
        });
        this.livesText = this.add.text(580, 16, 'LIVES: 3', { 
            fontFamily: '"Press Start 2P"', fontSize: '20px', fill: '#d00' 
        });
        
        // Colliders
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.bombs, this.platforms);
        
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);
        
        // Inputs
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Mobile controls
        this.createMobileControls();
    }

    createMobileControls() {
        this.mobileLeft = false;
        this.mobileRight = false;
        this.mobileJump = false;

        // Only show if touch is enabled
        if (!this.sys.game.device.input.touch) return;

        const leftBtn = this.add.circle(80, 520, 50, 0xffffff, 0.2).setInteractive();
        const rightBtn = this.add.circle(200, 520, 50, 0xffffff, 0.2).setInteractive();
        const jumpBtn = this.add.circle(720, 520, 50, 0xffffff, 0.2).setInteractive();

        const addEvents = (btn, dirKey) => {
            btn.on('pointerdown', () => this[dirKey] = true);
            btn.on('pointerup', () => this[dirKey] = false);
            btn.on('pointerout', () => this[dirKey] = false);
        };

        addEvents(leftBtn, 'mobileLeft');
        addEvents(rightBtn, 'mobileRight');
        addEvents(jumpBtn, 'mobileJump');
        
        // Icons
        this.add.text(80, 520, '<', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(200, 520, '>', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(720, 520, '^', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5);
    }

    update() {
        if (this.gameOver) return;

        const leftDown = this.cursors.left.isDown || this.mobileLeft;
        const rightDown = this.cursors.right.isDown || this.mobileRight;
        const jumpDown = this.cursors.up.isDown || this.mobileJump;

        if (leftDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        }
        else if (rightDown) {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
        }
        else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
        }

        if (jumpDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }
    }

    collectStar(player, star) {
        star.disableBody(true, true);
        
        this.score += 10;
        this.scoreText.setText('SCORE: ' + this.score);
        
        if (this.stars.countActive(true) === 0) {
            // New wave
            this.stars.children.iterate((child) => {
                child.enableBody(true, child.x, 0, true, true);
            });
            
            // Spawn a bomb
            const x = (this.player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);
            const bomb = this.bombs.create(x, 16, 'bomb');
            bomb.setBounce(1);
            bomb.setCollideWorldBounds(true);
            bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
            bomb.allowGravity = false;
        }
    }

    hitBomb(player, bomb) {
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.player.anims.play('turn');
        
        this.lives--;
        this.livesText.setText('LIVES: ' + this.lives);
        
        if (this.lives > 0) {
            // Flash and respawn
            this.time.delayedCall(1000, () => {
                this.physics.resume();
                this.player.clearTint();
                // Move player safely away from bombs
                this.player.setPosition(100, 450);
                
                // Clear bombs near spawn
                this.bombs.children.iterate((b) => {
                    if (b && b.x < 200) {
                        b.x = 600;
                    }
                });
            });
        } else {
            this.gameOver = true;
            this.time.delayedCall(1500, () => {
                this.scene.start('GameOverScene', { score: this.score });
            });
        }
    }
}
