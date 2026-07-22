
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import * as Phaser from "phaser";
/* END-USER-IMPORTS */

export default class Explode1 extends Phaser.GameObjects.Sprite {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "Explode1", frame ?? 0);

		/* START-USER-CTR-CODE */
		this.setScale(2);
		// Play when added to the scene so the sprite is on the update list.
		this.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, () => {
			this.playExplode();
		});
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	/** Animation key from static/assets/animations.json */
	static readonly EXPLODE_ANIM = "Explode1";
	/** Soft white circle used as particle texture (tinted green/blue at runtime). */
	private static readonly PARTICLE_TEXTURE_KEY = "explode1-particle";

	/** How many particles per explosion burst (kept low for mobile). */
	private static readonly PARTICLE_COUNT = 9;
	/** Max particle lifetime (ms) — also used to destroy the emitter after. */
	private static readonly PARTICLE_MAX_LIFE = 320;
	private static readonly WALL_PARTICLE_COUNT = 3;

	/**
	 * Spawn a one-shot explosion VFX at (x, y), then destroy it.
	 */
	static spawn(
		scene: Phaser.Scene,
		x: number,
		y: number,
		onComplete?: () => void
	): Explode1 {
		const fx = new Explode1(scene, x, y);
		if (onComplete) {
			fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, onComplete);
		}
		scene.add.existing(fx);
		return fx;
	}

	/**
	 * Lightweight wall-hit VFX: only a few particles, no explosion sprite animation.
	 */
	static spawnWallImpact(scene: Phaser.Scene, x: number, y: number) {
		Explode1.ensureParticleTexture(scene);

		const emitter = scene.add.particles(x, y, Explode1.PARTICLE_TEXTURE_KEY, {
			angle: { min: 0, max: 360 },
			speed: { min: 35, max: 95 },
			scale: { start: 0.5, end: 0 },
			alpha: { start: 0.7, end: 0 },
			lifespan: { min: 120, max: 200 },
			tint: [0x2bff6a, 0x00e676, 0x33ccff],
			blendMode: Phaser.BlendModes.ADD,
			gravityY: 0,
			emitting: false,
			quantity: 0,
		});

		emitter.explode(Explode1.WALL_PARTICLE_COUNT);
		scene.time.delayedCall(240, () => {
			if (emitter && emitter.scene) {
				emitter.destroy();
			}
		});
	}

	/**
	 * Play Explode1 once, burst green/blue particles, then destroy the sprite.
	 * Particles live on the scene so they finish after this sprite is gone.
	 */
	playExplode(onComplete?: () => void) {
		this.burstParticles();

		this.play({
			key: Explode1.EXPLODE_ANIM,
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
	 * One-shot radial burst: green + blue particles in all directions, then emitter dies.
	 */
	private burstParticles() {
		const scene = this.scene;
		Explode1.ensureParticleTexture(scene);

		const emitter = scene.add.particles(this.x, this.y, Explode1.PARTICLE_TEXTURE_KEY, {
			// All directions
			angle: { min: 0, max: 360 },
			speed: { min: 70, max: 180 },
			// Shrink + fade out
			scale: { start: 0.9, end: 0 },
			alpha: { start: 0.85, end: 0 },
			lifespan: { min: 180, max: Explode1.PARTICLE_MAX_LIFE },
			// Random greens and blues
			tint: [0x2bff6a, 0x00e676, 0x39ff14, 0x33ccff, 0x00a2ff, 0x4d7cff],
			blendMode: Phaser.BlendModes.ADD,
			gravityY: 0,
			emitting: false,
			// Don't continuous-emit; we only explode once
			quantity: 0,
		});

		// Match explode sprite depth so particles sit on top of bullets/walls FX
		emitter.setDepth(this.depth + 1);

		// Fire once in every direction
		emitter.explode(Explode1.PARTICLE_COUNT);

		// Destroy emitter after the longest particle can live
		scene.time.delayedCall(Explode1.PARTICLE_MAX_LIFE + 50, () => {
			if (emitter && emitter.scene) {
				emitter.destroy();
			}
		});
	}

	/** Create a small white circle texture once for tintable particles. */
	private static ensureParticleTexture(scene: Phaser.Scene) {
		if (scene.textures.exists(Explode1.PARTICLE_TEXTURE_KEY)) {
			return;
		}

		const size = 10;
		const g = scene.make.graphics({ x: 0, y: 0 });
		g.fillStyle(0xffffff, 1);
		g.fillCircle(size / 2, size / 2, size / 2);
		g.generateTexture(Explode1.PARTICLE_TEXTURE_KEY, size, size);
		g.destroy();
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
