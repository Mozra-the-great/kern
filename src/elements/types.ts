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
export interface KernGlobal {
	toast: ToastFunction;
	dismissToast(id: number): void;
	/** Says `message` through the page's <k-live-announcer>. `polite` is the default. */
	announce: (message: string, politeness?: AnnouncePoliteness) => void;
	strings: KernStringsApi;
}
