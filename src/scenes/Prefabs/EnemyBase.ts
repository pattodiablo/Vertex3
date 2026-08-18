// You can write more code here

/* START OF COMPILED CODE */

import * as Phaser from "phaser";
import type MainShip from "./MainShip";
import Bullet from "./Bullet";
import energyParticle from "./energyParticle";
import OpenPortal from "./OpenPortal";
import Explode2 from "./Explode2";
import { DYNAMIC } from "../../box2d/PhaserBox2D";
import { RotFromRad } from "../../box2d/PhaserBox2D";
import { b2BodyId } from "../../box2d/PhaserBox2D";
import { AddSpriteToWorld } from "../../box2d/PhaserBox2D";
import { RemoveSpriteFromWorld } from "../../box2d/PhaserBox2D";
import * as PhaserBox2D from "../../box2d/PhaserBox2D";
import { b2Vec2 } from "../../box2d/PhaserBox2D";
import { pxmVec2 } from "../../box2d/PhaserBox2D";

export default abstract class EnemyBase extends Phaser.GameObjects.Image {
	static readonly DIED_EVENT = "enemy1-died";
	static readonly ENEMY_CATEGORY = 0x0004;
	static readonly BULLET_CATEGORY = 0x0002;

	private static readonly enemiesByBodyKey = new Map<string, EnemyBase>();
	private static readonly openPortalPool: OpenPortal[] = [];
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

	private isAppeared = false;
	private isAppearing = false;
	private isDead = false;
	private finalScaleX = 0.5;
	private finalScaleY = 0.5;
	private readonly appearScaleDuration = 450;
	private moveSpeed = 90;
	private readonly arriveDistance = 4;
	private readonly faceTarget = true;
	private readonly defaultEnemyLife = 5;
	private hp = 5;
	private readonly hitRadius = 32;
	private readonly shipHitRadius = 42;
	private bodyId?: b2BodyId;
	private bodyKey = "";
	private spawnX = 0;
	private spawnY = 0;
	private spawnRotation = 0;
	private spawnPoseLocked = false;
	private detachedFromWorldSprites = false;

