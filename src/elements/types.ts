/*
 * Data shapes of the custom elements' list/object properties and event details, as the
 * elements accept them (JSON attributes or properties). Self-contained on purpose: this file
 * is copied verbatim into dist-elements/kern-elements.d.ts by scripts/elements-manifest.mjs,
 * so consumers need no Svelte types. Wrappers refer to these names in `@prop` / `@event` tags.
 * Keep in step with the Svelte components' exported types (minus Svelte-only callbacks).
 */

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
export interface ToastItem {
	id: number;
	message: string;
	title?: string | undefined;
	tone: ToastTone;
	/** Milliseconds; 0 keeps it until dismissed. */
	duration: number;
	action?: { label: string; onclick: () => void } | undefined;
}
export interface ToastInput {
	message: string;
	title?: string | undefined;
	/** Default `info`. */
	tone?: ToastTone | undefined;
	/** Milliseconds; 0 keeps it until dismissed. Default 5000. */
	duration?: number | undefined;
	action?: ToastItem['action'];
}
/** `toast('Saved')`, `toast({ message, tone, … })`, `toast.ok/warn/danger(message, options)`. Returns the id. */
export interface ToastFunction {
	(input: string | ToastInput): number;
	ok(message: string, options?: Partial<ToastInput>): number;
	warn(message: string, options?: Partial<ToastInput>): number;
	danger(message: string, options?: Partial<ToastInput>): number;
}
export interface KernGlobal {
	toast: ToastFunction;
	dismissToast(id: number): void;
}
