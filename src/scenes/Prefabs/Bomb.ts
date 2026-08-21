
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import * as Phaser from "phaser";
import MainShip from "./MainShip";
import EnemyBase from "./EnemyBase";
/* END-USER-IMPORTS */

export default class Bomb extends Phaser.GameObjects.Image {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "megaBomb", frame);

		this.scaleX = 0.7;
		this.scaleY = 0.7;

		/* START-USER-CTR-CODE */
		this.spinSpeed = Phaser.Math.FloatBetween(0.4, 1.4) * (Phaser.Math.Between(0, 1) === 0 ? -1 : 1);
		this.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
		this.setOrigin(0.5, 0.5);
		this.setScale(this.scaleX, this.scaleY);
		this.pulseTween = this.scene.tweens.add({
			targets: this,
			scaleX: this.scaleX * 1.08,
			scaleY: this.scaleY * 1.08,
			alpha: 0.78,
			duration: 550,
			ease: "Sine.easeInOut",
			yoyo: true,
			repeat: -1,
		});
		this.scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.updateSpin, this);
		this.scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.checkPickupOverlap, this);
		this.once(Phaser.GameObjects.Events.DESTROY, this.cleanupSpin, this);
		this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupSpin, this);
		/* END-USER-CTR-CODE */
	}

	private spinSpeed = 0;
	private pulseTween?: Phaser.Tweens.Tween;

	/* START-USER-CODE */

	private updateSpin(_time: number, delta: number) {
		this.rotation += this.spinSpeed * (delta / 1000);
	}

	private checkPickupOverlap() {
		if (!this.active || !this.visible || !this.scene?.sys?.isActive()) {
			return;
		}

		const ship = MainShip.getCurrentShip();
		if (!ship || !ship.active || !ship.visible || ship.hasDied || !ship.hasAppeared) {
			return;
		}

		const dx = ship.x - this.x;
		const dy = ship.y - this.y;
		const pickupRadius = Math.max(this.displayWidth, this.displayHeight) * 0.55;
		if (dx * dx + dy * dy > pickupRadius * pickupRadius) {
			return;
		}

		EnemyBase.destroyAllLiving();
		this.spawnShockwave();
		this.destroy();
	}

	private spawnShockwave() {
		if (!this.scene?.sys?.isActive()) {
			return;
		}

		const shockwave = this.scene.add.graphics();
		shockwave.setDepth(20005);
		shockwave.setPosition(this.x, this.y);
		const width = this.scene.scale.width;
		const height = this.scene.scale.height;
		const maxRadius = Math.max(
			Math.hypot(this.x, this.y),
			Math.hypot(width - this.x, this.y),
			Math.hypot(this.x, height - this.y),
			Math.hypot(width - this.x, height - this.y)
		);
		const wave = { radius: 8 };
		const drawWave = () => {
			shockwave.clear();
			shockwave.lineStyle(6, 0xde2e31, 0.95);
			shockwave.strokeCircle(0, 0, wave.radius);
		};
		drawWave();

		this.scene.tweens.add({
			targets: wave,
			radius: maxRadius,
			alpha: 0,
			duration: 520,
			ease: "Quad.easeOut",
			onUpdate: drawWave,
			onComplete: () => {
				shockwave.destroy();
			},
		});
	}

	private cleanupSpin() {
		this.pulseTween?.stop();
		this.pulseTween = undefined;
		this.scene?.events.off(Phaser.Scenes.Events.POST_UPDATE, this.updateSpin, this);
		this.scene?.events.off(Phaser.Scenes.Events.POST_UPDATE, this.checkPickupOverlap, this);
		this.scene?.events.off(Phaser.Scenes.Events.SHUTDOWN, this.cleanupSpin, this);
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
