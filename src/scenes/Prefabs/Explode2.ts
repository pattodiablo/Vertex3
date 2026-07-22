
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import * as Phaser from "phaser";
/* END-USER-IMPORTS */

export default class Explode2 extends Phaser.GameObjects.Sprite {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "Explode2", frame ?? 0);

		/* START-USER-CTR-CODE */
		this.setScale(2);
		this.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, () => {
			this.playExplode();
		});
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	/** Animation key from static/assets/animations.json */
	static readonly EXPLODE_ANIM = "Explode2";

	private static readonly PARTICLE_KEY = "explode2-orb";

	/** Orbs that fly out then float (Megaman death style). Kept light for mobile. */
	private static readonly ORB_COUNT = 8;
	/** How long orbs stay on screen floating (ms). */
	private static readonly ORB_MAX_LIFE = 1800;

	/**
	 * Spawn a one-shot explosion at (x, y).
	 * @param scale visual scale of the explode sprite (default 2)
	 */
	static spawn(
		scene: Phaser.Scene,
		x: number,
		y: number,
		onComplete?: () => void,
		scale = 2
	): Explode2 {
		const fx = new Explode2(scene, x, y);
		fx.setScale(scale);
		if (onComplete) {
			fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, onComplete);
		}
		scene.add.existing(fx);
		return fx;
	}

	/**
	 * Play Explode2 once + floating orbs, then destroy the sprite.
	 * Orbs live on the scene so they keep floating after the anim ends.
	 */
	playExplode(onComplete?: () => void) {
		this.burstFloatingOrbs();

		this.play({
			key: Explode2.EXPLODE_ANIM,
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

	/**
	 * Single particle type: burst from center (large → small), no gravity,
	 * long lifespan so they hang in space like Megaman death balls.
	 */
	private burstFloatingOrbs() {
		const scene = this.scene;
		Explode2.ensureOrbTexture(scene);

		const orbs = scene.add.particles(this.x, this.y, Explode2.PARTICLE_KEY, {
			// All directions from the center
			angle: { min: 0, max: 360 },
			// Moderate push outward (not too fast)
			speed: { min: 45, max: 95 },
			// de más a menos: bigger near center, shrink while floating
			scale: { start: 1.7, end: 0.35 },
			// Stay bright, fade only late in life
			alpha: { start: 1, end: 0 },
			lifespan: { min: 1500, max: Explode2.ORB_MAX_LIFE },
			tint: [0x66ffcc, 0x33ffaa, 0x44ddff, 0xaaffff, 0xffffff],
			blendMode: Phaser.BlendModes.ADD,
			// No gravity → float / drift
			gravityY: 0,
			emitting: false,
			quantity: 0,
		});

		orbs.setDepth(this.depth + 1);
		orbs.explode(Explode2.ORB_COUNT);

		scene.time.delayedCall(Explode2.ORB_MAX_LIFE + 100, () => {
			if (orbs.scene) {
				orbs.destroy();
			}
		});
	}

	/** Soft energy-orb texture. */
	private static ensureOrbTexture(scene: Phaser.Scene) {
		if (scene.textures.exists(Explode2.PARTICLE_KEY)) {
			return;
		}

		const size = 16;
		const g = scene.make.graphics({ x: 0, y: 0 }, false);
		g.fillStyle(0xffffff, 0.35);
		g.fillCircle(size / 2, size / 2, size / 2 - 0.5);
		g.fillStyle(0xffffff, 1);
		g.fillCircle(size / 2, size / 2, size / 3);
		g.generateTexture(Explode2.PARTICLE_KEY, size, size);
		g.destroy();
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
