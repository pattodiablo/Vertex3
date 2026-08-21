
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import * as Phaser from "phaser";
import AppearEffect from "./AppearEffect";
import MainShip from "./MainShip";
import EnemyBase from "./EnemyBase";
/* END-USER-IMPORTS */

export default class Bomb extends Phaser.GameObjects.Image {
	static readonly COLLECTED_EVENT = "bomb-collected";

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "megaBomb", frame);

		this.scaleX = 0.7;
		this.scaleY = 0.7;

		/* START-USER-CTR-CODE */
		this.setOrigin(0.5, 0.5);
		this.setScale(3);
		this.setAlpha(0);
		this.setVisible(false);
		AppearEffect.spawn(this.scene, this.x, this.y, () => {
			if (!this.active || !this.scene?.sys?.isActive()) {
				return;
			}

			this.setVisible(true);
			this.setAlpha(1);
			this.setScale(3);
			this.scene.tweens.add({
				targets: this,
				scaleX: 0.7,
				scaleY: 0.7,
				duration: 260,
				ease: "Back.easeOut",
				onComplete: () => {
					if (!this.active || !this.scene?.sys?.isActive()) {
						return;
					}

					this.spinSpeed = Phaser.Math.FloatBetween(0.4, 1.4) * (Phaser.Math.Between(0, 1) === 0 ? -1 : 1);
					this.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
					this.pulseTween = this.scene.tweens.add({
						targets: this,
						scaleX: 0.7 * 1.16,
						scaleY: 0.7 * 1.16,
						alpha: 0.68,
						duration: 260,
						ease: "Quad.easeInOut",
						yoyo: true,
						repeat: -1,
					});
				}
			});
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
		const pickupRadius = Math.max(this.displayWidth, this.displayHeight);
		if (dx * dx + dy * dy > pickupRadius * pickupRadius) {
			return;
		}

		EnemyBase.destroyAllLiving();
		this.spawnShockwave();
		this.scene?.events.emit(Bomb.COLLECTED_EVENT, { x: this.x, y: this.y });
		this.destroy();
	}

	playSpawnWave() {
		if (!this.scene?.sys?.isActive()) {
			return;
		}

		const wave = this.scene.add.graphics();
		wave.setDepth(20004);
		wave.setPosition(this.x, this.y);

		const state = { radius: 10, alpha: 0.9 };
		const drawWave = () => {
			wave.clear();
			wave.lineStyle(4, 0x6cee57, state.alpha);
			wave.strokeCircle(0, 0, state.radius);
		};
		drawWave();

		this.scene.tweens.add({
			targets: state,
			radius: 52,
			alpha: 0,
			duration: 260,
			ease: "Quad.easeOut",
			onUpdate: drawWave,
			onComplete: () => {
				wave.destroy();
			},
		});
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
