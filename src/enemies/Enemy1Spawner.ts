import * as Phaser from "phaser";
import Enemy1 from "../scenes/Prefabs/Enemy1";
import Enemy2 from "../scenes/Prefabs/Enemy2";
import Enemy3 from "../scenes/Prefabs/Enemy3";
import Enemy4 from "../scenes/Prefabs/Enemy4";
import Enemy5 from "../scenes/Prefabs/Enemy5";
import Enemy6 from "../scenes/Prefabs/Enemy6";
import Enemy7 from "../scenes/Prefabs/Enemy7";
import Enemy8 from "../scenes/Prefabs/Enemy8";
import EnemyBase from "../scenes/Prefabs/EnemyBase";
import Explode2 from "../scenes/Prefabs/Explode2";
import type { DifficultySpawnParams } from "../game/DifficultyManager";

type Edge = "top" | "bottom" | "left" | "right";

export type EnemySpawnerConfig = {
	/** Delay before the first wave (ms). */
	firstWaveDelayMs?: number;
	/** How far outside the screen edge to spawn (px). */
	margin?: number;
	/** Spread along the edge for the group (px). */
	edgeSpread?: number;
	/** Provides live difficulty-driven spawn params each wave. */
	getParams?: () => DifficultySpawnParams;
};

const DEFAULT_PARAMS: DifficultySpawnParams = {
	minGroup: 8,
	maxGroup: 14,
	waveIntervalMs: 7000,
	staggerMs: 90,
	enemyMoveSpeed: 90,
};

/**
 * Spawns enemy groups off-screen. Wave size / timing / enemy speed
 * come from DifficultyManager via getParams().
 */
export default class EnemySpawner {
	private static readonly ENEMY_UNLOCK_WINDOW_MS = 20 * 1000;
	private static readonly ENEMY_TYPES_BY_STAGE = [
		[Enemy1],
		[Enemy1, Enemy2],
		[Enemy1, Enemy2, Enemy3, Enemy4],
		[Enemy1, Enemy2, Enemy3, Enemy4, Enemy5, Enemy6],
		[Enemy1, Enemy2, Enemy3, Enemy4, Enemy5, Enemy6, Enemy7, Enemy8],
	];

	private readonly scene: Phaser.Scene;
	private readonly firstWaveDelayMs: number;
	private readonly margin: number;
	private readonly edgeSpread: number;
	private readonly getParams: () => DifficultySpawnParams;
	private readonly maxLivingEnemies = 24;

	private waveTimer?: Phaser.Time.TimerEvent;
	private destroyed = false;
	private startTimeMs = 0;

	constructor(scene: Phaser.Scene, config: EnemySpawnerConfig = {}) {
		this.scene = scene;
		this.firstWaveDelayMs = config.firstWaveDelayMs ?? 2000;
		this.margin = config.margin ?? 70;
		this.edgeSpread = config.edgeSpread ?? 200;
		this.getParams = config.getParams ?? (() => DEFAULT_PARAMS);
	}

	start() {
		if (this.destroyed) {
			return;
		}

		EnemyBase.warmOpenPortalPool(this.scene, 30);
		Explode2.warmPool(this.scene, 20);
		this.startTimeMs = this.scene.time.now;

		this.scene.time.delayedCall(this.firstWaveDelayMs, () => {
			if (this.destroyed || !this.scene.sys.isActive()) {
				return;
			}
			this.spawnWave();
			this.scheduleNextWave();
		});
	}

	/** Spawn one group using current difficulty params. */
	spawnWave() {
		if (this.destroyed || !this.scene.sys.isActive()) {
			return;
		}

		if (Enemy1.getLivingCount() >= this.maxLivingEnemies) {
			return;
		}

		const params = this.getParams();
		const count = Phaser.Math.Between(params.minGroup, params.maxGroup);
		const edge = this.randomEdge();
		const points = this.pointsAlongEdge(edge, count);
		const stagger = params.staggerMs;
		const speed = params.enemyMoveSpeed;

		points.forEach((p, i) => {
			this.scene.time.delayedCall(i * stagger, () => {
				if (this.destroyed || !this.scene.sys.isActive()) {
					return;
				}
				this.spawnOne(p.x, p.y, speed);
			});
		});
	}

