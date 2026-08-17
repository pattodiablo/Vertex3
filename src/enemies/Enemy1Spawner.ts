import * as Phaser from "phaser";
import Enemy1 from "../scenes/Prefabs/Enemy1";
import Enemy2 from "../scenes/Prefabs/Enemy2";
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
	private readonly scene: Phaser.Scene;
	private readonly firstWaveDelayMs: number;
	private readonly margin: number;
	private readonly edgeSpread: number;
	private readonly getParams: () => DifficultySpawnParams;
	private readonly maxLivingEnemies = 10;
	private readonly enemy2Chance = 0.25;

	private waveTimer?: Phaser.Time.TimerEvent;
	private destroyed = false;

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
		if (Phaser.Math.FloatBetween(0, 1) > this.enemy2Chance) {
			const enemy = new Enemy1(this.scene, x, y);
			enemy.setMoveSpeed(moveSpeed);
			enemy.setDepth(8);
			this.scene.add.existing(enemy);
			return;
		}

		this.spawnEnemy2Pack(x, y, moveSpeed);
	}

	private spawnEnemy2Pack(x: number, y: number, moveSpeed: number) {
		const ship = (this.scene as Phaser.Scene & { mainShip?: { x: number; y: number } }).mainShip;
		const offsets = [-72, 0, 72];
		const sceneHeight = this.scene.scale.height || 720;
		const margin = this.margin;
		const centerY = Phaser.Math.Clamp(
			(ship?.y ?? y) + Phaser.Math.Between(-120, 120),
			margin + 40,
			sceneHeight - margin - 40
		);
		for (const offset of offsets) {
			const enemy = new Enemy2(this.scene, x, centerY + offset);
			enemy.setMoveSpeed(moveSpeed);
			enemy.setDepth(8);
			this.scene.add.existing(enemy);
		}
	}

	private randomEdge(): Edge {
		const edges: Edge[] = ["top", "bottom", "left", "right"];
		return edges[Phaser.Math.Between(0, edges.length - 1)];
	}

	private pointsAlongEdge(edge: Edge, count: number): Array<{ x: number; y: number }> {
		const w = this.scene.scale.width || 1280;
		const h = this.scene.scale.height || 720;
		const m = this.margin;
		const points: Array<{ x: number; y: number }> = [];
		const centerT = Phaser.Math.FloatBetween(0.15, 0.85);

		for (let i = 0; i < count; i++) {
			const t =
				count === 1
					? centerT
					: centerT + ((i / (count - 1)) - 0.5) * (this.edgeSpread / Math.max(w, h));
			const along = Phaser.Math.Clamp(t, 0.05, 0.95);
			const jitter = Phaser.Math.Between(-24, 24);
			const out = m + Phaser.Math.Between(0, 50);

			switch (edge) {
				case "top":
					points.push({ x: along * w + jitter, y: -out });
					break;
				case "bottom":
					points.push({ x: along * w + jitter, y: h + out });
					break;
				case "left":
					points.push({ x: -out, y: along * h + jitter });
					break;
				case "right":
					points.push({ x: w + out, y: along * h + jitter });
					break;
			}
		}

		return points;
	}
}
