import * as Phaser from "phaser";

/**
 * Level BGM: intro (once) → mid (loop) → optional outro (death / level clear).
 * Asset keys from asset-pack: "intro", "mid", "outro".
 */
export default class LevelMusic {
	private readonly scene: Phaser.Scene;
	private readonly volume: number;

	private intro?: Phaser.Sound.BaseSound;
	private mid?: Phaser.Sound.BaseSound;
	private outro?: Phaser.Sound.BaseSound;

	private phase: "idle" | "intro" | "mid" | "outro" = "idle";
	private started = false;
	private destroyed = false;

	constructor(scene: Phaser.Scene, volume = 0.55) {
		this.scene = scene;
		this.volume = volume;
	}

	/**
	 * Begin playback: unlock audio if needed, play intro, then loop mid.
	 */
	start() {
		if (this.started || this.destroyed) {
			return;
		}
		this.started = true;

		// Browsers block autoplay until a user gesture unlocks the AudioContext.
		if (this.scene.sound.locked) {
			this.scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
				if (!this.destroyed) {
					this.resumeContext();
					this.playIntro();
				}
			});
			return;
		}

		this.resumeContext();
		this.playIntro();
	}

	/** Ensure AudioContext is running (needed for playback + analyser). */
	private resumeContext() {
		const ctx = (this.scene.sound as Phaser.Sound.WebAudioSoundManager).context;
		if (ctx && ctx.state === "suspended") {
			void ctx.resume();
		}
	}

	/** Switch to outro (call on player death or level complete). */
	playOutro() {
		if (this.destroyed || this.phase === "outro") {
			return;
		}

		this.phase = "outro";
		this.stopTrack(this.intro);
		this.stopTrack(this.mid);
		this.intro = undefined;
		this.mid = undefined;

		if (!this.scene.cache.audio.exists("outro")) {
			console.warn('[LevelMusic] missing audio key "outro"');
			return;
		}

		this.outro = this.scene.sound.add("outro", {
			volume: this.volume,
			loop: false,
		});
		this.outro.play();
	}

	/** Stop all level music. */
	stop() {
		this.stopTrack(this.intro);
		this.stopTrack(this.mid);
		this.stopTrack(this.outro);
		this.intro = undefined;
		this.mid = undefined;
		this.outro = undefined;
		this.phase = "idle";
	}

	destroy() {
		this.destroyed = true;
		this.stop();
	}

	get currentPhase() {
		return this.phase;
	}

	private playIntro() {
		if (this.destroyed || this.phase !== "idle") {
			return;
		}

		if (!this.scene.cache.audio.exists("intro")) {
			console.warn('[LevelMusic] missing audio key "intro" — skipping to mid');
			this.playMid();
			return;
		}

		this.phase = "intro";
		this.intro = this.scene.sound.add("intro", {
			volume: this.volume,
			loop: false,
		});

		this.intro.once(Phaser.Sound.Events.COMPLETE, () => {
			if (!this.destroyed && this.phase === "intro") {
				this.playMid();
			}
		});

		this.intro.play();
	}

	private playMid() {
		if (this.destroyed || this.phase === "outro") {
			return;
		}

		this.stopTrack(this.intro);
		this.intro = undefined;

		if (!this.scene.cache.audio.exists("mid")) {
			console.warn('[LevelMusic] missing audio key "mid"');
			return;
		}

		this.phase = "mid";
		this.mid = this.scene.sound.add("mid", {
			volume: this.volume,
			loop: true,
		});
		this.mid.play();
	}

	private stopTrack(sound?: Phaser.Sound.BaseSound) {
		if (!sound) {
			return;
		}
		if (sound.isPlaying || sound.isPaused) {
			sound.stop();
		}
		sound.destroy();
	}
}
