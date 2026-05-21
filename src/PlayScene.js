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

        // Define level configurations (Made smaller & punchier per user request)
        const levels = [
            // Level 1: Sunset/Orange tint, short map
            {
                worldWidth: 1200, // Reduced from 2400
                stars: 15,
                bombs: 0,
                skyTint: 0xffaa88, // Warm sunset
                platforms: [
                    { x: 400, y: 400 }, { x: 50, y: 250 }, 
                    { x: 750, y: 220 }, { x: 1000, y: 350 }
                ]
            },
            // Level 2: Dark/Purple tint, medium map
            {
                worldWidth: 1600, // Reduced from 3200
                stars: 20,
                bombs: 1,
                skyTint: 0x8844ff, // Twilight
                platforms: [
                    { x: 400, y: 300 }, { x: 800, y: 200 }, 
                    { x: 1200, y: 400 }, { x: 1500, y: 250 }, 
                    { x: 100, y: 150 }
                ]
            },
            // Level 3: Red tint, slightly larger map
            {
                worldWidth: 2000, // Reduced from 4000
                stars: 25,
                bombs: 2,
                skyTint: 0xff6666, // Blood moon
                platforms: [
                    { x: 300, y: 450 }, { x: 700, y: 350 }, 
                    { x: 1100, y: 250 }, { x: 1500, y: 150 }, 
                    { x: 1800, y: 400 }, { x: 50, y: 300 }
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
        
        // Background with tint
        this.bg = this.add.tileSprite(0, 0, worldWidth, worldHeight, 'sky').setOrigin(0, 0);
        this.bg.setTint(this.currentConfig.skyTint);
        
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
        this.player.setDepth(5); // Render above particles
        
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

        // ==========================================
        // PARTICLE EFFECTS
        // ==========================================

        // 1. Player Running Dust Trail
        this.playerEmitter = this.add.particles('spark').createEmitter({
            speed: { min: -20, max: 20 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.5, end: 0 },
            blendMode: 'ADD',
            lifespan: 300,
            gravityY: -50,
            on: true // Constantly follows, but we adjust frequency in update()
        });
        this.playerEmitter.startFollow(this.player, 0, 15);

        // 2. Star Collection Burst
        this.starEmitter = this.add.particles('star').createEmitter({
            speed: { min: 50, max: 150 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 1, end: 0 },
            blendMode: 'ADD',
            lifespan: 400,
            gravityY: 100,
            on: false // Only emit manually
        });

        // 3. Bomb Explosion
        this.bombEmitter = this.add.particles('spark').createEmitter({
            speed: { min: 100, max: 400 },
            angle: { min: 0, max: 360 },
            scale: { start: 2, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: 0xff0000,
            blendMode: 'ADD',
            lifespan: 600,
            gravityY: 200,
            on: false
        });

        // UI
        this.scoreText = this.add.text(16, 16, 'SCORE: ' + this.score, { 
            fontFamily: '"Press Start 2P"', fontSize: '20px', fill: '#000' 
        }).setScrollFactor(0).setDepth(10);

        this.livesText = this.add.text(580, 16, 'LIVES: ' + this.lives, { 
            fontFamily: '"Press Start 2P"', fontSize: '20px', fill: '#fff',
            stroke: '#d00', strokeThickness: 4
        }).setScrollFactor(0).setDepth(10);
        
        this.levelText = this.add.text(400, 16, 'MAP ' + this.level, { 
            fontFamily: '"Press Start 2P"', fontSize: '20px', fill: '#000' 
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);
        
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

        const leftBtn = this.add.circle(80, 520, 50, 0xffffff, 0.2).setInteractive().setScrollFactor(0).setDepth(10);
        const rightBtn = this.add.circle(200, 520, 50, 0xffffff, 0.2).setInteractive().setScrollFactor(0).setDepth(10);
        const jumpBtn = this.add.circle(720, 520, 50, 0xffffff, 0.2).setInteractive().setScrollFactor(0).setDepth(10);

        const addEvents = (btn, dirKey) => {
            btn.on('pointerdown', () => this[dirKey] = true);
            btn.on('pointerup', () => this[dirKey] = false);
            btn.on('pointerout', () => this[dirKey] = false);
        };

        addEvents(leftBtn, 'mobileLeft');
        addEvents(rightBtn, 'mobileRight');
        addEvents(jumpBtn, 'mobileJump');
        
        this.add.text(80, 520, '<', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
        this.add.text(200, 520, '>', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
        this.add.text(720, 520, '^', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
    }

    update() {
        if (this.gameOver || this.levelComplete) {
            this.player.setVelocityX(0);
            this.playerEmitter.stop(); // Stop dust when game over
            return;
        }

        const leftDown = this.cursors.left.isDown || this.mobileLeft;
        const rightDown = this.cursors.right.isDown || this.mobileRight;
        const jumpDown = this.cursors.up.isDown || this.mobileJump;

        if (leftDown) {
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
            this.playerEmitter.start(); // Emit dust when moving
        }
        else if (rightDown) {
            this.player.setVelocityX(160);
            this.player.anims.play('right', true);
            this.playerEmitter.start(); // Emit dust when moving
        }
        else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
            this.playerEmitter.stop(); // Stop dust when idle
        }

        if (jumpDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
            this.playSound('jump');
            // Give a little puff of smoke on jump
            this.playerEmitter.explode(10, this.player.x, this.player.y + 15);
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
        
        // Make bombs glow slightly
        bomb.setTint(0xffaaaa);
    }

    collectStar(player, star) {
        // Fire particles where the star was
        this.starEmitter.emitParticleAt(star.x, star.y, 8);
        
        star.disableBody(true, true);
        
        this.score += 10;
        this.scoreText.setText('SCORE: ' + this.score);
        this.playSound('pickup');
        
        // Add a nice UI bounce animation
        this.tweens.add({
            targets: this.scoreText,
            scaleX: 1.5, scaleY: 1.5,
            duration: 100, yoyo: true
        });
        
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
        
        // BOOM! Fire red explosion particles
        this.bombEmitter.emitParticleAt(this.player.x, this.player.y, 40);
        
        // Shake the camera
        this.cameras.main.shake(200, 0.02);
        
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
