
// You can write more code here

/* START OF COMPILED CODE */

import { b2CreateBody } from "../../box2d/PhaserBox2D";
import { b2DefaultBodyDef } from "../../box2d/PhaserBox2D";
import { pxmVec2 } from "../../box2d/PhaserBox2D";
/* START-USER-IMPORTS */
import * as Phaser from "phaser";
import MainShip from "./MainShip";
import { DYNAMIC } from "../../box2d/PhaserBox2D";
import { b2BodyId } from "../../box2d/PhaserBox2D";
import { b2DestroyBody } from "../../box2d/PhaserBox2D";
import { CreateCircle } from "../../box2d/PhaserBox2D";
import { b2Vec2 } from "../../box2d/PhaserBox2D";
import { pxm } from "../../box2d/PhaserBox2D";
import { RotFromRad } from "../../box2d/PhaserBox2D";
import * as PhaserBox2D from "../../box2d/PhaserBox2D";
/* END-USER-IMPORTS */

export default class energyParticle extends Phaser.GameObjects.Sprite {
	private static readonly ATTRACTION_RADIUS = 180;
	private static readonly FOLLOW_SPEED = 260;
	private static readonly FOLLOW_CLOSE_SPEED = 420;
	private static readonly FINAL_PULL_DURATION = 140;
	private static readonly ABSORB_RADIUS = 12;
	private static readonly LIFETIME_MS = 9000;
	private static readonly DRIFT_SPEED_MIN = 0.1;
	private static readonly DRIFT_SPEED_MAX = 1;
	private static readonly SPIN_SPEED_MIN = 2.4;
	private static readonly SPIN_SPEED_MAX = 6.2;

	private static readonly box2d = PhaserBox2D as typeof PhaserBox2D & {
		b2Body_SetType(bodyId: b2BodyId, type: number): void;
		b2Body_SetGravityScale(bodyId: b2BodyId, gravityScale: number): void;
		b2Body_SetLinearVelocity(bodyId: b2BodyId, linearVelocity: { x: number; y: number }): void;
		b2Body_SetAngularVelocity(bodyId: b2BodyId, angularVelocity: number): void;
		b2Body_SetTransform(bodyId: b2BodyId, position: b2Vec2, rotation?: ReturnType<typeof RotFromRad>): void;
		b2Body_GetTransform(bodyId: b2BodyId): { p: { x: number; y: number }; q: { c: number; s: number } };
		b2Body_Disable(bodyId: b2BodyId): void;
		b2Shape_SetFilter(shapeId: unknown, filter: { categoryBits: number; maskBits: number; groupIndex: number }): void;
		b2Shape_EnableSensorEvents(shapeId: unknown, flag: boolean): void;
	};

	private static readonly ENERGY_CATEGORY = 0x0010;
	private static readonly WALL_CATEGORY = 0x0001;
	private static readonly SHIP_CATEGORY = 0x0008;

	private bodyId!: b2BodyId;
	private isAbsorbing = false;
	private absorbTween?: Phaser.Tweens.Tween;
	private bodyDetached = false;
	private lifetimeTimer?: Phaser.Time.TimerEvent;

