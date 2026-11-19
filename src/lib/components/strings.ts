/*
 * The default texts of the components (#58): every label, accessible name and announcement a
 * component shows when no prop is given. English is built in; `de` lives in strings-de.ts, so a
 * consumer that does not import it does not ship it. A prop always wins over the catalogue.
 *
 * The state is framework-free and lives on a well-known global (`sharedStringsStore`), like the toast
 * queue: the Svelte package and the custom-elements bundle on one page share the same choice.
 * `strings.svelte.ts` mirrors it into reactive state for the components. Nothing here touches
 * `window` or `document` unless asked to (`followLang`), so the module is safe on the server.
 *
 * Text templates use `{name}` placeholders; a translation keeps the placeholders of its English text.
 */

const catalogue = {
	alert: { dismissLabel: 'Dismiss' },
	breadcrumb: { label: 'Breadcrumb', expandLabel: 'Show hidden items' },
	card: {
		/** Accessible name of a clickable card that has neither an `actionLabel`, a title nor a description. */
		openLabel: 'Open'
	},
	carousel: {
		label: 'Carousel',
		prevLabel: 'Previous slide',
		nextLabel: 'Next slide',
		dotsLabel: 'Slides',
		/** Followed by the slide number: "Go to slide 3". */
		slideLabel: 'Go to slide',
		ofLabel: 'of',
		/** What a screen reader calls the carousel and each of its slides (`aria-roledescription`). */
		roleDescription: 'carousel',
		slideRoleDescription: 'slide'
	},
	code: {
		copyLabel: 'Copy',
		copiedLabel: 'Copied',
		copyErrorLabel: 'Copy failed',
		/** Accessible name of a scrollable block without a language. */
		label: 'Code',
		/** Accessible name of a scrollable block with a `language`; `{language}` is replaced. */
		languageLabel: '{language} code'
	},
	colorPicker: {
		pickerLabel: 'Choose color',
		areaLabel: 'Saturation and brightness',
		/** `{color}`, `{saturation}` and `{brightness}` are replaced. */
		areaText: '{color}, saturation {saturation}%, brightness {brightness}%',
		hueLabel: 'Hue',
		alphaLabel: 'Opacity',
		swatchesLabel: 'Presets',
		invalidText: 'Enter a color as #rgb, #rrggbb or #rrggbbaa.'
	},
	combobox: { noResults: 'No results', toggleLabel: 'Show options' },
	commandPalette: {
		label: 'Command palette',
		placeholder: 'Type a command or search…',
		empty: 'No matching commands',
		closeLabel: 'Close'
	},
	contextMenu: { label: 'Context menu' },
	copyButton: { label: 'Copy', copiedLabel: 'Copied', errorLabel: 'Copy failed' },
	dataTable: {
		searchLabel: 'Filter',
		empty: 'No entries',
		/** `{query}` is replaced. */
		emptyFiltered: 'No entries match “{query}”',
		/** `{count}` is replaced. */
		resultsLabel: '{count} entries',
		/** `{count}` and `{total}` are replaced. */
		filteredLabel: '{count} of {total} entries',
		selectedLabel: '{count} selected',
		/** `{column}` and `{direction}` (one of the two labels below) are replaced. */
		sortedLabel: 'Sorted by {column}, {direction}',
		ascendingLabel: 'ascending',
		descendingLabel: 'descending',
		loadingLabel: 'Loading…',
		selectAllLabel: 'Select all rows on this page',
		/** `{row}` is replaced. */
		selectRowLabel: 'Select {row}',
		paginationLabel: 'Table pagination'
	},
	datePicker: {
		calendarLabel: 'Choose date',
		prevMonthLabel: 'Previous month',
		nextMonthLabel: 'Next month',
		invalidText: 'Enter a valid date.',
		/** The letters of the date pattern shown as the placeholder ("dd.mm.yyyy") for day, month and year. */
		pattern: { day: 'dd', month: 'mm', year: 'yyyy' }
	},
	drawer: { closeLabel: 'Close' },
	fileDrop: {
		removeLabel: 'Remove',
		listLabel: 'Selected files',
		/** `{name}` and `{max}` are replaced. */
		sizeError: '{name} is larger than {max}.',
		typeError: '{name} is not an accepted file type.',
		countError: 'Only one file can be selected.',
		statusLabel: 'Files selected: {count}',
		/** Prompts of the drop zone when `dropLabel` is not set (one file or several; with or without the button). */
		dropOne: 'Drop a file here',
		dropMany: 'Drop files here',
		dropOneOrChoose: 'Drop a file here or click to choose',
		dropManyOrChoose: 'Drop files here or click to choose'
	},
	heatmap: { cellLabel: '{date}: {value}', lessLabel: 'Less', moreLabel: 'More', emptyLabel: 'No data' },
	historyBar: {
		/** `{percent}` is replaced. */
		summaryLabel: '{percent} % ok',
		noDataLabel: 'No data',
		/** Spoken name of each status. */
		statuses: { ok: 'OK', warn: 'Degraded', down: 'Down', none: 'No data' }
	},
	kbd: {
		/** Spoken names of the keys that are drawn as symbols or abbreviations. */
		command: 'Command',
		control: 'Control',
		windows: 'Windows',
		option: 'Option',
		alt: 'Alt',
		shift: 'Shift',
		enter: 'Enter',
		escape: 'Escape',
		backspace: 'Backspace',
		delete: 'Delete',
		up: 'Up arrow',
		down: 'Down arrow',
		left: 'Left arrow',
		right: 'Right arrow'
	},
	link: {
		/** Read after the text of an `external` link. */
		externalLabel: '(opens in a new tab)'
	},
	marquee: { pauseLabel: 'Pause', playLabel: 'Play' },
	modal: { closeLabel: 'Close' },
	navbar: { label: 'Main', menuLabel: 'Menu' },
	numberInput: { decrementLabel: 'Decrease', incrementLabel: 'Increase' },
	onlineStatus: {
		/** Heading of the notice and the text announced when the connection is lost. */
		offlineTitle: 'You are offline',
		/** Second line of the notice. Empty text leaves it out. */
		offlineText: 'Some features may not work until the connection is back.',
		/** Announced when the connection returns. Empty text announces nothing. */
		onlineText: 'Back online'
	},
	pagination: { label: 'Pagination', prevLabel: 'Previous', nextLabel: 'Next', pageLabel: 'Page', ofLabel: 'of' },
	pinInput: { digitLabel: 'Digit {index} of {length}' },
	progressRing: { loadingText: 'Loading' },
	rating: { starLabel: '{value} of {max} stars' },
	resizable: { handleLabel: 'Resize {panel}' },
	scrollArea: { label: 'Scrollable content' },
	skipLink: { label: 'Skip to main content' },
	sparkline: { label: 'Trend: first {first}, last {last}, min {min}, max {max}', emptyLabel: 'No data' },
	spinner: { label: 'Loading' },
	stat: { upLabel: 'up {value}', downLabel: 'down {value}', flatLabel: 'unchanged' },
	statusDot: { statuses: { ok: 'OK', warn: 'Degraded', down: 'Down', idle: 'Idle', busy: 'Busy' } },
	stepper: {
		label: 'Progress',
		completeLabel: 'completed',
		compactLabel: 'Step {current} of {total}: {label}',
		doneLabel: 'All {total} steps completed',
		backLabel: 'Back to {label}'
	},
	table: { empty: 'No entries' },
	tag: { removeLabel: 'Remove' },
	tagInput: {
		removeLabel: 'Remove {tag}',
		instructions: 'Press Enter or comma to add a tag. Backspace in the empty field removes the last tag.',
		addedText: 'Added {tag}',
		removedText: 'Removed {tag}',
		duplicateText: '{tag} is already added',
		maxText: 'At most {max} tags'
	},
	terminal: { label: 'Terminal', copyLabel: 'Copy', copiedLabel: 'Copied' },
	themeToggle: {
		/** Accessible name of the two-theme toggle button. */
		toggleLabel: 'Dark mode',
		/** Accessible name of the menu of three or more themes. */
		menuLabel: 'Theme'
	},
	timeline: { statuses: { done: 'Done', current: 'Current', upcoming: 'Upcoming', error: 'Failed' } },
	toaster: { dismissLabel: 'Dismiss', undoLabel: 'Undo', label: 'Notifications' }
};

