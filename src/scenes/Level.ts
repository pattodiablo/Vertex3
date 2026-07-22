// You can write more code here

/* START OF COMPILED CODE */

import { CreateWorld } from "../box2d/PhaserBox2D";
import { SetWorldScale } from "../box2d/PhaserBox2D";
import { b2DefaultWorldDef } from "../box2d/PhaserBox2D";
import { PhaserDebugDraw } from "../box2d/PhaserDebugDraw";
import { b2CreateBody } from "../box2d/PhaserBox2D";
import { b2DefaultBodyDef } from "../box2d/PhaserBox2D";
import { pxmVec2 } from "../box2d/PhaserBox2D";
import { AddSpriteToWorld } from "../box2d/PhaserBox2D";
import { b2CreatePolygonShape } from "../box2d/PhaserBox2D";
import { b2DefaultShapeDef } from "../box2d/PhaserBox2D";
import { pxm } from "../box2d/PhaserBox2D";
import { b2MakeBox } from "../box2d/PhaserBox2D";
import { RotFromRad } from "../box2d/PhaserBox2D";
import MainShip from "./Prefabs/MainShip";
import { WorldStep } from "../box2d/PhaserBox2D";
import { UpdateWorldSprites } from "../box2d/PhaserBox2D";
import { b2World_Draw } from "../box2d/PhaserBox2D";
import { b2WorldId } from "../box2d/PhaserBox2D";
/* START-USER-IMPORTS */
import * as Phaser from "phaser";
import { b2BodyId } from "../box2d/PhaserBox2D";
import * as PhaserBox2D from "../box2d/PhaserBox2D";
import Bullet from "./Prefabs/Bullet";
import Enemy1 from "./Prefabs/Enemy1";
import MainShipUser from "./Prefabs/MainShip";
import LevelMusic from "../audio/LevelMusic";
import MusicGridPulse from "../audio/MusicGridPulse";
import Enemy1Spawner from "../enemies/Enemy1Spawner";
import DifficultyManager from "../game/DifficultyManager";
/* END-USER-IMPORTS */

export default class Level extends Phaser.Scene {