	static spawnBurst(scene: Phaser.Scene, x: number, y: number, count = Phaser.Math.Between(1, 2)) {
		for (let index = 0; index < count; index++) {
			const particle = new energyParticle(scene, x, y);
			scene.add.existing(particle);
			const spawnRotation = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
			const angle = Phaser.Math.FloatBetween(-Math.PI, Math.PI);
			const speed = Phaser.Math.FloatBetween(energyParticle.DRIFT_SPEED_MIN, energyParticle.DRIFT_SPEED_MAX);
			const spinDirection = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
			const angularVelocity = Phaser.Math.FloatBetween(energyParticle.SPIN_SPEED_MIN, energyParticle.SPIN_SPEED_MAX) * spinDirection;
			particle.launch(angle, speed, spawnRotation, angularVelocity);
		}
	}

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "energyParticle", frame);

		// body
		const body = b2CreateBody((this.scene as any).worldId, { 
			...b2DefaultBodyDef(), 
			type: DYNAMIC,
			gravityScale: 0,
			position: pxmVec2(this.x, -this.y)
		});
		this.bodyId = body;

		// shape
		CreateCircle({
			bodyId: body,
			radius: pxm(5),
			offset: new b2Vec2(0, 0),
			categoryBits: energyParticle.ENERGY_CATEGORY,
			maskBits: energyParticle.WALL_CATEGORY,
			groupIndex: 0,
			isSensor: false,
			friction: 0.15,
			restitution: 0.85,
		});

		/* START-USER-CTR-CODE */
		this.setOrigin(0.5, 0.5);
		this.setDepth(8);
		this.setBlendMode(Phaser.BlendModes.ADD);
		this.setScale(0.95);
		this.lifetimeTimer = this.scene.time.delayedCall(energyParticle.LIFETIME_MS, () => {
			if (!this.active || this.isAbsorbing) {
				return;
			}

			this.scene?.tweens.add({
				targets: this,
				alpha: 0,
				scaleX: this.scaleX * 0.7,
				scaleY: this.scaleY * 0.7,
				duration: 220,
				ease: "Sine.easeIn",
				onComplete: () => {
					if (this.active) {
						this.destroy();
					}
				},
			});
		});
		this.once(Phaser.GameObjects.Events.DESTROY, this.teardownPhysics, this);
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	launch(angle: number, speed: number, spawnRotation = angle, angularVelocity = 0) {
		if (!this.bodyId) {
			return;
		}

		this.setRotation(spawnRotation);
		energyParticle.box2d.b2Body_SetTransform(
			this.bodyId,
			pxmVec2(this.x, -this.y),
			RotFromRad(spawnRotation)
		);
		energyParticle.box2d.b2Body_SetLinearVelocity(this.bodyId, {
			x: Math.cos(angle) * speed,
			y: -Math.sin(angle) * speed,
		});
		energyParticle.box2d.b2Body_SetAngularVelocity(this.bodyId, angularVelocity);
	}

	preUpdate(_time: number, delta: number) {
		if (this.isAbsorbing || !this.active || !this.scene?.sys?.isActive()) {
			return;
		}

		this.syncFromBody();

		const ship = MainShip.getCurrentShip();
		if (!ship || !ship.active || !ship.visible || ship.hasDied || !ship.hasAppeared) {
			return;
		}

		const dx = ship.x - this.x;
		const dy = ship.y - this.y;
		const dist = Math.hypot(dx, dy);

		if (dist > energyParticle.ATTRACTION_RADIUS) {
			return;
		}

		this.absorbInto(ship);
	}

	private syncFromBody() {
		if (this.bodyDetached || !this.bodyId) {
			return;
		}

		const transform = energyParticle.box2d.b2Body_GetTransform(this.bodyId);
		this.x = transform.p.x * 40;
		this.y = -(transform.p.y * 40);
		this.rotation = -Math.atan2(transform.q.s, transform.q.c);
	}

	private detachPhysics() {
		if (this.bodyDetached || !this.bodyId) {
			return;
		}

		this.bodyDetached = true;

		try {
			energyParticle.box2d.b2Body_SetLinearVelocity(this.bodyId, { x: 0, y: 0 });
			energyParticle.box2d.b2Body_SetAngularVelocity(this.bodyId, 0);
			energyParticle.box2d.b2Body_Disable(this.bodyId);
		} catch {
			// ignore
		}
	}

	private absorbInto(ship: MainShip) {
		if (this.isAbsorbing || !this.active || !this.scene) {
			return;
		}

		this.setAlpha(0.92);
		this.lifetimeTimer?.remove(false);
		this.lifetimeTimer = undefined;
		this.scene.tweens.add({
			targets: this,
			scaleX: 1.08,
			scaleY: 1.08,
			duration: 160,
			yoyo: true,
			ease: "Sine.easeOut",
		});
		this.isAbsorbing = true;
		this.detachPhysics();
		ship.absorbEnergy(1);

		this.absorbTween?.stop();
		this.absorbTween = this.scene.tweens.add({
			targets: this,
			x: ship.x,
			y: ship.y,
			scaleX: 0.15,
			scaleY: 0.15,
			alpha: 0,
			duration: energyParticle.FINAL_PULL_DURATION,
			ease: "Sine.easeIn",
			onComplete: () => {
				if (this.active) {
					this.destroy();
				}
			},
		});
	}

	private teardownPhysics() {
		this.lifetimeTimer?.remove(false);
		this.lifetimeTimer = undefined;

		if (!this.bodyId) {
			return;
		}

		try {
			b2DestroyBody(this.bodyId);
		} catch {
			// world/body may already be gone
		}

		this.bodyDetached = true;
		this.bodyId = undefined as unknown as b2BodyId;
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
