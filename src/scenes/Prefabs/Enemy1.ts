
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

export default class Enemy1 extends EnemyBase {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "enemy1", frame);

		this.scaleX = 0.5;
		this.scaleY = 0.5;

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
		}, b2MakePolygon(b2ComputeHull([new b2Vec2(pxm(10), pxm(-17.25)), new b2Vec2(pxm(20), pxm(0)), new b2Vec2(pxm(10), pxm(17.25)), new b2Vec2(pxm(-20), pxm(0))], 4), pxm(0)));

		/* START-USER-CTR-CODE */
		this.initCollision(body, shape);
		this.finalizeSpawn();
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */
	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