/** Every default text, by component and name. All values are strings. */
export type KernStrings = typeof catalogue;

/** A complete set of texts for one language. `lang` is its BCP 47 tag; it also sets the number and date format. */
export interface KernBundle extends KernStrings {
	lang: string;
}

type DeepPartial<T> = { [K in keyof T]?: (T[K] extends string ? string : DeepPartial<T[K]>) | undefined };

/**
 * What `setStrings` accepts: any part of the catalogue. `lang` (BCP 47) additionally makes the
 * components that format numbers and dates use that locale when their `locale` prop is not set.
 */
export type KernStringsInput = DeepPartial<KernStrings> & { lang?: string | undefined };

/** The built-in English texts: the defaults. */
export const en: KernBundle = { lang: 'en', ...catalogue };

/* ───────────────────────────── shared store ───────────────────────────── */

type Plain = { [key: string]: Plain | string };
const UNSAFE = new Set(['__proto__', 'constructor', 'prototype']);

function isPlain(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Copy of `source` with only strings and plain objects, merged over `into` (later wins). */
function mergeInto(into: Plain, source: Record<string, unknown>): void {
	for (const key of Object.keys(source)) {
		if (UNSAFE.has(key)) continue;
		const value = source[key];
		if (typeof value === 'string') into[key] = value;
		else if (isPlain(value)) {
			const current = into[key];
			const target: Plain = typeof current === 'object' ? current : {};
			mergeInto(target, value);
			into[key] = target;
		}
	}
}

/** `base` with the strings of `overrides` where `base` has the same key; other keys of `overrides` are ignored. */
function resolveInto<T extends object>(base: T, overrides: unknown): T {
	const out: Record<string, unknown> = {};
	const over = isPlain(overrides) ? overrides : {};
	for (const key of Object.keys(base)) {
		const value = (base as Record<string, unknown>)[key];
		if (typeof value === 'string') out[key] = typeof over[key] === 'string' ? over[key] : value;
		else if (isPlain(value)) out[key] = resolveInto(value, over[key]);
	}
	return out as T;
}

/** The part of the store a kern copy relies on. Another shape (an older copy) stays untouched. */
export interface StringsStore {
	/** Shape version of the shared store (see `sharedStringsStore`). */
	readonly version: 1;
	/** Texts the consumer chose, merged; keys the copy does not know are ignored when resolving. */
	readonly overrides: Readonly<Record<string, unknown>>;
	/** BCP 47 tag the consumer chose, if any. */
	readonly lang: string | undefined;
	/** Counts every change. */
	readonly revision: number;
	/** Replaces the choice by the merge of `inputs`. */
	set(inputs: readonly KernStringsInput[]): void;
	/** Back to the built-in English texts. */
	reset(): void;
	/** Makes `bundle` available to `setLocale(lang)`. */
	register(lang: string, bundle: KernStringsInput): void;
	/** The bundle registered for `lang` (exact tag, else its primary language). */
	bundle(lang: string): KernStringsInput | undefined;
	/** Calls `fn` after every change. Returns the unsubscribe function. */
	subscribe(fn: () => void): () => void;
}

/** A new, independent store, e.g. for tests. */
export function createStringsStore(): StringsStore {
	let overrides: Plain = {};
	let lang: string | undefined;
	let revision = 0;
	const locales = new Map<string, KernStringsInput>();
	const listeners = new Set<() => void>();

	function notify(): void {
		revision++;
		for (const fn of [...listeners]) {
			try {
				fn();
			} catch (error) {
				if (typeof reportError === 'function') reportError(error);
				else console.error(error);
			}
		}
	}

	return {
		version: 1,
		get overrides() {
			return overrides;
		},
		get lang() {
			return lang;
		},
		get revision() {
			return revision;
		},
		set(inputs) {
			const next: Plain = {};
			let nextLang: string | undefined;
			for (const input of inputs) {
				if (!isPlain(input)) continue;
				mergeInto(next, input);
				const tag = input.lang;
				if (typeof tag === 'string' && tag.trim() !== '') nextLang = tag.trim();
			}
			delete next.lang;
			overrides = next;
			lang = nextLang;
			notify();
		},
		reset() {
			overrides = {};
			lang = undefined;
			notify();
		},
		register(tag, bundle) {
			const key = tag.trim().toLowerCase();
			if (key !== '' && isPlain(bundle)) locales.set(key, bundle);
		},
		bundle(tag) {
			const key = tag.trim().toLowerCase();
			return locales.get(key) ?? locales.get(key.split('-')[0] ?? key);
		},
		subscribe(fn) {
			listeners.add(fn);
			return () => listeners.delete(fn);
		}
	};
}

const KEY = Symbol.for('kern.strings');
let own: StringsStore | undefined;

function isStore(value: unknown): value is StringsStore {
	return isPlain(value) && value.version === 1 && typeof value.set === 'function' && typeof value.subscribe === 'function';
}

/**
 * The page-wide store. The first kern copy to load puts it on `globalThis[Symbol.for('kern.strings')]`
 * and every copy uses the same one. A store of another shape (an older kern copy) stays untouched;
 * this copy then keeps its own.
 */
export function sharedStringsStore(): StringsStore {
	if (own) return own;
	const g = globalThis as typeof globalThis & { [KEY]?: unknown };
	const existing = g[KEY];
	if (isStore(existing)) return (own = existing);
	own = createStringsStore();
	if (existing === undefined) g[KEY] = own;
	return own;
}

/** The catalogue for the store's current choice: English with the chosen texts on top. */
export function resolveStrings(store: StringsStore = sharedStringsStore()): KernStrings {
	const { lang: _lang, ...base } = en;
	return resolveInto(base, store.overrides);
}

/* ───────────────────────────── public API ───────────────────────────── */

/**
 * Sets the default texts of every component, in every build on the page. Pass a bundle (`de`), a
 * part of the catalogue (`{ modal: { closeLabel: 'Fermer' } }`), or several: later ones win. The
 * call replaces the earlier choice; `setStrings()` without arguments goes back to English.
 * Props of a component still win. Call it before the first render, or at any time to switch language:
 * components already on the page update.
 */
export function setStrings(...inputs: readonly KernStringsInput[]): void {
	if (inputs.length === 0) sharedStringsStore().reset();
	else sharedStringsStore().set(inputs);
}

/** Back to the built-in English texts (and the browser's number and date format). */
export function resetStrings(): void {
	sharedStringsStore().reset();
}

/** The texts in use: English with the chosen texts on top. */
export function getStrings(): KernStrings {
	return resolveStrings();
}

/** The BCP 47 tag of the chosen bundle, or `undefined` when none was chosen. */
export function getLang(): string | undefined {
	return sharedStringsStore().lang;
}

/** Makes a bundle available under a language tag, for `setLocale` and `followLang`. */
export function registerStrings(lang: string, bundle: KernStringsInput): void {
	sharedStringsStore().register(lang, bundle);
}

/**
 * Selects the bundle registered for `lang` (`de-AT` finds `de`). Without a bundle the texts stay
 * English and only the number and date format follows `lang`; the result is `false` then.
 * `undefined` or an empty tag goes back to the defaults.
 */
export function setLocale(lang: string | undefined): boolean {
	const store = sharedStringsStore();
	const tag = lang?.trim();
	if (!tag) {
		store.reset();
		return false;
	}
	const bundle = store.bundle(tag);
	store.set(bundle ? [bundle, { lang: tag }] : [{ lang: tag }]);
	return bundle !== undefined;
}

/**
 * Follows the `lang` attribute of `root` (default `<html>`): selects the matching registered bundle
 * now and whenever the attribute changes. Returns the function that stops following. Does nothing
 * on the server.
 */
export function followLang(root?: Element): () => void {
	if (typeof document === 'undefined') return () => undefined;
	const el = root ?? document.documentElement;
	const apply = () => void setLocale(el.getAttribute('lang') ?? undefined);
	apply();
	if (typeof MutationObserver === 'undefined') return () => undefined;
	const observer = new MutationObserver(apply);
	observer.observe(el, { attributes: true, attributeFilter: ['lang'] });
	return () => observer.disconnect();
}
