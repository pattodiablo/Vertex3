import * as Phaser from "phaser";

/**
 * Watches the real, already-smoothed FPS Phaser tracks (`game.loop.actualFps`)
 * and steps a global quality level down when it sustains a drop (mobile GPUs
 * choking on particle-heavy moments), then cautiously steps back up once the
 * framerate recovers. Lives outside any Scene so it persists across restarts —
 * a device that's slow stays in reduced quality instead of re-detecting the
 * drop every life.
 *
 * On top of that reactive watchdog, it runs a one-time best-effort device
 * check (CPU cores / RAM / GPU string) against our reference low-end phone —
 * a Realme GT Master Edition (Snapdragon 778G, Adreno 642L). Anything at or
 * below that tier starts in reduced quality immediately instead of waiting
 * for a frame-rate dip, and permanently drops the background's music-reactive
 * sync, which is pure decoration (an AnalyserNode read + texture redraw every
 * single frame) and the single priciest "nice to have" in the game.
 */
export default class PerformanceManager {
	static readonly QUALITY_FULL = 0;
	static readonly QUALITY_REDUCED = 1;
	static readonly QUALITY_MINIMAL = 2;

	private static readonly DOWNGRADE_FPS = 42;
	private static readonly UPGRADE_FPS = 55;
	private static readonly DOWNGRADE_HOLD_MS = 1500;
	private static readonly UPGRADE_HOLD_MS = 4000;
	/** Adreno model numbers are on one linear-ish scale; 642L is our reference ceiling. */
	private static readonly REFERENCE_ADRENO_MODEL = 650;

	private static quality = PerformanceManager.QUALITY_FULL;
	private static lowFpsMs = 0;
	private static highFpsMs = 0;
	private static detected = false;
	private static lowTierDevice = false;

	/** Safe to call multiple times — only the first call actually probes anything. */
	static ensureDetected() {
		if (PerformanceManager.detected) {
			return;
		}

		PerformanceManager.detectDeviceTier();
	}

	static update(scene: Phaser.Scene, delta: number) {
		PerformanceManager.ensureDetected();

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

		// Device-flagged phones never fully recover to FULL — they stay at
		// least REDUCED for the whole session, only MINIMAL is reactive.
		const floor = PerformanceManager.lowTierDevice ? PerformanceManager.QUALITY_REDUCED : PerformanceManager.QUALITY_FULL;

		if (
			PerformanceManager.lowFpsMs >= PerformanceManager.DOWNGRADE_HOLD_MS &&
			PerformanceManager.quality < PerformanceManager.QUALITY_MINIMAL
		) {
			PerformanceManager.quality += 1;
			PerformanceManager.lowFpsMs = 0;
		} else if (
			PerformanceManager.highFpsMs >= PerformanceManager.UPGRADE_HOLD_MS &&
			PerformanceManager.quality > floor
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

	/** Background music-reactive grid pulse — the first thing dropped on weaker hardware. */
	static get disableMusicSync(): boolean {
		return PerformanceManager.lowTierDevice || PerformanceManager.quality >= PerformanceManager.QUALITY_REDUCED;
	}

	private static detectDeviceTier() {
		PerformanceManager.detected = true;

		let suspect = false;

		try {
			const cores = navigator.hardwareConcurrency;
			if (typeof cores === "number" && cores > 0 && cores <= 6) {
				suspect = true;
			}
		} catch {
			// Not available — ignore this signal.
		}

		try {
			const memoryGb = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
			if (typeof memoryGb === "number" && memoryGb > 0 && memoryGb <= 6) {
				suspect = true;
			}
		} catch {
			// Not available — ignore this signal.
		}

		const gpuTier = PerformanceManager.readGpuTier();
		if (gpuTier === "weak") {
			suspect = true;
		} else if (gpuTier === "strong") {
			// A clearly high-end GPU overrides the coarser core/RAM guesses.
			suspect = false;
		}

		if (suspect) {
			PerformanceManager.lowTierDevice = true;
			PerformanceManager.quality = Math.max(PerformanceManager.quality, PerformanceManager.QUALITY_REDUCED);
		}
	}

	/**
	 * Reads the unmasked WebGL renderer string, when the browser exposes it
	 * (common on Android Chrome, usually unavailable on iOS Safari), and
	 * classifies known Adreno/Mali families relative to our reference phone.
	 * Best-effort only — "unknown" just means we fall back to the core/RAM check.
	 */
	private static readGpuTier(): "weak" | "strong" | "unknown" {
		try {
			const canvas = document.createElement("canvas");
			const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
			if (!gl) {
				return "unknown";
			}

			const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
			if (!debugInfo) {
				return "unknown";
			}

			const renderer = String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)).toLowerCase();

			const adrenoMatch = renderer.match(/adreno \(tm\) (\d+)/);
			if (adrenoMatch) {
				const model = parseInt(adrenoMatch[1], 10);
				return model <= PerformanceManager.REFERENCE_ADRENO_MODEL ? "weak" : "strong";
			}

			const weakMaliFamilies = ["mali-g31", "mali-g51", "mali-g52", "mali-g57", "mali-g68", "mali-g72", "mali-t8"];
			if (weakMaliFamilies.some((id) => renderer.includes(id))) {
				return "weak";
			}

			return "unknown";
		} catch {
			return "unknown";
		}
	}
}
