/** Type declarations for Phaser Box2D debug draw helper. */

export declare class PhaserDebugDraw {
	scale: number;
	width: number;
	height: number;
	drawShapes: boolean;
	drawJoints: boolean;
	drawAABBs: boolean;
	drawMass: boolean;
	drawContacts: boolean;

	constructor(
		graphics: Phaser.GameObjects.Graphics,
		width: number,
		height: number,
		scale: number
	);

	SetPosition(x: number, y: number): void;
}
