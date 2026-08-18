
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

export default class Enemy7 extends EnemyBase {
	public travelPadding: number = 90;
	public travelDirection: number = 1;
	public travelProgress: number = 0;
	public travelSpeedFactor: number = 1.15;
	public arcAmplitude: number = 150;
	public loopRadius: number = 42;
	public loopAngle: number = 0;
	public loopSpeed: number = 900;
	public loopTriggerRadius: number = 300;
	public loopActive: boolean = false;
	public startX: number = 0;
	public startY: number = 0;
	public endX: number = 0;
	public endY: number = 0;
	public arcDirection: number = 1;

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "enemy7", frame);

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
		}, b2MakePolygon(b2ComputeHull([new b2Vec2(pxm(-22), pxm(-25.5)), new b2Vec2(pxm(22), pxm(-25.5)), new b2Vec2(pxm(22), pxm(25.5)), new b2Vec2(pxm(-22), pxm(25.5))], 4), pxm(0)));

		/* START-USER-CTR-CODE */
		this.initCollision(body, shape);
		if (typeof (body as any) === "object") {
			try {
				((this.scene as any).worldId && (this as any).bodyId) || AddSpriteToWorld((this.scene as any).worldId, this, { bodyId: body });
			} catch {
				// ignore if the sprite is already registered with the world
			}
		}
		this.setupCornerRoute();
		this.finalizeSpawn();
		this.setAngle(-90);
		this.travelProgress = 0;
		this.loopAngle = 0;
		this.setScale(1, 1);
		/* END-USER-CTR-CODE */
	}

	public EnemyLife: number = 1;

	/* START-USER-CODE */

	private setupCornerRoute() {
		const sceneWidth = this.scene.scale.width || 1280;
		const sceneHeight = this.scene.scale.height || 720;
		const left = this.travelPadding;
		const right = sceneWidth - this.travelPadding;
		const top = this.travelPadding;
		const bottom = sceneHeight - this.travelPadding;
		const nearLeft = this.x <= sceneWidth * 0.5;
		const nearTop = this.y <= sceneHeight * 0.5;

		this.startX = nearLeft ? left : right;
		this.endX = nearLeft ? right : left;
		this.startY = nearTop ? top : bottom;
		this.endY = nearTop ? top : bottom;
		this.arcDirection = nearTop ? 1 : -1;

		this.x = this.startX;
		this.y = this.startY;
		this.travelDirection = this.startX <= this.endX ? 1 : -1;
	}

	protected updateMovement(delta: number) {
		const speed = this.getMoveSpeed();
		const travelDistance = Math.max(1, Math.abs(this.endX - this.startX));
		const travelStep = (speed * this.travelSpeedFactor * delta) / 1000;
		this.travelProgress += (travelStep / travelDistance) * this.travelDirection;

		if (this.travelProgress >= 1) {
			this.travelProgress = 1;
			this.travelDirection = -1;
		}
		if (this.travelProgress <= 0) {
			this.travelProgress = 0;
			this.travelDirection = 1;
		}

		const t = this.travelProgress;
		const x = Phaser.Math.Linear(this.startX, this.endX, t);
		const midY = Phaser.Math.Linear(this.startY, this.endY, t);
		const parabola = 4 * t * (1 - t);
		const centerLift = this.arcAmplitude * parabola;
		const baseDx = this.endX - this.startX;
		const baseDy = this.endY - this.startY;
		const parabolaSlope = 4 * (1 - 2 * t);

		let y = midY + (centerLift * this.arcDirection);
		let dx = baseDx;
		let dy = baseDy + (this.arcAmplitude * parabolaSlope * this.arcDirection);
		const ship = (this.scene as Phaser.Scene & { mainShip?: { x: number; y: number; active?: boolean; visible?: boolean; hasDied?: boolean; hasAppeared?: boolean } }).mainShip;
		const shipIsAlive = !!ship && ship.active !== false && ship.visible !== false && ship.hasDied !== true && ship.hasAppeared !== false;
		const shipDistance = shipIsAlive ? Math.hypot(ship!.x - x, ship!.y - y) : Infinity;
		this.loopActive = shipDistance <= this.loopTriggerRadius;

		if (this.loopActive) {
			this.loopAngle += this.loopSpeed * (delta / 1000);
			const loopPhase = this.loopAngle * Math.PI / 180;
			y += Math.sin(loopPhase) * this.loopRadius;
			dy += Math.cos(loopPhase) * this.loopRadius * 6;
			dx += Math.sin(loopPhase) * this.loopRadius * 6 * this.travelDirection;
		} else {
			this.loopAngle = 0;
		}

		this.x = x;
		this.y = y;
		this.setAngle(Phaser.Math.RadToDeg(Math.atan2(dy, dx)));
		this.setScale(1, 1);
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
