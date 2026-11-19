<script lang="ts">
	// Navigation and content (#46–#49, #74, #75): the new components and props fed with values that may be undefined.
	import { CodeBlock, Code, Drawer, Modal, TabLinks, Tabs, Tile, TileGrid } from '@mozra-the-great/kern';
	import type { TabItem, TabLinkItem } from '@mozra-the-great/kern';

	interface Props {
		maybeString?: string | undefined;
		maybeBoolean?: boolean | undefined;
		maybeNumber?: number | undefined;
	}
	let { maybeString, maybeBoolean, maybeNumber }: Props = $props();

	let page: string | undefined = $state();
	let open: boolean | undefined = $state();
	let copies = $state(0);
	let focusTarget: HTMLElement | undefined = $state();
	const tabs: TabItem[] = $derived([
		{ id: 'home', label: 'Home', controls: maybeString },
		{ id: 'inbox', label: 'Inbox', badge: maybeNumber, badgeLabel: maybeString, badgeTone: 'accent' },
		{ id: 'more', label: 'More', dot: maybeBoolean, badgeLabel: 'Sync error', badgeTone: 'danger' },
		{ id: 'admin', label: 'Admin', hidden: maybeBoolean, disabled: maybeBoolean, badge: maybeString, badgeTone: undefined }
	]);
	const links: TabLinkItem[] = $derived([
		{ href: '#a', label: 'A', current: maybeBoolean },
		{ href: '#b', label: 'B', badge: 3, dot: maybeBoolean, badgeLabel: maybeString, badgeTone: undefined }
	]);
	const onnavigate = (link: TabLinkItem, event: MouseEvent): void => {
		if (link.href.startsWith('#')) event.preventDefault();
	};
	const oncopy = (copied: boolean, text: string): void => {
		if (copied && text) copies++;
	};
</script>

<!-- Tab bar without panels (app navigation), the page renders the content. -->
<Tabs {tabs} bind:value={page} label={maybeString} look="pill" onchange={(id: string) => (page = id)} />
<main id="page">{page ?? 'home'}</main>
<TabLinks {links} label="Sections" look={undefined} {onnavigate} class={maybeString} />
<TabLinks links={[]} label="Empty" />

<CodeBlock code="npm ci" />
<CodeBlock
	code={maybeString ?? ''}
	label={maybeString}
	language={maybeString}
	lineNumbers={maybeBoolean}
	startLine={maybeNumber}
	copy={maybeBoolean}
	copyLabel={maybeString}
	copiedLabel={maybeString}
	copyErrorLabel={maybeString}
	showCopyLabel={maybeBoolean}
	hideScrollbar={maybeBoolean}
	{oncopy}
	class={maybeString}
/>
<Code
	code={maybeString}
	block
	copy
	copyShowLabel={maybeBoolean}
	hideScrollbar={maybeBoolean}
	oncopyerror={(error: unknown) => console.warn(error)}
/>

<TileGrid as="ul" min={maybeString} aria-label="Tools" class={maybeString}>
	<Tile as="li" href="/pdf" target={maybeString} rel={maybeString} data-tool="pdf">PDF</Tile>
	<Tile as="li">Plain</Tile>
</TileGrid>
<TileGrid as={undefined}>
	<Tile href={maybeString} as={undefined} id="tile">Maybe a link</Tile>
	<Tile>Plain</Tile>
</TileGrid>

<Drawer
	bind:open
	title="Filter"
	side="left"
	closeOnBackdrop={maybeBoolean}
	dismissible={maybeBoolean}
	initialFocus={focusTarget}
	closeLabel={maybeString}
	oncancel={(event: Event) => {
		if (maybeBoolean) event.preventDefault();
	}}
	onclose={() => (open = false)}
>
	<button type="button" bind:this={focusTarget}>Apply</button>
</Drawer>
<Drawer title="Selector focus" initialFocus={maybeString} dismissible={false}>Body</Drawer>
<Modal title="Closed by the user" onclose={() => (open = false)}>Body</Modal>
<p>{copies}</p>
