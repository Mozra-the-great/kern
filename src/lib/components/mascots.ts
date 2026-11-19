/*
 * Pixel-art runtime (#55): the stuffcloud mascot cast, the integer-scale rules and the idle
 * motion constants of stuffcloud's ADR 0008 ("Pixel-art animation runtime"). The art itself is
 * shipped as plain files under `assets/stuffcloud/`; `STUFFCLOUD_ART` lists every file with its
 * pixel grid. Nothing here touches `window`, so it is SSR-safe.
 */
import { STUFFCLOUD_ART, type PixelGrid, type StuffcloudArt } from './stuffcloud-art.js';

export { STUFFCLOUD_ART };
export type { PixelGrid, StuffcloudArt };

/** The stuffcloud mascot names, main mascot first. */
export const MASCOT_NAMES = ['stuffy', 'mochi', 'hop', 'bun', 'bloop', 'waddle', 'ember', 'boo', 'cumulo'] as const;

export type MascotName = (typeof MASCOT_NAMES)[number];

/** Where a mascot's art lives: `file` as in stuffcloud's `MASCOT_SOURCES`, `art` as in kern's assets. */
export interface MascotSource extends PixelGrid {
	/** File name without `.svg` (stuffcloud `docs/design/prototypes`, kern `assets/stuffcloud/mascots`). */
	readonly file: string;
	/** Path under `assets/stuffcloud/`, without `.svg`. */
	readonly art: StuffcloudArt;
	readonly animal: string;
}

function source(art: StuffcloudArt & `mascots/${string}`, animal: string): MascotSource {
	return { file: art.slice('mascots/'.length), art, animal, ...STUFFCLOUD_ART[art] };
}

/** stuffcloud mascot name → kern asset (the same mapping as stuffcloud's `MASCOT_SOURCES`). */
export const MASCOT_SOURCES: Readonly<Record<MascotName, MascotSource>> = {
	stuffy: source('mascots/axo', 'axolotl'),
	mochi: source('mascots/mascot-cat', 'cat'),
	hop: source('mascots/mascot-frog', 'frog'),
	bun: source('mascots/mascot-bunny', 'bunny'),
	bloop: source('mascots/mascot-jelly', 'jellyfish'),
	waddle: source('mascots/mascot-penguin', 'penguin'),
	ember: source('mascots/mascot-fox', 'fox'),
	boo: source('mascots/mascot-ghost', 'ghost'),
	cumulo: source('mascots/mascot-cloudy', 'cloud')
};

/** Default length of one idle cycle (`--k-mascot-bob-period`): half at rest, half raised. */
export const BOB_PERIOD_MS = 1200;
/** Default height of the raised pose above the rest pose, in CSS pixels (`--k-mascot-bob-offset`). */
export const BOB_OFFSET_PX = 4;
/** Widest viewport that uses `compactScale` (stuffcloud's phone breakpoint, `max-width: 760px`). */
export const COMPACT_MAX_WIDTH_PX = 760;

export function isMascotName(name: string): name is MascotName {
	return (MASCOT_NAMES as readonly string[]).includes(name);
}

export function isStuffcloudArt(name: string): name is StuffcloudArt {
	return Object.hasOwn(STUFFCLOUD_ART, name);
}

/** Asset path (`mascots/axo`) of a mascot name or of a path; undefined for anything unknown. */
export function artPath(name: string): StuffcloudArt | undefined {
	if (isMascotName(name)) return MASCOT_SOURCES[name].art;
	return isStuffcloudArt(name) ? name : undefined;
}

/**
 * URL of a shipped SVG inside `base`, the URL where the consumer serves the
 * `assets/stuffcloud/` folder: `artUrl('/art/stuffcloud', 'stuffy')` → `/art/stuffcloud/mascots/axo.svg`.
 */
export function artUrl(base: string, name: MascotName | StuffcloudArt): string {
	const path = artPath(name);
	if (path === undefined) throw new Error(`kern: unknown stuffcloud art "${name}"`);
	return `${base.endsWith('/') ? base : `${base}/`}${path}.svg`;
}

/**
 * A drawable integer scale: pixel art stays crisp only when every art pixel becomes a whole
 * number of CSS pixels. Fractions are cut off; anything below 1 or not finite becomes 1.
 */
export function normaliseScale(scale: number): number {
	return Number.isFinite(scale) && scale >= 1 ? Math.floor(scale) : 1;
}

/** The largest integer scale whose width does not exceed `targetWidth` (at least 1). */
export function integerScale(targetWidth: number, cols: number): number {
	return Number.isFinite(targetWidth) && cols > 0 ? normaliseScale(targetWidth / cols) : 1;
}

/** Drawn size in CSS pixels at an integer scale. */
export function mascotSize(grid: PixelGrid, scale: number): { readonly width: number; readonly height: number } {
	const factor = normaliseScale(scale);
	return { width: grid.cols * factor, height: grid.rows * factor };
}
