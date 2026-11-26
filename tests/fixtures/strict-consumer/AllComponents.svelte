<script lang="ts">
	// Every exported component at least once, optional props fed with values that may be undefined
	// and bindable props bound to `T | undefined` state. coverage.mjs checks that none is missing.
	import {
		Accordion,
		AccordionItem,
		Alert,
		Avatar,
		Badge,
		Breadcrumb,
		Button,
		Card,
		Caret,
		Carousel,
		Checkbox,
		Code,
		Collapsible,
		ColorPicker,
		Combobox,
		CommandPalette,
		ContextMenu,
		CopyButton,
		CountUp,
		DataTable,
		DatePicker,
		Divider,
		Drawer,
		DropdownMenu,
		EmptyState,
		Field,
		FileDrop,
		GridBackground,
		Heatmap,
		Highlight,
		HistoryBar,
		IconButton,
		Input,
		Kbd,
		VisuallyHidden,
		Label,
		Link,
		Marquee,
		Mascot,
		Modal,
		Navbar,
		NumberInput,
		Odometer,
		Pagination,
		PinInput,
		Popover,
		Progress,
		ProgressRing,
		RadioGroup,
		Rating,
		RelativeTime,
		Resizable,
		Reveal,
		Scramble,
		ScrollArea,
		SegmentedControl,
		Select,
		Skeleton,
		Slider,
		Sparkline,
		Spinner,
		Stat,
		StatusDot,
		Stepper,
		Switch,
		Table,
		Tabs,
		Tag,
		TagInput,
		Terminal,
		Textarea,
		ThemeToggle,
		Timeline,
		Toaster,
		Tooltip,
		TreeView,
		Typewriter,
		createToastQueue
	} from '@mozra-the-great/kern';
	import type {
		AccordionEntry,
		BreadcrumbItem,
		Column,
		ComboboxOption,
		Command,
		DataColumn,
		DataRowKey,
		DataSortDir,
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
		TerminalLine,
		ThemeOption,
		TimelineItem,
		TreeNode,
		ToastItem,
		ToastQueue
	} from '@mozra-the-great/kern';

	interface Props {
		maybeString?: string | undefined;
		maybeNumber?: number | undefined;
		maybeBoolean?: boolean | undefined;
	}
	let { maybeString, maybeNumber, maybeBoolean }: Props = $props();

	// Bindable props bound to state that starts out undefined.
	let open: boolean | undefined = $state();
	let focusTarget: HTMLElement | undefined = $state();
	const queue: ToastQueue = createToastQueue({ max: undefined });
	let checked: boolean | undefined = $state();
	let text: string | undefined = $state();
	let num: number | undefined = $state();
	let nullableNum: number | null | undefined = $state();
	let list: string[] | undefined = $state();
	let files: File[] | undefined = $state();
	let keys: DataRowKey[] | undefined = $state();
	let sortKey: string | null | undefined = $state();
	let sortDir: DataSortDir | undefined = $state();
	let sizes: number[] | undefined = $state();

	interface Row extends Record<string, unknown> {
		id: number;
		name: string;
	}
	const rows: Row[] = [{ id: 1, name: 'One' }];
	const columns: Column<Row>[] = $derived([{ key: 'name', label: 'Name', align: undefined, mono: maybeBoolean }]);
	const dataColumns: DataColumn<Row>[] = $derived([{ key: 'name', label: 'Name', sortable: maybeBoolean, format: undefined }]);
	const accordion: AccordionEntry[] = [{ id: 'a', title: 'A' }];
	const crumbs: BreadcrumbItem[] = $derived([{ label: 'Home', href: maybeString }]);
	const comboOptions: ComboboxOption[] = $derived([{ value: 'a', label: 'A', disabled: maybeBoolean }]);
	const commands: Command[] = $derived([{ id: 'c', label: 'C', group: maybeString, keywords: undefined, shortcut: maybeString }]);
	const menu: MenuEntry[] = $derived([{ id: 'm', label: 'M', href: maybeString, danger: maybeBoolean }, { type: 'separator' }]);
	const nav: NavbarItem[] = $derived([{ label: 'Home', href: '/', current: maybeBoolean }]);
	const radios: RadioOption[] = $derived([{ value: 'a', label: 'A', hint: maybeString }]);
	const panels: ResizablePanel[] = $derived([
		{ id: 'l', label: maybeString, min: maybeNumber },
		{ id: 'r', max: maybeNumber }
	]);
	const segments: SegmentOption[] = $derived([{ value: 'a', label: 'A', disabled: maybeBoolean }]);
	const selectOptions: SelectOption[] = $derived([{ value: 'a', label: 'A', disabled: maybeBoolean }]);
	const steps: StepItem[] = $derived([{ id: 's', label: 'S', description: maybeString }]);
	const tabs: TabItem[] = $derived([{ id: 't', label: 'T', disabled: maybeBoolean }]);
	const lines: TerminalLine[] = $derived([{ text: 'ls', prompt: maybeString, output: undefined }]);
	const themes: ThemeOption[] = [{ id: 'code', label: 'Code' }];
	const timeline: TimelineItem[] = $derived([{ id: 'e', title: 'E', time: maybeString, description: maybeString, status: undefined }]);
	const tree: TreeNode[] = $derived([{ id: 'n', label: 'N', children: undefined, disabled: maybeBoolean }]);
	const heat: HeatmapDatum[] = [{ date: '2026-01-01', value: 1 }];
	const history: HistoryItem[] = $derived([{ label: 'Mon', status: 'ok', detail: maybeString }]);
