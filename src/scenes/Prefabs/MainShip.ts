
// You can write more code here

/* START OF COMPILED CODE */

import { b2CreateBody } from "../../box2d/PhaserBox2D";
import { b2DefaultBodyDef } from "../../box2d/PhaserBox2D";
import { pxmVec2 } from "../../box2d/PhaserBox2D";
import { AddSpriteToWorld } from "../../box2d/PhaserBox2D";
import { pxm } from "../../box2d/PhaserBox2D";
import { b2Vec2 } from "../../box2d/PhaserBox2D";
/* START-USER-IMPORTS */
import * as Phaser from "phaser";
import AppearEffect from "./AppearEffect";
import Enemy1 from "./Enemy1";
import Bullet from "./Bullet";
import Explode2 from "./Explode2";
import { DYNAMIC } from "../../box2d/PhaserBox2D";
import { RotFromRad } from "../../box2d/PhaserBox2D";
import { b2BodyId } from "../../box2d/PhaserBox2D";
import { RemoveSpriteFromWorld } from "../../box2d/PhaserBox2D";
import { CreateCircle } from "../../box2d/PhaserBox2D";
import * as PhaserBox2D from "../../box2d/PhaserBox2D";
/* END-USER-IMPORTS */

export default class MainShip extends Phaser.GameObjects.Image {
	private static currentShip?: MainShip;
	private static readonly BASE_SCALE = 0.8;
	private static readonly BODY_RADIUS_PX = 41 * MainShip.BASE_SCALE;
	static readonly ENERGY_CHANGED_EVENT = "main-ship-energy-changed";
	private static readonly controlsByScene = new WeakMap<Phaser.Scene, {
		up: Phaser.Input.Keyboard.Key;
		down: Phaser.Input.Keyboard.Key;
		left: Phaser.Input.Keyboard.Key;
		right: Phaser.Input.Keyboard.Key;
		w: Phaser.Input.Keyboard.Key;
		a: Phaser.Input.Keyboard.Key;
		s: Phaser.Input.Keyboard.Key;
		d: Phaser.Input.Keyboard.Key;
	}>();

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 0, y ?? 0, texture || "mainShip", frame);

		// body
		const body = b2CreateBody((this.scene as any).worldId, { 
			...b2DefaultBodyDef(), 
			position: pxmVec2(this.x, -this.y)
		});

		// add body to this
		AddSpriteToWorld((this.scene as any).worldId, this, { bodyId: body });

		// shape
		const { shapeId: shape } = CreateCircle({
			bodyId: body,
			radius: pxm(MainShip.BODY_RADIUS_PX),
			offset: new b2Vec2(0, 0),
		});

		/* START-USER-CTR-CODE */
		this.setOrigin(0.5, 0.5);
		this.setScale(MainShip.BASE_SCALE);
		// Wire editor body/shape — all gameplay lives in START-USER-CODE
		this.initFromEditor(body, shape);
		this.setVisible(false);
		this.isAppeared = false;
		this.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, () => {
			MainShip.currentShip = this;
			this.appear();
		});
		this.once(Phaser.GameObjects.Events.DESTROY, () => {
			if (MainShip.currentShip === this) {
				MainShip.currentShip = undefined;
			}
			this.controls = undefined;
			MainShip.controlsByScene.delete(this.scene);
		});
		this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
			this.controls = undefined;
			MainShip.controlsByScene.delete(this.scene);
		});
		/* END-USER-CTR-CODE */
	}

	/* START-USER-CODE */

	// --- Box2D helpers (must live in USER-CODE so editor recompiles keep them) ---
	private static readonly box2d = PhaserBox2D as typeof PhaserBox2D & {
		b2Body_GetLinearVelocity(bodyId: b2BodyId): b2Vec2;
		b2Body_GetAngularVelocity(bodyId: b2BodyId): number;
		b2Body_SetLinearVelocity(bodyId: b2BodyId, linearVelocity: b2Vec2): void;
		b2Body_SetAngularVelocity(bodyId: b2BodyId, angularVelocity: number): void;
		b2Body_SetTransform(bodyId: b2BodyId, position: b2Vec2, rotation?: ReturnType<typeof RotFromRad>): void;
		b2Body_Disable(bodyId: b2BodyId): void;
		b2Body_Enable(bodyId: b2BodyId): void;
		b2Body_SetType(bodyId: b2BodyId, type: number): void;
		b2Body_IsFixedRotation(bodyId: b2BodyId): boolean;
		b2Body_SetFixedRotation(bodyId: b2BodyId, flag: boolean): void;
		b2Body_SetGravityScale(bodyId: b2BodyId, gravityScale: number): void;
		b2Shape_SetFilter(shapeId: unknown, filter: { categoryBits: number; maskBits: number; groupIndex: number }): void;
	};

	private static readonly SHIP_CATEGORY = 0x0008;

	private bodyId!: b2BodyId;

	// --- Controls ---
	private controls?: {
		up: Phaser.Input.Keyboard.Key;
		down: Phaser.Input.Keyboard.Key;
		left: Phaser.Input.Keyboard.Key;
		right: Phaser.Input.Keyboard.Key;
		w: Phaser.Input.Keyboard.Key;
		a: Phaser.Input.Keyboard.Key;
		s: Phaser.Input.Keyboard.Key;
		d: Phaser.Input.Keyboard.Key;
	};

	private readonly moveSpeed = 14;
	private readonly turnSpeed = 5.5;
	private readonly linearDrag = 0.90;
	private readonly angularDrag = 0.82;

	// --- Fire ---
	private bulletSpawnTimer = 0;
	private readonly bulletSpawnInterval = 125;
	private readonly bulletSpreadDeg = 10;

	// --- Touch ---
	private touchJoystick?: {
		active: boolean;
		pointerId: number;
		originX: number;
		originY: number;
		currentX: number;
		currentY: number;
	};
	private touchJoystickAngle = 0;
	private touchJoystickGraphics?: Phaser.GameObjects.Graphics;
	private touchControlsReady = false;
	private readonly joystickRadius = 64;
	private readonly joystickDeadZone = 8;
	private readonly gamepadDeadZone = 0.2;
	private readonly joystickBaseAlpha = 0.14;
	private readonly joystickKnobAlpha = 0.3;

	// --- Appear / death ---
	private isAppeared = false;
	private isAppearing = false;
	private isDead = false;
	private readonly appearScaleDuration = 450;
	private spawnX = 0;
	private spawnY = 0;
	private spawnRotation = 0;

	// --- Exhaust ---
	private static readonly EXHAUST_PARTICLE_KEY = "soft-circle-particle";
	private static readonly FIRE_SOUND_KEY = "Explosion31";
	private static readonly DIE_EXPLOSION = "Explosion16";
	private readonly shipDepth = 10;
	private readonly exhaustDepth = 5;
	private exhaustEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
	private absorbedEnergy = 0;

	static getCurrentShip() {
		return MainShip.currentShip;
	}

	get energyCollected() {
		return this.absorbedEnergy;
	}

	get scoreMultiplier() {
		return 1 + Math.floor(this.absorbedEnergy / 50);
	}

	absorbEnergy(amount = 1) {
		if (!Number.isFinite(amount) || amount <= 0) {
			return;
		}

		this.absorbedEnergy += amount;
		this.emitEnergyChanged();
	}

	private resetEnergy() {
		if (this.absorbedEnergy === 0) {
			this.emitEnergyChanged();
			return;
		}

		this.absorbedEnergy = 0;
		this.emitEnergyChanged();
	}

	private emitEnergyChanged() {
		this.scene?.events.emit(MainShip.ENERGY_CHANGED_EVENT, {
			energyCollected: this.absorbedEnergy,
			scoreMultiplier: this.scoreMultiplier,
		});
	}

	/** Capture editor body + configure filters / dynamic physics. */
	private initFromEditor(body: b2BodyId, shape: unknown) {
		const b2 = MainShip.box2d;
		this.bodyId = body;

		if (typeof b2.b2Body_SetType === "function") {
			b2.b2Body_SetType(body, DYNAMIC);
		}
		if (typeof b2.b2Body_SetGravityScale === "function") {
			b2.b2Body_SetGravityScale(body, 0);
		}

		b2.b2Shape_SetFilter(shape, {
			categoryBits: MainShip.SHIP_CATEGORY,
			// walls + enemies
			maskBits: 0x0001 | 0x0004,
			groupIndex: 0,
		});

		this.ensureBodyCanRotate();
	}

	private ensureBodyCanRotate() {
		const b2 = MainShip.box2d;
		if (!this.bodyId) {
			return;
		}

		if (typeof b2.b2Body_SetType === "function") {
			b2.b2Body_SetType(this.bodyId, DYNAMIC);
		}

		if (typeof b2.b2Body_SetGravityScale === "function") {
			b2.b2Body_SetGravityScale(this.bodyId, 0);
		}

		if (typeof b2.b2Body_IsFixedRotation === "function" && typeof b2.b2Body_SetFixedRotation === "function") {
			if (b2.b2Body_IsFixedRotation(this.bodyId)) {
				b2.b2Body_SetFixedRotation(this.bodyId, false);
			}
		}
	}

	preUpdate(_time: number, delta: number) {
		// Pin pose during appear — UpdateWorldSprites can shove disabled bodies to (0,0)
		if (this.isDead) {
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

		this.handleMovement(delta);
		this.handleAutoFire(delta);
		this.updateTouchJoystickGraphics();
		this.updateExhaustTrail(delta);
	}

	/**
	 * Hide the ship, play AppearEffect, then scale-pop in with bounce.
	 */
	appear(onComplete?: () => void) {
		if (this.isAppearing) {
			return;
		}

		const b2 = MainShip.box2d;

		this.spawnX = this.x;
		this.spawnY = this.y;
		this.spawnRotation = this.rotation;

		this.isAppearing = true;
		this.isAppeared = false;
		this.setVisible(false);
		this.setScale(0);
		this.stopExhaustTrail();
		this.ensureBodyCanRotate();

		b2.b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));
		b2.b2Body_SetAngularVelocity(this.bodyId, 0);
		b2.b2Body_SetTransform(
			this.bodyId,
			pxmVec2(this.spawnX, -this.spawnY),
			RotFromRad(this.spawnRotation)
		);
		b2.b2Body_Disable(this.bodyId);

		AppearEffect.spawn(this.scene, this.spawnX, this.spawnY, () => {
			if (!this.active) {
				return;
			}

			this.x = this.spawnX;
			this.y = this.spawnY;
			this.rotation = this.spawnRotation;

			this.ensureBodyCanRotate();
			b2.b2Body_Enable(this.bodyId);
			b2.b2Body_SetTransform(
				this.bodyId,
				pxmVec2(this.spawnX, -this.spawnY),
				RotFromRad(this.spawnRotation)
			);
			b2.b2Body_SetLinearVelocity(this.bodyId, new b2Vec2(0, 0));
			b2.b2Body_SetAngularVelocity(this.bodyId, 0);

			this.setVisible(true);
			this.setScale(0);

			this.scene.tweens.add({
				targets: this,
				scaleX: MainShip.BASE_SCALE,
				scaleY: MainShip.BASE_SCALE,
				duration: this.appearScaleDuration,
				ease: "Bounce.easeOut",
				onComplete: () => {
					if (!this.active) {
						return;
					}

					this.x = this.spawnX;
					this.y = this.spawnY;
					this.rotation = this.spawnRotation;
					b2.b2Body_SetTransform(
						this.bodyId,
						pxmVec2(this.spawnX, -this.spawnY),
						RotFromRad(this.spawnRotation)
					);

					this.setScale(MainShip.BASE_SCALE);
					this.isAppeared = true;
					this.isAppearing = false;
					this.setupExhaustTrail();
					onComplete?.();
				},
			});
		});
	}

	get hasAppeared() {
		return this.isAppeared;
	}

	get hasDied() {
		return this.isDead;
	}

	/** Scene event: Level listens and schedules respawn (other modes later). */
	static readonly DIED_EVENT = "main-ship-died";

	/**
	 * Called when an Enemy1 touches the ship:
	 * - Explode2 at ship position (scale 2)
	 * - destroy every Enemy1 on stage
	 * - remove the ship
	 * - emit DIED_EVENT so Level can respawn (temporary mode)
	 */
	dieFromEnemyHit() {
		if (this.isDead || !this.isAppeared || !this.active || !this.scene) {
			return;
		}

		this.isDead = true;
		this.isAppeared = false;
		this.resetEnergy();

		const x = this.x;
		const y = this.y;
		const scene = this.scene;
		const bodyId = this.bodyId;

		this.stopExhaustTrail();
		this.destroyExhaustTrail();
		this.teardownTouchJoystick();

		const b2 = MainShip.box2d;
		try {
			b2.b2Body_SetLinearVelocity(bodyId, new b2Vec2(0, 0));
			b2.b2Body_SetAngularVelocity(bodyId, 0);
			b2.b2Body_Disable(bodyId);
		} catch {
			// body may already be invalid
		}

		this.setVisible(false);

		// Big ship explosion
		if (scene.sys?.isActive()) {
			this.playDieExplotion();
			Explode2.spawn(scene, x, y, undefined, 2);
		}

		// Wipe all enemies first (while their scene refs are still valid)
		Enemy1.destroyAllLiving();

		// Notify Level (respawn, or future game-over modes)
		if (scene.sys?.isActive()) {
			scene.events.emit(MainShip.DIED_EVENT, { x, y });
		}

		try {
			RemoveSpriteFromWorld((scene as any).worldId, this, true);
		} catch {
			// ignore
		}

		if (this.active) {
			this.destroy();
		}
	}

	// ---------- Movement ----------

	private handleMovement(delta: number) {
		this.ensureControls();
		const gamepadStick = this.getGamepadMoveStick();
		if (gamepadStick) {
			this.handleAnalogMovement(delta, gamepadStick.angle, gamepadStick.magnitude);
			return;
		}

		if (this.scene.sys.game.device.input.touch) {
			this.handleTouchMovement(delta);
			return;
		}

		if (!this.controls) {
			return;
		}

		const b2 = MainShip.box2d;
		this.ensureBodyCanRotate();
		const moveForward = this.controls.w.isDown || this.controls.up.isDown;
		const moveBackward = this.controls.s.isDown || this.controls.down.isDown;
		const turnLeft = this.controls.a.isDown || this.controls.left.isDown;
		const turnRight = this.controls.d.isDown || this.controls.right.isDown;

		const moveInput = (moveForward ? 1 : 0) - (moveBackward ? 1 : 0);
		const turnInput = (turnLeft ? 1 : 0) - (turnRight ? 1 : 0);
		const deltaSeconds = delta / 1000;
		const currentLinearVelocity = b2.b2Body_GetLinearVelocity(this.bodyId);
		const nextRotation = this.rotation - turnInput * this.turnSpeed * deltaSeconds;

		if (turnInput !== 0) {
			this.rotation = nextRotation;
			b2.b2Body_SetTransform(this.bodyId, pxmVec2(this.x, -this.y), RotFromRad(nextRotation));
		}

		const directionX = Math.cos(this.rotation);
		const directionY = -Math.sin(this.rotation);

		let nextLinearVelocity: b2Vec2;
		if (moveInput !== 0) {
			const targetSpeed = this.moveSpeed * moveInput;
			const targetVelocity = new b2Vec2(directionX * targetSpeed, directionY * targetSpeed);
			const blend = Math.min(1, deltaSeconds * 8);
			nextLinearVelocity = new b2Vec2(
				currentLinearVelocity.x + (targetVelocity.x - currentLinearVelocity.x) * blend,
				currentLinearVelocity.y + (targetVelocity.y - currentLinearVelocity.y) * blend
			);
		} else {
			const drag = Math.pow(this.linearDrag, deltaSeconds * 60);
			nextLinearVelocity = new b2Vec2(currentLinearVelocity.x * drag, currentLinearVelocity.y * drag);
		}

		b2.b2Body_SetLinearVelocity(this.bodyId, nextLinearVelocity);
		b2.b2Body_SetAngularVelocity(this.bodyId, 0);
	}

	private handleTouchMovement(delta: number) {
		const joystick = this.touchJoystick;
		if (!joystick || !joystick.active) {
			this.applyDrag(delta);
			return;
		}

		const deltaX = joystick.currentX - joystick.originX;
		const deltaY = joystick.currentY - joystick.originY;
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

		if (distance < this.joystickDeadZone) {
			this.applyDrag(delta);
			return;
		}

		const clampedDistance = Math.min(distance, this.joystickRadius);
		const angle = Math.atan2(deltaY, deltaX);
		this.touchJoystickAngle = angle;

		const speedFactor = clampedDistance / this.joystickRadius;
		this.handleAnalogMovement(delta, angle, speedFactor);
	}

	private handleAnalogMovement(_delta: number, angle: number, speedFactor: number) {
		const b2 = MainShip.box2d;
		const clampedSpeedFactor = Phaser.Math.Clamp(speedFactor, 0, 1);
		const targetSpeed = this.moveSpeed * clampedSpeedFactor;
		const targetVelocity = new b2Vec2(Math.cos(angle) * targetSpeed, -Math.sin(angle) * targetSpeed);

		b2.b2Body_SetLinearVelocity(this.bodyId, targetVelocity);
		b2.b2Body_SetAngularVelocity(this.bodyId, 0);
		b2.b2Body_SetTransform(this.bodyId, pxmVec2(this.x, -this.y), RotFromRad(angle));
	}

	private applyDrag(delta: number) {
		const b2 = MainShip.box2d;
		const deltaSeconds = delta / 1000;
		const currentLinearVelocity = b2.b2Body_GetLinearVelocity(this.bodyId);
		const currentAngularVelocity = b2.b2Body_GetAngularVelocity(this.bodyId);
		const linearDrag = Math.pow(this.linearDrag, deltaSeconds * 60);
		const angularDrag = Math.pow(this.angularDrag, deltaSeconds * 60);

		b2.b2Body_SetLinearVelocity(
			this.bodyId,
			new b2Vec2(currentLinearVelocity.x * linearDrag, currentLinearVelocity.y * linearDrag)
		);
		b2.b2Body_SetAngularVelocity(this.bodyId, currentAngularVelocity * angularDrag);
	}

	// ---------- Fire (auto-aim nearest enemy) ----------

	private handleAutoFire(delta: number) {
		this.bulletSpawnTimer += delta;
		while (this.bulletSpawnTimer >= this.bulletSpawnInterval) {
			this.bulletSpawnTimer -= this.bulletSpawnInterval;
			this.spawnBullet();
		}
	}

	private spawnBullet() {
		const baseAngle = this.getFireAngle();
		const spread = Phaser.Math.DegToRad(this.bulletSpreadDeg);
		const angles = [baseAngle, baseAngle + spread, baseAngle - spread];
		this.playFireBurstSound();

		for (const angle of angles) {
			const bullet = new Bullet(this.scene, this.x, this.y, angle);
			this.scene.add.existing(bullet);
		}
	}

	private playFireBurstSound() {
		if (!this.scene.cache.audio.exists(MainShip.FIRE_SOUND_KEY)) {
			return;
		}

		this.scene.sound.play(MainShip.FIRE_SOUND_KEY, {
			volume: 0.28,
		});
	}


	private playDieExplotion() {
		if (!this.scene.cache.audio.exists(MainShip.DIE_EXPLOSION)) {
			return;
		}

		this.scene.sound.play(MainShip.DIE_EXPLOSION, {
			volume: 0.30,
		});
	}

	/**
	 * Aim at nearest living Enemy1; fallback to facing / joystick.
	 */
	private getFireAngle() {
		const nearest = Enemy1.getNearestLiving(this.x, this.y);
		if (nearest) {
			return Math.atan2(nearest.y - this.y, nearest.x - this.x);
		}

		const gamepadAimAngle = this.getGamepadAimAngle();
		if (gamepadAimAngle !== null) {
			return gamepadAimAngle;
		}

		if (this.scene.sys.game.device.input.touch && this.touchJoystick) {
			return this.touchJoystickAngle;
		}

		return this.rotation;
	}

	private getActiveGamepad() {
		const gamepadManager = this.scene.input.gamepad;
		if (!gamepadManager) {
			return null;
		}

		for (const pad of gamepadManager.gamepads) {
			if (pad && pad.connected) {
				return pad;
			}
		}

		return null;
	}

	private getGamepadMoveStick() {
		const pad = this.getActiveGamepad();
		if (!pad) {
			return null;
		}

		const axisX = this.readGamepadAxis(pad.leftStick.x, !!pad.left, !!pad.right);
		const axisY = this.readGamepadAxis(pad.leftStick.y, !!pad.up, !!pad.down);
		return this.normalizeAnalogInput(axisX, axisY);
	}

	private getGamepadAimAngle() {
		const pad = this.getActiveGamepad();
		if (!pad) {
			return null;
		}

		const rightStick = this.normalizeAnalogInput(pad.rightStick.x, pad.rightStick.y);
		if (rightStick) {
			return rightStick.angle;
		}

		const leftStick = this.getGamepadMoveStick();
		return leftStick?.angle ?? null;
	}

	private readGamepadAxis(axisValue: number | undefined, negativePressed = false, positivePressed = false) {
		const analogValue = axisValue ?? 0;
		if (Math.abs(analogValue) > this.gamepadDeadZone) {
			return analogValue;
		}

		return (positivePressed ? 1 : 0) - (negativePressed ? 1 : 0);
	}

	private normalizeAnalogInput(rawX: number, rawY: number) {
		const magnitude = Math.min(1, Math.hypot(rawX, rawY));
		if (magnitude <= this.gamepadDeadZone) {
			return null;
		}

		return {
			angle: Math.atan2(rawY, rawX),
			magnitude,
		};
	}

	// ---------- Touch joystick ----------

	private updateTouchJoystickGraphics() {
		if (!this.touchJoystickGraphics || !this.touchJoystick || !this.touchJoystick.active) {
			return;
		}

		const joystick = this.touchJoystick;
		const deltaX = joystick.currentX - joystick.originX;
		const deltaY = joystick.currentY - joystick.originY;
		const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
		const angle = Math.atan2(deltaY, deltaX);
		const clampedDistance = Math.min(distance, this.joystickRadius);
		const knobX = joystick.originX + Math.cos(angle) * clampedDistance;
		const knobY = joystick.originY + Math.sin(angle) * clampedDistance;

		this.touchJoystickGraphics.clear();
		this.touchJoystickGraphics.fillStyle(0x000000, this.joystickBaseAlpha);
		this.touchJoystickGraphics.fillCircle(joystick.originX, joystick.originY, this.joystickRadius);
		this.touchJoystickGraphics.fillStyle(0xffffff, this.joystickKnobAlpha);
		this.touchJoystickGraphics.fillCircle(knobX, knobY, 18);
		this.touchJoystickGraphics.setVisible(true);
	}

	private ensureTouchJoystick() {
		if (this.touchControlsReady || !this.scene.sys.game.device.input.touch) {
			return;
		}

		this.touchControlsReady = true;
		this.touchJoystickGraphics = this.scene.add.graphics();
		this.touchJoystickGraphics.setScrollFactor(0);
		this.touchJoystickGraphics.setDepth(1000);
		this.touchJoystickGraphics.setVisible(false);

		this.scene.input.on("pointerdown", this.handlePointerDown, this);
		this.scene.input.on("pointermove", this.handlePointerMove, this);
		this.scene.input.on("pointerup", this.handlePointerUp, this);
		this.scene.input.on("pointerupoutside", this.handlePointerUp, this);
		this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.teardownTouchJoystick, this);
	}

	private handlePointerDown(pointer: Phaser.Input.Pointer) {
		if (!this.scene.sys.game.device.input.touch || (this.touchJoystick && this.touchJoystick.active)) {
			return;
		}

		this.touchJoystick = {
			active: true,
			pointerId: pointer.id,
			originX: pointer.x,
			originY: pointer.y,
			currentX: pointer.x,
			currentY: pointer.y,
		};
		this.touchJoystickAngle = this.rotation;
		if (this.touchJoystickGraphics) {
			this.touchJoystickGraphics.setVisible(true);
		}
	}

	private handlePointerMove(pointer: Phaser.Input.Pointer) {
		if (!this.touchJoystick || !this.touchJoystick.active || this.touchJoystick.pointerId !== pointer.id) {
			return;
		}

		this.touchJoystick.currentX = pointer.x;
		this.touchJoystick.currentY = pointer.y;
	}

	private handlePointerUp(pointer: Phaser.Input.Pointer) {
		if (!this.touchJoystick || this.touchJoystick.pointerId !== pointer.id) {
			return;
		}

		this.touchJoystick = undefined;
		this.touchJoystickGraphics?.clear();
		this.touchJoystickGraphics?.setVisible(false);
	}

	private teardownTouchJoystick() {
		const input = this.scene?.input;
		input?.off("pointerdown", this.handlePointerDown, this);
		input?.off("pointermove", this.handlePointerMove, this);
		input?.off("pointerup", this.handlePointerUp, this);
		input?.off("pointerupoutside", this.handlePointerUp, this);
		this.touchJoystickGraphics?.destroy();
		this.touchJoystickGraphics = undefined;
		this.touchJoystick = undefined;
		this.touchControlsReady = false;
	}

	private ensureControls() {
		if (this.controls || this.scene.sys.game.device.input.touch) {
			this.ensureTouchJoystick();
			return;
		}

		const keyboard = this.scene.input.keyboard;
		if (!keyboard) {
			return;
		}

		let controls = MainShip.controlsByScene.get(this.scene);
		if (!controls) {
			controls = {
				...keyboard.createCursorKeys(),
				...keyboard.addKeys({
					w: Phaser.Input.Keyboard.KeyCodes.W,
					a: Phaser.Input.Keyboard.KeyCodes.A,
					s: Phaser.Input.Keyboard.KeyCodes.S,
					d: Phaser.Input.Keyboard.KeyCodes.D,
				}) as Pick<NonNullable<MainShip["controls"]>, "w" | "a" | "s" | "d">,
			};
			MainShip.controlsByScene.set(this.scene, controls);
		}

		this.controls = controls;
	}

	// ---------- Exhaust trail ----------

	private setupExhaustTrail() {
		if (this.exhaustEmitter || !this.scene) {
			return;
		}

		MainShip.ensureExhaustParticleTexture(this.scene);
		this.setDepth(this.shipDepth);

		this.exhaustEmitter = this.scene.add.particles(0, 0, MainShip.EXHAUST_PARTICLE_KEY, {
			speed: { min: 12, max: 52 },
			angle: { min: 0, max: 360 },
			scale: { start: 1.4, end: 0 },
			alpha: { start: 0.55, end: 0 },
			lifespan: { min: 140, max: 240 },
			frequency: 52,
			quantity: 1,
			tint: [0x2bff6a, 0x00e676, 0x39ff14, 0x33ccff, 0x00a2ff, 0x4d7cff, 0x9bffce],
			blendMode: Phaser.BlendModes.ADD,
			gravityY: 0,
			emitting: true,
		});

		this.exhaustEmitter.setDepth(this.exhaustDepth);
		this.exhaustEmitter.startFollow(this, 0, 0, true);
		this.exhaustEmitter.start();

		this.once(Phaser.GameObjects.Events.DESTROY, this.destroyExhaustTrail, this);
		this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroyExhaustTrail, this);
	}

	private updateExhaustTrail(_delta: number) {
		if (!this.exhaustEmitter) {
			return;
		}

		this.setDepth(this.shipDepth);
		this.exhaustEmitter.setDepth(this.exhaustDepth);

		if (!this.visible || !this.active) {
			if (this.exhaustEmitter.emitting) {
				this.exhaustEmitter.stop();
			}
			return;
		}

		if (!this.exhaustEmitter.emitting) {
			this.exhaustEmitter.start();
		}
	}

	private stopExhaustTrail() {
		this.exhaustEmitter?.stop();
	}

	private destroyExhaustTrail() {
		this.exhaustEmitter?.stopFollow();
		this.exhaustEmitter?.destroy();
		this.exhaustEmitter = undefined;
	}

	private static ensureExhaustParticleTexture(scene: Phaser.Scene) {
		const key = MainShip.EXHAUST_PARTICLE_KEY;
		if (scene.textures.exists(key)) {
			return;
		}

		const size = 12;
		const g = scene.make.graphics({ x: 0, y: 0 }, false);
		g.fillStyle(0xffffff, 1);
		g.fillCircle(size / 2, size / 2, size / 2 - 0.5);
		g.generateTexture(key, size, size);
		g.destroy();
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
