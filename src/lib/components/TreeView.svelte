<script lang="ts">
	import { tick, type Snippet } from 'svelte';

	export interface TreeNode {
		id: string;
		label: string;
		children?: TreeNode[];
		/** Can be focused and expanded, but not selected. */
		disabled?: boolean;
	}
	export interface TreeItemState {
		level: number;
		expanded: boolean;
		selected: boolean;
		hasChildren: boolean;
	}
	interface Props {
		nodes: TreeNode[];
		/** Id of the selected node. */
		selected?: string;
		/** Ids of the expanded nodes. */
		expanded?: string[];
		/** Accessible name of the tree. */
		label?: string;
		/** Custom node content; the default is the label. */
		item?: Snippet<[TreeNode, TreeItemState]>;
		/** Called when the user selects a node. */
		onselect?: (id: string) => void;
		/** Called when the user expands or collapses a node. */
		ontoggle?: (id: string, expanded: boolean) => void;
		class?: string;
	}
	let {
		nodes,
		selected = $bindable(),
		expanded = $bindable([]),
		label,
		item,
		onselect,
		ontoggle,
		class: cls = ''
	}: Props = $props();

	interface Entry {
		node: TreeNode;
		level: number;
		parent: string | null;
		siblings: TreeNode[];
	}
	let root: HTMLElement | undefined = $state();
	let focusId = $state<string>();
	let typed = '';
	let typedAt = 0;

	const open = $derived(new Set(expanded));
	const hasKids = (n: TreeNode) => !!n.children && n.children.length > 0;

	/** Every node with its level and parent, for parent lookup and `*`. */
	const index = $derived.by(() => {
		const map = new Map<string, Entry>();
		const walk = (list: TreeNode[], level: number, parent: string | null) => {
			for (const node of list) {
				map.set(node.id, { node, level, parent, siblings: list });
				if (node.children) walk(node.children, level + 1, node.id);
			}
		};
		walk(nodes, 1, null);
		return map;
	});
	/** Visible nodes in display order (children of collapsed nodes are skipped). */
	const visible = $derived.by(() => {
		const out: TreeNode[] = [];
		const walk = (list: TreeNode[]) => {
			for (const node of list) {
				out.push(node);
				if (hasKids(node) && open.has(node.id)) walk(node.children ?? []);
			}
		};
		walk(nodes);
		return out;
	});
	/** The one node in the tab order (roving tabindex). */
	const tabId = $derived.by(() => {
		const ids = new Set(visible.map((n) => n.id));
		if (focusId && ids.has(focusId)) return focusId;
		if (selected && ids.has(selected)) return selected;
		return visible[0]?.id;
	});

	function norm(s: string): string {
		return s.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
	}
	async function focusNode(id: string | undefined) {
		if (id === undefined) return;
		focusId = id;
		await tick();
		root?.querySelector<HTMLElement>(`[data-id="${CSS.escape(id)}"]`)?.focus();
	}
	function setExpanded(id: string, value: boolean) {
		if (open.has(id) === value) return;
		expanded = value ? [...expanded, id] : expanded.filter((x) => x !== id);
		ontoggle?.(id, value);
	}
	function select(node: TreeNode) {
		if (node.disabled) return;
		selected = node.id;
		onselect?.(node.id);
	}

	function idOf(e: Event): string | undefined {
		return (e.target as Element).closest<HTMLElement>('[role="treeitem"]')?.dataset.id;
	}
	function onclick(e: MouseEvent) {
		const id = idOf(e);
		const entry = id === undefined ? undefined : index.get(id);
		if (!entry) return;
		focusId = entry.node.id;
		if ((e.target as Element).closest('.twisty') && hasKids(entry.node)) setExpanded(entry.node.id, !open.has(entry.node.id));
		else select(entry.node);
	}
	function onkeydown(e: KeyboardEvent) {
		const id = idOf(e);
		const entry = id === undefined ? undefined : index.get(id);
		if (!entry) return;
		const node = entry.node;
		const i = visible.findIndex((n) => n.id === node.id);
		let handled = true;
		switch (e.key) {
			case 'ArrowDown':
				focusNode(visible[i + 1]?.id);
				break;
			case 'ArrowUp':
				focusNode(visible[i - 1]?.id);
				break;
			case 'ArrowRight':
				if (hasKids(node)) {
					if (!open.has(node.id)) setExpanded(node.id, true);
					else focusNode(node.children?.[0]?.id);
				}
				break;
			case 'ArrowLeft':
				if (hasKids(node) && open.has(node.id)) setExpanded(node.id, false);
				else if (entry.parent !== null) focusNode(entry.parent);
				break;
			case 'Home':
				focusNode(visible[0]?.id);
				break;
			case 'End':
				focusNode(visible[visible.length - 1]?.id);
				break;
			case 'Enter':
			case ' ':
				select(node);
				break;
			case '*': {
				const add = entry.siblings.filter((n) => hasKids(n) && !open.has(n.id)).map((n) => n.id);
				if (add.length) {
					expanded = [...expanded, ...add];
					for (const a of add) ontoggle?.(a, true);
				}
				break;
			}
			default:
				handled = typeAhead(e, i);
		}
		if (handled) {
			e.preventDefault();
			e.stopPropagation();
		}
	}
	/** Focus the next visible node whose label starts with the typed characters. */
	function typeAhead(e: KeyboardEvent, from: number): boolean {
		if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey || e.key === ' ') return false;
		const now = Date.now();
		typed = now - typedAt > 600 ? e.key : typed + e.key;
		typedAt = now;
		const q = norm(typed);
		// Repeating one letter cycles through matches; a longer prefix may stay on the current node.
		const repeat = q.length > 1 && [...q].every((c) => c === q[0]);
		const needle = repeat ? q[0] : q;
		const start = repeat || q.length === 1 ? from + 1 : from;
		const n = visible.length;
		for (let k = 0; k < n; k++) {
			const cand = visible[(start + k) % n];
			if (norm(cand.label).startsWith(needle)) {
				focusNode(cand.id);
				break;
			}
		}
		return true;
	}
</script>

{#snippet branch(list: TreeNode[], level: number)}
	{#each list as node, i (node.id)}
		{@const kids = hasKids(node)}
		{@const isOpen = kids && open.has(node.id)}
		{@const isSelected = node.id === selected}
		<li
			role="treeitem"
			data-id={node.id}
			aria-level={level}
			aria-setsize={list.length}
			aria-posinset={i + 1}
			aria-expanded={kids ? isOpen : undefined}
			aria-selected={isSelected || undefined}
			aria-disabled={node.disabled || undefined}
			tabindex={node.id === tabId ? 0 : -1}
			style:--level={level}
			onfocus={(e) => { if (e.target === e.currentTarget) focusId = node.id; }}
		>
			<div class="row" class:selected={isSelected}>
				<span class="twisty" aria-hidden="true">
					{#if kids}<svg viewBox="0 0 16 16"><path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2" /></svg>{/if}
				</span>
				<span class="text">
					{#if item}{@render item(node, { level, expanded: isOpen, selected: isSelected, hasChildren: kids })}{:else}{node.label}{/if}
				</span>
			</div>
			{#if isOpen}
				<ul role="group">{@render branch(node.children ?? [], level + 1)}</ul>
			{/if}
		</li>
	{/each}
{/snippet}

<ul class="k-tree {cls}" role="tree" aria-label={label} bind:this={root} {onclick} {onkeydown}>
	{@render branch(nodes, 1)}
</ul>

<style>
	.k-tree, ul { margin: 0; padding: 0; list-style: none; }
	.k-tree { min-width: 0; font-size: var(--k-text-sm); }
	li { outline: none; }
	.row {
		display: flex;
		align-items: center;
		gap: var(--k-space-1);
		min-height: 40px;
		padding: 0 var(--k-space-3) 0 calc((var(--level) - 1) * var(--k-space-6));
		box-sizing: border-box;
		border-radius: min(var(--k-radius-control), 10px);
		color: var(--k-fg);
		cursor: pointer;
		user-select: none;
		transition: background-color var(--k-dur) var(--k-ease);
	}
	.row:hover { background: var(--k-bg-sunken); }
	.row.selected {
		background: var(--k-selected);
		box-shadow: inset 3px 0 0 var(--k-accent);
		font-weight: var(--k-weight-heading);
	}
	li:focus-visible > .row { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: calc(var(--k-focus-w) * -1); }
	li[aria-disabled='true'] > .row { opacity: 0.45; cursor: not-allowed; }
	.twisty { flex: none; display: grid; place-items: center; width: 32px; height: 40px; color: var(--k-fg-muted); }
	.twisty svg { width: 14px; height: 14px; transition: transform var(--k-dur) var(--k-ease); }
	li[aria-expanded='true'] > .row .twisty svg { transform: rotate(90deg); }
	.text { flex: 1; min-width: 0; padding: var(--k-space-2) 0; overflow-wrap: anywhere; }
	@media (pointer: coarse) { .row { min-height: 44px; } .twisty { width: 40px; height: 44px; } }
</style>
