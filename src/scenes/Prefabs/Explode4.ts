
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import * as Phaser from "phaser";
/* END-USER-IMPORTS */

export default class Explode4 extends Phaser.GameObjects.Sprite {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "Explode4", frame ?? 0);

		/* START-USER-CTR-CODE */
		this.setScale(2);
		this.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, () => {
			this.playExplode();
		});
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	static readonly EXPLODE_ANIM = "Explode4";

	private static readonly PARTICLE_KEY = "explode4-orb";
	private static readonly ORB_COUNT = 5;
	private static readonly ORB_MAX_LIFE = 1100;

	static spawn(
		scene: Phaser.Scene,
		x: number,
		y: number,
		onComplete?: () => void,
		scale?: number
	): Explode4 {
		const fx = new Explode4(scene, x, y);
		fx.setScale(scale ?? Phaser.Math.FloatBetween(0.5, 1));
		fx.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
		if (onComplete) {
			fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, onComplete);
		}
		scene.add.existing(fx);
		return fx;
	}

	playExplode(onComplete?: () => void) {
		this.burstFloatingOrbs();

		this.play({
			key: Explode4.EXPLODE_ANIM,
			repeat: 0,
		});

		this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
			onComplete?.();
			if (this.active) {
				this.destroy();
			}
		});

		return this;
	}

	private burstFloatingOrbs() {
		const scene = this.scene;
		Explode4.ensureOrbTexture(scene);

		const orbs = scene.add.particles(this.x, this.y, Explode4.PARTICLE_KEY, {
			angle: { min: 0, max: 360 },
			speed: { min: 35, max: 75 },
			scale: { start: 1.35, end: 0.25 },
			alpha: { start: 0.9, end: 0 },
			lifespan: { min: 850, max: Explode4.ORB_MAX_LIFE },
			tint: [0x66ffcc, 0x33ffaa, 0x44ddff, 0xaaffff, 0xffffff],
			blendMode: Phaser.BlendModes.ADD,
			gravityY: 0,
			emitting: false,
			quantity: 0,
		});

		orbs.setDepth(this.depth + 1);
		orbs.explode(Explode4.ORB_COUNT);

		scene.time.delayedCall(Explode4.ORB_MAX_LIFE + 100, () => {
			if (orbs.scene) {
				orbs.destroy();
			}
		});
	}

	private static ensureOrbTexture(scene: Phaser.Scene) {
		if (scene.textures.exists(Explode4.PARTICLE_KEY)) {
			return;
		}

		const size = 16;
		const g = scene.make.graphics({ x: 0, y: 0 }, false);
		g.fillStyle(0xffffff, 0.35);
		g.fillCircle(size / 2, size / 2, size / 2 - 0.5);
		g.fillStyle(0xffffff, 1);
		g.fillCircle(size / 2, size / 2, size / 3);
		g.generateTexture(Explode4.PARTICLE_KEY, size, size);
		g.destroy();
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
