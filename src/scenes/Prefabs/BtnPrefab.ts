
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

		// btnTextureHover
		const btnTextureHover = scene.add.image(0, 0, "btnTexture");
		btnTextureHover.scaleY = 0.5;
		btnTextureHover.setAlpha(0);
		this.add(btnTextureHover);


		this.btnTextureHover = btnTextureHover;
		this.BtnText = this.BtnText;
		this.buttonText.setText(this.BtnText);

		
		/* END-USER-CTR-CODE */
	}

	private btnTexture: Phaser.GameObjects.Image;
	private buttonText: Phaser.GameObjects.Text;
	public BtnText: string = "Abutton";

	/* START-USER-CODE */
	private btnTextureHover: Phaser.GameObjects.Image;
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
			this.btnTextureHover.setAlpha(0.35);
		} else {
			this.btnTexture.clearTint();
			this.btnTextureHover.setAlpha(0);
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

		this.handlePointerOut();
		this.btnTexture.setInteractive({ useHandCursor: true });
		this.btnTexture.on(Phaser.Input.Events.POINTER_OVER, this.handlePointerOver, this);
		this.btnTexture.on(Phaser.Input.Events.POINTER_OUT, this.handlePointerOut, this);
		this.btnTexture.on(Phaser.Input.Events.POINTER_UP, this.handlePointerUp, this);
	}

	private handlePointerOver() {
		this.setScale(this.hoverScale);
		this.btnTexture.setTint(this.hoverTint);
		this.btnTextureHover.setAlpha(0.35);
		this.buttonText.setColor("#DE2E31");
	}

	private handlePointerOut() {
		this.setScale(1);
		this.btnTexture.clearTint();
		this.btnTextureHover.setAlpha(0);
		this.buttonText.setColor("#FFFFFF");
	}

	private handlePointerUp() {
		this.emit("clicked");
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
