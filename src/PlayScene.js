export default class PlayScene extends Phaser.Scene {
    constructor() {
        super('PlayScene');
    }

    init(data) {
        this.level = data.level || 1;
        this.score = data.score || 0;
        this.lives = data.lives || 3;
    }

    create() {
        this.gameOver = false;
        this.levelComplete = false;

        // Define level configurations
        const levels = [
            // Level 1: Basic wide map
            {
                worldWidth: 2400,
                stars: 30,
                bombs: 0,
                platforms: [
                    { x: 600, y: 400 }, { x: 50, y: 250 }, { x: 750, y: 220 },
                    { x: 1100, y: 350 }, { x: 1400, y: 200 }, { x: 1800, y: 400 },
                    { x: 2100, y: 250 }
                ]
            },
            // Level 2: Wider, more platforms, starting with a bomb
            {
                worldWidth: 3200,
                stars: 40,
                bombs: 1,
                platforms: [
                    { x: 400, y: 300 }, { x: 800, y: 200 }, { x: 1200, y: 400 },
                    { x: 1600, y: 250 }, { x: 2000, y: 450 }, { x: 2400, y: 300 },
                    { x: 2800, y: 200 }, { x: 100, y: 150 }, { x: 1500, y: 100 }
                ]
            },
            // Level 3: Huge, many bombs, tricky jumps
            {
                worldWidth: 4000,
                stars: 50,
                bombs: 3,
                platforms: [
                    { x: 300, y: 450 }, { x: 700, y: 350 }, { x: 1100, y: 250 },
                    { x: 1500, y: 150 }, { x: 1900, y: 400 }, { x: 2300, y: 300 },
                    { x: 2700, y: 200 }, { x: 3100, y: 450 }, { x: 3500, y: 350 },
                    { x: 3800, y: 200 }
                ]
            }
        ];

        this.maxLevels = levels.length;
        this.currentConfig = levels[this.level - 1] || levels[0];
        
        const worldWidth = this.currentConfig.worldWidth;
        const worldHeight = 600;

        // Set camera and physics bounds
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        
        // Background
        this.add.tileSprite(0, 0, worldWidth, worldHeight, 'sky').setOrigin(0, 0);
        
        // Platforms
        this.platforms = this.physics.add.staticGroup();
        
        // Ground covering the entire world
        for (let x = 0; x < worldWidth; x += 400) {
            this.platforms.create(x + 200, 568, 'ground').setScale(2).refreshBody();
        }

        // Add configured platforms
        this.currentConfig.platforms.forEach(pos => {
            this.platforms.create(pos.x, pos.y, 'ground');
        });
        
        // Player
        this.player = this.physics.add.sprite(100, 450, 'dude');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        
        // Camera follow
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // Stars
        this.stars = this.physics.add.group({
            key: 'star',
            repeat: this.currentConfig.stars - 1,
            setXY: { x: 12, y: 0, stepX: Math.floor(worldWidth / this.currentConfig.stars) }
        });
        
        this.stars.children.iterate((child) => {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
        });
        
        // Bombs
        this.bombs = this.physics.add.group();
        
        for (let i = 0; i < this.currentConfig.bombs; i++) {
            this.spawnBomb();
        }
        
        // UI
        this.scoreText = this.add.text(16, 16, 'SCORE: ' + this.score, { 
            fontFamily: '"Press Start 2P"', fontSize: '20px', fill: '#000' 
        }).setScrollFactor(0);

        this.livesText = this.add.text(580, 16, 'LIVES: ' + this.lives, { 
            fontFamily: '"Press Start 2P"', fontSize: '20px', fill: '#d00' 
        }).setScrollFactor(0);
        
        this.levelText = this.add.text(400, 16, 'MAP ' + this.level, { 
            fontFamily: '"Press Start 2P"', fontSize: '20px', fill: '#000' 
        }).setOrigin(0.5, 0).setScrollFactor(0);
        
        // Central messages
        this.centerText = this.add.text(400, 300, '', {
            fontFamily: '"Press Start 2P"', fontSize: '40px', fill: '#ff0',
            stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
        this.centerText.setVisible(false);

        // Colliders
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.bombs, this.platforms);
        
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);
        
        // Inputs
        this.cursors = this.input.keyboard.createCursorKeys();
        this.createMobileControls();

        // Audio Context setup
        if (!window.audioCtx) {
            window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    createMobileControls() {
        this.mobileLeft = false;
        this.mobileRight = false;
        this.mobileJump = false;

        if (!this.sys.game.device.input.touch) return;

        const leftBtn = this.add.circle(80, 520, 50, 0xffffff, 0.2).setInteractive().setScrollFactor(0);
        const rightBtn = this.add.circle(200, 520, 50, 0xffffff, 0.2).setInteractive().setScrollFactor(0);
        const jumpBtn = this.add.circle(720, 520, 50, 0xffffff, 0.2).setInteractive().setScrollFactor(0);

        const addEvents = (btn, dirKey) => {
            btn.on('pointerdown', () => this[dirKey] = true);
            btn.on('pointerup', () => this[dirKey] = false);
            btn.on('pointerout', () => this[dirKey] = false);
        };

        addEvents(leftBtn, 'mobileLeft');
        addEvents(rightBtn, 'mobileRight');
        addEvents(jumpBtn, 'mobileJump');
        
        this.add.text(80, 520, '<', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);
        this.add.text(200, 520, '>', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);
        this.add.text(720, 520, '^', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0);
    }

    update() {
        if (this.gameOver || this.levelComplete) {
            this.player.setVelocityX(0);
            return;
        }

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
            this.playSound('jump');
        }
    }

    spawnBomb() {
        const spawnX = (this.player.x < this.currentConfig.worldWidth / 2) 
            ? Phaser.Math.Between(this.currentConfig.worldWidth / 2, this.currentConfig.worldWidth) 
            : Phaser.Math.Between(0, this.currentConfig.worldWidth / 2);
            
        const bomb = this.bombs.create(spawnX, 16, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;
    }

    collectStar(player, star) {
        star.disableBody(true, true);
        
        this.score += 10;
        this.scoreText.setText('SCORE: ' + this.score);
        this.playSound('pickup');
        
        if (this.stars.countActive(true) === 0) {
            this.levelComplete = true;
            this.physics.pause();
            
            if (this.level < this.maxLevels) {
                this.centerText.setText('MAP COMPLETE!');
                this.centerText.setVisible(true);
                
                // Reward with an extra life for completing a map
                this.lives++;
                this.livesText.setText('LIVES: ' + this.lives);
                
                this.time.delayedCall(2000, () => {
                    this.scene.start('PlayScene', { 
                        level: this.level + 1, 
                        score: this.score, 
                        lives: this.lives 
                    });
                });
            } else {
                // Game beat!
                this.time.delayedCall(1000, () => {
                    this.scene.start('GameOverScene', { score: this.score, win: true });
                });
            }
        }
    }

    hitBomb(player, bomb) {
        if (this.levelComplete) return; // Ignore bombs if map is won
        
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.player.anims.play('turn');
        
        this.lives--;
        this.livesText.setText('LIVES: ' + this.lives);
        this.playSound('explosion');
        
        if (this.lives > 0) {
            this.time.delayedCall(1000, () => {
                this.physics.resume();
                this.player.clearTint();
                this.player.setPosition(100, 450);
                
                this.bombs.children.iterate((b) => {
                    if (b && b.x < 400) b.x = 800; 
                });
            });
        } else {
            this.gameOver = true;
            this.time.delayedCall(1500, () => {
                this.scene.start('GameOverScene', { score: this.score, win: false });
            });
        }
    }

    playSound(type) {
        const ctx = window.audioCtx;
        if (ctx.state === 'suspended') ctx.resume();
        
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        const now = ctx.currentTime;
        
        if (type === 'jump') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gainNode.gain.setValueAtTime(0.05, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'pickup') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.setValueAtTime(1200, now + 0.05);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'explosion') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        }
    }
}
