/*
 * Data shapes of the custom elements' list/object properties and event details, as the
 * elements accept them (JSON attributes or properties). Self-contained on purpose: this file
 * is copied verbatim into dist-elements/kern-elements.d.ts by scripts/elements-manifest.mjs,
 * so consumers need no Svelte types. Wrappers refer to these names in `@prop` / `@event` tags.
 * Keep in step with the Svelte components' exported types (minus Svelte-only callbacks).
 */

export interface SelectOption { value: string; label: string; disabled?: boolean }
export interface ComboboxOption { value: string; label: string; disabled?: boolean }
export interface RadioOption { value: string; label: string; hint?: string; disabled?: boolean }
export interface SegmentOption { value: string; label: string; disabled?: boolean }
export interface ColorSwatch {
	/** Any accepted hex form. */
	value: string;
	/** Accessible name; default: the hex value. */
	label?: string;
}
export interface TabItem { id: string; label: string; disabled?: boolean }
export interface BreadcrumbItem {
	label: string;
	/** Without `href` the item is plain text. */
	href?: string;
}
export interface NavbarItem {
	label: string;
	href: string;
	/** Marks the link of the current page (`aria-current="page"`). */
	current?: boolean;
}
/** Entry of <k-dropdown-menu> / <k-context-menu>; choosing an item fires `select` with its id. */
export type MenuEntry =
	| { type?: 'item'; id: string; label: string; href?: string; danger?: boolean; disabled?: boolean; shortcut?: string }
	| { type: 'separator' }
	| { type: 'label'; label: string };
export interface Command {
	id: string;
	label: string;
	/** Heading the command is listed under. */
	group?: string;
	/** Extra search terms. */
	keywords?: string[];
	/** Shortcut hint shown on the right, e.g. "Ctrl+S". */
	shortcut?: string;
}
export interface TreeNode {
	id: string;
	label: string;
	children?: TreeNode[];
	/** Can be focused and expanded, but not selected. */
	disabled?: boolean;
}
export interface TableColumn {
	key: string;
	label: string;
	align?: 'start' | 'end' | 'center';
	/** Set in the mono family: numbers, ids. */
	mono?: boolean;
	sortable?: boolean;
}
export type TableRow = Record<string, unknown>;
export type DataRowKey = string | number;
export type DataSortDir = 'asc' | 'desc';
export interface StepItem { id: string; label: string; description?: string }
export type TimelineStatus = 'done' | 'current' | 'upcoming' | 'error';
export interface TimelineItem {
	id: string;
	title: string;
	/** ISO date or date-time, or free text. */
	time?: string;
	description?: string;
	/** Default `done`. */
	status?: TimelineStatus;
}
export type HistoryStatus = 'ok' | 'warn' | 'down' | 'none';
export interface HistoryItem {
	/** Name of the period, e.g. a date. */
	label: string;
	status: HistoryStatus;
	/** Extra text, e.g. "2 min outage". */
	detail?: string;
}
export interface HeatmapDatum {
	/** ISO date `yyyy-mm-dd`. Several entries of one day add up. */
	date: string;
	value: number;
}
export interface TerminalLine {
	/** Prompt in front of the command. Defaults to the `prompt` attribute. */
	prompt?: string;
	/** The command that is typed. */
	text: string;
	/** What the command prints. One string = one line. */
	output?: string | string[];
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
	label?: string;
	/** Smallest size in % of the group. Default 10. */
	min?: number;
	/** Largest size in %. Default 100. */
	max?: number;
}
export type DotStatus = 'ok' | 'warn' | 'down' | 'idle' | 'busy';

export type ToastTone = 'info' | 'ok' | 'warn' | 'danger';
export interface ToastItem {
	id: number;
	message: string;
	title?: string;
	tone: ToastTone;
	/** Milliseconds; 0 keeps it until dismissed. */
	duration: number;
	action?: { label: string; onclick: () => void };
}
export type ToastInput = Partial<Omit<ToastItem, 'id' | 'message'>> & { message: string };
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
