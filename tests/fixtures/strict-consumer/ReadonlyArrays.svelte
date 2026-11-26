<script lang="ts">
	// #142: every input-only list prop (and every array field of an exported item type) takes a
	// `readonly X[]` and an `as const` literal under `strict` + `exactOptionalPropertyTypes`, so a consumer
	// that keeps its data readonly needs no copy at the call site. A mutable array still works
	// (AllComponents.svelte). Bindable outputs (FileDrop.files, TagInput.value, DataTable.selected,
	// TreeView.expanded, Resizable.sizes) stay mutable and are not part of this file.
	// scripts/ci/readonly-arrays-dts.mjs (npm run check:dts) fails when a new list prop is mutable.
	import {
		Accordion,
		Breadcrumb,
		Carousel,
		ColorPicker,
		Combobox,
		CommandPalette,
		ContextMenu,
		DataTable,
		DropdownMenu,
		Heatmap,
		HistoryBar,
		Kbd,
		Navbar,
		RadioGroup,
		Resizable,
		SegmentedControl,
		Select,
		Sparkline,
		Stepper,
		Table,
		TabLinks,
		Tabs,
		TagInput,
		Terminal,
		ThemeToggle,
		Timeline,
		TreeView,
		Typewriter
	} from '@mozra-the-great/kern';
	import type {
		AccordionEntry,
		BreadcrumbItem,
		Column,
		ColorSwatch,
		ComboboxOption,
		Command,
		DataColumn,
		HeatmapDatum,
		HistoryItem,
		MenuEntry,
		NavbarItem,
		RadioOption,
		ResizablePanel,
		SegmentOption,
		SelectOption,
		StepItem,
		TabItem,
		TabLinkItem,
		TerminalLine,
		ThemeOption,
		TimelineItem,
		TreeNode
	} from '@mozra-the-great/kern';

	let text: string | undefined = $state();
	let open: boolean | undefined = $state();
	let num: number | undefined = $state();

	// `readonly X[]` values, as stuffcloud keeps them.
	const accordion: readonly AccordionEntry[] = [{ id: 'a', title: 'A' }];
	const crumbs: readonly BreadcrumbItem[] = [{ label: 'Home', href: '/' }];
	const swatches: readonly (string | ColorSwatch)[] = ['#ff0000', { value: '#00ff00', label: 'Green' }];
	const comboOptions: readonly ComboboxOption[] = [{ value: 'a', label: 'A' }];
	// Nested `keywords` is readonly too, both as a readonly variable and as a const tuple.
	const keywords: readonly string[] = ['theme', 'dark'];
	const commands: readonly Command[] = [
		{ id: 'c', label: 'C', keywords },
		{ id: 'd', label: 'D', keywords: ['x'] as const }
	];
	const menu: readonly MenuEntry[] = [{ id: 'm', label: 'M' }, { type: 'separator' }, { type: 'label', label: 'L' }];
	const nav: readonly NavbarItem[] = [{ label: 'Home', href: '/' }];
	const radios: readonly RadioOption[] = [{ value: 'a', label: 'A' }];
	const panels: readonly ResizablePanel[] = [{ id: 'l' }, { id: 'r' }];
	const segments: readonly SegmentOption[] = [{ value: 'a', label: 'A' }];
	const selectOptions: readonly SelectOption[] = [{ value: 'a', label: 'A' }];
	const values: readonly number[] = [1, 2, 3];
	const steps: readonly StepItem[] = [{ id: 's', label: 'S' }];
	const tabs: readonly TabItem[] = [{ id: 't', label: 'T' }];
	const links: readonly TabLinkItem[] = [{ href: '/a', label: 'A' }];
	const suggestions: readonly string[] = ['one', 'two'];
	const output: readonly string[] = ['line 1', 'line 2'];
	const lines: readonly TerminalLine[] = [
		{ text: 'ls', output },
		{ text: 'pwd', output: ['/'] as const },
		{ text: 'id', output: 'me' }
	];
	const themes: readonly ThemeOption[] = [{ id: 'code', label: 'Code' }];
	const timeline: readonly TimelineItem[] = [{ id: 'e', title: 'E' }];
	// Nested `children`, readonly at every level.
	const leaf: TreeNode = { id: 'leaf', label: 'Leaf' };
	const children: readonly TreeNode[] = [leaf, { id: 'inner', label: 'Inner', children: [leaf] as const }];
	const tree: readonly TreeNode[] = [{ id: 'n', label: 'N', children }];
	const heat: readonly HeatmapDatum[] = [{ date: '2026-01-01', value: 1 }];
	const history: readonly HistoryItem[] = [{ label: 'Mon', status: 'ok' }];
	const keys: readonly string[] = ['mod', 'K'];
	const slides: readonly string[] = ['a', 'b'];
	const words: readonly string[] = ['one', 'two'];

	interface Row extends Record<string, unknown> {
		id: number;
		name: string;
	}
	const rows: readonly Row[] = [{ id: 1, name: 'One' }];
	const columns: readonly Column<Row>[] = [{ key: 'name', label: 'Name' }];
	const dataColumns: readonly DataColumn<Row>[] = [{ key: 'name', label: 'Name' }];

	// `as const` literals, deeply readonly (readonly properties and readonly tuples).
	const constTabs = [
		{ id: 'a', label: 'A', badge: 3 },
		{ id: 'b', label: 'B', hidden: true }
	] as const;
	const constOptions = [
		{ value: 'a', label: 'A' },
		{ value: 'b', label: 'B', disabled: true }
	] as const;
	const constRadios = [{ value: 'a', label: 'A', hint: 'first' }] as const;
	const constLinks = [{ href: '/a', label: 'A', current: true }] as const;
	const constTree = [
		{
			id: 'root',
			label: 'Root',
			children: [
				{ id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] },
				{ id: 'b', label: 'B' }
			]
		}
	] as const;
	const constCommands = [{ id: 'c', label: 'C', keywords: ['theme', 'dark'] }] as const;
	const constThemes = [
		{ id: 'code', label: 'Code' },
		{ id: 'flower', label: 'Flower' }
	] as const;
	const constKeys = ['mod', 'K'] as const;
	const constSuggestions = ['one', 'two'] as const;
	const constSteps = [{ id: 's', label: 'S' }] as const;
	const constLines = [{ text: 'ls', output: ['a', 'b'] }] as const;
