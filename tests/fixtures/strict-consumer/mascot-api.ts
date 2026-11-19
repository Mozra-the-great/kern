// The Mascot helpers and types under the same strict flags.
import {
	artPath,
	artUrl,
	BOB_OFFSET_PX,
	BOB_PERIOD_MS,
	COMPACT_MAX_WIDTH_PX,
	integerScale,
	isMascotName,
	isStuffcloudArt,
	MASCOT_NAMES,
	MASCOT_SOURCES,
	mascotSize,
	normaliseScale,
	STUFFCLOUD_ART
} from '@mozra-the-great/kern';
import type { MascotArt, MascotMotion, MascotName, MascotSource, PixelGrid, StuffcloudArt } from '@mozra-the-great/kern';

export function mascotUrl(name: string, base: string | undefined): string | undefined {
	const path: StuffcloudArt | undefined = artPath(name);
	if (path === undefined || base === undefined) return undefined;
	const grid: PixelGrid = STUFFCLOUD_ART[path];
	const size = mascotSize(grid, normaliseScale(integerScale(320, grid.cols)));
	if (size.width <= 0) return undefined;
	return isMascotName(name) ? artUrl(base, name) : artUrl(base, path);
}

export const names: readonly MascotName[] = MASCOT_NAMES;
export const source: MascotSource = MASCOT_SOURCES.stuffy;
export const motion: MascotMotion = 'still';
export const art: MascotArt = 'tool-stickers/sticker-qr';
export const timing: number = BOB_PERIOD_MS + BOB_OFFSET_PX + COMPACT_MAX_WIDTH_PX;
export const known: boolean = isStuffcloudArt('mascots/axo');
