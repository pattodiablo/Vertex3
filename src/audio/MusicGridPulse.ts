import * as Phaser from "phaser";

type WebAudioManager = Phaser.Sound.BaseSoundManager & {
	context?: AudioContext;
	masterVolumeNode?: GainNode;
	masterMuteNode?: GainNode;
};

/** Optional shine resources from Phaser.Actions.AddEffectShine */
export type GridShineHandle = {
	gradient: Phaser.GameObjects.Gradient & { offset?: number };
	dynamicTexture: Phaser.Textures.DynamicTexture;
	tween: Phaser.Tweens.Tween;
	/** Matches AddEffectShine radius/scale (band half-size in offset space). */
	gradientRadius: number;
};

/**
 * Analyses BGM and drives:
 *  - grid scale pulse (more obvious on beats)
 *  - horizontal shine band that travels up/down with the music
 */
export default class MusicGridPulse {
	private readonly scene: Phaser.Scene;
	private readonly grid: Phaser.GameObjects.Image;
	private readonly baseScaleX: number;
	private readonly baseScaleY: number;
	private readonly baseAlpha: number;
	private readonly shine?: GridShineHandle;

	// --- Scale (more noticeable) ---
	private readonly energyBoost = 0.34;
	private readonly beatBoost = 0.8;
	private readonly beatAlphaBoost = 0.8;

	private readonly beatDecay = 5.5;
	private readonly energyLerp = 0.58;
	private readonly beatCooldownMs = 110;
	private readonly beatThreshold = 1.15;

	// --- Shine travel (offset 0..1, mapped to gradient.offset) ---
	private shineT = 0;
	private shineDir = 1;
	/** Base travel speed (normalized units / sec). */
	private readonly shineBaseSpeed = 0.22;
	/** Extra speed from continuous energy. */
	private readonly shineEnergySpeed = 0.55;
	/** Kick on beat (instant offset jump in travel direction). */
	private readonly shineBeatKick = 0.07;

	private analyser: AnalyserNode | null = null;
	private freqData: Uint8Array | null = null;
	private timeData: Uint8Array | null = null;
	private hookedNode: AudioNode | null = null;
	private hooked = false;

	private smoothBass = 0.001;
	private smoothEnergy = 0;
	private beatPulse = 0;
	private lastBeatAt = 0;

	constructor(
		scene: Phaser.Scene,
		grid: Phaser.GameObjects.Image,
		shine?: GridShineHandle
	) {
		this.scene = scene;
		this.grid = grid;
		this.baseScaleX = grid.scaleX || 1;
		this.baseScaleY = grid.scaleY || 1;
		this.baseAlpha = grid.alpha;
		this.shine = shine;

		if (grid.originX !== 0.5 || grid.originY !== 0.5) {
			grid.setOrigin(0.5, 0.5);
		}

		// We drive the shine ourselves with the music
		if (this.shine?.tween) {
			this.shine.tween.pause();
			this.shine.tween.stop();
		}

		this.tryHookAnalyser();
		this.redrawShine();
	}

	update(time: number, delta: number) {
		if (!this.grid?.active) {
			return;
		}

		if (!this.hooked) {
			this.tryHookAnalyser();
		}

		const dt = Math.min((Number.isFinite(delta) ? delta : 16.6) / 1000, 0.05);
		let bass = 0;
		let energy = 0;

		if (this.analyser && this.freqData && this.timeData) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.analyser.getByteFrequencyData(this.freqData as any);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			this.analyser.getByteTimeDomainData(this.timeData as any);
			const freq = this.freqData;
			const timeDomain = this.timeData;

			const n = freq.length;
			const bassEnd = Math.max(3, Math.floor(n * 0.1));
			const midEnd = Math.max(bassEnd + 1, Math.floor(n * 0.4));

			let bassSum = 0;
			for (let i = 1; i < bassEnd; i++) {
				bassSum += freq[i];
			}
			bass = bassSum / ((bassEnd - 1) * 255);

			let midSum = 0;
			for (let i = bassEnd; i < midEnd; i++) {
				midSum += freq[i];
			}
			const mid = midSum / ((midEnd - bassEnd) * 255);

			let rms = 0;
			for (let i = 0; i < timeDomain.length; i++) {
				const v = (timeDomain[i] - 128) / 128;
				rms += v * v;
			}
			rms = Math.sqrt(rms / timeDomain.length);

			energy = Phaser.Math.Clamp(rms * 2.2 * 0.5 + bass * 0.35 + mid * 0.15, 0, 1);
		}

