
/* START OF COMPILED CODE */

import EnemyBase from "./EnemyBase";
import { b2CreateBody } from "../../box2d/PhaserBox2D";
import { b2DefaultBodyDef } from "../../box2d/PhaserBox2D";
import { pxmVec2 } from "../../box2d/PhaserBox2D";
import { AddSpriteToWorld } from "../../box2d/PhaserBox2D";
import { b2CreatePolygonShape } from "../../box2d/PhaserBox2D";
import { b2DefaultShapeDef } from "../../box2d/PhaserBox2D";
import { pxm } from "../../box2d/PhaserBox2D";
import { b2Vec2 } from "../../box2d/PhaserBox2D";
import { b2ComputeHull } from "../../box2d/PhaserBox2D";
import { b2MakePolygon } from "../../box2d/PhaserBox2D";
/* START-USER-IMPORTS */
import * as Phaser from "phaser";
import { DYNAMIC } from "../../box2d/PhaserBox2D";

/* END-USER-IMPORTS */

export default class Enemy2 extends EnemyBase {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "enemy2", frame);

		// shape
		const body = (this.scene as any).worldId && (this as any).bodyId ? (this as any).bodyId : b2CreateBody((this.scene as any).worldId, { 
			...b2DefaultBodyDef(), 
			position: pxmVec2(this.x, -this.y)
		});
		const shape = b2CreatePolygonShape(body, { 
			...b2DefaultShapeDef()
		}, b2MakePolygon(b2ComputeHull([new b2Vec2(pxm(-28), pxm(-34.5)), new b2Vec2(pxm(28), pxm(-34.5)), new b2Vec2(pxm(28), pxm(34.5)), new b2Vec2(pxm(-28), pxm(34.5))], 4), pxm(0)));

		/* START-USER-CTR-CODE */
		this.initCollision(body, shape);
		if (typeof (body as any) === "object") {
			try {
				((this.scene as any).worldId && (this as any).bodyId) || AddSpriteToWorld((this.scene as any).worldId, this, { bodyId: body });
			} catch {
				// ignore if the sprite is already registered with the world
			}
		}
		this.finalizeSpawn();
		this.setScale(1);
		const sceneWidth = this.scene.scale.width || 1280;
		this.horizontalDirection = this.x >= sceneWidth * 0.5 ? -1 : 1;
		this.setScale(this.horizontalDirection < 0 ? -1 : 1, 1);
		/* END-USER-CTR-CODE */
	}

	public horizontalDirection: number = 0;
	public travelPadding: number = 90;

	/* START-USER-CODE */

	protected updateMovement(delta: number) {
		const sceneWidth = this.scene.scale.width || 1280;
		const speed = this.getMoveSpeed();
		this.x += this.horizontalDirection * speed * (delta / 1000);
		this.setScale(this.horizontalDirection < 0 ? -1 : 1, 1);

		if (this.horizontalDirection > 0 && this.x > sceneWidth + this.travelPadding) {
			this.horizontalDirection = -1;
			this.setScale(-1, 1);
			this.x = sceneWidth + this.travelPadding;
		}

		if (this.horizontalDirection < 0 && this.x < -this.travelPadding) {
			this.horizontalDirection = 1;
			this.setScale(1, 1);
			this.x = -this.travelPadding;
		}
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */
