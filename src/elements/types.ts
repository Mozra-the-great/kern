/*
 * Data shapes of the custom elements' list/object properties and event details, as the
 * elements accept them (JSON attributes or properties). Self-contained on purpose: this file
 * is copied verbatim into dist-elements/kern-elements.d.ts by scripts/elements-manifest.mjs,
 * so consumers need no Svelte types. Wrappers refer to these names in `@prop` / `@event` tags.
 * Keep in step with the Svelte components' exported types (minus Svelte-only callbacks).
 */

// The generator replaces the next two lines by the interface itself (written from the catalogue in
// src/lib/components/strings.ts), so the shipped d.ts needs no import.
import type { KernStrings } from '../lib/components/strings.js';
export type { KernStrings };

export interface SelectOption {
	value: string;
	label: string;
	disabled?: boolean | undefined;
}
export interface ComboboxOption {
	value: string;
	label: string;
	disabled?: boolean | undefined;
}
export interface RadioOption {
	value: string;
	label: string;
	hint?: string | undefined;
	disabled?: boolean | undefined;
}
export interface SegmentOption {
	value: string;
	label: string;
	disabled?: boolean | undefined;
}
export interface ColorSwatch {
	/** Any accepted hex form. */
	value: string;
	/** Accessible name; default: the hex value. */
	label?: string | undefined;
}
export interface TabItem {
	id: string;
	label: string;
	disabled?: boolean | undefined;
	/** Not rendered and skipped by the arrow keys, e.g. a page only admins see. */
	hidden?: boolean | undefined;
	/** Id of the element the tab controls (`aria-controls`) when there are no panels. Must be in the same root as the tabs (an id in the page does not reach into the element). */
	controls?: string | undefined;
	/** Short visible text after the label, e.g. a count. */
	badge?: string | number | undefined;
	/** A small dot after the label, e.g. for a sync error. Ignored when `badge` is set. */
	dot?: boolean | undefined;
	/** Spoken after the label instead of the badge text, e.g. "3 unread" or "Sync error"; with a `badge` it should start with the badge text. A dot without it is not announced. */
	badgeLabel?: string | undefined;
	/** Colour of the badge or dot. Default `accent`. */
	badgeTone?: 'accent' | 'danger' | undefined;
}
export interface TabLinkItem {
	href: string;
	label: string;
	/** The link of the page the visitor is on (`aria-current="page"`). */
	current?: boolean | undefined;
	/** Short visible text after the label, e.g. a count. */
	badge?: string | number | undefined;
	/** A small dot after the label. Ignored when `badge` is set. */
	dot?: boolean | undefined;
	/** Spoken after the label instead of the badge text. A dot without it is not announced. */
	badgeLabel?: string | undefined;
	/** Colour of the badge or dot. Default `accent`. */
	badgeTone?: 'accent' | 'danger' | undefined;
}
/** Item of <k-sortable-list>. */
export interface SortableItem {
	/** Identifies the item while it moves. */
	id: string | number;
	/** The item's name: visible text, and part of the accessible name of its buttons. */
	label: string;
	/** Second, muted line under the name. */
	description?: string | undefined;
}
/** Item of <k-select-grid>. */
export interface SelectGridItem {
	/** Identifies the item: what `selected` lists, and what stays with it when it moves. */
	id: string | number;
	/** The item's name: its accessible name and the caption under the picture. */
	label: string;
	/** URL of the picture. */
	src?: string | undefined;
	/** Second, muted line under the caption. */
	description?: string | undefined;
}
export interface BreadcrumbItem {
	label: string;
	/** Without `href` the item is plain text. */
	href?: string | undefined;
}
export interface NavbarItem {
	label: string;
	href: string;
	/** Marks the link of the current page (`aria-current="page"`). */
	current?: boolean | undefined;
}
/** Entry of <k-dropdown-menu> / <k-context-menu>; choosing an item fires `select` with its id. */
export type MenuEntry =
	| {
			type?: 'item' | undefined;
			id: string;
			label: string;
			href?: string | undefined;
			danger?: boolean | undefined;
			disabled?: boolean | undefined;
			shortcut?: string | undefined;
	  }
	| { type: 'separator' }
	| { type: 'label'; label: string };
export interface Command {
	id: string;
	label: string;
	/** Heading the command is listed under. */
	group?: string | undefined;
	/** Extra search terms. */
	keywords?: string[] | undefined;
	/** Shortcut hint shown on the right, e.g. "Ctrl+S". */
	shortcut?: string | undefined;
}
export interface TreeNode {
	id: string;
	label: string;
	children?: TreeNode[] | undefined;
	/** Can be focused and expanded, but not selected. */
	disabled?: boolean | undefined;
}
export interface TableColumn {
	key: string;
	label: string;
	align?: 'start' | 'end' | 'center' | undefined;
	/** Set in the mono family: numbers, ids. */
	mono?: boolean | undefined;
	sortable?: boolean | undefined;
}
export type TableRow = Record<string, unknown>;
export type DataRowKey = string | number;
export type DataSortDir = 'asc' | 'desc';
export interface StepItem {
	id: string;
	label: string;
	description?: string | undefined;
}
export type TimelineStatus = 'done' | 'current' | 'upcoming' | 'error';
export interface TimelineItem {
	id: string;
	title: string;
	/** ISO date or date-time, or free text. */
	time?: string | undefined;
	description?: string | undefined;
	/** Default `done`. */
	status?: TimelineStatus | undefined;
}
export type HistoryStatus = 'ok' | 'warn' | 'down' | 'none';
export interface HistoryItem {
	/** Name of the period, e.g. a date. */
	label: string;
	status: HistoryStatus;
	/** Extra text, e.g. "2 min outage". */
	detail?: string | undefined;
}
export interface HeatmapDatum {
	/** ISO date `yyyy-mm-dd`. Several entries of one day add up. */
	date: string;
	value: number;
}
export interface TerminalLine {
	/** Prompt in front of the command. Defaults to the `prompt` attribute. */
	prompt?: string | undefined;
	/** The command that is typed. */
	text: string;
	/** What the command prints. One string = one line. */
	output?: string | string[] | undefined;
}
export interface ThemeOption {
	/** Value of `data-theme`. */
	id: string;
	/** Visible name, e.g. in the menu. */
	label: string;
}
export interface ResizablePanel {
	/** Unique within the group. */
	id: string;
	/** Name of the panel, used in the label of its handle. Default: the id. */
	label?: string | undefined;
	/** Smallest size in % of the group. Default 10. */
	min?: number | undefined;
	/** Largest size in %. Default 100. */
	max?: number | undefined;
}
export type DotStatus = 'ok' | 'warn' | 'down' | 'idle' | 'busy';

export type ToastTone = 'info' | 'ok' | 'warn' | 'danger';
/**
 * Why a toast closed. `timeout`: its time ran out; `dismiss`: the dismiss button or `dismissToast(id)`;
 * `action`: its action button; `undo`: its undo button; `replaced`: a newer toast took its place
 * (same `key`, or the oldest one above the limit); `cleared`: `toast.clear()`.
 */
export type ToastCloseReason = 'timeout' | 'dismiss' | 'action' | 'undo' | 'replaced' | 'cleared';
export interface ToastItem {
	id: number;
	message: string;
	title?: string | undefined;
	tone: ToastTone;
	/** Milliseconds; 0 keeps it until dismissed. */
	duration: number;
	action?: { label: string; onclick: () => void } | undefined;
	/** A new toast with the same key replaces this one (reason `replaced`). */
	key?: string | undefined;
	/** Shows an undo button (label: the toaster's `undo-label`); runs when it is pressed. */
	onundo?: (() => void) | undefined;
	/** Runs once when the toast closes for any reason except undo: the place to commit a deletion. */
	oncommit?: (() => void) | undefined;
	/** Runs once when the toast closes, with the reason. */
	onclose?: ((reason: ToastCloseReason) => void) | undefined;
}
export interface ToastInput {
	message: string;
	title?: string | undefined;
	/** Default `info`. */
	tone?: ToastTone | undefined;
	/** Milliseconds; 0 keeps it until dismissed. Default per tone: info/ok 6000, warn 10000, danger 0. */
	duration?: number | undefined;
	action?: ToastItem['action'];
	key?: ToastItem['key'];
	onundo?: ToastItem['onundo'];
	oncommit?: ToastItem['oncommit'];
	onclose?: ToastItem['onclose'];
}
/** Detail of the `dismiss`, `undo` and `action` events of <k-toaster>. */
export interface ToastEventDetail {
	id: number;
	key: string | undefined;
}
/**
 * `toast('Saved')`, `toast({ message, tone, … })`, `toast.ok/warn/danger(message, options)`. Returns the id.
 * `toast.clear()` closes every toast (reason `cleared`).
 */
