
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import * as Phaser from "phaser";
import assetPackUrl from "../../static/assets/asset-pack.json";
import PerformanceManager from "../game/PerformanceManager";
/* END-USER-IMPORTS */

export default class Preload extends Phaser.Scene {

	constructor() {
		super("Preload");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {

		const barHeight = this.scale.height * 0.9;
		const barY = this.scale.height * 0.5 - barHeight * 0.5;

		// progressBarBg
		const progressBarBg = this.add.rectangle(0, barY, this.scale.width, barHeight, 0x0c1f12);
		progressBarBg.setOrigin(0, 0);
		progressBarBg.isStroked = true;

		// progressBar
		const progressBar = this.add.rectangle(0, barY, 0, barHeight, 0x6cee57);
		progressBar.setOrigin(0, 0);
		progressBar.isFilled = true;

		// percentText
		const percentText = this.add.text(this.scale.width * 0.5, barY + barHeight * 0.5, "0%", {
			color: "#000000",
			fontFamily: "Orbitron",
			fontSize: "72pt",
			fontStyle: "bold",
		});
		percentText.setOrigin(0.5, 0.5);
		percentText.setDepth(1);

		this.progressBar = progressBar;
		this.percentText = percentText;

		this.events.emit("scene-awake");
	}

	private progressBar!: Phaser.GameObjects.Rectangle;
	private percentText!: Phaser.GameObjects.Text;

	/* START-USER-CODE */

	// Write your code here

	preload() {

		PerformanceManager.ensureDetected();
		this.editorCreate();

		this.load.pack("asset-pack", assetPackUrl);

		const fullWidth = this.scale.width;

		this.load.on("progress", (value: number) => {

			this.progressBar.width = fullWidth * value;
			this.percentText.setText(`${Math.round(value * 100)}%`);
		});
	}

	create() {

		if (process.env.NODE_ENV === "development") {

			const start = new URLSearchParams(location.search).get("start");

			if (start) {

				console.log(`Development: jump to ${start}`);
				this.scene.start(start);

				return;
			}
		}

		this.scene.start("Level");
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
