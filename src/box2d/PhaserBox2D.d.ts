/** Type declarations for Phaser Box2D (ESM build used by Phaser Editor). */

export declare class b2WorldId {
	index1: number;
	revision: number;
	constructor(index1?: number, revision?: number);
}

export declare class b2BodyId {
	index1: number;
	world0: number;
	revision: number;
}

export declare class b2ShapeId {
	index1: number;
	world0: number;
	revision: number;
}

export declare class b2Vec2 {
	x: number;
	y: number;
	constructor(x?: number, y?: number);
}

export declare class b2Rot {
	c: number;
	s: number;
	constructor(c?: number, s?: number);
}

export declare enum b2BodyType {
	b2_staticBody = 0,
	b2_kinematicBody = 1,
	b2_dynamicBody = 2,
}

export declare const STATIC: 0;
export declare const KINEMATIC: 1;
export declare const DYNAMIC: 2;

export declare function b2DefaultWorldDef(): Record<string, unknown>;
export declare function b2DefaultBodyDef(): Record<string, unknown>;
export declare function b2DefaultShapeDef(): Record<string, unknown>;

export declare function SetWorldScale(scale: number): void;
export declare function GetWorldScale(): number;
export declare function mpx(meters: number): number;
export declare function pxm(pixels: number): number;
export declare function pxmVec2(x: number, y: number): b2Vec2;
/** Converts radians to a b2Rot (Y-axis flipped for Phaser coordinates). */
export declare function RotFromRad(radians: number): b2Rot;

export declare function CreateWorld(data: {
	worldDef?: Record<string, unknown>;
}): { worldId: b2WorldId };

export declare function WorldStep(data: {
	worldId: b2WorldId;
	deltaTime: number;
	fixedTimeStep?: number;
	subStepCount?: number;
}): number;

export declare function UpdateWorldSprites(worldId: b2WorldId): void;
export declare function AddSpriteToWorld(worldId: b2WorldId, sprite: unknown, body: { bodyId: b2BodyId }): void;
export declare function RemoveSpriteFromWorld(worldId: b2WorldId, sprite: unknown, destroyBody?: boolean): void;
export declare function ClearWorldSprites(worldId: b2WorldId): void;

export declare function SpriteToBox(
	worldId: b2WorldId,
	sprite: unknown,
	data?: Record<string, unknown>
): { bodyId: b2BodyId };

export declare function SpriteToCircle(
	worldId: b2WorldId,
	sprite: unknown,
	data?: Record<string, unknown>
): { bodyId: b2BodyId };

export declare function CreateBoxPolygon(data: Record<string, unknown>): { bodyId: b2BodyId; shapeId: b2ShapeId };
export declare function CreateCircle(data: Record<string, unknown>): { bodyId: b2BodyId; shapeId: b2ShapeId };

export declare function b2CreateWorld(def: Record<string, unknown>): b2WorldId;
export declare function b2CreateWorldArray(): void;
export declare function b2DestroyWorld(worldId: b2WorldId): void;
export declare function b2World_Step(worldId: b2WorldId, timeStep: number, subStepCount: number): void;
export declare function b2World_Draw(worldId: b2WorldId, draw: unknown): void;
export declare function b2World_SetGravity(worldId: b2WorldId, gravity: b2Vec2): void;

export declare function b2CreateBody(worldId: b2WorldId, def: Record<string, unknown>): b2BodyId;
export declare function b2DestroyBody(bodyId: b2BodyId): void;
export declare function b2CreatePolygonShape(bodyId: b2BodyId, def: Record<string, unknown>, polygon: unknown): b2ShapeId;
export declare function b2CreateCircleShape(bodyId: b2BodyId, def: Record<string, unknown>, circle: unknown): b2ShapeId;
export declare function b2MakeBox(hx: number, hy: number): unknown;
export declare function b2MakePolygon(hull: unknown, radius: number, forceCheck?: boolean): unknown;
export declare function b2ComputeHull(points: b2Vec2[], count: number): { count: number; points: b2Vec2[] };
export declare function b2DefaultFilter(): Record<string, unknown>;
