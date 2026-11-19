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
import type { SortableItem } from '../lib/components/SortableList.svelte';
import type { SelectGridItem } from '../lib/components/SelectGrid.svelte';
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
import type { DownloadError, DownloadErrorCode, DownloadOk } from '../lib/components/download.js';
import type * as A from '../lib/components/accent.js';

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
	Assert<Same<E.SortableItem, SortableItem>>,
	Assert<Same<E.SelectGridItem, SelectGridItem>>,
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
	Assert<Same<E.AnnouncePoliteness, Politeness>>,
	Assert<Same<E.DownloadDetail, Omit<DownloadOk, 'ok'>>>,
	Assert<Same<E.DownloadErrorCode, DownloadErrorCode>>,
	Assert<Same<E.DownloadErrorDetail, Pick<DownloadError, 'code' | 'message'>>>,
	Assert<Same<E.AccentScheme, A.AccentScheme>>,
	Assert<Same<E.AccentRole, A.AccentRole>>,
	Assert<Same<E.AccentErrorCode, A.AccentErrorCode>>,
	Assert<Same<E.AccentError, A.AccentError>>,
	Assert<Same<E.AccentGround, A.AccentGround>>,
	Assert<Same<E.AccentSurfacesInput, A.AccentSurfacesInput>>,
	Assert<Same<E.AccentOptions, A.AccentOptions>>,
	Assert<Same<E.AccentAdjustment, A.AccentAdjustment>>,
	Assert<Same<E.AccentCheck, A.AccentCheck>>,
	Assert<Same<E.AccentOk, A.AccentOk>>,
	Assert<Same<E.AccentFailure, A.AccentFailure>>,
	Assert<Same<E.AccentResult, A.AccentResult>>,
	Assert<Same<E.AccentCssOptions, A.AccentCssOptions>>,
	Assert<Same<E.AccentCssOk, A.AccentCssOk>>,
	Assert<Same<E.AccentCssResult, A.AccentCssResult>>,
	Assert<Same<E.InstallAccentOptions, A.InstallAccentOptions>>,
	Assert<Same<E.AccentScriptOptions, A.AccentScriptOptions>>,
	Assert<Same<E.RemoveAccentOptions, A.RemoveAccentOptions>>,
	Assert<Same<E.ApplyAccentOptions, A.ApplyAccentOptions>>,
	Assert<Same<E.KernAccentApi['tokens'], typeof A.accentTokens>>,
	Assert<Same<E.KernAccentApi['css'], typeof A.accentCss>>,
	Assert<Same<E.KernAccentApi['install'], typeof A.installAccent>>,
	Assert<Same<E.KernAccentApi['remove'], typeof A.removeAccent>>,
	Assert<Same<E.KernAccentApi['apply'], typeof A.applyAccent>>,
	Assert<Same<E.KernAccentApi['clear'], typeof A.clearAccent>>,
	Assert<Same<E.KernAccentApi['script'], typeof A.createAccentScript>>
];
