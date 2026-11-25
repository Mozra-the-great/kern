<script lang="ts">
	// Every exported component, mounted once in a section named after it (`data-csp-case`). tests/csp/csp.spec.ts
	// fails when an export of src/lib/index.ts has no section here or no entry in its CASES table, opens every overlay
	// and picker through the UI and fails on any CSP violation. The buttons in the "open" bar are the triggers of the
	// overlays that the app (not a built-in trigger) opens.
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
		CodeBlock,
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
		DownloadButton,
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
		Label,
		Link,
		LiveAnnouncer,
		Marquee,
		Mascot,
		Modal,
		Navbar,
		NumberInput,
		Odometer,
		OnlineStatus,
		Pagination,
		PinInput,
		Popover,
		Progress,
		ProgressRing,
		Prose,
		RadioGroup,
		Rating,
		RelativeTime,
		Resizable,
		Reveal,
		Scramble,
		ScrollArea,
		SegmentedControl,
		Select,
		SelectGrid,
		Skeleton,
		SkipLink,
		Slider,
		SortableList,
		Sparkline,
		Spinner,
		Stat,
		StatusDot,
		StatusMessage,
		Stepper,
		Switch,
		TabLinks,
		Table,
		Tabs,
		Tag,
		TagInput,
		Terminal,
		Textarea,
		ThemeToggle,
		Tile,
		TileGrid,
		Timeline,
		Toaster,
		Tooltip,
		TreeView,
		Typewriter,
		VisuallyHidden,
		announce,
		moveItem,
		toast
	} from '@mozra-the-great/kern';
	import type { Command, DataColumn, MenuEntry, TreeNode } from '@mozra-the-great/kern';
	import axolotl from '@mozra-the-great/kern/assets/code/mascots/axo.svg?url';
	import { THEME_KEY } from '../../../csp/policy.mjs';

	interface Person extends Record<string, unknown> {
		id: number;
		name: string;
		role: string;
	}
	interface Item {
		id: string;
		label: string;
	}

	let modalOpen = $state(false);
	let drawerOpen = $state(false);
	let paletteOpen = $state(false);
	let accordionOpen = $state(false);
	let collapsibleOpen = $state(false);
	let checked = $state(true);
	let switchOn = $state(false);
	let text = $state('Ada');
	let notes = $state('Line one');
	let fruit = $state('');
	let date = $state('');
	let color = $state('#336699');
	let tags = $state(['svelte']);
	let pin = $state('');
	let amount: number | null = $state(3);
	let volume = $state(40);
	let stars = $state(3);
	let size = $state('m');
	let view = $state('list');
	let country = $state('de');
	let tab = $state('one');
	let page = $state(2);
	let carouselIndex = $state(0);
	let treeSelected = $state('a');
	let treeExpanded = $state(['root']);
	let files: File[] = $state([]);
	let theme: string | undefined = $state();
	let sizes = $state([50, 50]);
	const message = 'Saved';

	const menu: MenuEntry[] = [
		{ id: 'open', label: 'Open' },
		{ id: 'rename', label: 'Rename' },
		{ type: 'separator' },
		{ id: 'delete', label: 'Delete', danger: true }
	];
	const commands: Command[] = [
		{ id: 'new', label: 'New file', group: 'File', shortcut: 'mod+N' },
		{ id: 'theme', label: 'Switch theme', group: 'View' }
	];
	const people: Person[] = [
		{ id: 1, name: 'Ada', role: 'Engineer' },
		{ id: 2, name: 'Grace', role: 'Admiral' },
		{ id: 3, name: 'Linus', role: 'Maintainer' }
	];
	const dataColumns: DataColumn<Person>[] = [
		{ key: 'name', label: 'Name', sortable: true },
		{ key: 'role', label: 'Role', sortable: true }
	];
	const items: Item[] = [
		{ id: 'a', label: 'Alpha' },
		{ id: 'b', label: 'Beta' },
		{ id: 'c', label: 'Gamma' }
	];
	let order: Item[] = $state(items.slice());
	const tree: TreeNode[] = [
		{
			id: 'root',
			label: 'src',
			children: [
				{ id: 'a', label: 'App.svelte' },
				{ id: 'b', label: 'main.ts' }
			]
		}
	];
	const heat = Array.from({ length: 60 }, (_, i) => ({
		date: new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10),
		value: (i * 7) % 5
	}));
</script>

<SkipLink target="main" label="Skip to content" />
<LiveAnnouncer />
<Toaster position="bottom-right" />

