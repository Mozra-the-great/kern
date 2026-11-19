// saveBlob, saveText and their result types under the same strict flags (#92).
import { REVOKE_DELAY_MS, sanitizeFileName, saveBlob, saveText, textMimeType } from '@mozra-the-great/kern';
import type { DownloadError, DownloadErrorCode, DownloadFailure, DownloadOk, DownloadResult, SaveOptions } from '@mozra-the-great/kern';

/** The result is a union that narrows on `ok`. */
export function describe(result: DownloadResult): string {
	if (result.ok) {
		const ok: DownloadOk = result;
		return `${ok.name} ${String(ok.size)} ${ok.type}`;
	}
	const failure: DownloadFailure = result;
	const error: DownloadError = failure.error;
	const code: DownloadErrorCode = error.code;
	return `${code} ${error.message} ${String(error.cause)}`;
}

/** Values that may be undefined are accepted where they are optional. */
export function save(name: string, blob: Blob, text: string, type: string | undefined, fallback: string | undefined): string[] {
	const options: SaveOptions = { fallbackName: fallback };
	return [
		describe(saveBlob(name, blob)),
		describe(saveBlob(name, blob, options)),
		describe(saveText(name, text)),
		describe(saveText(name, text, type)),
		describe(saveText(name, text, undefined, options)),
		sanitizeFileName(name),
		sanitizeFileName(undefined, fallback),
		textMimeType(type),
		String(REVOKE_DELAY_MS)
	];
}