	stop() {
		this.destroyed = true;
		this.waveTimer?.remove(false);
		this.waveTimer = undefined;
	}

	destroy() {
		this.stop();
	}

	/** Re-schedule next wave with *current* interval (difficulty can change). */
	private scheduleNextWave() {
		if (this.destroyed || !this.scene.sys.isActive()) {
			return;
		}

		this.waveTimer?.remove(false);
		const delay = this.getParams().waveIntervalMs;
		this.waveTimer = this.scene.time.delayedCall(delay, () => {
			if (this.destroyed || !this.scene.sys.isActive()) {
				return;
			}
			this.spawnWave();
			this.scheduleNextWave();
		});
	}

	private spawnOne(x: number, y: number, moveSpeed: number) {
		const unlockedTypes = this.getUnlockedEnemyTypes();

		const EnemyClass = unlockedTypes[Phaser.Math.Between(0, unlockedTypes.length - 1)];
		if (EnemyClass === Enemy7) {
			this.spawnEnemy7Pack(x, y, moveSpeed);
			return;
		}

		const enemy = new EnemyClass(this.scene, x, y);
		enemy.setMoveSpeed(EnemyClass === Enemy4 ? Math.max(moveSpeed + 35, 130) : moveSpeed);
		enemy.setDepth(8);
		this.scene.add.existing(enemy);
	}

	private spawnEnemy7Pack(x: number, y: number, moveSpeed: number) {
		const ship = (this.scene as Phaser.Scene & { mainShip?: { x: number; y: number } }).mainShip;
		const offsets = [-70, 0, 70];
		const sceneHeight = this.scene.scale.height || 720;
		const margin = this.margin;
		const centerY = Phaser.Math.Clamp(
			(ship?.y ?? y) + Phaser.Math.Between(-110, 110),
			margin + 40,
			sceneHeight - margin - 40
		);
		for (const offset of offsets) {
			const enemy = new Enemy7(this.scene, x, centerY + offset);
			enemy.setMoveSpeed(moveSpeed);
			enemy.setDepth(8);
			this.scene.add.existing(enemy);
		}
	}

	private getUnlockedEnemyTypes() {
		const elapsedMs = Math.max(0, this.scene.time.now - this.startTimeMs);
		const stageIndex = Math.min(
			EnemySpawner.ENEMY_TYPES_BY_STAGE.length - 1,
			Math.floor(elapsedMs / EnemySpawner.ENEMY_UNLOCK_WINDOW_MS)
		);
		return EnemySpawner.ENEMY_TYPES_BY_STAGE[stageIndex];
	}

	private randomEdge(): Edge {
		const edges: Edge[] = ["top", "bottom", "left", "right"];
		return edges[Phaser.Math.Between(0, edges.length - 1)];
	}

	private pointsAlongEdge(edge: Edge, count: number): Array<{ x: number; y: number }> {
		const w = this.scene.scale.width || 1280;
		const h = this.scene.scale.height || 720;
		const m = this.margin;
		const insetX = Math.max(m, 40);
		const insetY = Math.max(m, 40);
		const points: Array<{ x: number; y: number }> = [];
		const centerT = Phaser.Math.FloatBetween(0.15, 0.85);

		for (let i = 0; i < count; i++) {
			const t =
				count === 1
					? centerT
					: centerT + ((i / (count - 1)) - 0.5) * (this.edgeSpread / Math.max(w, h));
			const along = Phaser.Math.Clamp(t, 0.05, 0.95);
			const jitter = Phaser.Math.Between(-24, 24);
			const x = Phaser.Math.Clamp(along * w + jitter, insetX, w - insetX);
			const y = Phaser.Math.Clamp(along * h + jitter, insetY, h - insetY);

			switch (edge) {
				case "top":
					points.push({ x, y: insetY });
					break;
				case "bottom":
					points.push({ x, y: h - insetY });
					break;
				case "left":
					points.push({ x: insetX, y });
					break;
				case "right":
					points.push({ x: w - insetX, y });
					break;
			}
		}

		return points;
	}
}
