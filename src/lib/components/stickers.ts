/*
 * The tool stickers (#182): 42 pixel-art stickers shipped as plain files under
 * `assets/code/tool-stickers/`, their names and the tool category each belongs to. The data is
 * theme-independent and framework-free (SSR-safe); `Sticker` draws one by name.
 * A test keeps `STICKER_NAMES` and the shipped files in sync in both directions.
 */
import { CODE_ART, type CodeArt, type PixelGrid } from './code-art.js';

/** The sticker names, alphabetical: `sticker-<name>.svg` under `assets/code/tool-stickers/`. */
export const STICKER_NAMES = [
	'base64',
	'burn',
	'colour',
	'cron',
	'diff',
	'download',
	'expiry',
	'hash',
	'img-background',
	'img-convert',
	'img-crop',
	'img-exif',
	'img-pixel',
	'img-resize',
	'json',
	'jwt',
	'lorem',
	'mac',
	'markdown',
	'password',
	'paste',
	'pdf-compress',
	'pdf-merge',
	'pdf-protect',
	'pdf-rotate',
	'pdf-split',
	'qr',
	'regex',
	'report',
	'shield',
	'site',
	'sql',
	'subnet',
	'textops',
	'timestamp',
	'trash',
	'units',
	'url',
	'useragent',
	'uuid',
	'xml',
	'yaml'
] as const;

export type StickerName = (typeof STICKER_NAMES)[number];

/** The sticker categories (tool areas), in display order. */
export const STICKER_CATEGORIES = ['pdf', 'images', 'convert', 'time', 'network', 'text', 'dev', 'hosting'] as const;

/**
 * A tool category: `pdf` (PDF tools), `images`, `convert` (formats, encodings, units), `time` (time and
 * agents), `network`, `text` (text and generators), `dev` (developer helpers) and `hosting` (hosting and misc).
 */
export type StickerCategory = (typeof STICKER_CATEGORIES)[number];

/** Which category every sticker belongs to. */
export const STICKER_CATEGORY: Readonly<Record<StickerName, StickerCategory>> = {
	base64: 'convert',
	burn: 'hosting',
	colour: 'convert',
	cron: 'time',
	diff: 'text',
	download: 'hosting',
	expiry: 'hosting',
	hash: 'dev',
	'img-background': 'images',
	'img-convert': 'images',
	'img-crop': 'images',
	'img-exif': 'images',
	'img-pixel': 'images',
	'img-resize': 'images',
	json: 'convert',
	jwt: 'dev',
	lorem: 'text',
	mac: 'network',
	markdown: 'dev',
	password: 'dev',
	paste: 'hosting',
	'pdf-compress': 'pdf',
	'pdf-merge': 'pdf',
	'pdf-protect': 'pdf',
	'pdf-rotate': 'pdf',
	'pdf-split': 'pdf',
	qr: 'text',
	regex: 'dev',
	report: 'hosting',
	shield: 'hosting',
	site: 'hosting',
	sql: 'dev',
	subnet: 'network',
	textops: 'text',
	timestamp: 'time',
	trash: 'hosting',
	units: 'convert',
	url: 'dev',
	useragent: 'time',
	uuid: 'text',
	xml: 'convert',
	yaml: 'convert'
};

/** The stickers of each category, in display order. */
export const STICKERS_BY_CATEGORY: Readonly<Record<StickerCategory, readonly StickerName[]>> = {
	pdf: ['pdf-merge', 'pdf-split', 'pdf-rotate', 'pdf-compress', 'pdf-protect'],
	images: ['img-resize', 'img-crop', 'img-convert', 'img-background', 'img-pixel', 'img-exif'],
	convert: ['json', 'yaml', 'xml', 'base64', 'colour', 'units'],
	time: ['cron', 'timestamp', 'useragent'],
	network: ['subnet', 'mac'],
	text: ['lorem', 'uuid', 'qr', 'diff', 'textops'],
	dev: ['hash', 'password', 'regex', 'url', 'jwt', 'markdown', 'sql'],
	hosting: ['paste', 'site', 'expiry', 'report', 'shield', 'trash', 'download', 'burn']
};

export function isStickerName(value: unknown): value is StickerName {
	return typeof value === 'string' && (STICKER_NAMES as readonly string[]).includes(value);
}

export function isStickerCategory(value: unknown): value is StickerCategory {
	return typeof value === 'string' && (STICKER_CATEGORIES as readonly string[]).includes(value);
}

/** The stickers of one category in display order; an empty list for anything that is not a category. */
export function stickersOfCategory(category: string): readonly StickerName[] {
	return isStickerCategory(category) ? STICKERS_BY_CATEGORY[category] : [];
}

/** Asset path of a sticker (`tool-stickers/sticker-qr`): the key in `CODE_ART`, without `.svg`. Typed, so a missing file does not compile. */
export function stickerPath(name: StickerName): CodeArt {
	return `tool-stickers/sticker-${name}`;
}

/** Pixel grid of a sticker. */
export function stickerGrid(name: StickerName): PixelGrid {
	return CODE_ART[stickerPath(name)];
}

/**
 * URL of a sticker inside `base`, the URL where the consumer serves the `assets/code/` folder:
 * `stickerUrl('/art/code', 'qr')` → `/art/code/tool-stickers/sticker-qr.svg`.
 */
export function stickerUrl(base: string, name: StickerName): string {
	return `${base.endsWith('/') ? base : `${base}/`}${stickerPath(name)}.svg`;
}