export interface ToastFunction {
	(input: string | ToastInput): number;
	ok(message: string, options?: Partial<ToastInput>): number;
	warn(message: string, options?: Partial<ToastInput>): number;
	danger(message: string, options?: Partial<ToastInput>): number;
	clear(): void;
}
/** Detail of the `change` event of <k-online-status>. */
export interface OnlineChangeDetail {
	/** `true` when the connection came back, `false` when it was lost. */
	online: boolean;
}
/** Detail of the `download` event of <k-download-button>. */
export interface DownloadDetail {
	/** The file name used, after cleaning. */
	name: string;
	/** Size in bytes. */
	size: number;
	/** MIME type; empty when there is none. */
	type: string;
}
export type DownloadErrorCode = 'no-dom' | 'invalid' | 'failed' | 'content';
/** Detail of the `download-error` event of <k-download-button>. */
export interface DownloadErrorDetail {
	/** `content`: no content or `getContent` failed; `failed`: the browser refused; `invalid`, `no-dom`: not a Blob, no document. */
	code: DownloadErrorCode;
	/** For developers (English). */
	message: string;
}
export type AnnouncePoliteness = 'polite' | 'assertive';
type StringsDeepPartial<T> = { [K in keyof T]?: (T[K] extends string ? string : StringsDeepPartial<T[K]>) | undefined };
/** A part of the default texts, by component and name (`{ modal: { closeLabel: 'Schließen' } }`); `lang` is a BCP 47 tag. */
export type KernStringsInput = StringsDeepPartial<KernStrings> & { lang?: string | undefined };
/** A complete set of texts for one language. */
export interface KernBundle extends KernStrings {
	lang: string;
}
/** `window.kern.strings`: the default texts of every element. Attributes and properties still win. */
export interface KernStringsApi {
	/** Sets the texts: a bundle (`kern.strings.de`), a part of the catalogue, or several (later ones win). Replaces the earlier choice. */
	set(...inputs: readonly KernStringsInput[]): void;
	/** Back to the built-in English texts. */
	reset(): void;
	/** The texts in use. */
	get(): KernStrings;
	/** Makes a bundle available to `setLocale` and `followLang`. `en` and `de` are registered already. */
	register(lang: string, bundle: KernStringsInput): void;
	/** Selects the bundle of a language tag (`de-AT` finds `de`); `false` when there is none (texts stay English, formats follow the tag). */
	setLocale(lang: string | undefined): boolean;
	/** Follows the `lang` attribute of `root` (default `<html>`). Returns the function that stops it. */
	followLang(root?: Element): () => void;
	/** The tag of the chosen bundle, if any. */
	readonly lang: string | undefined;
	/** The built-in bundles. */
	readonly en: KernBundle;
	readonly de: KernBundle;
}
/** Light or dark: which way an accent is moved when it fails its contrast. */
export type AccentScheme = 'light' | 'dark';
/** Which groups of tokens an accent sets. */
export type AccentRole = 'primary' | 'accent' | 'focus';
export type AccentErrorCode = 'invalid-color' | 'invalid-ground' | 'unknown-theme' | 'invalid-selector' | 'invalid-element' | 'no-dom';
export interface AccentError {
	code: AccentErrorCode;
	message: string;
}
/** What an accent has to be readable against, for one standard theme. */
export interface AccentGround {
	scheme: AccentScheme;
	bg: string;
	raised: string;
	sunken: string;
	fg: string;
}
/** Surfaces to check against when no standard theme fits (a custom theme). Hex colours. */
export interface AccentSurfacesInput {
	bg: string;
	raised?: string | undefined;
	sunken?: string | undefined;
	fg?: string | undefined;
	scheme?: AccentScheme | undefined;
}
export interface AccentOptions {
	/** `data-theme` value to guarantee the contrast on; an unknown id is an `unknown-theme` failure unless `scheme` or `surfaces` is given. */
	theme?: string | null | undefined;
	/** Without `theme`: guarantee the contrast on every standard theme of this scheme at once. */
	scheme?: AccentScheme | undefined;
	/** Your own surfaces; they win over `theme` and `scheme`. */
	surfaces?: AccentSurfacesInput | undefined;
	/** Default: all of `primary`, `accent` and `focus`. */
	roles?: readonly AccentRole[] | undefined;
}
/** A token whose value is not the raw accent because the raw accent failed its contrast. */
export interface AccentAdjustment {
	token: string;
	from: string;
	to: string;
	/** `text`: needed 4.5:1; `ui`: needed 3:1. */
	kind: 'text' | 'ui';
	message: string;
}
export interface AccentCheck {
	token: string;
	on: string;
	ratio: number;
	min: number;
	pass: boolean;
}
export interface AccentOk {
	ok: true;
	/** The accent as given, normalised to `#rrggbb`. */
	accent: string;
	scheme: AccentScheme;
	/** `--k-*` token to value. */
	tokens: Readonly<Record<string, string>>;
	/** The same as a `style=""` attribute value. */
	style: string;
	adjustments: readonly AccentAdjustment[];
	checks: readonly AccentCheck[];
	guaranteed: boolean;
}
export interface AccentFailure {
	ok: false;
	error: AccentError;
}
export type AccentResult = AccentOk | AccentFailure;
export interface AccentCssOptions {
	/** Element that carries `data-theme`; default `:root`. */
	selector?: string | undefined;
	roles?: readonly AccentRole[] | undefined;
}
export interface AccentCssOk {
	ok: true;
	accent: string;
	css: string;
	themes: Readonly<Record<string, AccentOk>>;
	guaranteed: boolean;
}
export type AccentCssResult = AccentCssOk | AccentFailure;
export interface InstallAccentOptions extends AccentCssOptions {
	/** Also store the CSS under this `localStorage` key for the head script. */
	storageKey?: string | undefined;
	/** `accent`: paint the browser UI (`<meta name="theme-color">`) in the accent. */
	themeColor?: 'accent' | false | undefined;
	document?: Document | undefined;
	/** CSP nonce for the `<style>` element (`style-src 'nonce-…'`). */
	nonce?: string | undefined;
}
export interface AccentScriptOptions {
	/** CSP nonce the head script puts on the `<style>` it adds. */
	nonce?: string | undefined;
}
export interface RemoveAccentOptions {
	storageKey?: string | undefined;
	document?: Document | undefined;
}
export interface ApplyAccentOptions extends AccentOptions {
	/** Skip reading the element's computed `--k-bg…` and use `theme` / `scheme` / `surfaces` only. */
	computed?: boolean | undefined;
}
/** `window.kern.accent`: a custom accent colour on top of any standard theme, with WCAG contrast guaranteed. */
export interface KernAccentApi {
	/** The tokens for one theme or scheme (pure). Invalid input returns `{ ok: false, error }`. */
	tokens(accent: string, options?: AccentOptions): AccentResult;
	/** A stylesheet with a rule per standard theme (pure; for the server or the head). */
	css(accent: string, options?: AccentCssOptions): AccentCssResult;
	/** Puts the accent on the whole page (`<style id="kern-accent">`), optionally stored for the head script. */
	install(accent: string, options?: InstallAccentOptions): AccentCssResult;
	/** Undoes `install`. */
	remove(options?: RemoveAccentOptions): void;
	/** Inline tokens on one element, for the theme it shows right now. */
	apply(el: Element & ElementCSSInlineStyle, accent: string, options?: ApplyAccentOptions): AccentResult;
	/** Removes what `apply` set. */
	clear(el: ElementCSSInlineStyle): void;
	/** Inline `<head>` script that applies the stored accent before the first paint. */
	script(storageKey: string, options?: AccentScriptOptions): string;
	/** The surfaces of every standard `data-theme` value. */
	readonly grounds: Readonly<Record<string, AccentGround>>;
	/** The tokens an accent can set. */
	readonly tokenNames: readonly string[];
}
export interface KernGlobal {
	toast: ToastFunction;
	dismissToast(id: number): void;
	/** Says `message` through the page's <k-live-announcer>. `polite` is the default. */
	announce: (message: string, politeness?: AnnouncePoliteness) => void;
	strings: KernStringsApi;
	accent: KernAccentApi;
}
