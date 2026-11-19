/*
 * Save-as-download helpers (#92): `saveBlob(name, blob)` and `saveText(name, text, type?)` offer data the page
 * already holds as a file download. An object URL of this browser is put on a temporary `<a download>` that is
 * clicked once; nothing is sent anywhere and nothing is read back. Plain functions, no Svelte, safe on the
 * server: without a document they return a typed failure instead of throwing.
 *
 * The file name is cleaned first (`sanitizeFileName`), so a name that comes from data (a title, a user's file
 * name) cannot carry a path, control or direction-override characters into the download dialog.
 */
import { getStrings } from './strings.js';

/** Why nothing was saved. */
export type DownloadErrorCode =
	/** No document, or no object URLs: server rendering, a worker, a test without a DOM. */
	| 'no-dom'
	/** The content is not a `Blob` (or text). */
	| 'invalid'
	/** The browser refused: creating the object URL or clicking the link threw. */
	| 'failed'
	/** The content could not be produced: a `getContent` function threw, rejected or returned something else. */
	| 'content';

export interface DownloadError {
	code: DownloadErrorCode;
	/** For developers (English), not for the user interface. */
	message: string;
	/** The value that was thrown, when there was one. */
	cause?: unknown;
}

/** The download was handed to the browser. The browser may still ask where to put the file. */
export interface DownloadOk {
	ok: true;
	/** The file name that was used (after cleaning). */
	name: string;
	/** Size in bytes. */
	size: number;
	/** MIME type of the file; empty when the blob had none. */
	type: string;
}

export interface DownloadFailure {
	ok: false;
	error: DownloadError;
}

export type DownloadResult = DownloadOk | DownloadFailure;

export interface SaveOptions {
	/**
	 * File name used when `name` is empty after cleaning. Default: the catalogue text
	 * `downloadButton.fallbackName` ("download", "datei" in German).
	 */
	fallbackName?: string | undefined;
}

/**
 * How long the object URL stays valid after the click, in milliseconds. The URL is revoked from a timer, so it
 * is always after the click handler has returned.
 * - Chromium and Firefox have taken what they need by then: the link's `href` was parsed into a URL that holds the
 *   blob, and a `setTimeout(…, 0)` revoke delivered 10 byte and 40 MB files intact in both (checked with Playwright
 *   for this module, three runs each).
 * - Safari (WebKit) could not be tested here. It starts the download from a navigation that is scheduled, not run
 *   inside `click()`, and there are reports of downloads that fail when the URL is revoked at once; libraries such as
 *   FileSaver.js wait for that reason. So the URL stays valid a moment longer than a zero timer; the price is the
 *   memory of one blob for one second.
 */
export const REVOKE_DELAY_MS = 1000;

/** Longest file name kept, in characters. Most file systems allow 255 bytes; this leaves room for multi-byte text. */
const MAX_NAME_LENGTH = 180;
/** Longest extension that is kept when a long name is shortened. */
const MAX_EXTENSION_LENGTH = 16;
/** Used when neither the name nor the fallback leaves anything. */
const LAST_RESORT_NAME = 'download';

/**
 * Cleans a file name for the download dialog. Removes control, format (zero width, direction overrides, BOM)
 * and unpaired surrogate characters, turns path separators and the characters Windows does not allow
 * (`\ / : * ? " < > |`) into `_`, trims spaces and trailing dots, prefixes names Windows reserves (`CON`, `NUL`,
 * `COM1` …) with `_`, and shortens very long names while keeping the extension. Returns the cleaned `fallback`
 * (same rules; default the catalogue's `downloadButton.fallbackName`) when nothing is left, e.g. for `''`,
 * `'..'` or `'///'`. Never returns an empty string.
 */
export function sanitizeFileName(name: unknown, fallback?: string): string {
	const cleaned = clean(typeof name === 'string' ? name : '');
	if (cleaned !== '') return cleaned;
	const given = clean(typeof fallback === 'string' ? fallback : getStrings().downloadButton.fallbackName);
	return given !== '' ? given : LAST_RESORT_NAME;
}

