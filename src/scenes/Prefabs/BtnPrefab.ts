
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import * as Phaser from "phaser";
/* END-USER-IMPORTS */

export default class BtnPrefab extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 0, y ?? 0);

		// btnTexture
		const btnTexture = scene.add.image(0, 0, "btnTexture");
		btnTexture.scaleY = 0.5;
		this.add(btnTexture);

		// ButtonText
		const buttonText = scene.add.text(0, 0, "", {});
		buttonText.setOrigin(0.5, 0.5);
		buttonText.text = "button";
		buttonText.setStyle({ "fontFamily": "Orbitron" });
		this.add(buttonText);

		this.btnTexture = btnTexture;
		this.buttonText = buttonText;
		// awake handler
		this.scene.events.once("scene-awake", () => this.awake());

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	private btnTexture: Phaser.GameObjects.Image;
	private buttonText: Phaser.GameObjects.Text;
	public BtnText: string = "Abutton";

	/* START-USER-CODE */
	private readonly hoverScale = 1.08;
	private readonly hoverTint = 0xde2e31;

	private awake() {
		this.initializeButton();
	}

	public setLabel(label: string) {
		this.BtnText = label;
		this.buttonText.setText(label);
	}

	public setSelected(selected: boolean) {
		this.buttonText.setColor(selected ? "#DE2E31" : "#FFFFFF");
		if (selected) {
			this.btnTexture.setTint(this.hoverTint);
		} else {
			this.btnTexture.clearTint();
		}
	}

	private initializeButton() {
		this.setLabel(this.BtnText);
		this.buttonText.setOrigin(0.5, 0.5);
		this.buttonText.setStyle({
			fontFamily: "Orbitron",
			fontSize: "22pt",
			color: "#FFFFFF",
		});

		this.setScrollFactor(0);
		this.setDepth(10004);
		this.setSize(this.btnTexture.displayWidth, this.btnTexture.displayHeight);

		this.handlePointerOut();
		this.btnTexture.setOrigin(0.5, 0.5);
		this.btnTexture.setPosition(0, 0);
		this.btnTexture.setInteractive();
		this.btnTexture.on(Phaser.Input.Events.POINTER_OVER, this.handlePointerOver, this);
		this.btnTexture.on(Phaser.Input.Events.POINTER_OUT, this.handlePointerOut, this);
		this.btnTexture.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);
	}

	private handlePointerOver() {
		this.setScale(this.hoverScale);
		this.btnTexture.setTint(this.hoverTint);
		this.buttonText.setColor("#DE2E31");
	}

	private handlePointerOut() {
		this.setScale(1);
		this.btnTexture.clearTint();
		this.buttonText.setColor("#FFFFFF");
	}

	private handlePointerDown() {
		if (this.BtnText.trim().toLowerCase() === "retry" || this.BtnText.trim().toLowerCase() === "retry?") {
			this.scene.scene.restart();
			return;
		}

		this.emit("clicked");
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