	constructor() {
		super("Level");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	editorCreate(): void {
		// Box2D world creation
		SetWorldScale(40);
		const world = CreateWorld({ worldDef: { 
			...b2DefaultWorldDef()
		}});
		this.worldId = world.worldId;

		// gameBg
		const gameBg = this.add.image(0, 0, "bgGalaxy");
		gameBg.scaleX = 1.1;
		gameBg.scaleY = 1.1;
		gameBg.setOrigin(0, 0);

		// pared1
		const pared1 = this.add.rectangle(681, 776, 128, 128);
		pared1.scaleX = 15.333759102205278;
		pared1.alpha = 0;
		pared1.isFilled = true;

		// body_2
		const body_2 = b2CreateBody(this.worldId, { 
			...b2DefaultBodyDef(), 
			position: pxmVec2(681, -776)
		});

		// add body_2 to pared1
		AddSpriteToWorld(this.worldId, pared1, { bodyId: body_2 });

		// pisoShape
		const pisoShape = b2CreatePolygonShape(body_2, { 
			...b2DefaultShapeDef(), 
			friction: 0.8
		}, b2MakeBox(pxm(981.3605825411378), pxm(64)));

		// pared2
		const pared2 = this.add.rectangle(-56, 395, 128, 128);
		pared2.scaleX = 15.333759102205278;
		pared2.angle = 90;
		pared2.alpha = 0;
		pared2.isFilled = true;

		// body_3
		const body_3 = b2CreateBody(this.worldId, { 
			...b2DefaultBodyDef(), 
			position: pxmVec2(-56, -395), 
			rotation: RotFromRad(Phaser.Math.DegToRad(90))
		});

		// add body_3 to pared2
		AddSpriteToWorld(this.worldId, pared2, { bodyId: body_3 });

		// pisoShape_1
		const pisoShape_1 = b2CreatePolygonShape(body_3, { 
			...b2DefaultShapeDef(), 
			friction: 0.8
		}, b2MakeBox(pxm(981.3605825411378), pxm(64)));

		// pared3
		const pared3 = this.add.rectangle(681, -60, 128, 128);
		pared3.scaleX = 15.333759102205278;
		pared3.alpha = 0;
		pared3.isFilled = true;

		// body_4
		const body_4 = b2CreateBody(this.worldId, { 
			...b2DefaultBodyDef(), 
			position: pxmVec2(681, 60)
		});

		// add body_4 to pared3
		AddSpriteToWorld(this.worldId, pared3, { bodyId: body_4 });

		// pisoShape_2
		const pisoShape_2 = b2CreatePolygonShape(body_4, { 
			...b2DefaultShapeDef(), 
			friction: 0.8
		}, b2MakeBox(pxm(981.3605825411378), pxm(64)));

		// pared4
		const pared4 = this.add.rectangle(1335, 395, 128, 128);
		pared4.scaleX = 15.333759102205278;
		pared4.angle = 90;
		pared4.alpha = 0;
		pared4.isFilled = true;

		// body_5
		const body_5 = b2CreateBody(this.worldId, { 
			...b2DefaultBodyDef(), 
			position: pxmVec2(1335, -395), 
			rotation: RotFromRad(Phaser.Math.DegToRad(90))
		});

		// add body_5 to pared4
		AddSpriteToWorld(this.worldId, pared4, { bodyId: body_5 });

		// pisoShape_3
		const pisoShape_3 = b2CreatePolygonShape(body_5, { 
			...b2DefaultShapeDef(), 
			friction: 0.8
		}, b2MakeBox(pxm(981.3605825411378), pxm(64)));

		// grid
		const grid = this.add.image(640, 360, "grid");

		// asteroidsBg
		const asteroidsBg = this.add.image(640, 360, "AsteroidsBg");
		asteroidsBg.scaleX = 1.1;
		asteroidsBg.scaleY = 1.1;

		// asteroidsFore
		const asteroidsFore = this.add.image(640, 360, "AsteroidsFore");
		asteroidsFore.scaleX = 1.1;
		asteroidsFore.scaleY = 1.1;

		// mainShip
		const mainShip = new MainShip(this, 640, 360);
		this.add.existing(mainShip);

		// ScoreText
		const scoreText = this.add.text(131, 83, "", {});
		scoreText.setOrigin(0.5, 0.5);
		scoreText.text = "000000000";
		scoreText.setStyle({ "color": "#6CEE57", "fontFamily": "Orbitron", "fontSize": "22pt", "shadow.offsetX": 3, "shadow.offsetY": 3, "shadow.stroke": true });

		// ScoreText_1
		const scoreText_1 = this.add.text(130, 42, "", {});
		scoreText_1.setOrigin(0.5, 0.5);
		scoreText_1.text = "score";
		scoreText_1.setStyle({ "align": "center", "color": "#6CEE57", "fontFamily": "Orbitron", "fontSize": "21pt", "shadow.offsetX": 3, "shadow.offsetY": 3, "shadow.stroke": true });

		// multiplierText
		const multiplierText = this.add.text(388, 65, "", {});
		multiplierText.text = "0";
		multiplierText.setStyle({ "color": "#6CEE57", "fontFamily": "Orbitron", "fontSize": "22pt", "shadow.offsetX": 3, "shadow.offsetY": 3, "shadow.stroke": true });

		// multiplierX
		const multiplierX = this.add.text(361, 65, "", {});
		multiplierX.text = "x";
		multiplierX.setStyle({ "color": "#6CEE57", "fontFamily": "Orbitron", "fontSize": "22pt", "shadow.offsetX": 3, "shadow.offsetY": 3, "shadow.stroke": true });

		// TimeText
		const timeText = this.add.text(622, 43, "", {});
		timeText.setOrigin(0.5, 0);
		timeText.text = "00:00";
		timeText.setStyle({ "color": "#6CEE57", "fontFamily": "Orbitron", "fontSize": "51pt", "shadow.offsetX": 3, "shadow.offsetY": 3, "shadow.stroke": true });

		// lifeHeart1
		const lifeHeart1 = this.add.image(849, 87, "LifeHeart");

		// lifeHeart2
		const lifeHeart2 = this.add.image(887, 87, "LifeHeart");

		// lifeHeart3
		const lifeHeart3 = this.add.image(925, 87, "LifeHeart");

		// BestTitle
		const bestTitle = this.add.text(1126, 42, "", {});
		bestTitle.setOrigin(0.5, 0.5);
		bestTitle.text = "best";
		bestTitle.setStyle({ "align": "center", "color": "#6CEE57", "fontFamily": "Orbitron", "fontSize": "21pt", "shadow.offsetX": 3, "shadow.offsetY": 3, "shadow.stroke": true });

		// BestText
		const bestText = this.add.text(1129, 65, "", {});
		bestText.setOrigin(0.5, 0);
		bestText.text = "000000000";
		bestText.setStyle({ "color": "#6CEE57", "fontFamily": "Orbitron", "fontSize": "22pt", "shadow.offsetX": 3, "shadow.offsetY": 3, "shadow.stroke": true });

		// Box2D debug graphics
		this.debugGraphics = this.add.graphics();
		this.debugDraw = new PhaserDebugDraw(this.debugGraphics, this.game.scale.width, this.game.scale.height, 40);

		this.gameBg = gameBg;
		this.body_2 = body_2;
		this.pared1 = pared1;
		this.body_3 = body_3;
		this.pared2 = pared2;
		this.body_4 = body_4;
		this.pared3 = pared3;
		this.body_5 = body_5;
		this.pared4 = pared4;
		this.grid = grid;
		this.asteroidsBg = asteroidsBg;
		this.asteroidsFore = asteroidsFore;
		this.mainShip = mainShip;
		this.scoreText = scoreText;
		this.scoreText_1 = scoreText_1;
		this.multiplierText = multiplierText;
		this.multiplierX = multiplierX;
		this.timeText = timeText;
		this.lifeHeart1 = lifeHeart1;
		this.lifeHeart2 = lifeHeart2;
		this.lifeHeart3 = lifeHeart3;
		this.bestTitle = bestTitle;
		this.bestText = bestText;

		this.events.emit("scene-awake");
	}

	update(time: number, delta: number) {

		WorldStep({ worldId: this.worldId, deltaTime: delta });
		UpdateWorldSprites(this.worldId);
		this.debugGraphics.clear();
		b2World_Draw(this.worldId, this.debugDraw);
	}

	private gameBg!: Phaser.GameObjects.Image;
	private body_2!: b2BodyId;
	private pared1!: Phaser.GameObjects.Rectangle;
	private body_3!: b2BodyId;
	private pared2!: Phaser.GameObjects.Rectangle;
	private body_4!: b2BodyId;
	private pared3!: Phaser.GameObjects.Rectangle;
	private body_5!: b2BodyId;
	private pared4!: Phaser.GameObjects.Rectangle;
	private grid!: Phaser.GameObjects.Image;
	private asteroidsBg!: Phaser.GameObjects.Image;
	private asteroidsFore!: Phaser.GameObjects.Image;
	public mainShip!: MainShip;
	public scoreText!: Phaser.GameObjects.Text;
	public scoreText_1!: Phaser.GameObjects.Text;
	public multiplierText!: Phaser.GameObjects.Text;
	public multiplierX!: Phaser.GameObjects.Text;
	public timeText!: Phaser.GameObjects.Text;
	public lifeHeart1!: Phaser.GameObjects.Image;
	public lifeHeart2!: Phaser.GameObjects.Image;
	public lifeHeart3!: Phaser.GameObjects.Image;
	public bestTitle!: Phaser.GameObjects.Text;
	public bestText!: Phaser.GameObjects.Text;
	public worldId!: b2WorldId;
	public debugGraphics!: Phaser.GameObjects.Graphics;

	/* START-USER-CODE */
	// Kept here so Phaser Editor recompiles don't drop this field
	public debugDraw!: PhaserDebugDraw;

	/**
	 * Debug de colisiones Box2D.
	 * true  = mostrar outlines de física
	 * false = ocultarlos
	 */
	public showPhysicsDebug = false;

	/** Max parallax shift in pixels when the player is at the edge of the screen. */
	private readonly parallaxMaxOffset = 28;

	/**
	 * Depth factors (0 = no movement, 1 = full max offset).
	 * Far layers move less; near layers move more.
	 */
	private readonly parallaxFactors = {
		gameBg: 0.22,
		asteroidsBg: 0.48,
		asteroidsFore: 0.82,
	};

	/** Smoothing 0..1 applied each frame (higher = snappier). */
	private readonly parallaxLerp = 0.12;

	private parallaxLayers: Array<{
		image: Phaser.GameObjects.Image;
		baseX: number;
		baseY: number;
		factor: number;
	}> = [];

	/** intro → mid (loop) → outro on death/clear */
	private levelMusic?: LevelMusic;
	/** Grid scale reacts to music beats / energy */
	private musicGridPulse?: MusicGridPulse;
	/** Waves of Enemy1 from off-screen edges */
	private enemy1Spawner?: Enemy1Spawner;
	/** Survival / progress difficulty scaling */
	private difficulty?: DifficultyManager;

	/** Temporary mode: respawn ship after death (other modalities later). */
	private readonly mainShipRespawnDelayMs = 3000;
	private readonly mainShipSpawnX = 640;
	private readonly mainShipSpawnY = 360;
	private mainShipRespawnTimer?: Phaser.Time.TimerEvent;
	private score = 0;
	private displayedScore = 0;
	private scoreCountTween?: Phaser.Tweens.Tween;
	private scorePulseTween?: Phaser.Tweens.Tween;
	private readonly maxLives = 3;
	private readonly gameOverRestartDelayMs = 1200;
	private remainingLives = this.maxLives;
	private lifeHearts: Phaser.GameObjects.Image[] = [];
	private gameOverText?: Phaser.GameObjects.Text;
	private pauseText?: Phaser.GameObjects.Text;
	private isGameOver = false;
	private canRestartFromGameOver = false;
	private isRestartingFromGameOver = false;
	private wasBlurPaused = false;
	private restartEnterKey?: Phaser.Input.Keyboard.Key;
	private gameOverRestartDelayTimer?: Phaser.Time.TimerEvent;

	create() {

		this.editorCreate();
		this.resetRuntimeState();

		// Bullets enable pre-solve events; continuous CCD always calls this and
		// crashes if it is null ("world.preSolveFcn is not a function").
		const box2d = PhaserBox2D as typeof PhaserBox2D & {
			b2World_SetPreSolveCallback(
				worldId: b2WorldId,
				fcn: ((shapeIdA: unknown, shapeIdB: unknown, manifold: unknown, context: unknown) => boolean) | null,
				context: unknown
			): void;
		};

		box2d.b2World_SetPreSolveCallback(this.worldId, (shapeIdA, shapeIdB) => {
			return Bullet.onPreSolve(shapeIdA, shapeIdB);
		}, null);

		if (!this.showPhysicsDebug && this.debugGraphics) {
			this.debugGraphics.setVisible(false);
		}

		this.setupParallaxLayers();
		this.setupLivesHud();
		this.setupPauseText();
		this.setupGameOverText();
		this.setupLevelMusic();
		// Shine + music pulse (horizontal band driven by audio)
		this.setupMusicGridPulse();
		this.refreshScoreText();
		this.refreshMultiplierText(1);
		this.setupDifficulty();
		this.setupEnemySpawner();
		this.setupMainShipRespawn();
		this.setupScoreTracking();
		this.setupGameOverRestartControls();
		this.setupBlurPauseHandling();
		this.events.on(Phaser.Scenes.Events.POST_UPDATE, this.onPostUpdateEffects, this);
		this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
			this.events.off(Phaser.Scenes.Events.POST_UPDATE, this.onPostUpdateEffects, this);
			this.events.off(MainShipUser.DIED_EVENT, this.onMainShipDied, this);
			this.events.off(MainShipUser.ENERGY_CHANGED_EVENT, this.onMainShipEnergyChanged, this);
			this.events.off(Enemy1.DIED_EVENT, this.onEnemy1Died, this);
			window.removeEventListener("blur", this.handleWindowBlur);
			window.removeEventListener("focus", this.handleWindowFocus);
			document.removeEventListener("visibilitychange", this.handleVisibilityChange);
			this.input.off(Phaser.Input.Events.POINTER_UP, this.handleGameOverPointerUp, this);
			this.restartEnterKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.handleGameOverEnterDown, this);
			this.restartEnterKey?.destroy();
			this.restartEnterKey = undefined;
			this.gameOverRestartDelayTimer?.remove(false);
			this.gameOverRestartDelayTimer = undefined;
			this.mainShipRespawnTimer?.remove(false);
			this.mainShipRespawnTimer = undefined;
			this.enemy1Spawner?.destroy();
			this.enemy1Spawner = undefined;
			this.difficulty = undefined;
			this.musicGridPulse?.destroy();
			this.musicGridPulse = undefined;
			this.levelMusic?.destroy();
			this.levelMusic = undefined;
		});
	}

	private resetRuntimeState() {
		this.isGameOver = false;
		this.canRestartFromGameOver = false;
		this.isRestartingFromGameOver = false;
		this.wasBlurPaused = false;
		this.gameOverRestartDelayTimer?.remove(false);
		this.gameOverRestartDelayTimer = undefined;
		this.score = 0;
		this.displayedScore = 0;
		this.scoreCountTween?.stop();
		this.scoreCountTween = undefined;
		this.scorePulseTween?.stop();
		this.scorePulseTween = undefined;
		this.remainingLives = this.maxLives;
	}

	private setupDifficulty() {
		this.difficulty = new DifficultyManager();
	}

	/**
	 * Temporary death mode: wait a few seconds, then respawn MainShip at center.
	 * Hook for future modes (game over, lives, etc.).
	 */
	private setupMainShipRespawn() {
		this.events.on(MainShipUser.DIED_EVENT, this.onMainShipDied, this);
	}

	private setupScoreTracking() {
		this.events.on(MainShipUser.ENERGY_CHANGED_EVENT, this.onMainShipEnergyChanged, this);
		this.events.on(Enemy1.DIED_EVENT, this.onEnemy1Died, this);
	}

	private setupLivesHud() {
		this.remainingLives = this.maxLives;
		this.lifeHearts = [this.lifeHeart1, this.lifeHeart2, this.lifeHeart3].filter(Boolean);
		this.refreshLivesHud();
	}

	private setupGameOverText() {
		this.gameOverText?.destroy();
		this.gameOverText = this.add.text(this.scale.width * 0.5, this.scale.height * 0.5, "GAME OVER", {
			color: "#6CEE57",
			fontFamily: "Orbitron",
			fontSize: "54pt",
			shadow: {
				offsetX: 4,
				offsetY: 4,
				stroke: true,
			},
		});
		this.gameOverText.setOrigin(0.5, 0.5);
		this.gameOverText.setDepth(2000);
		this.gameOverText.setVisible(false);
	}

	private setupPauseText() {
		this.pauseText?.destroy();
		this.pauseText = this.add.text(this.scale.width * 0.5, this.scale.height * 0.5, "PAUSED", {
			color: "#6CEE57",
			fontFamily: "Orbitron",
			fontSize: "36pt",
			shadow: {
				offsetX: 4,
				offsetY: 4,
				stroke: true,
			},
		});
		this.pauseText.setOrigin(0.5, 0.5);
		this.pauseText.setDepth(1990);
		this.pauseText.setVisible(false);
	}

	private setupBlurPauseHandling() {
		window.removeEventListener("blur", this.handleWindowBlur);
		window.removeEventListener("focus", this.handleWindowFocus);
		document.removeEventListener("visibilitychange", this.handleVisibilityChange);

		window.addEventListener("blur", this.handleWindowBlur);
		window.addEventListener("focus", this.handleWindowFocus);
		document.addEventListener("visibilitychange", this.handleVisibilityChange);

		if (document.hidden) {
			this.pauseFromBlur();
		}
	}

	private readonly handleWindowBlur = () => {
		this.pauseFromBlur();
	};

	private readonly handleWindowFocus = () => {
		this.resumeFromBlur();
	};

	private readonly handleVisibilityChange = () => {
		if (document.hidden) {
			this.pauseFromBlur();
			return;
		}

		this.resumeFromBlur();
	};

	private pauseFromBlur() {
		if (this.isGameOver || this.wasBlurPaused || !this.scene.isActive()) {
			return;
		}

		this.wasBlurPaused = true;
		this.pauseText?.setVisible(true);
		this.sound.pauseAll();
		this.scene.pause();
	}

	private resumeFromBlur() {
		if (!this.wasBlurPaused) {
			return;
		}

		this.wasBlurPaused = false;
		if (this.scene.isPaused()) {
			this.scene.resume();
		}
		this.pauseText?.setVisible(false);
		this.sound.resumeAll();
	}

	private setupGameOverRestartControls() {
		this.input.off(Phaser.Input.Events.POINTER_UP, this.handleGameOverPointerUp, this);
		this.input.on(Phaser.Input.Events.POINTER_UP, this.handleGameOverPointerUp, this);

		this.restartEnterKey?.off(Phaser.Input.Keyboard.Events.DOWN, this.handleGameOverEnterDown, this);
		this.restartEnterKey?.destroy();
		this.restartEnterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
		this.restartEnterKey?.on(Phaser.Input.Keyboard.Events.DOWN, this.handleGameOverEnterDown, this);
	}

	private handleGameOverPointerUp() {
		this.restartIfGameOver();
	}

	private handleGameOverEnterDown() {
		this.restartIfGameOver();
	}

	private restartIfGameOver() {
		if (!this.isGameOver || !this.canRestartFromGameOver || this.isRestartingFromGameOver || !this.sys.isActive()) {
			return;
		}

		this.isGameOver = false;
		this.isRestartingFromGameOver = true;
		this.time.delayedCall(0, () => {
			if (this.sys.isActive()) {
				this.scene.restart();
			}
		});
	}

	private refreshLivesHud() {
		for (let index = 0; index < this.lifeHearts.length; index++) {
			const heart = this.lifeHearts[index];
			if (!heart) {
				continue;
			}

			heart.setAlpha(index < this.remainingLives ? 1 : 0.22);
			if (index >= this.remainingLives) {
				heart.setTint(0x6cee57);
			} else {
				heart.clearTint();
			}
		}
	}

	private onMainShipDied(_payload?: { x: number; y: number }) {
		// Ease difficulty a bit; total progress still grows
		this.difficulty?.onShipDied();
		this.refreshMultiplierText(1);

		// Clear stale reference (instance is destroyed)
		(this as { mainShip?: MainShip }).mainShip = undefined;
		this.remainingLives = Math.max(0, this.remainingLives - 1);
		this.refreshLivesHud();

		if (this.remainingLives <= 0) {
			this.triggerGameOver();
			return;
		}

		this.mainShipRespawnTimer?.remove(false);
		this.mainShipRespawnTimer = this.time.delayedCall(this.mainShipRespawnDelayMs, () => {
			this.mainShipRespawnTimer = undefined;
			if (!this.sys.isActive()) {
				return;
			}
			// Already have a living ship (safety)
			if (this.mainShip?.active && !this.mainShip.hasDied) {
				return;
			}
			this.respawnMainShip();
		});
	}

	/** Spawn a fresh MainShip with appear intro at the default spawn point. */
	private respawnMainShip() {
		this.difficulty?.onShipRespawned();
		const ship = new MainShipUser(this, this.mainShipSpawnX, this.mainShipSpawnY);
		this.add.existing(ship);
		this.mainShip = ship as MainShip;
		this.refreshMultiplierText(this.mainShip.scoreMultiplier);
	}

	private triggerGameOver() {
		if (this.isGameOver) {
			return;
		}

		this.isGameOver = true;
		this.canRestartFromGameOver = false;
		this.gameOverRestartDelayTimer?.remove(false);
		this.gameOverRestartDelayTimer = undefined;
		this.mainShipRespawnTimer?.remove(false);
		this.mainShipRespawnTimer = undefined;
		this.enemy1Spawner?.destroy();
		this.enemy1Spawner = undefined;
		this.playLevelOutro();
		if (!this.gameOverText) {
			return;
		}

		this.gameOverText.setAlpha(0);
		this.gameOverText.setScale(0.8);
		this.gameOverText.setVisible(true);
		this.tweens.add({
			targets: this.gameOverText,
			alpha: 1,
			scaleX: 1,
			scaleY: 1,
			duration: 320,
			ease: "Back.easeOut",
		});

		this.gameOverRestartDelayTimer = this.time.delayedCall(this.gameOverRestartDelayMs, () => {
			this.gameOverRestartDelayTimer = undefined;
			if (!this.sys.isActive() || !this.isGameOver) {
				return;
			}

			this.canRestartFromGameOver = true;
		});
	}

	private onEnemy1Died(payload?: { baseScore?: number }) {
		const baseScore = payload?.baseScore ?? 10;
		this.addScore(baseScore);
	}

	private onMainShipEnergyChanged(payload?: { scoreMultiplier?: number }) {
		this.refreshMultiplierText(payload?.scoreMultiplier ?? this.mainShip?.scoreMultiplier ?? 1);
	}

	private addScore(baseScore: number) {
		if (!Number.isFinite(baseScore) || baseScore <= 0) {
			return;
		}

		const multiplier = this.mainShip?.scoreMultiplier ?? 1;
		this.score += Math.round(baseScore * multiplier);
		this.refreshScoreText();
	}

	private refreshScoreText() {
		const targetScore = Math.max(0, Math.floor(this.score));

		if (!this.scoreText?.active) {
			this.displayedScore = targetScore;
			return;
		}

		if (targetScore === this.displayedScore) {
			this.applyScoreTextValue(targetScore);
			return;
		}

		this.scoreCountTween?.stop();
		this.scorePulseTween?.stop();

		this.scorePulseTween = this.tweens.add({
			targets: [this.scoreText].filter(Boolean),
			scaleX: 1.08,
			scaleY: 1.08,
			duration: 90,
			ease: "Quad.easeOut",
			yoyo: true,
		});

		this.scoreCountTween = this.tweens.addCounter({
			from: this.displayedScore,
			to: targetScore,
			duration: 180,
			ease: "Cubic.easeOut",
			onUpdate: (tween) => {
				const tweenValue = tween.getValue();
				const value = Math.round(tweenValue ?? targetScore);
				this.applyScoreTextValue(value);
			},
			onComplete: () => {
				this.applyScoreTextValue(targetScore);
				this.scoreCountTween = undefined;
			},
		});
	}

	private applyScoreTextValue(value: number) {
		this.displayedScore = Math.max(0, Math.floor(value));
		const formatted = this.displayedScore.toString().padStart(9, "0");
		this.scoreText?.setText(formatted);
	}

	private refreshMultiplierText(multiplier: number) {
		const safeMultiplier = Math.max(1, Math.floor(multiplier));
		const formatted = safeMultiplier.toString();
		this.multiplierText?.setText(formatted);
	}

	/** Enemy waves driven by live difficulty params. */
	private setupEnemySpawner() {
		this.enemy1Spawner = new Enemy1Spawner(this, {
			firstWaveDelayMs: 2000,
			margin: 80,
			getParams: () =>
				this.difficulty?.getSpawnParams() ?? {
					minGroup: 8,
					maxGroup: 14,
					waveIntervalMs: 7000,
					staggerMs: 90,
					enemyMoveSpeed: 90,
				},
		});
		this.enemy1Spawner.start();
	}

	/**
	 * Music flow: intro once, then mid loops.
	 * Call playLevelOutro() later on death / level complete.
	 */
	private setupLevelMusic() {
		this.levelMusic = new LevelMusic(this);
		this.levelMusic.start();
	}

	/**
	 * Horizontal shine band (travels up/down) + music-reactive scale.
	 * Shine motion is driven by MusicGridPulse from the analyser.
	 */
	private setupMusicGridPulse() {
		if (!this.grid) {
			return;
		}

		// direction = π/2 → band is horizontal, travels top ↔ bottom
		const shineRadius = 0.22;
		const shineScale = 2;
		const gradientRadius = shineRadius / shineScale;

		const [shine] = Phaser.Actions.AddEffectShine(this.grid, {
			radius: shineRadius,
			// Vertical travel = horizontal light band
			direction: Math.PI / 2,
			scale: shineScale,
			colorFactor: [1.5, 2.0, 2.6, 1],
			// Tween is paused immediately; music drives the offset
			duration: 4000,
			yoyo: true,
			ease: "Linear",
			repeatDelay: 0,
		});

		this.musicGridPulse = new MusicGridPulse(this, this.grid, {
			gradient: shine.gradient as Phaser.GameObjects.Gradient & { offset?: number },
			dynamicTexture: shine.dynamicTexture,
			tween: shine.tween,
			gradientRadius,
		});
	}

	/** Public hook for death / level end. */
	playLevelOutro() {
		this.levelMusic?.playOutro();
	}

	private onPostUpdateEffects(time: number, delta: number) {
		const d = delta ?? this.game.loop.delta;
		this.difficulty?.update(d);
		this.updateParallax();
		// Scene POST_UPDATE always passes (time, delta)
		this.musicGridPulse?.update(time, d);
	}

	private setupParallaxLayers() {
		// Uses CLASS-scoped images from the editor (gameBg, asteroidsBg, asteroidsFore).
		this.parallaxLayers = [
			{
				image: this.gameBg,
				baseX: this.gameBg.x,
				baseY: this.gameBg.y,
				factor: this.parallaxFactors.gameBg,
			},
			{
				image: this.asteroidsBg,
				baseX: this.asteroidsBg.x,
				baseY: this.asteroidsBg.y,
				factor: this.parallaxFactors.asteroidsBg,
			},
			{
				image: this.asteroidsFore,
				baseX: this.asteroidsFore.x,
				baseY: this.asteroidsFore.y,
				factor: this.parallaxFactors.asteroidsFore,
			},
		];
	}

	/**
	 * Static camera: shift layers opposite to the player's offset from screen center.
	 * Far = small factor, near = larger factor → simple depth parallax.
	 */
	private updateParallax() {
		if (!this.mainShip || this.parallaxLayers.length === 0) {
			return;
		}

		const halfW = this.scale.width * 0.5;
		const halfH = this.scale.height * 0.5;
		// Normalize player position to roughly -1..1 around the screen center.
		const nx = Phaser.Math.Clamp((this.mainShip.x - halfW) / halfW, -1, 1);
		const ny = Phaser.Math.Clamp((this.mainShip.y - halfH) / halfH, -1, 1);

		for (const layer of this.parallaxLayers) {
			const amount = this.parallaxMaxOffset * layer.factor;
			// Opposite direction → layers lag behind the ship (depth feel).
			const targetX = layer.baseX - nx * amount;
			const targetY = layer.baseY - ny * amount;
			layer.image.x = Phaser.Math.Linear(layer.image.x, targetX, this.parallaxLerp);
			layer.image.y = Phaser.Math.Linear(layer.image.y, targetY, this.parallaxLerp);
		}
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