</script>

<Accordion items={accordion} />
<Accordion items={[{ id: 'a', title: 'A' }] as const} />
<Breadcrumb items={crumbs} />
<Breadcrumb items={[{ label: 'Home', href: '/' }] as const} />
<Carousel items={slides}>
	{#snippet slide(item, i)}{item}{i}{/snippet}
</Carousel>
<Carousel items={['a', 'b'] as const} bind:index={num}>
	{#snippet slide(item)}{item}{/snippet}
</Carousel>
<ColorPicker {swatches} bind:value={text} />
<ColorPicker swatches={['#f00', { value: '#0f0' }] as const} />
<Combobox options={comboOptions} bind:value={text} />
<Combobox options={constOptions} />
<CommandPalette {commands} bind:open />
<CommandPalette commands={constCommands} />
<ContextMenu items={menu}>Area</ContextMenu>
<ContextMenu items={[{ id: 'm', label: 'M', shortcut: 'Ctrl+M' }, { type: 'separator' }] as const}>Area</ContextMenu>
<DataTable {rows} columns={dataColumns} caption="Rows" />
<DataTable rows={[{ id: 1, name: 'One' }] as const} columns={[{ key: 'name', label: 'Name' }] as const} caption="Const rows" />
<DropdownMenu label="Menu" items={menu} />
<DropdownMenu label="Menu" items={[{ id: 'm', label: 'M' }] as const} />
<Heatmap data={heat} label="Activity" />
<Heatmap data={[{ date: '2026-01-01', value: 1 }] as const} label="Const activity" />
<HistoryBar items={history} label="Uptime" />
<HistoryBar items={[{ label: 'Mon', status: 'ok' }] as const} label="Const uptime" />
<Kbd {keys} />
<Kbd keys={constKeys} />
<Navbar items={nav} />
<Navbar items={[{ label: 'Home', href: '/' }] as const} />
<RadioGroup label="Radio" options={radios} bind:value={text} />
<RadioGroup label="Radio" options={constRadios} />
<Resizable {panels}>
	{#snippet panel(p)}{p.id}{/snippet}
</Resizable>
<Resizable panels={[{ id: 'l', min: 10 }, { id: 'r' }] as const}>
	{#snippet panel(p)}{p.id}{/snippet}
</Resizable>
<SegmentedControl options={segments} bind:value={text} />
<SegmentedControl options={constOptions} />
<Select options={selectOptions} bind:value={text} />
<Select options={constOptions} />
<Sparkline {values} />
<Sparkline values={[1, 2, 3] as const} />
<Stepper {steps} />
<Stepper steps={constSteps} />
<Table {rows} {columns} caption="Rows" />
<Table rows={[{ id: 1, name: 'One' }] as const} columns={[{ key: 'name', label: 'Name' }] as const} caption="Const rows" />
<TabLinks {links} label="Sections" />
<TabLinks links={constLinks} label="Const sections" />
<Tabs {tabs} bind:value={text} />
<Tabs tabs={constTabs} />
<TagInput {suggestions} />
<TagInput suggestions={constSuggestions} />
<Terminal {lines} />
<Terminal lines={constLines} />
<ThemeToggle {themes} bind:value={text} />
<ThemeToggle themes={constThemes} />
<Timeline items={timeline} />
<Timeline items={[{ id: 'e', title: 'E' }] as const} />
<TreeView nodes={tree} />
<TreeView nodes={constTree} />
<Typewriter text={words} />
<Typewriter text={['a', 'b'] as const} />
