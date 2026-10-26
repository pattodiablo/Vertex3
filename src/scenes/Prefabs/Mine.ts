
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import * as Phaser from "phaser";
import EnemyBase from "./EnemyBase";
import Explode2 from "./Explode2";
/* END-USER-IMPORTS */

export default class Mine extends Phaser.GameObjects.Image {
	private static readonly EXPLOSION_DAMAGE = 10;
	private static readonly LAUNCH_RADIUS = 220;
	private static readonly PROXIMITY_SOUND_KEY = "proximity";
	private static readonly EXPLOSION_SOUND_KEYS = ["explotion1", "explotion2"];
	private static readonly BASE_SCALE = 0.9;
	private static readonly SPAWN_SCALE = 2;
	private static readonly SPAWN_SETTLE_DELAY_MS = 2000;
	private static readonly LAUNCH_SPEED_PX_PER_SEC = 520;
	private isExploding = false;
	private isLaunched = false;
	private hasTriggeredProximity = false;
	private idleTween?: Phaser.Tweens.Tween;
	private launchTween?: Phaser.Tweens.Tween;
	private spawnSettleTimer?: Phaser.Time.TimerEvent;

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "mine", frame);

		/* START-USER-CTR-CODE */
		console.log("Mine constructor called");
		this.setOrigin(0.5, 0.5);
		this.setDepth(9);
		this.setScale(Mine.SPAWN_SCALE);
		this.setTint(0xff0000);
		this.spawnSettleTimer = this.scene.time.delayedCall(Mine.SPAWN_SETTLE_DELAY_MS, () => {
			this.spawnSettleTimer = undefined;
			this.settleToIdle();
		});
		this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.checkForTargets, this);
		this.once(Phaser.GameObjects.Events.DESTROY, () => {
			this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.checkForTargets, this);
			this.spawnSettleTimer?.remove(false);
			this.spawnSettleTimer = undefined;
		});
		/* END-USER-CTR-CODE */
	}

	preUpdate(_time: number, _delta: number) {
		if (this.isExploding || !this.active || !this.visible || !this.scene?.sys?.isActive()) {
			return;
		}

		this.checkForTargets();
	}

	/* START-USER-CODE */

	// Write your code here.

	private settleToIdle() {
		if (this.isExploding || !this.active || !this.scene?.sys?.isActive()) {
			return;
		}

		this.scene.tweens.add({
			targets: this,
			scaleX: Mine.BASE_SCALE,
			scaleY: Mine.BASE_SCALE,
			duration: 450,
			ease: "Bounce.easeOut",
			onComplete: () => {
				this.clearTint();
				if (!this.active || this.isExploding || this.isLaunched || !this.scene?.sys?.isActive()) {
					return;
				}

				this.idleTween = this.scene.tweens.add({
					targets: this,
					scaleX: Mine.BASE_SCALE + 0.15,
					scaleY: Mine.BASE_SCALE + 0.15,
					alpha: 0.82,
					duration: 260,
					ease: "Sine.easeInOut",
					yoyo: true,
					repeat: -1,
				});
			},
		});
	}

	private checkForTargets() {
		if (this.isExploding || !this.active || !this.visible || !this.scene?.sys?.isActive()) {
			return;
		}

		this.checkProximity();

		if (this.isLaunched) {
			this.checkDetonationProximity();
			return;
		}

		let nearestEnemy: EnemyBase | null = null;
		let nearestDistanceSq = Number.POSITIVE_INFINITY;
		const searchRadius = Mine.LAUNCH_RADIUS;
		const searchRadiusSq = searchRadius * searchRadius;

		EnemyBase.forEachLiving((enemy) => {
			const dx = enemy.x - this.x;
			const dy = enemy.y - this.y;
			const distanceSq = dx * dx + dy * dy;
			if (distanceSq > searchRadiusSq || distanceSq >= nearestDistanceSq) {
				return;
			}

			nearestEnemy = enemy;
			nearestDistanceSq = distanceSq;
		});

		if (!nearestEnemy) {
			return;
		}

		this.launchAt(nearestEnemy);
	}

	private launchAt(target: EnemyBase) {
		if (this.isLaunched || this.isExploding || !this.scene?.sys?.isActive()) {
			return;
		}

		this.isLaunched = true;
		this.idleTween?.stop();
		this.idleTween = undefined;
		this.setRotation(Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y));

		const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
		const duration = Math.max(120, (distance / Mine.LAUNCH_SPEED_PX_PER_SEC) * 1000);

		this.launchTween = this.scene.tweens.add({
			targets: this,
			x: target.x,
			y: target.y,
			duration,
			ease: "Quad.easeIn",
			onComplete: () => {
				this.launchTween = undefined;
				if (!this.isExploding) {
					this.explode();
				}
			},
		});
	}

	private checkDetonationProximity() {
		if (this.isExploding || !this.active || !this.scene?.sys?.isActive()) {
			return;
		}

		const explosionRadius = this.getDestructionRadius();
		const explosionRadiusSq = explosionRadius * explosionRadius;
		let enemyInRange = false;
		EnemyBase.forEachLiving((enemy) => {
			if (enemyInRange) {
				return;
			}

			const dx = enemy.x - this.x;
			const dy = enemy.y - this.y;
			if (dx * dx + dy * dy <= explosionRadiusSq) {
				enemyInRange = true;
			}
		});

		if (enemyInRange) {
			this.explode();
		}
	}

	private checkProximity() {
		if (this.hasTriggeredProximity || this.isExploding || !this.active || !this.scene?.sys?.isActive()) {
			return;
		}

		const radiusSq = Mine.LAUNCH_RADIUS * Mine.LAUNCH_RADIUS;
		let enemyNear = false;
		EnemyBase.forEachLiving((enemy) => {
			if (enemyNear) {
				return;
			}

			const dx = enemy.x - this.x;
			const dy = enemy.y - this.y;
			if (dx * dx + dy * dy <= radiusSq) {
				enemyNear = true;
			}
		});

		if (!enemyNear) {
			return;
		}

		this.hasTriggeredProximity = true;
		this.playProximityAlert();
	}

	private playProximityAlert() {
		this.playProximitySound();
		this.idleTween?.pause();
		this.setTint(0xff4d4d);
		this.scene.tweens.add({
			targets: this,
			scaleX: this.scaleX * 1.35,
			scaleY: this.scaleY * 1.35,
			duration: 90,
			yoyo: true,
			ease: "Quad.easeOut",
			onComplete: () => {
				this.clearTint();
				if (this.active && !this.isExploding) {
					this.idleTween?.resume();
				}
			},
		});
	}

	private playProximitySound() {
		if (!this.scene.cache.audio.exists(Mine.PROXIMITY_SOUND_KEY)) {
			return;
		}

		const rate = Phaser.Math.FloatBetween(0.85, 1.15);
		this.scene.sound.play(Mine.PROXIMITY_SOUND_KEY, { volume: 0.45, rate });
	}

	private playExplosionSound() {
		const key = Phaser.Utils.Array.GetRandom(Mine.EXPLOSION_SOUND_KEYS);
		if (!this.scene.cache.audio.exists(key)) {
			return;
		}

		const rate = Phaser.Math.FloatBetween(0.85, 1.15);
		this.scene.sound.play(key, { volume: 0.3, rate });
	}

	private explode() {
		if (this.isExploding || !this.scene?.sys?.isActive()) {
			return;
		}

		this.isExploding = true;
		this.spawnSettleTimer?.remove(false);
		this.spawnSettleTimer = undefined;
		this.scene.tweens.killTweensOf(this);
		this.playExplosionSound();
		const explosion = Explode2.spawn(this.scene, this.x, this.y, undefined, 2.35);
		explosion.setTint(0xff4d4d);

		const explosionRadius = this.getDestructionRadius();
		const explosionRadiusSq = explosionRadius * explosionRadius;
		let hitCount = 0;
		EnemyBase.forEachLiving((enemy) => {
			const dx = enemy.x - this.x;
			const dy = enemy.y - this.y;
			if (dx * dx + dy * dy <= explosionRadiusSq) {
				enemy.takeDamage(Mine.EXPLOSION_DAMAGE);
				hitCount += 1;
			}
		});
		console.log("Mine exploded", { x: this.x, y: this.y, hitCount, damage: Mine.EXPLOSION_DAMAGE });

		this.destroy();
	}

	private getDestructionRadius() {
		const mineSize = Math.max(this.displayWidth, this.displayHeight);
		return mineSize * 0.5 + 40;
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
