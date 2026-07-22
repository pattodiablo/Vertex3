
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import * as Phaser from "phaser";
/* END-USER-IMPORTS */

export default class AppearEffect extends Phaser.GameObjects.Sprite {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "AppearEffect2", frame ?? 0);

		/* START-USER-CTR-CODE */
		// Playback is controlled by playAppear() / spawn() so callers can choose loop vs one-shot.
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	/** Animation key from static/assets/animations.json */
	static readonly APPEAR_ANIM = "AppearEffect2";

	/**
	 * Spawn a one-shot appear VFX at (x, y), then destroy it.
	 * Calls onComplete when AppearEffect2 finishes (one full pass).
	 */
	static spawn(
		scene: Phaser.Scene,
		x: number,
		y: number,
		onComplete?: () => void
	): AppearEffect {
		const fx = new AppearEffect(scene, x, y);
		fx.setScale(3);
		scene.add.existing(fx);
		fx.playAppear({ loop: false, destroyOnComplete: true, onComplete });
		return fx;
	}

	/**
	 * Play AppearAnim.
	 * @param loop if true, loops forever (default false for spawn use)
	 * @param destroyOnComplete destroy this sprite when the anim ends (one-shot only)
	 * @param onComplete callback when a non-looping anim finishes
	 */
	playAppear(options?: {
		loop?: boolean;
		destroyOnComplete?: boolean;
		onComplete?: () => void;
	}) {
		const loop = options?.loop ?? false;
		const destroyOnComplete = options?.destroyOnComplete ?? false;

		this.play({
			key: AppearEffect.APPEAR_ANIM,
			repeat: loop ? -1 : 0,
		});

		if (!loop) {
			this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
				options?.onComplete?.();
				if (destroyOnComplete) {
					this.destroy();
				}
			});
		}

		return this;
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
