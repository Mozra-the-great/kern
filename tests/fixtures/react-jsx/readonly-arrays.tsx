// Type-level fixture (never run): the list properties of the custom elements take `readonly` arrays and
// `as const` literals (#142), as a strict React 19 app that keeps its data readonly passes them. Mutable
// arrays still work (app.tsx). Bindable outputs (`value` of <k-tag-input>, `selected` of <k-data-table>,
// `expanded` of <k-tree-view>, `sizes` of <k-resizable>) stay mutable and are not used here.
// Checked by `npm run test:types`.
import '@mozra-the-great/kern/elements';
import type {} from '@mozra-the-great/kern/elements/react';
import type { Command, SelectOption, TabItem, TreeNode } from '@mozra-the-great/kern/elements';

const tabs: readonly TabItem[] = [{ id: 'a', label: 'A' }];
const options: readonly SelectOption[] = [{ value: 's', label: 'Small' }];
const keywords: readonly string[] = ['theme', 'dark'];
const commands: readonly Command[] = [{ id: 'c', label: 'C', keywords }];
const children: readonly TreeNode[] = [{ id: 'leaf', label: 'Leaf' }];
const nodes: readonly TreeNode[] = [{ id: 'root', label: 'Root', children }];

export function ReadonlyArrays() {
	return (
		<div>
			<k-tabs tabs={tabs} />
			<k-tabs tabs={[{ id: 'a', label: 'A', badge: 3 }] as const} />
			<k-select options={options} />
			<k-select options={[{ value: 's', label: 'Small' }] as const} />
			<k-combobox options={[{ value: 'a', label: 'A' }] as const} />
			<k-radio-group options={[{ value: 'a', label: 'A', hint: 'first' }] as const} />
			<k-segmented-control options={[{ value: 'a', label: 'A' }] as const} />
			<k-color-picker swatches={['#ff0000', { value: '#00ff00', label: 'Green' }] as const} />
			<k-tab-links links={[{ href: '/a', label: 'A', current: true }] as const} />
			<k-breadcrumb items={[{ label: 'Home', href: '/' }] as const} />
			<k-navbar items={[{ label: 'Home', href: '/' }] as const} />
			<k-command-palette commands={commands} />
			<k-command-palette commands={[{ id: 'c', label: 'C', keywords: ['theme', 'dark'] }] as const} />
			<k-context-menu items={[{ id: 'm', label: 'M' }, { type: 'separator' }] as const} />
			<k-dropdown-menu items={[{ id: 'm', label: 'M' }, { type: 'label', label: 'L' }] as const} />
			<k-tree-view nodes={nodes} />
			<k-tree-view
				nodes={[{ id: 'root', label: 'Root', children: [{ id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] }] }] as const}
			/>
			<k-table columns={[{ key: 'name', label: 'Name' }] as const} rows={[{ name: 'One' }] as const} />
			<k-data-table columns={[{ key: 'name', label: 'Name' }] as const} rows={[{ name: 'One' }] as const} />
			<k-heatmap data={[{ date: '2026-01-01', value: 1 }] as const} />
			<k-history-bar items={[{ label: 'Mon', status: 'ok' }] as const} />
			<k-kbd keys={['mod', 'K'] as const} />
			<k-resizable panels={[{ id: 'l' }, { id: 'r' }] as const} />
			<k-select-grid items={[{ id: 1, label: 'Page 1' }] as const} selected={[1] as const} />
			<k-sortable-list items={[{ id: 'a', label: 'A' }] as const} />
			<k-sparkline values={[1, 2, 3] as const} />
			<k-stepper steps={[{ id: 's', label: 'S' }] as const} />
			<k-tag-input suggestions={['one', 'two'] as const} />
			<k-terminal lines={[{ text: 'ls', output: ['a', 'b'] }] as const} />
			<k-theme-toggle themes={[{ id: 'code', label: 'Code' }] as const} />
			<k-timeline items={[{ id: 'e', title: 'E' }] as const} />
			<k-typewriter text={['a', 'b'] as const} />
		</div>
	);
}
