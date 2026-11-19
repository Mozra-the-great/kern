// Compile-time guard (npm run check): the self-contained shapes in types.ts, which ship in
// kern-elements.d.ts, must stay identical to the Svelte components' types. Not bundled.
import type * as E from './types.js';
import type { SelectOption } from '../lib/components/Select.svelte';
import type { ComboboxOption } from '../lib/components/Combobox.svelte';
import type { RadioOption } from '../lib/components/RadioGroup.svelte';
import type { SegmentOption } from '../lib/components/SegmentedControl.svelte';
import type { ColorSwatch } from '../lib/components/ColorPicker.svelte';
import type { TabItem } from '../lib/components/Tabs.svelte';
import type { TabLinkItem } from '../lib/components/TabLinks.svelte';
import type { BreadcrumbItem } from '../lib/components/Breadcrumb.svelte';
import type { NavbarItem } from '../lib/components/Navbar.svelte';
import type { TreeNode } from '../lib/components/TreeView.svelte';
import type { StepItem } from '../lib/components/Stepper.svelte';
import type { TimelineItem, TimelineStatus } from '../lib/components/Timeline.svelte';
import type { HistoryItem, HistoryStatus } from '../lib/components/HistoryBar.svelte';
import type { HeatmapDatum } from '../lib/components/Heatmap.svelte';
import type { TerminalLine } from '../lib/components/Terminal.svelte';
import type { ResizablePanel } from '../lib/components/Resizable.svelte';
import type { DotStatus } from '../lib/components/StatusDot.svelte';
import type { DataRowKey, DataSortDir } from '../lib/components/DataTable.svelte';
import type { ThemeOption } from '../lib/components/theme.js';
import type { ToastCloseReason, ToastInput, ToastItem } from '../lib/components/toast.svelte.js';
import type { toast, dismissToast } from '../lib/components/toast.svelte.js';
import type { KernBundle, KernStringsInput } from '../lib/components/strings.js';
import type { Politeness } from '../lib/components/announcer.js';

type Mutual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
/** Mutually assignable and the same keys (catches a missing or extra optional field). */
type Same<A, B> = Mutual<A, B> extends true ? Mutual<keyof A, keyof B> : false;
type Assert<T extends true> = T;

export type Checks = [
	Assert<Same<E.SelectOption, SelectOption>>,
	Assert<Same<E.ComboboxOption, ComboboxOption>>,
	Assert<Same<E.RadioOption, RadioOption>>,
	Assert<Same<E.SegmentOption, SegmentOption>>,
	Assert<Same<E.ColorSwatch, ColorSwatch>>,
	Assert<Same<E.TabItem, TabItem>>,
	Assert<Same<E.TabLinkItem, TabLinkItem>>,
	Assert<Same<E.BreadcrumbItem, BreadcrumbItem>>,
	Assert<Same<E.NavbarItem, NavbarItem>>,
	Assert<Same<E.TreeNode, TreeNode>>,
	Assert<Same<E.StepItem, StepItem>>,
	Assert<Same<E.TimelineItem, TimelineItem>>,
	Assert<Same<E.TimelineStatus, TimelineStatus>>,
	Assert<Same<E.HistoryItem, HistoryItem>>,
	Assert<Same<E.HistoryStatus, HistoryStatus>>,
	Assert<Same<E.HeatmapDatum, HeatmapDatum>>,
	Assert<Same<E.TerminalLine, TerminalLine>>,
	Assert<Same<E.ResizablePanel, ResizablePanel>>,
	Assert<Same<E.DotStatus, DotStatus>>,
	Assert<Same<E.DataRowKey, DataRowKey>>,
	Assert<Same<E.DataSortDir, DataSortDir>>,
	Assert<Same<E.ThemeOption, ThemeOption>>,
	Assert<Same<E.ToastItem, ToastItem>>,
	Assert<Same<E.ToastInput, ToastInput>>,
	Assert<Same<E.ToastCloseReason, ToastCloseReason>>,
	Assert<Same<E.ToastFunction, typeof toast>>,
	Assert<Same<E.KernGlobal['dismissToast'], typeof dismissToast>>,
	Assert<Same<E.KernStringsInput, KernStringsInput>>,
	Assert<Same<E.KernBundle, KernBundle>>,
	Assert<Same<E.AnnouncePoliteness, Politeness>>
];
