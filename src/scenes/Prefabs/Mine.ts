
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import * as Phaser from "phaser";
import EnemyBase from "./EnemyBase";
import Explode2 from "./Explode2";
/* END-USER-IMPORTS */

export default class Mine extends Phaser.GameObjects.Image {
	private static readonly EXPLOSION_DAMAGE = 10;
	private isExploding = false;

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "mine", frame);

		/* START-USER-CTR-CODE */
		console.log("Mine constructor called");
		this.setOrigin(0.5, 0.5);
		this.setDepth(11);
		this.setScale(0.9);
		this.scene.tweens.add({
			targets: this,
			scaleX: 1.05,
			scaleY: 1.05,
			alpha: 0.82,
			duration: 260,
			ease: "Sine.easeInOut",
			yoyo: true,
			repeat: -1,
		});
		this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.checkForTargets, this);
		this.once(Phaser.GameObjects.Events.DESTROY, () => {
			this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.checkForTargets, this);
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

	private checkForTargets() {
		if (this.isExploding || !this.active || !this.visible || !this.scene?.sys?.isActive()) {
			return;
		}

		let nearestEnemy: EnemyBase | null = null;
		let nearestDistanceSq = Number.POSITIVE_INFINITY;
		const searchRadius = this.getActivationRadius();
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

		this.explode();
	}

	private explode() {
		if (this.isExploding || !this.scene?.sys?.isActive()) {
			return;
		}

		this.isExploding = true;
		this.scene.tweens.killTweensOf(this);
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

	private getActivationRadius() {
		const mineSize = Math.max(this.displayWidth, this.displayHeight);
		return mineSize * 0.5 + 20;
	}

	private getDestructionRadius() {
		const mineSize = Math.max(this.displayWidth, this.displayHeight);
		return mineSize * 0.5 + 40;
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
