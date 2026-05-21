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
        
        // Active Buff State
        this.activeBuff = null; // 'shield' or 'boots'
        this.buffTimerEvent = null;
        this.buffTimeRemaining = 0;

        // Configurations
        const levels = [
            {
                worldWidth: 1200, stars: 15, bombs: 0,
                platforms: [{ x: 400, y: 400 }, { x: 50, y: 250 }, { x: 750, y: 220 }, { x: 1000, y: 350 }]
            },
            {
                worldWidth: 1600, stars: 20, bombs: 1,
                platforms: [{ x: 400, y: 300 }, { x: 800, y: 200 }, { x: 1200, y: 400 }, { x: 1500, y: 250 }, { x: 100, y: 150 }]
            },
            {
                worldWidth: 2000, stars: 25, bombs: 2,
                platforms: [{ x: 300, y: 450 }, { x: 700, y: 350 }, { x: 1100, y: 250 }, { x: 1500, y: 150 }, { x: 1800, y: 400 }, { x: 50, y: 300 }]
            },
            {
                worldWidth: 2400, stars: 30, bombs: 3,
                platforms: [{ x: 200, y: 400 }, { x: 600, y: 300 }, { x: 1000, y: 200 }, { x: 1400, y: 300 }, { x: 1800, y: 400 }, { x: 2200, y: 250 }]
            },
            {
                worldWidth: 2800, stars: 35, bombs: 4,
                platforms: [{ x: 150, y: 350 }, { x: 550, y: 250 }, { x: 950, y: 150 }, { x: 1350, y: 250 }, { x: 1750, y: 350 }, { x: 2150, y: 250 }, { x: 2550, y: 150 }]
            }
        ];

        this.maxLevels = levels.length;
        this.currentConfig = levels[this.level - 1] || levels[0];
        
        const worldWidth = this.currentConfig.worldWidth;
        const worldHeight = 600;

        // Camera and Physics
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        
        // Scrolling Space Background
        this.bg = this.add.tileSprite(0, 0, 800, 600, 'space_bg').setOrigin(0, 0).setScrollFactor(0);
        
        // Updated ground texture uses 'ground' asset (new tile)
        // Platforms already use 'ground' texture, no change needed

        this.platforms = this.physics.add.staticGroup();
        for (let x = 0; x < worldWidth; x += 400) {
            this.platforms.create(x + 200, 568, 'ground').setScale(2).refreshBody();
        }
        this.currentConfig.platforms.forEach(pos => this.platforms.create(pos.x, pos.y, 'ground'));
        
        // Player
        this.player = this.physics.add.sprite(100, 450, 'dude');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.player.setDepth(5);
        this.baseVelocityX = 160;
        this.baseJumpVelocity = -330;
        
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // Entities
        this.stars = this.physics.add.group({
            key: 'star',
            repeat: this.currentConfig.stars - 1,
            setXY: { x: 12, y: 0, stepX: Math.floor(worldWidth / this.currentConfig.stars) }
        });
        this.stars.children.iterate((c) => c.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)));
        
        this.bombs = this.physics.add.group();


        this.powerups = this.physics.add.group();

        // Particles
        this.playerEmitter = this.add.particles('spark').createEmitter({
            speed: { min: -20, max: 20 }, angle: { min: 0, max: 360 }, scale: { start: 0.5, end: 0 },
            alpha: { start: 0.5, end: 0 }, blendMode: 'ADD', lifespan: 300, gravityY: -50, on: true
        });
        this.playerEmitter.startFollow(this.player, 0, 15);

        this.starEmitter = this.add.particles('star').createEmitter({
            speed: { min: 50, max: 150 }, scale: { start: 0.4, end: 0 }, alpha: { start: 1, end: 0 },
            blendMode: 'ADD', lifespan: 400, on: false
        });

        this.bombEmitter = this.add.particles('spark').createEmitter({
            speed: { min: 100, max: 400 }, scale: { start: 2, end: 0 }, tint: 0xff0000,
            blendMode: 'ADD', lifespan: 600, on: false
        });

        // UI
        this.scoreText = this.add.text(16, 16, 'SCORE: ' + this.score, { fontFamily: '"Press Start 2P"', fontSize: '16px', fill: '#fff' }).setScrollFactor(0).setDepth(10);
        this.livesText = this.add.text(580, 16, 'LIVES: ' + this.lives, { fontFamily: '"Press Start 2P"', fontSize: '16px', fill: '#fff', stroke: '#d00', strokeThickness: 4 }).setScrollFactor(0).setDepth(10);
        this.levelText = this.add.text(400, 16, 'MAP ' + this.level, { fontFamily: '"Press Start 2P"', fontSize: '16px', fill: '#0ff' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(10);
        
        this.buffText = this.add.text(16, 45, '', { fontFamily: '"Press Start 2P"', fontSize: '12px', fill: '#0f0' }).setScrollFactor(0).setDepth(10);

        this.centerText = this.add.text(400, 300, '', { fontFamily: '"Press Start 2P"', fontSize: '32px', fill: '#ff0', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setScrollFactor(0).setDepth(10).setVisible(false);

        // Colliders
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.stars, this.platforms);
        this.physics.add.collider(this.bombs, this.platforms);
        this.physics.add.collider(this.powerups, this.platforms);
        
        this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);
        this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);
        
        
        this.cursors = this.input.keyboard.createCursorKeys();
        this.createMobileControls();

        if (!window.audioCtx) window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Add a timer to update the buff text every 100ms
        this.time.addEvent({ delay: 100, callback: this.updateBuffUI, callbackScope: this, loop: true });
    }

    createMobileControls() {
        this.mobileLeft = false; this.mobileRight = false; this.mobileJump = false;
        if (!this.sys.game.device.input.touch) return;
        const addBtn = (x, txt, key) => {
            const btn = this.add.circle(x, 520, 50, 0xffffff, 0.2).setInteractive().setScrollFactor(0).setDepth(10);
            btn.on('pointerdown', () => this[key] = true);
            btn.on('pointerup', () => this[key] = false);
            btn.on('pointerout', () => this[key] = false);
            this.add.text(x, 520, txt, { fontSize: '28px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0).setDepth(10);
        };
        addBtn(80, '<', 'mobileLeft'); addBtn(200, '>', 'mobileRight'); addBtn(720, '^', 'mobileJump');
    }

    update() {
        if (this.gameOver || this.levelComplete) {
            this.player.setVelocityX(0);
            this.playerEmitter.stop();
            return;
        }

        // Parallax background scroll
        this.bg.tilePositionX = this.cameras.main.scrollX * 0.3;

        const leftDown = this.cursors.left.isDown || this.mobileLeft;
        const rightDown = this.cursors.right.isDown || this.mobileRight;
        const jumpDown = this.cursors.up.isDown || this.mobileJump;
        
        const speedMultiplier = this.activeBuff === 'boots' ? 1.5 : 1;
        const jumpMultiplier = this.activeBuff === 'boots' ? 1.2 : 1;

        if (leftDown) {
            this.player.setVelocityX(-this.baseVelocityX * speedMultiplier);
            this.player.anims.play('left', true);
            this.playerEmitter.start();
        } else if (rightDown) {
            this.player.setVelocityX(this.baseVelocityX * speedMultiplier);
            this.player.anims.play('right', true);
            this.playerEmitter.start();
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn');
            this.playerEmitter.stop();
        }

        if (jumpDown && this.player.body.touching.down) {
            this.player.setVelocityY(this.baseJumpVelocity * jumpMultiplier);
            this.playSound('jump');
            this.playerEmitter.explode(10, this.player.x, this.player.y + 15);
        }
    }

    updateBuffUI() {
        if (this.activeBuff && this.buffTimerEvent) {
            const remaining = Math.ceil(this.buffTimerEvent.getRemainingSeconds());
            this.buffText.setText(`${this.activeBuff.toUpperCase()}: ${remaining}s`);
        } else {
            this.buffText.setText('');
        }
    }

    spawnBomb() {
        const spawnX = (this.player.x < this.currentConfig.worldWidth / 2) 
            ? Phaser.Math.Between(this.currentConfig.worldWidth / 2, this.currentConfig.worldWidth) 
            : Phaser.Math.Between(0, this.currentConfig.worldWidth / 2);
        const bomb = this.bombs.create(spawnX, 16, 'bomb');
        bomb.setBounce(1).setCollideWorldBounds(true).setVelocity(Phaser.Math.Between(-200, 200), 20);
        bomb.allowGravity = false;
        bomb.setTint(0xffaaaa);
    }

    collectStar(player, star) {
        this.starEmitter.emitParticleAt(star.x, star.y, 8);
        star.disableBody(true, true);
        this.score += 10;
        this.scoreText.setText('SCORE: ' + this.score);
        this.playSound('pickup');
        this.tweens.add({ targets: this.scoreText, scaleX: 1.5, scaleY: 1.5, duration: 100, yoyo: true });

        const remaining = this.stars.countActive(true);

        // Spawn a powerup when half the stars are collected (once per level)
        if (!this.powerupSpawned && remaining <= Math.floor(this.currentConfig.stars / 2)) {
            this.powerupSpawned = true;
            if (Phaser.Math.Between(1, 100) > 30) { // 70% chance
                const type = Phaser.Math.RND.pick(['powerup_shield', 'powerup_boots', 'powerup_heart']);
                const spawnX = Phaser.Math.Between(100, this.currentConfig.worldWidth - 100);
                const p = this.powerups.create(spawnX, 16, type);
                p.setBounce(0.5);
                p.powerupType = type;
            }
        }

        if (remaining === 0) {
            // ALL STARS COLLECTED — Level Complete!
            this.levelComplete = true;
            this.physics.pause();

            // Clear uncollected powerups
            this.powerups.clear(true, true);

            if (this.level < this.maxLevels) {
                this.centerText.setText('MAP COMPLETE!');
                this.centerText.setVisible(true);

                // Reward +1 life
                this.lives++;
                this.livesText.setText('LIVES: ' + this.lives);

                // Play a fanfare sound
                this.playSound('pickup');

                this.time.delayedCall(2000, () => {
                    this.scene.start('PlayScene', {
                        level: this.level + 1,
                        score: this.score,
                        lives: this.lives
                    });
                });
            } else {
                // Beat the final map!
                this.centerText.setText('YOU WIN!');
                this.centerText.setVisible(true);

                this.time.delayedCall(2000, () => {
                    this.scene.start('GameOverScene', { score: this.score, win: true });
                });
            }
        }
    }

    collectPowerup(player, powerup) {
        powerup.disableBody(true, true);
        this.playSound('pickup');
        this.starEmitter.emitParticleAt(powerup.x, powerup.y, 20); // big burst

        if (powerup.powerupType === 'powerup_heart') {
            this.lives++;
            this.livesText.setText('LIVES: ' + this.lives);
            this.player.setTintFill(0xffffff);
            this.time.delayedCall(200, () => this.applyBuffTint());
            return;
        }

        // Handle Shield and Boots
        if (this.buffTimerEvent) this.buffTimerEvent.remove();
        
        if (powerup.powerupType === 'powerup_shield') {
            this.activeBuff = 'shield';
            this.buffText.setColor('#00ffff');
        } else if (powerup.powerupType === 'powerup_boots') {
            this.activeBuff = 'boots';
            this.buffText.setColor('#00ff00');
        }

        this.applyBuffTint();
        
        // 8 seconds duration
        this.buffTimerEvent = this.time.delayedCall(8000, () => {
            this.activeBuff = null;
            this.player.clearTint();
            this.buffText.setText('');
        });
    }

    applyBuffTint() {
        if (this.activeBuff === 'shield') this.player.setTint(0x00ffff);
        else if (this.activeBuff === 'boots') this.player.setTint(0x00ff00);
        else this.player.clearTint();
    }




    hitBomb(player, bomb) {
        if (this.levelComplete) return;
        
        // Shield ignores bombs completely!
        if (this.activeBuff === 'shield') {
            this.playSound('explosion');
            this.bombEmitter.emitParticleAt(bomb.x, bomb.y, 20);
            bomb.disableBody(true, true); // destroy the bomb
            return;
        }
        
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.player.anims.play('turn');
        
        this.lives--;
        this.livesText.setText('LIVES: ' + this.lives);
        this.playSound('explosion');
        this.bombEmitter.emitParticleAt(this.player.x, this.player.y, 40);
        this.cameras.main.shake(200, 0.02);
        
        if (this.lives > 0) {
            this.time.delayedCall(1000, () => {
                this.physics.resume();
                this.applyBuffTint(); // Restore tint if buff is still active
                this.player.setPosition(100, 450);
                this.bombs.children.iterate((b) => { if (b && b.x < 400) b.x = 800; });
            });
        } else {
            this.gameOver = true;
            this.time.delayedCall(1500, () => this.scene.start('GameOverScene', { score: this.score, win: false }));
        }
    }

    playSound(type) {
        const ctx = window.audioCtx;
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode); gainNode.connect(ctx.destination);
        const now = ctx.currentTime;
        
        if (type === 'jump') {
            osc.type = 'square'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gainNode.gain.setValueAtTime(0.025, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'pickup') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(600, now); osc.frequency.setValueAtTime(1200, now + 0.05);
            gainNode.gain.setValueAtTime(0.05, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);
        } else if (type === 'explosion') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
            gainNode.gain.setValueAtTime(0.1, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);
        }
    }
}
