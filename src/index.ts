import * as Phaser from "phaser";
import Level from "./scenes/Level";
import preloadAssetPackUrl from "../static/assets/preload-asset-pack.json";
import Preload from "./scenes/Preload";

function isMobileLikeDevice() {
	return window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
}

function createFullscreenButton(game: Phaser.Game) {
	const button = document.createElement("button");
	button.type = "button";
	button.textContent = "Fullscreen";
	button.setAttribute("aria-label", "Toggle fullscreen");
	button.style.position = "fixed";
	button.style.right = "16px";
	button.style.bottom = "16px";
	button.style.zIndex = "1000";
	button.style.padding = "10px 14px";
	button.style.border = "0";
	button.style.borderRadius = "999px";
	button.style.background = "rgba(0, 0, 0, 0.45)";
	button.style.color = "#fff";
	button.style.font = "600 14px/1.1 sans-serif";
	button.style.backdropFilter = "blur(6px)";
	button.style.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.25)";
	button.style.touchAction = "manipulation";

	const updateLabel = () => {
		button.textContent = game.scale.isFullscreen ? "Exit fullscreen" : "Fullscreen";
	};

	button.addEventListener("click", () => {
		if (game.scale.isFullscreen) {
			game.scale.stopFullscreen();
		} else {
			game.scale.startFullscreen();
		}

		updateLabel();
	});

	game.scale.on("enterfullscreen", updateLabel);
	game.scale.on("leavefullscreen", updateLabel);
	updateLabel();

	document.body.appendChild(button);
}

class Boot extends Phaser.Scene {

    constructor() {
        super("Boot");
    }

    preload() {

        this.load.pack("pack", preloadAssetPackUrl);
    }

    create() {

       this.scene.start("Preload");
    }
}

window.addEventListener('load', function () {
	
	const game = new Phaser.Game({
		width: 1280,
		height: 720,
		backgroundColor: "#2f2f2f",
		scale: {
			mode: Phaser.Scale.ScaleModes.FIT,
			autoCenter: Phaser.Scale.Center.CENTER_BOTH
		},
		scene: [Boot, Preload, Level]
	});

	if (isMobileLikeDevice()) {
		createFullscreenButton(game);
	}

	game.scene.start("Boot");
});