function clean(raw: string): string {
	let name = raw
		.replace(/[\p{Cc}\p{Cf}\p{Cs}]/gu, '')
		.replace(/[\p{Zl}\p{Zp}]/gu, ' ')
		.replace(/[\\/:*?"<>|]/g, '_')
		.trim();
	// Windows drops trailing dots and spaces silently, which could turn "name." into "name" or ".." into "".
	name = trimTrailingDotsAndSpaces(name);
	if (name === '') return '';
	if (/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(name)) name = `_${name}`;
	const chars = Array.from(name);
	if (chars.length > MAX_NAME_LENGTH) {
		const dot = name.lastIndexOf('.');
		const extension = dot > 0 ? Array.from(name.slice(dot)) : [];
		const keep = extension.length > 1 && extension.length <= MAX_EXTENSION_LENGTH ? extension : [];
		name = trimTrailingDotsAndSpaces(chars.slice(0, MAX_NAME_LENGTH - keep.length).join('')) + keep.join('');
	}
	return name;
}

/**
 * `text` without trailing dots and spaces. A loop instead of `/[. ]+$/`, which backtracks quadratically on
 * input with many dots or spaces followed by another character (CodeQL js/polynomial-redos).
 */
function trimTrailingDotsAndSpaces(text: string): string {
	let end = text.length;
	while (end > 0 && (text[end - 1] === '.' || text[end - 1] === ' ')) end--;
	return text.slice(0, end);
}

function failure(code: DownloadErrorCode, message: string, cause?: unknown): DownloadFailure {
	return { ok: false, error: cause === undefined ? { code, message } : { code, message, cause } };
}

function canDownload(): boolean {
	return (
		typeof document !== 'undefined' &&
		typeof URL !== 'undefined' &&
		typeof URL.createObjectURL === 'function' &&
		typeof URL.revokeObjectURL === 'function'
	);
}

function noDom(): DownloadFailure {
	return failure('no-dom', 'There is no document to start a download from (server rendering or a worker).');
}

/** True for a `Blob` or `File`, also one made in another window. */
export function isBlob(value: unknown): value is Blob {
	if (typeof value !== 'object' || value === null) return false;
	if (typeof Blob !== 'undefined' && value instanceof Blob) return true;
	// A blob from another window (an iframe, a popup) is not an instance of this window's `Blob`.
	const tag = Object.prototype.toString.call(value);
	return (tag === '[object Blob]' || tag === '[object File]') && typeof (value as { size?: unknown }).size === 'number';
}

/**
 * Offers `blob` as a download named `name`. Creates an object URL, clicks a temporary
 * `<a download>` (appended to `document.body`, which Firefox needs, and removed again) and revokes the URL a
 * moment later (`REVOKE_DELAY_MS`). The click does not bubble: page code that listens for clicks on the document
 * (outside-click handling of a popover, a router) never sees it. Nothing is sent anywhere.
 *
 * Call it from a user's click (or key press): browsers let a download start without a gesture only for the first
 * one on a page and may ask before more. Never throws; the result says what happened:
 *
 * ```ts
 * const result = saveBlob('report.csv', blob);
 * if (!result.ok) console.warn(result.error.code); // 'no-dom' on the server
 * ```
 */
export function saveBlob(name: string, blob: Blob, options: SaveOptions = {}): DownloadResult {
	if (!canDownload()) return noDom();
	if (!isBlob(blob)) return failure('invalid', 'saveBlob needs a Blob or File.');
	const file = sanitizeFileName(name, options.fallbackName);
	let url: string | undefined;
	try {
		url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = file;
		link.rel = 'noopener';
		link.style.display = 'none';
		// A synthetic click is not the user's: keep it away from handlers on ancestors and the document.
		link.addEventListener('click', (event) => event.stopPropagation());
		(document.body ?? document.documentElement).append(link);
		try {
			link.click();
		} finally {
			link.remove();
		}
	} catch (error) {
		if (url !== undefined) revokeLater(url, 0);
		return failure('failed', 'The browser could not start the download.', error);
	}
	revokeLater(url, REVOKE_DELAY_MS);
	return { ok: true, name: file, size: blob.size, type: blob.type };
}

function revokeLater(url: string, delay: number): void {
	setTimeout(() => {
		try {
			URL.revokeObjectURL(url);
		} catch {
			/* Already revoked, or the page is going away. */
		}
	}, delay);
}

/** A MIME type with optional parameters (`text/csv`, `text/html; charset=utf-8`); anything else is not one. */
const MIME = /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*(?:\s*;\s*[a-z0-9!#$&^_.+-]+=(?:[a-z0-9!#$&^_.+-]+|"[^"\\\r\n]*"))*$/i;

/**
 * The `Blob` type `saveText` uses for `type`: UTF-8 is added unless the type names a charset itself, and a value that
 * is not a MIME type (empty, with control characters, a typo like `csv`) becomes `text/plain`.
 */
export function textMimeType(type?: string): string {
	const given = typeof type === 'string' ? type.trim() : '';
	const mime = MIME.test(given) ? given.toLowerCase() : 'text/plain';
	return /;\s*charset=/.test(mime) ? mime : `${mime};charset=utf-8`;
}

/**
 * Offers `text` as a UTF-8 file named `name` (`saveBlob` with a `Blob` of that text). `type` is the MIME type,
 * default `text/plain`; `;charset=utf-8` is appended unless `type` has a charset. Same rules and result as `saveBlob`.
 */
export function saveText(name: string, text: string, type?: string, options: SaveOptions = {}): DownloadResult {
	if (!canDownload() || typeof Blob === 'undefined') return noDom();
	if (typeof text !== 'string') return failure('invalid', 'saveText needs a string.');
	return saveBlob(name, new Blob([text], { type: textMimeType(type) }), options);
}
