/*
 * Pixel-art runtime (#55): the Code mascot cast, the integer-scale rules and the idle
 * motion constants of stuffcloud's ADR 0008 ("Pixel-art animation runtime"). The art itself is
 * shipped as plain files under `assets/code/`; `CODE_ART` lists every file with its
 * pixel grid. Nothing here touches `window`, so it is SSR-safe.
 */
import { CODE_ART, type CodeArt, type PixelGrid } from './code-art.js';

export { CODE_ART };
export type { CodeArt, PixelGrid };

/** @deprecated Renamed to `CODE_ART` (#85); the old name is removed in 1.0. */
export const STUFFCLOUD_ART: typeof CODE_ART = CODE_ART;
/** @deprecated Renamed to `CodeArt` (#85); the old name is removed in 1.0. */
export type StuffcloudArt = CodeArt;

/** The mascot names (the stuffcloud cast), main mascot first. */
export const MASCOT_NAMES = ['stuffy', 'mochi', 'hop', 'bun', 'bloop', 'waddle', 'ember', 'boo', 'cumulo'] as const;

export type MascotName = (typeof MASCOT_NAMES)[number];

/**
 * Alternative names that resolve to a mascot (#183): the animal and the file stem of the art
 * (`axo`, `cat`, `jelly`, `cloudy`). `stuffy` stays the one canonical name; an alias never shows up in
 * `MASCOT_NAMES` or `data-mascot`.
 */
export const MASCOT_ALIASES = {
	axo: 'stuffy',
	axolotl: 'stuffy',
	cat: 'mochi',
	frog: 'hop',
	bunny: 'bun',
	jelly: 'bloop',
	jellyfish: 'bloop',
	penguin: 'waddle',
	fox: 'ember',
	ghost: 'boo',
	cloudy: 'cumulo',
	cloud: 'cumulo'
} as const satisfies Record<string, MascotName>;

export type MascotAlias = keyof typeof MASCOT_ALIASES;

/** `main` is Stuffy, who stands on pages; `easter-egg` is the rest of the cast, which shows up rarely and never blocks content. */
export type MascotRole = 'main' | 'easter-egg';

/** Where a mascot's art lives: `file` as in stuffcloud's `MASCOT_SOURCES`, `art` as in kern's assets. */
export interface MascotSource extends PixelGrid {
	/** File name without `.svg` (kern `assets/code/mascots`; stuffcloud `docs/design/prototypes` is the frozen reference it was copied from). */
	readonly file: string;
	/** Path under `assets/code/`, without `.svg`. */
	readonly art: CodeArt;
	readonly animal: string;
	readonly role: MascotRole;
}

function source(art: CodeArt & `mascots/${string}`, animal: string, role: MascotRole = 'easter-egg'): MascotSource {
	return { file: art.slice('mascots/'.length), art, animal, role, ...CODE_ART[art] };
}

/** Mascot name → kern asset (the same mapping as stuffcloud's `MASCOT_SOURCES`). */
export const MASCOT_SOURCES: Readonly<Record<MascotName, MascotSource>> = {
	stuffy: source('mascots/axo', 'axolotl', 'main'),
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

export function isMascotAlias(name: string): name is MascotAlias {
	return Object.hasOwn(MASCOT_ALIASES, name);
}

/** The canonical mascot name of a name or an alias (`axo` → `stuffy`); undefined for anything else, paths included. */
export function resolveMascotName(name: string): MascotName | undefined {
	if (isMascotName(name)) return name;
	return isMascotAlias(name) ? MASCOT_ALIASES[name] : undefined;
}

export function isCodeArt(name: string): name is CodeArt {
	return Object.hasOwn(CODE_ART, name);
}

/** @deprecated Renamed to `isCodeArt` (#85); the old name is removed in 1.0. */
export function isStuffcloudArt(name: string): name is CodeArt {
	return isCodeArt(name);
}

/** Asset path (`mascots/axo`) of a mascot name, an alias or a path; undefined for anything unknown. */
export function artPath(name: string): CodeArt | undefined {
	const mascot = resolveMascotName(name);
	if (mascot !== undefined) return MASCOT_SOURCES[mascot].art;
	return isCodeArt(name) ? name : undefined;
}

/**
 * URL of a shipped SVG inside `base`, the URL where the consumer serves the
 * `assets/code/` folder: `artUrl('/art/code', 'stuffy')` → `/art/code/mascots/axo.svg`.
 */
export function artUrl(base: string, name: MascotName | MascotAlias | CodeArt): string {
	const path = artPath(name);
	if (path === undefined) throw new Error(`kern: unknown Code art "${name}"`);
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
