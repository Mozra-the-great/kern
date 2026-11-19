/**
 * File filters with the grammar of `<input type="file" accept>`: comma-separated `.ext`, `type/*`
 * and `type/subtype`, case-insensitive. Only the file's name and MIME type are looked at, never its
 * content (files stay on the device). Used by FileDrop; exported for hosts that filter files
 * themselves (paste handlers, drops on other targets).
 */

/** Whether `file` matches `accept`. An empty or missing list accepts everything. */
export function matchesAccept(file: Pick<File, 'name' | 'type'>, accept: string | null | undefined): boolean {
	const patterns = (accept ?? '')
		.split(',')
		.map((pattern) => pattern.trim().toLowerCase())
		.filter((pattern) => pattern !== '');
	if (patterns.length === 0) return true;
	const name = file.name.toLowerCase();
	const type = file.type.toLowerCase();
	return patterns.some((pattern) => {
		if (pattern.startsWith('.')) return name.endsWith(pattern);
		if (pattern.endsWith('/*')) return type.startsWith(pattern.slice(0, -1));
		return type === pattern;
	});
}

export interface SplitFiles {
	/** Files that match `accept`, in their original order (only the first one without `multiple`). */
	readonly accepted: File[];
	/** Files that do not match, followed by the accepted ones that `multiple: false` left out. */
	readonly rejected: File[];
}

/** Splits files into accepted and rejected ones; without `multiple` only the first accepted file stays. */
export function splitFiles(files: readonly File[], accept: string | null | undefined, multiple: boolean): SplitFiles {
	const accepted: File[] = [];
	const rejected: File[] = [];
	for (const file of files) (matchesAccept(file, accept) ? accepted : rejected).push(file);
	if (!multiple && accepted.length > 1) return { accepted: accepted.slice(0, 1), rejected: [...rejected, ...accepted.slice(1)] };
	return { accepted, rejected };
}
