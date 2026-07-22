
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
/* START-USER-IMPORTS */
import * as Phaser from "phaser";
import AppearEffect from "./AppearEffect";
import type MainShip from "./MainShip";
import Bullet from "./Bullet";
import energyParticle from "./energyParticle";
import { DYNAMIC } from "../../box2d/PhaserBox2D";
import { RotFromRad } from "../../box2d/PhaserBox2D";
import { b2BodyId } from "../../box2d/PhaserBox2D";
import { RemoveSpriteFromWorld } from "../../box2d/PhaserBox2D";
import * as PhaserBox2D from "../../box2d/PhaserBox2D";
import Explode2 from "./Explode2";
/* END-USER-IMPORTS */

export default class Enemy1 extends Phaser.GameObjects.Image {
	static readonly DIED_EVENT = "enemy1-died";

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "enemy1", frame);

		this.scaleX = 0.5;
		this.scaleY = 0.5;

		// body
		const body = b2CreateBody((this.scene as any).worldId, {
			...b2DefaultBodyDef(),
			// Keep dynamic + no gravity even if the editor regenerates without them
			type: DYNAMIC,
			gravityScale: 0,
			position: pxmVec2(this.x, -this.y)
		});

		// add body to this
		AddSpriteToWorld((this.scene as any).worldId, this, { bodyId: body });

		// shape (editor polygon — configured as bullet trigger in user code)
		const shape = b2CreatePolygonShape(body, {
			...b2DefaultShapeDef(),
			// Trigger flags (may be overwritten by editor recompile; re-applied below)
			isSensor: true,
			enableContactEvents: true,
			enablePreSolveEvents: true,
			filter: {
				categoryBits: 0x0004,
				maskBits: 0x0002,
				groupIndex: 0,
			},
		}, b2MakePolygon(b2ComputeHull([new b2Vec2(pxm(10), pxm(-17.25)), new b2Vec2(pxm(20), pxm(0)), new b2Vec2(pxm(10), pxm(17.25)), new b2Vec2(pxm(-20), pxm(0))], 4), pxm(0)));

		/* START-USER-CTR-CODE */
		this.finalScaleX = this.scaleX;
		this.finalScaleY = this.scaleY;
		// Lock intended spawn immediately (before any UpdateWorldSprites can run).
		this.lockSpawnPose(this.x, this.y, this.rotation);
		// Use the editor body + shape (no second body/shape)
		this.setupTriggerFromEditor(body, shape);
		// Detach from WorldSprites while disabled — otherwise BodyToSprite
		// rewrites this sprite to (0,0) every frame during appear.
		this.detachFromWorldSprites();
		this.setVisible(false);
		this.isAppeared = false;
		this.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, () => {
			this.appear();
		});
		this.once(Phaser.GameObjects.Events.DESTROY, this.teardownPhysics, this);
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	/** Matches Bullet.ENEMY_CATEGORY so projectiles can hit this trigger. */
	static readonly ENEMY_CATEGORY = 0x0004;
	static readonly BULLET_CATEGORY = 0x0002;

	private static readonly enemiesByBodyKey = new Map<string, Enemy1>();

	private static readonly box2d = PhaserBox2D as typeof PhaserBox2D & {
		b2Body_SetTransform(bodyId: b2BodyId, position: b2Vec2, rotation?: ReturnType<typeof RotFromRad>): void;
		b2Body_SetLinearVelocity(bodyId: b2BodyId, linearVelocity: b2Vec2): void;
		b2Body_SetAngularVelocity(bodyId: b2BodyId, angularVelocity: number): void;
		b2Body_Disable(bodyId: b2BodyId): void;
		b2Body_Enable(bodyId: b2BodyId): void;
		b2Body_SetType(bodyId: b2BodyId, type: number): void;
		b2Shape_SetFilter(shapeId: unknown, filter: { categoryBits: number; maskBits: number; groupIndex: number }): void;
		b2Shape_EnableContactEvents(shapeId: unknown, flag: boolean): void;
		b2Shape_EnablePreSolveEvents(shapeId: unknown, flag: boolean): void;
		b2Shape_EnableSensorEvents(shapeId: unknown, flag: boolean): void;
	};

	/** True after the appear VFX finished. */
	private isAppeared = false;
	/** Prevent stacking multiple appear sequences. */
	private isAppearing = false;
	private isDead = false;

	/** Target scale after pop-in (matches prefab scale). */
	private finalScaleX = 0.5;
	private finalScaleY = 0.5;

	/** Scale pop-in duration after AppearEffect (ms). */
	private readonly appearScaleDuration = 450;

	/** Chase speed in pixels per second (overridden by difficulty at spawn). */
	private moveSpeed = 90;
	/** Stop when this close to the ship (px) to avoid jitter. */
	private readonly arriveDistance = 4;
	/** Rotate to face MainShip while chasing. */
	private readonly faceTarget = true;

	/** Hit points — each bullet deals 1 damage; dies at 0. */
	private readonly maxHp = 5;
	private hp = 5;

	/**
	 * Trigger hit radius in pixels (circle vs bullet position).
	 * Tuned for scale 0.5 sprite (~36–40px wide).
	 */
	private readonly hitRadius = 32;
	/** Collision radius vs MainShip (px). */
	private readonly shipHitRadius = 42;

	private bodyId?: b2BodyId;
	private bodyKey = "";

	/** Spawn pose locked during appear (never trust this.x/y while body is disabled). */
	private spawnX = 0;
	private spawnY = 0;
	private spawnRotation = 0;
	private spawnPoseLocked = false;
	/** True while sprite is not in WorldSprites (avoid BodyToSprite → 0,0). */
	private detachedFromWorldSprites = false;

	/**
	 * Register editor body/shape and force trigger (sensor) filters for bullets.
	 * Does NOT create extra shapes — uses the polygon from the editor.
	 */
	private setupTriggerFromEditor(body: b2BodyId, shapeId: unknown) {
		const b2 = Enemy1.box2d;

		this.bodyId = body;
		this.bodyKey = Enemy1.makeBodyKey(body);
		Enemy1.enemiesByBodyKey.set(this.bodyKey, this);

		if (typeof b2.b2Body_SetType === "function") {
			b2.b2Body_SetType(body, DYNAMIC);
		}

		// Force bullet-trigger collision filters on the editor polygon shape.
		b2.b2Shape_SetFilter(shapeId, {
			categoryBits: Enemy1.ENEMY_CATEGORY,
			maskBits: Enemy1.BULLET_CATEGORY,
			groupIndex: 0,
		});
		b2.b2Shape_EnableContactEvents(shapeId, true);
		b2.b2Shape_EnablePreSolveEvents(shapeId, true);
		b2.b2Shape_EnableSensorEvents(shapeId, true);

		// Pin physics to locked spawn before disable
		if (this.spawnPoseLocked) {
			b2.b2Body_SetLinearVelocity(body, new b2Vec2(0, 0));
			b2.b2Body_SetAngularVelocity(body, 0);
			b2.b2Body_SetTransform(
				body,
				pxmVec2(this.spawnX, -this.spawnY),
				RotFromRad(this.spawnRotation)
			);
		}

		this.disableBody();
	}

	/** Remember intended spawn before physics can corrupt the sprite. */
	private lockSpawnPose(x: number, y: number, rotation = 0) {
		this.spawnX = x;
		this.spawnY = y;
		this.spawnRotation = rotation;
		this.spawnPoseLocked = true;
		this.x = x;
		this.y = y;
		this.rotation = rotation;
	}

	/**
	 * Stop UpdateWorldSprites from overwriting this sprite while body is disabled.
	 * (Disabled bodies often report transform 0,0 → visible flash at corner.)
	 */
	private detachFromWorldSprites() {
		const worldId = (this.scene as any).worldId;
		if (!worldId || !this.bodyId) {
			return;
		}
		try {
			RemoveSpriteFromWorld(worldId, this, false);
			this.detachedFromWorldSprites = true;
		} catch {
			// ignore
		}
	}

	/** Re-link sprite ↔ body for normal gameplay sync. */
	private attachToWorldSprites() {
		const worldId = (this.scene as any).worldId;
		if (!worldId || !this.bodyId) {
			return;
		}
		try {
			AddSpriteToWorld(worldId, this, { bodyId: this.bodyId });
			this.detachedFromWorldSprites = false;
		} catch {
			// ignore
		}
	}

	/**
	 * Hide, play AppearEffect at locked spawn, then bounce scale in.
	 */
	appear(onComplete?: () => void) {
		if (this.isAppearing) {
			return;
		}

		const b2 = Enemy1.box2d;

		// Prefer already-locked spawner coords; only re-read if never locked
		if (!this.spawnPoseLocked) {
			this.lockSpawnPose(this.x, this.y, this.rotation);
		} else {
			// Force sprite back to lock in case UpdateWorldSprites already ran
			this.x = this.spawnX;
			this.y = this.spawnY;
			this.rotation = this.spawnRotation;
		}

		this.isAppearing = true;
		this.isAppeared = false;
		this.isDead = false;
		this.hp = this.maxHp;
		this.setVisible(false);
		this.setScale(0);

		// Ensure not synced from a bad disabled body mid-appear
		if (!this.detachedFromWorldSprites) {
			this.detachFromWorldSprites();
		}

		if (this.bodyId) {
			b2.b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));
			b2.b2Body_SetAngularVelocity(this.bodyId, 0);
			b2.b2Body_SetTransform(
				this.bodyId,
				pxmVec2(this.spawnX, -this.spawnY),
				RotFromRad(this.spawnRotation)
			);
		}
		this.disableBody();

		AppearEffect.spawn(this.scene, this.spawnX, this.spawnY, () => {
			if (!this.active) {
				return;
			}

			this.x = this.spawnX;
			this.y = this.spawnY;
			this.rotation = this.spawnRotation;
			this.setVisible(true);
			this.setScale(0);

			this.scene.tweens.add({
				targets: this,
				scaleX: this.finalScaleX,
				scaleY: this.finalScaleY,
				x: this.spawnX,
				y: this.spawnY,
				duration: this.appearScaleDuration,
				ease: "Bounce.easeOut",
				onComplete: () => {
					if (!this.active) {
						return;
					}

					this.x = this.spawnX;
					this.y = this.spawnY;
					this.rotation = this.spawnRotation;
					this.setScale(this.finalScaleX, this.finalScaleY);
					this.syncBodyTransform();
					this.enableBody();
					this.attachToWorldSprites();
					this.isAppeared = true;
					this.isAppearing = false;
					onComplete?.();
				},
			});
		});
	}

	get hasAppeared() {
		return this.isAppeared;
	}

	get currentHp() {
		return this.hp;
	}

	/** Set by Enemy1Spawner from current difficulty. */
	setMoveSpeed(speed: number) {
		if (Number.isFinite(speed) && speed > 0) {
			this.moveSpeed = speed;
		}
	}

	/** 1 damage per bullet hit; destroy at 0 HP. */
	takeDamage(amount = 1) {
		if (this.isDead || !this.isAppeared || !this.active || !this.scene) {
			return;
		}

		this.hp = Math.max(0, this.hp - amount);

		this.setTint(0xffffff);
		this.scene.time.delayedCall(50, () => {
			if (this.active && !this.isDead && this.scene) {
				this.clearTint();
			}
		});

		if (this.hp <= 0) {
			this.die();
		}
	}

	/** Used by Bullet.onPreSolve when a projectile touches this enemy body. */
	static applyHitFromBody(bodyId: b2BodyId, damage = 1): boolean {
		const key = Enemy1.makeBodyKey(bodyId);
		const enemy = Enemy1.enemiesByBodyKey.get(key);
		if (!enemy || enemy.isDead) {
			return false;
		}
		enemy.takeDamage(damage);
		return true;
	}

	/**
	 * Nearest living, fully-appeared enemy to (fromX, fromY).
	 * Used by MainShip auto-aim.
	 */
	static getNearestLiving(fromX: number, fromY: number): Enemy1 | null {
		let best: Enemy1 | null = null;
		let bestDistSq = Infinity;

		for (const enemy of Enemy1.enemiesByBodyKey.values()) {
			if (!enemy.active || !enemy.visible || enemy.isDead || !enemy.hasAppeared) {
				continue;
			}

			const dx = enemy.x - fromX;
			const dy = enemy.y - fromY;
			const distSq = dx * dx + dy * dy;
			if (distSq < bestDistSq) {
				bestDistSq = distSq;
				best = enemy;
			}
		}

		return best;
	}

	/**
	 * Destroy every living Enemy1 on the stage (ship death wipe).
	 * Snapshot first — die() mutates the map.
	 */
	static destroyAllLiving() {
		const list = Array.from(Enemy1.enemiesByBodyKey.values());
		for (const enemy of list) {
			if (!enemy.isDead) {
				enemy.die(false);
			}
		}
	}

	preUpdate(_time: number, delta: number) {
		// Destroyed / scene tearing down — Phaser may still tick one frame
		if (this.isDead || !this.active || !this.scene?.sys?.isActive()) {
			return;
		}

		if (!this.isAppeared) {
			if (this.isAppearing) {
				this.x = this.spawnX;
				this.y = this.spawnY;
				this.rotation = this.spawnRotation;
			}
			return;
		}

		if (!this.visible) {
			return;
		}

		this.chaseMainShip(delta);
		this.syncBodyTransform();
		// Reliable trigger: geometric hit (Box2D preSolve is backup for walls/physics)
		this.checkBulletHits();
		this.checkShipCollision();
	}

	/**
	 * Trigger-style hit test: if a bullet overlaps this enemy, destroy the bullet
	 * (bullet dies like walls; enemy death uses Explode2) and deal 1 damage.
	 */
	private checkBulletHits() {
		const r2 = this.hitRadius * this.hitRadius;

		Bullet.forEachActive((bullet) => {
			const dx = bullet.x - this.x;
			const dy = bullet.y - this.y;
			if (dx * dx + dy * dy > r2) {
				return;
			}

			// First time only → destroy bullet like a wall hit
			if (Bullet.tryQueueDestroy(bullet.bodyId)) {
				this.takeDamage(1);
			}
		});
	}

	private chaseMainShip(delta: number) {
		const ship = this.getMainShip();
		if (!ship || !ship.active || !ship.visible || ship.hasDied) {
			return;
		}

		if (typeof ship.hasAppeared === "boolean" && !ship.hasAppeared) {
			return;
		}

		const dx = ship.x - this.x;
		const dy = ship.y - this.y;
		const dist = Math.hypot(dx, dy);

		if (dist <= this.arriveDistance) {
			return;
		}

		const step = (this.moveSpeed * delta) / 1000;
		const nx = dx / dist;
		const ny = dy / dist;
		const travel = Math.min(step, dist - this.arriveDistance);
		this.x += nx * travel;
		this.y += ny * travel;

		if (this.faceTarget) {
			this.rotation = Math.atan2(dy, dx);
		}
	}

	/**
	 * If this enemy touches MainShip → ship Explode2 + wipe all enemies.
	 */
	private checkShipCollision() {
		const ship = this.getMainShip();
		if (!ship || !ship.active || !ship.visible || ship.hasDied || !ship.hasAppeared) {
			return;
		}

		const dx = ship.x - this.x;
		const dy = ship.y - this.y;
		const r = this.shipHitRadius;
		if (dx * dx + dy * dy <= r * r) {
			ship.dieFromEnemyHit();
		}
	}

	/** Public so destroyAllLiving can call it. */
	die(grantRewards = true) {
		if (this.isDead) {
			return;
		}
		this.isDead = true;
		this.isAppeared = false;

		const x = this.x;
		const y = this.y;
		const scene = this.scene;
		this.teardownPhysics();
		if (scene?.sys?.isActive()) {
			Explode2.spawn(scene, x, y);
			energyParticle.spawnBurst(scene, x, y);
			if (grantRewards) {
				scene.events.emit(Enemy1.DIED_EVENT, {
					baseScore: 10,
					x,
					y,
				});
			}
		}
		if (this.active) {
			this.destroy();
		}
	}

	private syncBodyTransform() {
		if (!this.bodyId) {
			return;
		}
		const b2 = Enemy1.box2d;
		b2.b2Body_SetTransform(this.bodyId, pxmVec2(this.x, -this.y), RotFromRad(this.rotation));
		b2.b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));
		b2.b2Body_SetAngularVelocity(this.bodyId, 0);
	}

	private enableBody() {
		if (this.bodyId) {
			Enemy1.box2d.b2Body_Enable(this.bodyId);
			this.syncBodyTransform();
		}
	}

	private disableBody() {
		if (this.bodyId) {
			Enemy1.box2d.b2Body_Disable(this.bodyId);
		}
	}

	private teardownPhysics() {
		if (this.bodyKey) {
			Enemy1.enemiesByBodyKey.delete(this.bodyKey);
			this.bodyKey = "";
		}
		if (this.bodyId) {
			try {
				RemoveSpriteFromWorld((this.scene as any).worldId, this, true);
			} catch {
				// world/body may already be gone
			}
			this.bodyId = undefined;
		}
	}

	private getMainShip(): MainShip | null {
		const scene = this.scene as (Phaser.Scene & { mainShip?: MainShip }) | undefined;
		if (!scene || !scene.sys?.isActive()) {
			return null;
		}
		return scene.mainShip ?? null;
	}

	private static makeBodyKey(bodyId: b2BodyId) {
		return `${bodyId.world0}:${bodyId.index1}:${bodyId.revision}`;
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
