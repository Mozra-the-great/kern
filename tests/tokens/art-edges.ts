/**
 * Reads the colours a piece of art shows against whatever it stands on (#188), straight from the
 * shipped SVG files, so the stage readability test needs no copy of the art's colours.
 */
import { readFileSync } from 'node:fs';

/** Number of art pixels per colour. */
export type ColourCount = ReadonlyMap<string, number>;

/**
 * The colours of the pixels on the silhouette of Code pixel art: every art pixel that has a side
 * on the outside of the art or on a transparent pixel. Those are the pixels that meet the stage,
 * so they are the "outline" of a piece that has no drawn outline of its own.
 *
 * Code art is a grid of `<path fill="#rrggbb" d="Mx yhWvHh-Wz…">` squares (assets/README.md,
 * "code"); anything else in the file is a mistake that `npm run assets:check` reports first.
 */
export function pixelSilhouette(svg: string): ColourCount {
	const box = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
	if (!box) throw new Error('No integer viewBox "0 0 W H"');
	const cols = Number(box[1]);
	const rows = Number(box[2]);
	const grid: (string | null)[][] = Array.from({ length: rows }, () => Array<string | null>(cols).fill(null));
	for (const path of svg.matchAll(/<path fill="(#[0-9a-fA-F]{6})" d="([^"]+)"/g)) {
		const fill = path[1].toLowerCase();
		for (const square of path[2].matchAll(/M(\d+) (\d+)h(\d+)v(\d+)h-\d+z/g)) {
			const [x, y, w, h] = [Number(square[1]), Number(square[2]), Number(square[3]), Number(square[4])];
			for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) grid[row][col] = fill;
		}
	}
	const edge = new Map<string, number>();
	const sides: readonly (readonly [number, number])[] = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1]
	];
	for (let row = 0; row < rows; row++) {
		for (let col = 0; col < cols; col++) {
			const fill = grid[row][col];
			if (fill === null) continue;
			const open = sides.some(([dx, dy]) => grid[row + dy]?.[col + dx] == null);
			if (open) edge.set(fill, (edge.get(fill) ?? 0) + 1);
		}
	}
	return edge;
}

export const silhouetteOf = (file: string): ColourCount => pixelSilhouette(readFileSync(file, 'utf8'));

/**
 * The outline colour of vector art (Pop, Line): the stroke colour used most often in the file,
 * as `#rrggbb`. `null` when the file draws no stroke (Flower's motifs are filled shapes only).
 */
export function dominantStroke(svg: string): string | null {
	const counts = new Map<string, number>();
	for (const m of svg.matchAll(/stroke="(#[0-9a-fA-F]{3,6})"/g)) {
		const colour = normalizeHex(m[1]);
		counts.set(colour, (counts.get(colour) ?? 0) + 1);
	}
	let best: string | null = null;
	for (const [colour, n] of counts) if (best === null || n > (counts.get(best) ?? 0)) best = colour;
	return best;
}

function normalizeHex(hex: string): string {
	const h = hex.toLowerCase();
	return h.length === 4 ? `#${[...h.slice(1)].map((c) => c + c).join('')}` : h;
}
