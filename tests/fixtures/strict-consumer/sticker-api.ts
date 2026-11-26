// The sticker data and helpers under the same strict flags.
import {
	isStickerCategory,
	isStickerName,
	STICKER_CATEGORIES,
	STICKER_CATEGORY,
	STICKER_NAMES,
	STICKERS_BY_CATEGORY,
	stickerGrid,
	stickerPath,
	stickersOfCategory,
	stickerUrl
} from '@mozra-the-great/kern';
import type { CodeArt, PixelGrid, StickerCategory, StickerName } from '@mozra-the-great/kern';

export const names: readonly StickerName[] = STICKER_NAMES;
export const categories: readonly StickerCategory[] = STICKER_CATEGORIES;
export const category: StickerCategory = STICKER_CATEGORY.qr;
export const group: readonly StickerName[] = STICKERS_BY_CATEGORY[category];
export const path: CodeArt = stickerPath('pdf-merge');
export const grid: PixelGrid = stickerGrid('qr');

export function stickerSrc(name: string, base: string | undefined): string | undefined {
	if (!isStickerName(name) || base === undefined) return undefined;
	return stickerUrl(base, name);
}

export function stickersOf(value: string): readonly StickerName[] {
	return isStickerCategory(value) ? stickersOfCategory(value) : stickersOfCategory(value.toLowerCase());
}