	protected constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "enemy1", frame);
	}

	protected initCollision(body: b2BodyId, shapeId: unknown) {
		const b2 = EnemyBase.box2d;
		this.bodyId = body;
		this.bodyKey = EnemyBase.makeBodyKey(body);
		EnemyBase.enemiesByBodyKey.set(this.bodyKey, this);
		if (typeof b2.b2Body_SetType === "function") b2.b2Body_SetType(body, DYNAMIC);
		b2.b2Shape_SetFilter(shapeId, { categoryBits: EnemyBase.ENEMY_CATEGORY, maskBits: EnemyBase.BULLET_CATEGORY, groupIndex: 0 });
		b2.b2Shape_EnableContactEvents(shapeId, true);
		b2.b2Shape_EnablePreSolveEvents(shapeId, true);
		b2.b2Shape_EnableSensorEvents(shapeId, true);
		this.disableBody();
	}

	protected finalizeSpawn() {
		this.finalScaleX = this.scaleX;
		this.finalScaleY = this.scaleY;
		this.lockSpawnPose(this.x, this.y, this.rotation);
		this.detachFromWorldSprites();
		this.setVisible(false);
		this.isAppeared = false;
		this.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, () => this.appear());
		this.once(Phaser.GameObjects.Events.DESTROY, this.teardownPhysics, this);
	}

	appear(onComplete?: () => void) {
		if (this.isAppearing) return;
		const b2 = EnemyBase.box2d;
		if (!this.spawnPoseLocked) this.lockSpawnPose(this.x, this.y, this.rotation);
		else { this.x = this.spawnX; this.y = this.spawnY; this.rotation = this.spawnRotation; }
		this.isAppearing = true;
		this.isAppeared = false;
		this.isDead = false;
		this.hp = this.getEnemyLife();
		this.setVisible(false);
		this.setScale(0);
		if (!this.detachedFromWorldSprites) this.detachFromWorldSprites();
		if (this.bodyId) {
			b2.b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));
			b2.b2Body_SetAngularVelocity(this.bodyId, 0);
			b2.b2Body_SetTransform(this.bodyId, pxmVec2(this.spawnX, -this.spawnY), RotFromRad(this.spawnRotation));
		}
		this.disableBody();
		const portal = EnemyBase.acquireOpenPortal(this.scene, this.spawnX, this.spawnY);
		let portalFinished = false;
		const finishPortal = () => {
			if (portalFinished) return;
			portalFinished = true;
			EnemyBase.releaseOpenPortal(portal);
		};
		portal.play("openPortal");
		portal.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
			finishPortal();
			this.showAfterPortal(onComplete);
		});
		this.scene.time.delayedCall(700, () => {
			finishPortal();
			this.showAfterPortal(onComplete);
		});
	}

	private showAfterPortal(onComplete?: () => void) {
		if (!this.active) return;
		if (this.isAppeared) return;
		this.x = this.spawnX; this.y = this.spawnY; this.rotation = this.spawnRotation;
		this.setVisible(true); this.setScale(0);
		this.scene.tweens.add({ targets: this, scaleX: this.finalScaleX, scaleY: this.finalScaleY, x: this.spawnX, y: this.spawnY, duration: this.appearScaleDuration, ease: "Bounce.easeOut", onComplete: () => {
			if (!this.active) return;
			this.x = this.spawnX; this.y = this.spawnY; this.rotation = this.spawnRotation; this.setScale(this.finalScaleX, this.finalScaleY);
			this.syncBodyTransform(); this.enableBody(); this.attachToWorldSprites(); this.isAppeared = true; this.isAppearing = false; onComplete?.();
		}});
	}

	get hasAppeared() { return this.isAppeared; }
	get currentHp() { return this.hp; }
	protected getMoveSpeed() { return this.moveSpeed; }
	setMoveSpeed(speed: number) { if (Number.isFinite(speed) && speed > 0) this.moveSpeed = speed; }
	static getLivingCount() {
		let count = 0;
		for (const enemy of EnemyBase.enemiesByBodyKey.values()) {
			if (enemy.active && !enemy.isDead && enemy.hasAppeared) {
				count += 1;
			}
		}
		return count;
	}
	takeDamage(amount = 1) { if (this.isDead || !this.isAppeared || !this.active || !this.scene) return; this.hp = Math.max(0, this.hp - amount); this.setTint(0xffffff); this.scene.time.delayedCall(50, () => { if (this.active && !this.isDead && this.scene) this.clearTint(); }); if (this.hp <= 0) this.die(); }
	static applyHitFromBody(bodyId: b2BodyId, damage = 1): boolean { const key = EnemyBase.makeBodyKey(bodyId); const enemy = EnemyBase.enemiesByBodyKey.get(key); if (!enemy || enemy.isDead) return false; enemy.takeDamage(damage); return true; }
	static getNearestLiving(fromX: number, fromY: number): EnemyBase | null { let best: EnemyBase | null = null; let bestDistSq = Infinity; for (const enemy of EnemyBase.enemiesByBodyKey.values()) { if (!enemy.active || !enemy.visible || enemy.isDead || !enemy.hasAppeared) continue; const dx = enemy.x - fromX; const dy = enemy.y - fromY; const distSq = dx * dx + dy * dy; if (distSq < bestDistSq) { bestDistSq = distSq; best = enemy; } } return best; }
	static destroyAllLiving() { const list = Array.from(EnemyBase.enemiesByBodyKey.values()); for (const enemy of list) if (!enemy.isDead) enemy.die(false); }
	preUpdate(_time: number, delta: number) { if (this.isDead || !this.active || !this.scene?.sys?.isActive()) return; if (!this.isAppeared) { if (this.isAppearing) { this.x = this.spawnX; this.y = this.spawnY; this.rotation = this.spawnRotation; } return; } if (!this.visible) return; this.updateMovement(delta); this.syncBodyTransform(); this.checkBulletHits(); this.checkShipCollision(); }
	protected updateMovement(delta: number) { this.chaseMainShip(delta); }
	protected checkBulletHits() { const r2 = this.hitRadius * this.hitRadius; Bullet.forEachActive((bullet) => { const dx = bullet.x - this.x; const dy = bullet.y - this.y; if (dx * dx + dy * dy > r2) return; if (Bullet.tryQueueDestroy(bullet.bodyId)) this.takeDamage(1); }); }
	protected chaseMainShip(delta: number) { const ship = this.getMainShip(); const step = (this.moveSpeed * delta) / 1000; if (!ship || !ship.active || !ship.visible || ship.hasDied || (typeof ship.hasAppeared === "boolean" && !ship.hasAppeared)) { const angle = Number.isFinite(this.rotation) ? this.rotation : this.spawnRotation; this.x += Math.cos(angle) * step; this.y += Math.sin(angle) * step; return; } const dx = ship.x - this.x; const dy = ship.y - this.y; const dist = Math.hypot(dx, dy); if (dist <= this.arriveDistance) return; const nx = dx / dist; const ny = dy / dist; const travel = Math.min(step, dist - this.arriveDistance); this.x += nx * travel; this.y += ny * travel; if (this.faceTarget) this.rotation = Math.atan2(dy, dx); }
	protected checkShipCollision() { const ship = this.getMainShip(); if (!ship || !ship.active || !ship.visible || ship.hasDied || !ship.hasAppeared) return; const dx = ship.x - this.x; const dy = ship.y - this.y; const r = this.shipHitRadius; if (dx * dx + dy * dy <= r * r) ship.dieFromEnemyHit(); }
	die(grantRewards = true) { if (this.isDead) return; this.isDead = true; this.isAppeared = false; const x = this.x; const y = this.y; const scene = this.scene; this.teardownPhysics(); if (scene?.sys?.isActive()) { Explode2.spawn(scene, x, y); energyParticle.spawnBurst(scene, x, y); if (grantRewards) scene.events.emit(EnemyBase.DIED_EVENT, { baseScore: 10, x, y }); } if (this.active) this.destroy(); }
	protected syncBodyTransform() { if (!this.bodyId) return; const b2 = EnemyBase.box2d; b2.b2Body_SetTransform(this.bodyId, pxmVec2(this.x, -this.y), RotFromRad(this.rotation)); b2.b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0)); b2.b2Body_SetAngularVelocity(this.bodyId, 0); }
	protected enableBody() { if (this.bodyId) { EnemyBase.box2d.b2Body_Enable(this.bodyId); this.syncBodyTransform(); } }
	protected disableBody() { if (this.bodyId) EnemyBase.box2d.b2Body_Disable(this.bodyId); }
	protected teardownPhysics() { if (this.bodyKey) { EnemyBase.enemiesByBodyKey.delete(this.bodyKey); this.bodyKey = ""; } if (this.bodyId) { try { RemoveSpriteFromWorld((this.scene as any).worldId, this, true); } catch { } this.bodyId = undefined; } }
	protected attachToWorldSprites() { const worldId = (this.scene as any).worldId; if (!worldId || !this.bodyId) return; try { AddSpriteToWorld(worldId, this, { bodyId: this.bodyId }); this.detachedFromWorldSprites = false; } catch { } }
	protected detachFromWorldSprites() { const worldId = (this.scene as any).worldId; if (!worldId || !this.bodyId) return; try { RemoveSpriteFromWorld(worldId, this, false); this.detachedFromWorldSprites = true; } catch { } }
	protected lockSpawnPose(x: number, y: number, rotation = 0) { this.spawnX = x; this.spawnY = y; this.spawnRotation = rotation; this.spawnPoseLocked = true; this.x = x; this.y = y; this.rotation = rotation; }
	protected getEnemyLife() {
		const configuredLife = Number((this as { EnemyLife?: number }).EnemyLife);
		return Number.isFinite(configuredLife) && configuredLife > 0 ? configuredLife : this.defaultEnemyLife;
	}
	private static acquireOpenPortal(scene: Phaser.Scene, x: number, y: number) {
		const portal = EnemyBase.openPortalPool.pop() ?? new OpenPortal(scene, x, y);
		if (!portal.scene) {
			scene.add.existing(portal);
		}
		portal.setPosition(x, y);
		portal.setVisible(true);
		portal.setActive(true);
		portal.setScale(0.5);
		portal.setAlpha(1);
		portal.setRotation(0);
		portal.anims?.stop();
		portal.setFrame(20);
		return portal;
	}
	private static releaseOpenPortal(portal: OpenPortal) {
		portal.removeAllListeners(Phaser.Animations.Events.ANIMATION_COMPLETE);
		portal.anims?.stop();
		portal.setActive(false);
		portal.setVisible(false);
		EnemyBase.openPortalPool.push(portal);
	}

	static warmOpenPortalPool(scene: Phaser.Scene, count = 30) {
		EnemyBase.clearRuntimePools();
		for (let i = EnemyBase.openPortalPool.length; i < count; i++) {
			const portal = new OpenPortal(scene, 0, 0);
			scene.add.existing(portal);
			portal.anims?.stop();
			portal.setActive(false);
			portal.setVisible(false);
			EnemyBase.openPortalPool.push(portal);
		}
	}

	static clearRuntimePools() {
		for (const portal of EnemyBase.openPortalPool) {
			portal.removeAllListeners();
			portal.destroy();
		}
		EnemyBase.openPortalPool.length = 0;
	}
	private getMainShip(): MainShip | null { const scene = this.scene as (Phaser.Scene & { mainShip?: MainShip }) | undefined; if (!scene || !scene.sys?.isActive()) return null; return scene.mainShip ?? null; }
	private static makeBodyKey(bodyId: b2BodyId) { return `${bodyId.world0}:${bodyId.index1}:${bodyId.revision}`; }
}

/* END OF COMPILED CODE */