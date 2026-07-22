/**
 * Difficulty grows with:
 *  1) total time in the level (never fully resets)
 *  2) current survival streak (resets on ship death)
 *
 * On death: apply temporary relief (difficulty drops a bit),
 * then it climbs again as survival + total time continue.
 */
export type DifficultySnapshot = {
	/** 0 ≈ easy, 1 ≈ hard; can exceed 1 late-game. */
	level: number;
	/** Seconds since level start (always accumulates). */
	totalSeconds: number;
	/** Seconds survived this life (0 after death until respawn). */
	survivalSeconds: number;
	/** Current relief after a death (fades over time). */
	deathRelief: number;
};

export type DifficultySpawnParams = {
	minGroup: number;
	maxGroup: number;
	waveIntervalMs: number;
	staggerMs: number;
	/** Enemy chase speed (px/s). */
	enemyMoveSpeed: number;
};

export default class DifficultyManager {
	private totalSeconds = 0;
	private survivalSeconds = 0;
	private shipAlive = true;
	/** Temporary ease after death (subtracted from level). */
	private deathRelief = 0;

	/** How fast death relief fades (units/sec). */
	private readonly reliefDecayPerSec = 0.035;
	/** Survival contribution scales up over this many seconds. */
	private readonly survivalScaleSec = 100;
	/** Total-time contribution scales over this many seconds. */
	private readonly totalScaleSec = 240;

	update(deltaMs: number) {
		const dt = Math.max(0, deltaMs) / 1000;
		this.totalSeconds += dt;

		if (this.shipAlive) {
			this.survivalSeconds += dt;
		}

		if (this.deathRelief > 0) {
			this.deathRelief = Math.max(0, this.deathRelief - this.reliefDecayPerSec * dt);
		}
	}

	/** Call when MainShip dies. */
	onShipDied() {
		this.shipAlive = false;
		this.survivalSeconds = 0;
		// Soften current pressure; more relief if you were deep in a hard run
		const current = this.getLevel();
		this.deathRelief = Math.min(0.55, 0.18 + current * 0.22);
	}

	/** Call when MainShip respawns. */
	onShipRespawned() {
		this.shipAlive = true;
		this.survivalSeconds = 0;
	}

	/**
	 * Composite difficulty level.
	 * Base + total progress + survival streak − death relief.
	 */
	getLevel(): number {
		const global = this.totalSeconds / this.totalScaleSec;
		const survival = this.survivalSeconds / this.survivalScaleSec;
		// Global keeps climbing forever; survival adds pressure while alive
		const raw = 0.12 + global * 0.65 + survival * 0.55 - this.deathRelief;
		return Math.max(0.08, raw);
	}

	getSnapshot(): DifficultySnapshot {
		return {
			level: this.getLevel(),
			totalSeconds: this.totalSeconds,
			survivalSeconds: this.survivalSeconds,
			deathRelief: this.deathRelief,
		};
	}

	/**
	 * Map difficulty → spawner / enemy tunables.
	 * t = 0 easy … 1 hard (clamped for lerps; level can go higher).
	 */
	getSpawnParams(): DifficultySpawnParams {
		const t = Math.min(1.35, this.getLevel()); // allow mild overshoot past "1"

		const lerp = (a: number, b: number, u: number) => a + (b - a) * Math.min(1, Math.max(0, u));

		// Group size grows with difficulty
		const minGroup = Math.round(lerp(6, 24, t));
		const maxGroup = Math.round(lerp(10, 32, t));

		// Waves come faster
		const waveIntervalMs = Math.round(lerp(9000, 2800, t));

		// Tighter stagger at high difficulty
		const staggerMs = Math.round(lerp(140, 45, t));

		// Enemies chase faster
		const enemyMoveSpeed = Math.round(lerp(70, 155, t));

		return {
			minGroup: Math.max(3, minGroup),
			maxGroup: Math.max(minGroup, maxGroup),
			waveIntervalMs: Math.max(2000, waveIntervalMs),
			staggerMs: Math.max(30, staggerMs),
			enemyMoveSpeed: Math.max(50, enemyMoveSpeed),
		};
	}
}
