
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import * as Phaser from "phaser";
/* END-USER-IMPORTS */

export default class Explode2 extends Phaser.GameObjects.Sprite {
	private static readonly pool: Explode2[] = [];

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "Explode3", frame ?? 0);

		/* START-USER-CTR-CODE */
		this.setScale(2);
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	/** Animation key from static/assets/animations.json */
	static readonly EXPLODE_ANIM = "Explode3";

	private static readonly PARTICLE_KEY = "explode2-orb";

	/** Orbs that fly out then float (Megaman death style). Kept light for mobile. */
	private static readonly ORB_COUNT = 12;
	/** How long orbs stay on screen floating (ms). */
	private static readonly ORB_MAX_LIFE = 1100;

	/**
	 * Spawn a one-shot explosion at (x, y).
	 * @param scale visual scale of the explode sprite (default 2)
	 */
	static spawn(
		scene: Phaser.Scene,
		x: number,
		y: number,
		onComplete?: () => void,
		scale?: number
	): Explode2 {
		const fx = Explode2.pool.pop() ?? new Explode2(scene, x, y);
		if (!fx.scene) {
			scene.add.existing(fx);
		}
		fx.setPosition(x, y);
		fx.setVisible(true);
		fx.setActive(true);
		fx.setAlpha(1);
		fx.setScale(scale ?? Phaser.Math.FloatBetween(0.5, 1));
		fx.setRotation(Phaser.Math.FloatBetween(0, Math.PI * 2));
		fx.anims.stop();
		fx.setFrame(0);
		fx.removeAllListeners(Phaser.Animations.Events.ANIMATION_COMPLETE);
		if (onComplete) fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, onComplete);
		fx.playExplode();
		return fx;
	}

	static warmPool(scene: Phaser.Scene, count = 20) {
		Explode2.clearRuntimePool();
		for (let i = Explode2.pool.length; i < count; i++) {
			const fx = new Explode2(scene, 0, 0);
			scene.add.existing(fx);
			fx.setScale(2);
			fx.setActive(false);
			fx.setVisible(false);
			Explode2.pool.push(fx);
		}
	}

	static clearRuntimePool() {
		for (const fx of Explode2.pool) {
			fx.removeAllListeners();
			fx.destroy();
		}
		Explode2.pool.length = 0;
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
				this.setActive(false);
				this.setVisible(false);
				Explode2.pool.push(this);
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
			speed: { min: 55, max: 110 },
			// de más a menos: bigger near center, shrink while floating
			scale: { start: 1.75, end: 0.2 },
			// Stay bright, fade only late in life
			alpha: { start: 1, end: 0 },
			lifespan: { min: 900, max: Explode2.ORB_MAX_LIFE },
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
