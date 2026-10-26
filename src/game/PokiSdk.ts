/**
 * Thin wrapper around window.PokiSDK (loaded via the <script> tag in
 * src/index.html). Safe to call from anywhere even when the SDK failed to
 * load (ad blockers, running outside poki.com, offline dev) — every call
 * silently no-ops instead of throwing.
 */
type PokiSdkGlobal = {
	init: () => Promise<void>;
	gameLoadingFinished: () => void;
	gameplayStart: () => void;
	gameplayStop: () => void;
	commercialBreak: (beforeAd?: () => void) => Promise<void>;
	rewardedBreak: (beforeAd?: () => void) => Promise<boolean>;
	/** Activity-funnel event. action: "start"/"complete"/"fail" pair up a funnel step;
	 * "visible"/"interact" pair up an interaction; anything else is a one-off custom event. */
	measure: (category: string, what: string, action: string) => void;
};

declare global {
	interface Window {
		PokiSDK?: PokiSdkGlobal;
	}
}

export default class PokiSdk {
	private static ready = false;
	private static initPromise?: Promise<void>;

	/** Call once, as early as possible — in parallel with asset loading, not after it. */
	static init(): Promise<void> {
		if (PokiSdk.initPromise) {
			return PokiSdk.initPromise;
		}

		if (!window.PokiSDK) {
			PokiSdk.initPromise = Promise.resolve();
			return PokiSdk.initPromise;
		}

		PokiSdk.initPromise = window.PokiSDK.init()
			.then(() => {
				PokiSdk.ready = true;
			})
			.catch(() => {
				PokiSdk.ready = false;
			});

		return PokiSdk.initPromise;
	}

	/** Call once the game is fully loaded and the first interactive screen is showing. */
	static gameLoadingFinished() {
		if (PokiSdk.ready) {
			window.PokiSDK?.gameLoadingFinished();
		}
	}

	/** Call when real gameplay begins (enemies spawning, timer running). */
	static gameplayStart() {
		if (PokiSdk.ready) {
			window.PokiSDK?.gameplayStart();
		}
	}

	/** Call the instant gameplay stops (death, time up, pause, any menu). */
	static gameplayStop() {
		if (PokiSdk.ready) {
			window.PokiSDK?.gameplayStop();
		}
	}

	/** Shows an interstitial ad at a natural break (e.g. before a restart). Always resolves. */
	static commercialBreak(): Promise<void> {
		if (!PokiSdk.ready || !window.PokiSDK) {
			return Promise.resolve();
		}

		return window.PokiSDK.commercialBreak().catch(() => undefined);
	}

	/**
	 * Activity-funnel / custom event. See PokiSDK docs: category is the broad
	 * group ("level", "tutorial", "button"), what is the specific instance
	 * ("1", "intro", "retry"), action is "start"/"complete"/"fail" for a
	 * progress funnel, "visible"/"interact" for an interaction funnel, or any
	 * custom string for a one-off event. No "/" or "^" in any parameter.
	 */
	static measure(category: string, what: string, action: string) {
		if (PokiSdk.ready) {
			window.PokiSDK?.measure(category, what, action);
		}
	}
}
