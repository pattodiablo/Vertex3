import * as Phaser from "phaser";

/**
 * Watches the real, already-smoothed FPS Phaser tracks (`game.loop.actualFps`)
 * and steps a global quality level down when it sustains a drop (mobile GPUs
 * choking on particle-heavy moments), then cautiously steps back up once the
 * framerate recovers. Lives outside any Scene so it persists across restarts —
 * a device that's slow stays in reduced quality instead of re-detecting the
 * drop every life.
 */
export default class PerformanceManager {
	static readonly QUALITY_FULL = 0;
	static readonly QUALITY_REDUCED = 1;
	static readonly QUALITY_MINIMAL = 2;

	private static readonly DOWNGRADE_FPS = 42;
	private static readonly UPGRADE_FPS = 55;
	private static readonly DOWNGRADE_HOLD_MS = 1500;
	private static readonly UPGRADE_HOLD_MS = 4000;

	private static quality = PerformanceManager.QUALITY_FULL;
	private static lowFpsMs = 0;
	private static highFpsMs = 0;

	static update(scene: Phaser.Scene, delta: number) {
		const fps = scene.game.loop.actualFps;

		if (fps < PerformanceManager.DOWNGRADE_FPS) {
			PerformanceManager.lowFpsMs += delta;
			PerformanceManager.highFpsMs = 0;
		} else if (fps > PerformanceManager.UPGRADE_FPS) {
			PerformanceManager.highFpsMs += delta;
			PerformanceManager.lowFpsMs = 0;
		} else {
			PerformanceManager.lowFpsMs = 0;
			PerformanceManager.highFpsMs = 0;
		}

		if (
			PerformanceManager.lowFpsMs >= PerformanceManager.DOWNGRADE_HOLD_MS &&
			PerformanceManager.quality < PerformanceManager.QUALITY_MINIMAL
		) {
			PerformanceManager.quality += 1;
			PerformanceManager.lowFpsMs = 0;
		} else if (
			PerformanceManager.highFpsMs >= PerformanceManager.UPGRADE_HOLD_MS &&
			PerformanceManager.quality > PerformanceManager.QUALITY_FULL
		) {
			PerformanceManager.quality -= 1;
			PerformanceManager.highFpsMs = 0;
		}
	}

	/** 1 = full particle counts, 0.5 = halved, 0 = skip decorative particle bursts entirely. */
	static get particleScale(): number {
		switch (PerformanceManager.quality) {
			case PerformanceManager.QUALITY_MINIMAL:
				return 0;
			case PerformanceManager.QUALITY_REDUCED:
				return 0.5;
			default:
				return 1;
		}
	}
}