</script>

<Accordion items={accordion} single={maybeBoolean}>
	{#snippet content(id)}{id}{/snippet}
</Accordion>
<AccordionItem title="Item" bind:open name={maybeString}>Body</AccordionItem>
<Alert tone={undefined} title={maybeString} dismissLabel={maybeString} ondismiss={undefined}>Alert</Alert>
<Avatar name="Ada" src={maybeString} size={undefined} />
<Badge tone={undefined} look={undefined}>Badge</Badge>
<Breadcrumb items={crumbs} label={maybeString} max={maybeNumber} />
<Button
	variant={undefined}
	size={undefined}
	block={maybeBoolean}
	loading={maybeBoolean}
	loadingLabel={maybeString}
	href={maybeString}
	disabled={maybeBoolean}
>
	Button
</Button>
<Card title={maybeString} description={maybeString} href={maybeString} level={undefined} look={undefined}>Card</Card>
<Caret shape={undefined} blink={maybeBoolean} cycles={maybeNumber} />
<Carousel items={['a', 'b']} bind:index={num} label={maybeString} onchange={undefined}>
	{#snippet slide(item, i)}{item}{i}{/snippet}
</Carousel>
<Checkbox bind:checked bind:indeterminate={open} label={maybeString} hint={maybeString} />
<Code code={maybeString} language={maybeString} block={maybeBoolean} startLine={maybeNumber} />
<Collapsible bind:open label={maybeString} look={undefined} ontoggle={undefined}>Content</Collapsible>
<ColorPicker bind:value={text} label={maybeString} alpha={maybeBoolean} name={maybeString} />
<Combobox options={comboOptions} bind:value={text} label={maybeString} placeholder={maybeString} />
<CommandPalette {commands} bind:open hotkey={maybeString} onselect={undefined} />
<ContextMenu items={menu} label={maybeString} longPress={maybeNumber}>Area</ContextMenu>
<CopyButton value={maybeString} label={maybeString} resetAfter={maybeNumber} />
<CountUp value={1} from={maybeNumber} duration={maybeNumber} locale={maybeString} format={undefined} />
<DataTable
	{rows}
	columns={dataColumns}
	caption="Rows"
	rowKey="id"
	selectable
	bind:selected={keys}
	bind:query={text}
	bind:sortKey
	bind:sortDir
	bind:page={num}
	pageSize={maybeNumber}
/>
<DatePicker bind:value={text} min={maybeString} max={maybeString} locale={maybeString} weekStart={maybeNumber} />
<Divider label={maybeString} vertical={maybeBoolean} />
<Drawer bind:open title="Drawer" side={undefined} closeLabel={maybeString}>Drawer</Drawer>
<DropdownMenu label="Menu" items={menu} align={undefined} triggerVariant={undefined} />
<EmptyState title="Empty" description={maybeString} level={undefined} />
<Field label={maybeString} hint={maybeString} error={maybeString} for={maybeString}>
	{#snippet children({ describedby, invalid })}<input aria-describedby={describedby} aria-invalid={invalid} />{/snippet}
</Field>
<FileDrop bind:files accept={maybeString} maxSize={maybeNumber} multiple={maybeBoolean} />
<GridBackground variant={undefined} size={maybeNumber} fade={maybeBoolean}>Grid</GridBackground>
<Heatmap data={heat} label="Activity" start={maybeString} end={maybeString} weekStart={maybeNumber} />
<Highlight inView={maybeBoolean} delay={maybeNumber}>Highlight</Highlight>
<HistoryBar items={history} label="Uptime" statusLabels={{ ok: maybeString, down: 'Down' }} />
<IconButton label="Close" variant={undefined} size={undefined}>x</IconButton>
<Input bind:value={text} label={maybeString} hint={maybeString} error={maybeString} />
<Input bind:value={nullableNum} type="number" label="Number" />
<VisuallyHidden as={undefined} focusable={undefined} class={undefined}>Nur für Screenreader</VisuallyHidden>
<VisuallyHidden as="h2" focusable id="vh">Abschnitt</VisuallyHidden>
<Kbd keys={['mod', 'K']} separator={maybeString} size={undefined} platform={undefined} labels={undefined} />
<Label for={maybeString} required={maybeBoolean} text={maybeString} />
<Link href={maybeString} external={maybeBoolean}>Link</Link>
<Marquee bind:paused={checked} speed={maybeNumber} gap={maybeString} label={maybeString}>Ticker</Marquee>
<Mascot
	name="stuffy"
	src={maybeString}
	base={maybeString}
	cols={maybeNumber}
	rows={maybeNumber}
	scale={maybeNumber}
	compactScale={maybeNumber}
	animated={maybeBoolean}
	label={maybeString}
	class={maybeString}
/>
<Modal
	bind:open
	title="Modal"
	description={maybeString}
	size={undefined}
	closeOnBackdrop={maybeBoolean}
	dismissible={maybeBoolean}
	initialFocus={maybeString}
	alert={maybeBoolean}
	closeLabel={maybeString}
	oncancel={(e: Event) => e.preventDefault()}
	onclose={undefined}
>
	Modal
</Modal>
<Modal title="Focus" initialFocus={focusTarget} dismissible={false}><button type="button" bind:this={focusTarget}>Go</button></Modal>
<Navbar items={nav} label={maybeString} menuLabel={maybeString} />
<!-- #131: items is optional; without it the bar is brand and actions only -->
<Navbar />
<Navbar items={undefined} label={maybeString} menuLabel={maybeString}>
	{#snippet brand()}kern{/snippet}
	{#snippet actions()}<button type="button">Sign in</button>{/snippet}
</Navbar>
<NumberInput bind:value={nullableNum} min={maybeNumber} max={maybeNumber} step={maybeNumber} format={undefined} />
<Odometer value={1} duration={maybeNumber} locale={maybeString} />
<Pagination bind:page={num} pageCount={5} siblings={maybeNumber} onchange={undefined} />
<PinInput bind:value={text} length={maybeNumber} type={undefined} mask={maybeBoolean} />
<Popover bind:open label="Popover" placement={undefined} triggerVariant={undefined}>Popover</Popover>
<Progress
	label="Progress"
	value={maybeNumber}
	max={maybeNumber}
	showValue={maybeBoolean}
	hideLabel={maybeBoolean}
	tone={undefined}
	valueText={maybeString}
	class={maybeString}
/>
<Progress label="Indeterminate" value={null} tone="warn" />
<ProgressRing label="Ring" value={maybeNumber} size={maybeNumber} format={undefined} />
<RadioGroup label="Radio" options={radios} bind:value={text} inline={maybeBoolean} error={maybeString} />
<Rating bind:value={num} max={maybeNumber} readonly={maybeBoolean} />
<RelativeTime value={0} locale={maybeString} now={undefined} />
<Resizable {panels} bind:sizes direction={undefined} height={maybeString}>
	{#snippet panel(p, i)}{p.id}{i}{/snippet}
</Resizable>
<Reveal direction={undefined} delay={maybeNumber} once={maybeBoolean}>Reveal</Reveal>
<Scramble text="Scramble" duration={maybeNumber} glyphs={maybeString} hover={maybeBoolean} />
<ScrollArea maxHeight={maybeString} direction={undefined} label={maybeString}>Scroll</ScrollArea>
<SegmentedControl options={segments} bind:value={text} label={maybeString} block={maybeBoolean} />
<Select options={selectOptions} bind:value={text} label={maybeString} placeholder={maybeString} />
<Skeleton variant={undefined} width={maybeString} height={maybeNumber} lines={maybeNumber} />
<Slider bind:value={num} min={maybeNumber} max={maybeNumber} step={maybeNumber} label={maybeString} format={undefined} />
<Sparkline values={[1, 2, 3]} variant={undefined} label={maybeString} min={maybeNumber} />
<Spinner label={maybeString} size={maybeNumber} />
<Stat label="Stat" value={1} unit={maybeString} delta={maybeNumber} description={maybeString} />
<StatusDot status="ok" label={maybeString} statusLabels={{ ok: maybeString }} pulse={maybeBoolean} />
<Stepper {steps} current={maybeNumber} orientation={undefined} onstep={undefined} />
<Switch bind:checked label="Switch" hint={maybeString} labelFirst={maybeBoolean} />
<Table {rows} {columns} caption={maybeString} stack={maybeBoolean} empty={maybeString} />
<Tabs {tabs} bind:value={text} label={maybeString} look={undefined}>
	{#snippet panel(id)}{id}{/snippet}
</Tabs>
<Tag selected={maybeBoolean} removeLabel={maybeString} onremove={undefined}>Tag</Tag>
<TagInput bind:value={list} max={maybeNumber} suggestions={undefined} placeholder={maybeString} />
<Terminal {lines} title={maybeString} prompt={maybeString} typewriter={maybeBoolean} speed={maybeNumber} />
<Textarea bind:value={text} label={maybeString} autosize={maybeBoolean} />
<ThemeToggle {themes} bind:value={text} target={undefined} persist={maybeString} followSystem={maybeBoolean} />
<Timeline items={timeline} label={maybeString} statusLabels={{ done: maybeString }} locale={maybeString} />
<Toaster
	position={undefined}
	dismissLabel={maybeString}
	undoLabel={maybeString}
	label={maybeString}
	max={maybeNumber}
	queue={undefined}
	ondismiss={undefined}
	onundo={(item: ToastItem) => item.id}
	onaction={undefined}
/>
<Toaster position="bottom-left" {queue} />
<Tooltip text="Tip" placement={undefined}><button type="button">Hover</button></Tooltip>
<TreeView nodes={tree} bind:selected={text} bind:expanded={list} label={maybeString} />
<Typewriter text={['a', 'b']} speed={maybeNumber} loop={maybeBoolean} caretShape={undefined} />
