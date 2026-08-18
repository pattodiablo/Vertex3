
// You can write more code here

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
/* END-USER-IMPORTS */

export default class Enemy5 extends EnemyBase {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "enemy5", frame);

		// body
		const body = b2CreateBody((this.scene as any).worldId, { 
			...b2DefaultBodyDef(), 
			position: pxmVec2(this.x, -this.y)
		});

		// add body to this
		AddSpriteToWorld((this.scene as any).worldId, this, { bodyId: body });

		// shape
		const shape = b2CreatePolygonShape(body, { 
			...b2DefaultShapeDef()
		}, b2MakePolygon(b2ComputeHull([new b2Vec2(pxm(-33), pxm(-40.5)), new b2Vec2(pxm(33), pxm(-40.5)), new b2Vec2(pxm(33), pxm(40.5)), new b2Vec2(pxm(-33), pxm(40.5))], 4), pxm(0)));

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
		/* END-USER-CTR-CODE */
	}

	public EnemyLife: number = 4;

	/* START-USER-CODE */

	// Write your code here.

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
