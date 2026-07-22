
// You can write more code here

/* START OF COMPILED CODE */

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
import { DYNAMIC } from "../../box2d/PhaserBox2D";
import { RotFromRad } from "../../box2d/PhaserBox2D";
import { b2BodyId } from "../../box2d/PhaserBox2D";
import { RemoveSpriteFromWorld } from "../../box2d/PhaserBox2D";
import * as PhaserBox2D from "../../box2d/PhaserBox2D";
/* START-USER-IMPORTS */
import * as Phaser from "phaser";
import Explode1 from "./Explode1";
/* END-USER-IMPORTS */

const box2d = PhaserBox2D as typeof PhaserBox2D & {
	b2Body_SetTransform(bodyId: b2BodyId, position: b2Vec2, rotation?: ReturnType<typeof RotFromRad>): void;
	b2Body_SetLinearVelocity(bodyId: b2BodyId, linearVelocity: b2Vec2): void;
};

type BulletShapeFilter = {
	categoryBits: number;
	maskBits: number;
	groupIndex: number;
};

export default class Bullet extends Phaser.GameObjects.Image {
	private static readonly bulletsByBodyKey = new Map<string, Bullet>();
	private static readonly pendingDestroyKeys = new Set<string>();
	private static readonly wallImpactKeys = new Set<string>();

	private static readonly BULLET_CATEGORY = 0x0002;
	private static readonly WALL_CATEGORY = 0x0001;
	private static readonly ENEMY_CATEGORY = 0x0004;
	private readonly bodyKey: string;
	public readonly bodyId: b2BodyId;

	constructor(scene: Phaser.Scene, x?: number, y?: number, angle = 0, speed = 28, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "Bullet", frame);

		// body_1
		const body_1 = b2CreateBody((this.scene as any).worldId, { 
			...b2DefaultBodyDef(), 
			type: DYNAMIC,
			gravityScale: 0,
			position: pxmVec2(this.x, -this.y)
		});
		this.bodyId = body_1;
		this.bodyKey = Bullet.makeBodyKey(body_1);
		Bullet.bulletsByBodyKey.set(this.bodyKey, this);

		// add body_1 to this
		AddSpriteToWorld((this.scene as any).worldId, this, { bodyId: body_1 });
		box2d.b2Body_SetTransform(body_1, pxmVec2(this.x, -this.y), RotFromRad(angle));

		const forwardX = Math.cos(angle) * speed;
		const forwardY = -Math.sin(angle) * speed;
		box2d.b2Body_SetLinearVelocity(body_1, new b2Vec2(forwardX, forwardY));

		// shape_1
		const shapeDef = b2DefaultShapeDef() as { friction: number; filter: BulletShapeFilter };
		shapeDef.friction = 0;
		(shapeDef as { enablePreSolveEvents?: boolean }).enablePreSolveEvents = true;
		shapeDef.filter.categoryBits = Bullet.BULLET_CATEGORY;
		shapeDef.filter.maskBits = Bullet.WALL_CATEGORY | Bullet.ENEMY_CATEGORY;

		const shape_1 = b2CreatePolygonShape(body_1, shapeDef, b2MakePolygon(b2ComputeHull([new b2Vec2(pxm(0), pxm(-4)), new b2Vec2(pxm(8), pxm(0)), new b2Vec2(pxm(0), pxm(4)), new b2Vec2(pxm(-8), pxm(0))], 4), pxm(0)));

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	preUpdate() {
		if (!Bullet.pendingDestroyKeys.has(this.bodyKey)) {
			return;
		}

		const hitX = this.x;
		const hitY = this.y;
		const scene = this.scene;

		Bullet.pendingDestroyKeys.delete(this.bodyKey);
		Bullet.bulletsByBodyKey.delete(this.bodyKey);
		const isWallImpact = Bullet.wallImpactKeys.delete(this.bodyKey);
		RemoveSpriteFromWorld((this.scene as any).worldId, this, true);
		super.destroy();

		if (isWallImpact) {
			Explode1.spawnWallImpact(scene, hitX, hitY);
			return;
		}

		// Enemy impact VFX
		Explode1.spawn(scene, hitX, hitY);
	}

	static queueDestroy(bodyId: b2BodyId) {
		Bullet.tryQueueDestroy(bodyId);
	}

	private static makeBodyKey(bodyId: b2BodyId) {
		return `${bodyId.world0}:${bodyId.index1}:${bodyId.revision}`;
	}

	/* START-USER-CODE */

	/**
	 * Iterate live bullets not already pending destroy (for enemy trigger checks).
	 */
	static forEachActive(callback: (bullet: Bullet) => void) {
		for (const bullet of Bullet.bulletsByBodyKey.values()) {
			if (!bullet.active || Bullet.pendingDestroyKeys.has(bullet.bodyKey)) {
				continue;
			}
			callback(bullet);
		}
	}

	/**
	 * Queue bullet destruction once (same path as wall hits → explode + remove).
	 * @returns true only the first time this bullet is queued.
	 */
	static tryQueueDestroy(bodyId: b2BodyId): boolean {
		const key = Bullet.makeBodyKey(bodyId);
		if (!Bullet.bulletsByBodyKey.has(key)) {
			return false;
		}
		if (Bullet.pendingDestroyKeys.has(key)) {
			return false;
		}

		Bullet.pendingDestroyKeys.add(key);
		return true;
	}

	static markWallImpact(bodyId: b2BodyId) {
		const key = Bullet.makeBodyKey(bodyId);
		if (Bullet.bulletsByBodyKey.has(key)) {
			Bullet.wallImpactKeys.add(key);
		}
	}

	/**
	 * Box2D pre-solve (walls / solid bodies).
	 * Enemy hits are handled by Enemy1.checkBulletHits() (reliable trigger).
	 */
	static onPreSolve(shapeIdA: unknown, shapeIdB: unknown): boolean {
		const box2dApi = PhaserBox2D as typeof PhaserBox2D & {
			b2Shape_GetBody(shapeId: unknown): b2BodyId;
		};
		const bodyA = box2dApi.b2Shape_GetBody(shapeIdA);
		const bodyB = box2dApi.b2Shape_GetBody(shapeIdB);

		Bullet.markWallImpact(bodyA);
		Bullet.markWallImpact(bodyB);
		const hitA = Bullet.tryQueueDestroy(bodyA);
		const hitB = Bullet.tryQueueDestroy(bodyB);

		// false = discard contact (no bounce) — same for walls
		return !(hitA || hitB);
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
