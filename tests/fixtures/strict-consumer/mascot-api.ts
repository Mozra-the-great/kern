// The Mascot helpers and types under the same strict flags.
import {
	artPath,
	artUrl,
	BOB_OFFSET_PX,
	BOB_PERIOD_MS,
	COMPACT_MAX_WIDTH_PX,
	integerScale,
	isMascotName,
	isCodeArt,
	isStuffcloudArt,
	MASCOT_NAMES,
	MASCOT_SOURCES,
	mascotSize,
	normaliseScale,
	CODE_ART,
	STUFFCLOUD_ART
} from '@mozra-the-great/kern';
import type { MascotArt, MascotMotion, MascotName, MascotSource, PixelGrid, CodeArt, StuffcloudArt } from '@mozra-the-great/kern';

export function mascotUrl(name: string, base: string | undefined): string | undefined {
	const path: CodeArt | undefined = artPath(name);
	if (path === undefined || base === undefined) return undefined;
	const grid: PixelGrid = CODE_ART[path];
	const size = mascotSize(grid, normaliseScale(integerScale(320, grid.cols)));
	if (size.width <= 0) return undefined;
	return isMascotName(name) ? artUrl(base, name) : artUrl(base, path);
}

export const names: readonly MascotName[] = MASCOT_NAMES;
export const source: MascotSource = MASCOT_SOURCES.stuffy;
export const motion: MascotMotion = 'still';
export const art: MascotArt = 'tool-stickers/sticker-qr';
export const timing: number = BOB_PERIOD_MS + BOB_OFFSET_PX + COMPACT_MAX_WIDTH_PX;
export const known: boolean = isCodeArt('mascots/axo');

// Deprecated aliases (#85, removed in 1.0) keep compiling under the same flags.
export const knownOld: boolean = isStuffcloudArt('mascots/axo');
export const oldPath: StuffcloudArt = 'mascots/axo';
export const oldGrid: PixelGrid = STUFFCLOUD_ART[oldPath];