<div class="bar" data-csp-bar>
	<Button onclick={() => (modalOpen = true)}>Open modal</Button>
	<Button variant="secondary" onclick={() => (drawerOpen = true)}>Open drawer</Button>
	<Button variant="secondary" onclick={() => (paletteOpen = true)}>Open palette</Button>
	<Button variant="secondary" onclick={() => toast({ message: 'Saved the file', title: 'Done', tone: 'ok', duration: 0 })}>Toast</Button>
	<Button variant="ghost" onclick={() => toast.danger('Upload failed')}>Error toast</Button>
	<Button variant="ghost" onclick={() => announce('Announced')}>Announce</Button>
</div>

<main id="main" class="grid">
	<section data-csp-case="Accordion">
		<Accordion
			items={[
				{ id: 'one', title: 'One' },
				{ id: 'two', title: 'Two' }
			]}
		>
			{#snippet content(id)}Body {id}{/snippet}
		</Accordion>
	</section>
	<section data-csp-case="AccordionItem"><AccordionItem title="Item" bind:open={accordionOpen}>Body</AccordionItem></section>
	<section data-csp-case="Alert"><Alert tone="warn" title="Heads up" ondismiss={() => undefined}>Something happened.</Alert></section>
	<section data-csp-case="Avatar"><Avatar name="Ada Lovelace" size={48} /></section>
	<section data-csp-case="Badge"><Badge tone="accent">Badge</Badge></section>
	<section data-csp-case="Breadcrumb">
		<Breadcrumb items={[{ label: 'Home', href: '#' }, { label: 'Docs', href: '#' }, { label: 'CSP' }]} />
	</section>
	<section data-csp-case="Button"><Button loading>Saving</Button></section>
	<section data-csp-case="Card"><Card title="Card" description="A card">Body</Card></section>
	<section data-csp-case="Caret"><Caret /></section>
	<section data-csp-case="Carousel">
		<Carousel items={['One', 'Two', 'Three']} bind:index={carouselIndex} label="Slides">
			{#snippet slide(item)}<p>{item}</p>{/snippet}
		</Carousel>
	</section>
	<section data-csp-case="Checkbox"><Checkbox bind:checked label="Accept" /></section>
	<section data-csp-case="Code"><Code code="const a = 1;" /></section>
	<section data-csp-case="CodeBlock"><CodeBlock code={'const a = 1;\nconst b = 2;'} label="Snippet" /></section>
	<section data-csp-case="Collapsible"><Collapsible bind:open={collapsibleOpen} label="More">Hidden content</Collapsible></section>
	<section data-csp-case="ColorPicker"><ColorPicker label="Colour" bind:value={color} alpha swatches={['#ff0000', '#00aa00']} /></section>
	<section data-csp-case="Combobox">
		<Combobox
			label="Fruit"
			bind:value={fruit}
			options={[
				{ value: 'apple', label: 'Apple' },
				{ value: 'banana', label: 'Banana' },
				{ value: 'cherry', label: 'Cherry' }
			]}
		/>
	</section>
	<section data-csp-case="CommandPalette"><CommandPalette {commands} bind:open={paletteOpen} /></section>
	<section data-csp-case="ContextMenu">
		<ContextMenu items={menu} label="File actions"><div class="area">Right-click here</div></ContextMenu>
	</section>
	<section data-csp-case="CopyButton"><CopyButton text="copied text" label="Copy" /></section>
	<section data-csp-case="CountUp"><CountUp value={1234} /></section>
	<section data-csp-case="DataTable">
		<DataTable rows={people} columns={dataColumns} caption="People" rowKey="id" selectable pageSize={2} />
	</section>
	<section data-csp-case="DatePicker"><DatePicker label="Date" bind:value={date} /></section>
	<section data-csp-case="Divider"><Divider label="Or" /></section>
	<section data-csp-case="DownloadButton"><DownloadButton text="file content" name="file.txt" label="Download" showLabel /></section>
	<section data-csp-case="Drawer"><Drawer bind:open={drawerOpen} title="Drawer">Drawer content</Drawer></section>
	<section data-csp-case="DropdownMenu"><DropdownMenu label="Actions" items={menu} /></section>
	<section data-csp-case="EmptyState"><EmptyState title="Nothing here" description="Add something." /></section>
	<section data-csp-case="Field">
		<Field label="Name" hint="Your name" error="Required" for="field-name">
			{#snippet children({ describedby, invalid })}<input id="field-name" aria-describedby={describedby} aria-invalid={invalid} />{/snippet}
		</Field>
	</section>
	<section data-csp-case="FileDrop"><FileDrop label="Upload" bind:files multiple /></section>
	<section data-csp-case="GridBackground"><GridBackground size={24}>Grid</GridBackground></section>
	<section data-csp-case="Heatmap"><Heatmap data={heat} label="Activity" start="2026-01-01" end="2026-03-01" /></section>
	<section data-csp-case="Highlight"><Highlight>Highlighted</Highlight></section>
	<section data-csp-case="HistoryBar">
		<HistoryBar
			label="Uptime"
			items={[
				{ label: 'Mon', status: 'ok', detail: 'All good' },
				{ label: 'Tue', status: 'down', detail: 'Outage' },
				{ label: 'Wed', status: 'ok' }
			]}
		/>
	</section>
	<section data-csp-case="IconButton"><IconButton label="Close">x</IconButton></section>
	<section data-csp-case="Input"><Input label="Email" bind:value={text} error="Invalid" /></section>
	<section data-csp-case="Kbd"><Kbd keys={['mod', 'K']} /></section>
	<section data-csp-case="Label"><Label text="Label" required /></section>
	<section data-csp-case="Link"><Link href="#main">Link</Link></section>
	<section data-csp-case="LiveAnnouncer"><p>LiveAnnouncer is mounted at the top of the page.</p></section>
	<section data-csp-case="Marquee"><Marquee label="Ticker" speed={60}>News · More news · Even more news</Marquee></section>
	<section data-csp-case="Mascot"><Mascot name="stuffy" src={axolotl} scale={4} label="Axolotl" /></section>
	<section data-csp-case="Modal">
		<Modal bind:open={modalOpen} title="Modal" description="A modal dialog">
			Modal content
			{#snippet footer()}<Button onclick={() => (modalOpen = false)}>Close modal</Button>{/snippet}
		</Modal>
	</section>
	<section data-csp-case="Navbar">
		<Navbar
			items={[
				{ label: 'Home', href: '#', current: true },
				{ label: 'Docs', href: '#' }
			]}
		/>
	</section>
	<section data-csp-case="NumberInput"><NumberInput label="Amount" bind:value={amount} min={0} max={10} /></section>
	<section data-csp-case="Odometer"><Odometer value={4711} /></section>
	<section data-csp-case="OnlineStatus"><OnlineStatus /></section>
	<section data-csp-case="Pagination"><Pagination bind:page pageCount={9} /></section>
	<section data-csp-case="PinInput"><PinInput label="Code" length={4} bind:value={pin} /></section>
	<section data-csp-case="Popover"><Popover label="Info">Popover details</Popover></section>
	<section data-csp-case="Progress"><Progress label="Upload" value={40} showValue /><Progress label="Waiting" value={null} /></section>
	<section data-csp-case="ProgressRing"><ProgressRing label="Sync" value={70} /></section>
	<section data-csp-case="Prose"><Prose text={'First paragraph with https://example.org.\n\nSecond paragraph.'} /></section>
	<section data-csp-case="RadioGroup">
		<RadioGroup
			label="Size"
			bind:value={size}
			options={[
				{ value: 's', label: 'Small' },
				{ value: 'm', label: 'Medium' }
			]}
		/>
	</section>
	<section data-csp-case="Rating"><Rating label="Rating" bind:value={stars} /></section>
	<section data-csp-case="RelativeTime"><RelativeTime value={new Date(Date.now() - 3_600_000)} /></section>
	<section data-csp-case="Resizable">
		<Resizable panels={[{ id: 'left', label: 'Left' }, { id: 'right' }]} bind:sizes height="120px">
			{#snippet panel(p)}<p>{p.id}</p>{/snippet}
		</Resizable>
	</section>
	<section data-csp-case="Reveal"><Reveal>Revealed</Reveal></section>
	<section data-csp-case="Scramble"><Scramble text="Scramble" /></section>
	<section data-csp-case="ScrollArea">
		<ScrollArea maxHeight="80px" label="Scrollable"><p class="tall">Scroll content</p></ScrollArea>
	</section>
	<section data-csp-case="SegmentedControl">
		<SegmentedControl
			label="View"
			bind:value={view}
			options={[
				{ value: 'list', label: 'List' },
				{ value: 'grid', label: 'Grid' }
			]}
		/>
	</section>
	<section data-csp-case="Select">
		<Select
			label="Country"
			bind:value={country}
			options={[
				{ value: 'de', label: 'Germany' },
				{ value: 'fr', label: 'France' }
			]}
		/>
	</section>
	<section data-csp-case="SelectGrid"><SelectGrid {items} label="Pick" key={(i) => i.id} itemLabel={(i) => i.label} reorderable /></section>
	<section data-csp-case="Skeleton"><Skeleton width="60%" height={16} lines={2} /></section>
	<section data-csp-case="SkipLink"><p>SkipLink is the first element of the page.</p></section>
	<section data-csp-case="Slider"><Slider label="Volume" bind:value={volume} /></section>
	<section data-csp-case="SortableList">
		<SortableList
			items={order}
			label="Order"
			key={(i) => i.id}
			itemLabel={(i) => i.label}
			removable
			onmove={(from, to) => (order = moveItem(order, from, to))}
		/>
	</section>
	<section data-csp-case="Sparkline"><Sparkline values={[1, 3, 2, 5, 4]} label="Trend" /></section>
	<section data-csp-case="Spinner"><Spinner label="Loading" /></section>
	<section data-csp-case="Stat"><Stat label="Users" value={1200} delta={4} unit="pp" /></section>
	<section data-csp-case="StatusDot"><StatusDot status="ok" pulse /></section>
	<section data-csp-case="StatusMessage"><StatusMessage {message} /></section>
	<section data-csp-case="Stepper">
		<Stepper
			steps={[
				{ id: 'a', label: 'Cart' },
				{ id: 'b', label: 'Address' },
				{ id: 'c', label: 'Pay' }
			]}
			current={1}
		/>
	</section>
	<section data-csp-case="Switch"><Switch label="Notifications" bind:checked={switchOn} /></section>
	<section data-csp-case="TabLinks">
		<TabLinks
			label="Sections"
			links={[
				{ href: '#a', label: 'A', current: true },
				{ href: '#b', label: 'B' }
			]}
		/>
	</section>
	<section data-csp-case="Table">
		<Table
			rows={people}
			columns={[
				{ key: 'name', label: 'Name' },
				{ key: 'role', label: 'Role' }
			]}
			caption="Team"
		/>
	</section>
	<section data-csp-case="Tabs">
		<Tabs
			tabs={[
				{ id: 'one', label: 'One' },
				{ id: 'two', label: 'Two' }
			]}
			bind:value={tab}
		>
			{#snippet panel(id)}Panel {id}{/snippet}
		</Tabs>
	</section>
	<section data-csp-case="Tag"><Tag onremove={() => undefined}>Tag</Tag></section>
	<section data-csp-case="TagInput">
		<TagInput label="Tags" bind:value={tags} suggestions={['svelte', 'vite', 'typescript', 'csp']} />
	</section>
	<section data-csp-case="Terminal">
		<Terminal lines={[{ text: 'npm run build', output: ['built in 1s', 'done'] }]} title="Shell" />
	</section>
	<section data-csp-case="Textarea"><Textarea label="Message" bind:value={notes} autosize /></section>
	<section data-csp-case="ThemeToggle"><ThemeToggle bind:value={theme} persist={THEME_KEY} /></section>
	<section data-csp-case="Tile"><Tile href="#main">Tile</Tile></section>
	<section data-csp-case="TileGrid">
		<TileGrid min="8rem"><Tile>One</Tile><Tile>Two</Tile></TileGrid>
	</section>
	<section data-csp-case="Timeline">
		<Timeline
			items={[
				{ id: 'a', title: 'Created', status: 'done' },
				{ id: 'b', title: 'Reviewed', status: 'current' }
			]}
		/>
	</section>
	<section data-csp-case="Toaster"><p>Toaster is mounted at the top of the page.</p></section>
	<section data-csp-case="Tooltip"><Tooltip text="Tooltip text"><button type="button">Hover me</button></Tooltip></section>
	<section data-csp-case="TreeView">
		<TreeView nodes={tree} bind:selected={treeSelected} bind:expanded={treeExpanded} label="Files" />
	</section>
	<section data-csp-case="Typewriter"><Typewriter text={['Hello', 'World']} /></section>
	<section data-csp-case="VisuallyHidden"><VisuallyHidden>Only for screen readers</VisuallyHidden></section>
</main>

<style>
	:global(body) {
		margin: 0;
		background: var(--k-bg);
		color: var(--k-fg);
		font-family: var(--k-font-body);
	}
	.bar {
		display: flex;
		flex-wrap: wrap;
		gap: var(--k-space-2);
		padding: var(--k-space-3);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
		gap: var(--k-space-4);
		padding: var(--k-space-3);
	}
	section {
		min-width: 0;
	}
	.area {
		padding: var(--k-space-4);
		border: var(--k-border-w) dashed var(--k-border);
	}
	.tall {
		height: 240px;
		margin: 0;
	}
</style>