		this.smoothEnergy += (energy - this.smoothEnergy) * this.energyLerp;
		this.smoothBass += (Math.max(bass, 0.001) - this.smoothBass) * 0.2;

		let beatThisFrame = false;
		if (
			bass > 0.05 &&
			bass > this.smoothBass * this.beatThreshold &&
			time - this.lastBeatAt > this.beatCooldownMs
		) {
			this.lastBeatAt = time;
			this.beatPulse = Math.min(1, 0.55 + bass * 1.15);
			beatThisFrame = true;
		}

		if (this.beatPulse > 0) {
			this.beatPulse *= Math.max(0, 1 - this.beatDecay * dt);
			if (this.beatPulse < 0.02) {
				this.beatPulse = 0;
			}
		}

		// --- Scale ---
		const boost =
			1 +
			this.smoothEnergy * this.energyBoost +
			this.beatPulse * this.beatBoost;
		const safeBoost = Number.isFinite(boost) ? boost : 1;
		this.grid.setScale(this.baseScaleX * safeBoost, this.baseScaleY * safeBoost);
		this.grid.setAlpha(
			Phaser.Math.Clamp(this.baseAlpha + this.beatPulse * this.beatAlphaBoost, 0, 1)
		);

		// --- Shine: horizontal band travels up/down with energy + beats ---
		this.updateShineTravel(dt, beatThisFrame);
	}

	destroy() {
		this.unhookAnalyser();
		if (this.grid?.active) {
			this.grid.setScale(this.baseScaleX, this.baseScaleY);
			this.grid.setAlpha(this.baseAlpha);
		}
		// Leave shine filters on the grid; tween already stopped
	}

	/**
	 * Move a horizontal shine band vertically. Direction flips at ends (yoyo).
	 * Speed tracks energy; beats give a small kick.
	 */
	private updateShineTravel(dt: number, beatThisFrame: boolean) {
		if (!this.shine) {
			return;
		}

		const speed =
			this.shineBaseSpeed +
			this.smoothEnergy * this.shineEnergySpeed +
			this.beatPulse * 0.35;

		this.shineT += this.shineDir * speed * dt;

		if (beatThisFrame) {
			this.shineT += this.shineDir * this.shineBeatKick * (0.6 + this.beatPulse);
		}

		if (this.shineT >= 1) {
			this.shineT = 1;
			this.shineDir = -1;
		} else if (this.shineT <= 0) {
			this.shineT = 0;
			this.shineDir = 1;
		}

		this.redrawShine();
	}

	private redrawShine() {
		if (!this.shine) {
			return;
		}

		const r = this.shine.gradientRadius;
		// Map 0..1 → -r .. 1+r (full enter/exit of the band)
		const offset = -r + this.shineT * (1 + 2 * r);
		const g = this.shine.gradient as Phaser.GameObjects.Gradient & { offset: number };
		g.offset = offset;

		try {
			this.shine.dynamicTexture.clear().draw(this.shine.gradient).render();
		} catch {
			// texture may be mid-destroy on shutdown
		}
	}

	private tryHookAnalyser() {
		if (this.hooked) {
			return;
		}

		const mgr = this.scene.sound as WebAudioManager;
		const ctx = mgr?.context;
		const tapNode = mgr?.masterVolumeNode ?? mgr?.masterMuteNode;

		if (!ctx || !tapNode) {
			return;
		}

		try {
			const analyser = ctx.createAnalyser();
			analyser.fftSize = 512;
			analyser.smoothingTimeConstant = 0.65;
			analyser.minDecibels = -100;
			analyser.maxDecibels = -20;

			tapNode.connect(analyser);

			this.analyser = analyser;
			this.freqData = new Uint8Array(analyser.frequencyBinCount);
			this.timeData = new Uint8Array(analyser.fftSize);
			this.hookedNode = tapNode;
			this.hooked = true;
		} catch (err) {
			console.warn("[MusicGridPulse] analyser hook failed", err);
			this.hooked = false;
		}
	}

	private unhookAnalyser() {
		if (!this.hooked) {
			return;
		}

		try {
			if (this.hookedNode && this.analyser) {
				this.hookedNode.disconnect(this.analyser);
			}
		} catch {
			// ignore
		}

		try {
			this.analyser?.disconnect();
		} catch {
			// ignore
		}

		this.analyser = null;
		this.freqData = null;
		this.timeData = null;
		this.hookedNode = null;
		this.hooked = false;
	}
}
