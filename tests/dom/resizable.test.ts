/**
 * Resizable in jsdom: the WAI-ARIA window splitter. Handles are focusable separators with a name, orientation,
 * the controlled panel and their value range; sizes are normalised to 100 % within each panel's min/max; the keys
 * (arrows by direction and RTL, Shift for the large step, Home/End, Enter to collapse and restore), pointer drags
 * (computed from the sizes at pointer-down, other pointers and buttons ignored) and `bind:sizes` / `onchange`.
 * jsdom has no layout: the panels' `getBoundingClientRect` is stubbed.
 */
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { tick } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Resizable, { type ResizablePanel } from '../../src/lib/components/Resizable.svelte';
import { mapSnippet2 } from './helpers.js';
import { reactive } from './reactive.svelte.js';

/** Size of one panel in px, in both axes. */
let panelPx = 200;

beforeEach(() => {
	panelPx = 200;
	vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
		const size = this.classList.contains('panel') ? panelPx : 0;
		return DOMRect.fromRect({ width: size, height: size });
	});
});

afterEach(() => {
	vi.restoreAllMocks();
});

const panel = mapSnippet2<ResizablePanel, number>((p, i) => `${p.label ?? p.id} ${String(i)}`);
const two: ResizablePanel[] = [
	{ id: 'nav', label: 'Navigation' },
	{ id: 'main', label: 'Content' }
];
const handles = (): HTMLElement[] => screen.getAllByRole('separator');
const grows = (): string[] => Array.from(document.querySelectorAll<HTMLElement>('.panel')).map((p) => p.style.flexGrow);

type Props = {
	panels: ResizablePanel[];
	panel: typeof panel;
	sizes?: number[] | undefined;
	direction?: 'horizontal' | 'vertical' | undefined;
	step?: number | undefined;
	largeStep?: number | undefined;
	onchange?: ((sizes: number[]) => void) | undefined;
};

function pointer(type: string, init: { id?: number; x?: number; y?: number; button?: number; pointerType?: string } = {}): MouseEvent {
	const event = new MouseEvent(type, {
		bubbles: true,
		cancelable: true,
		clientX: init.x ?? 0,
		clientY: init.y ?? 0,
		button: init.button ?? 0
	});
	Object.defineProperty(event, 'pointerId', { value: init.id ?? 1 });
	Object.defineProperty(event, 'pointerType', { value: init.pointerType ?? 'mouse' });
	return event;
}

describe('Resizable', () => {
	it('renders equal panels and a named, focusable separator with its range between neighbours', () => {
		render(Resizable, { panels: two, panel });
		expect(screen.getByText('Navigation 0')).toBeTruthy();
		expect(grows()).toEqual(['50', '50']);
		const [handle] = handles();
		expect(handles()).toHaveLength(1);
		expect(handle?.getAttribute('aria-label')).toBe('Resize Navigation');
		expect(handle?.tabIndex).toBe(0);
		expect(handle?.getAttribute('aria-orientation')).toBe('vertical');
		expect(handle?.getAttribute('aria-controls')).toBe(document.querySelector('.panel')?.id);
		expect(handle?.getAttribute('aria-valuenow')).toBe('50');
		expect(handle?.getAttribute('aria-valuemin')).toBe('10');
		expect(handle?.getAttribute('aria-valuemax')).toBe('90');
		expect(handle?.getAttribute('aria-valuetext')).toBe('50%');
		expect(document.querySelector('.group')?.getAttribute('data-direction')).toBe('horizontal');
	});

	it('uses the panel id without a label, the given handle label, class and height', () => {
		const { unmount } = render(Resizable, {
			panels: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
			panel,
			handleLabel: 'Drag {panel}',
			class: 'extra',
			height: 300
		});
		expect(handles().map((h) => h.getAttribute('aria-label'))).toEqual(['Drag a', 'Drag b']);
		const root = document.querySelector<HTMLElement>('.k-resizable');
		expect(root?.classList.contains('extra')).toBe(true);
		expect(root?.style.getPropertyValue('--rz-height')).toBe('300px');
		unmount();
		render(Resizable, { panels: two, panel, height: '50vh', direction: 'vertical' });
		expect(document.querySelector<HTMLElement>('.k-resizable')?.style.getPropertyValue('--rz-height')).toBe('50vh');
		expect(handles()[0]?.getAttribute('aria-orientation')).toBe('horizontal');
	});

	it('normalises the given sizes to 100 % inside every min and max', () => {
		const panels: ResizablePanel[] = [
			{ id: 'a', min: 20, max: 40 },
			{ id: 'b', min: 10 },
			{ id: 'c', min: 30 }
		];
		const props = reactive<Props>({ panels, panel, sizes: [1, 1, 2] });
		render(Resizable, { props });
		const values = grows().map(Number);
		expect(values.reduce((a, b) => a + b, 0)).toBeCloseTo(100);
		expect(values[0]).toBeGreaterThanOrEqual(20);
		expect(values[2]).toBeGreaterThanOrEqual(30);
		props.sizes = [0, 0, 0];
		return tick().then(() => {
			expect(
				grows()
					.map(Number)
					.reduce((a, b) => a + b, 0)
			).toBeCloseTo(100);
			props.sizes = [50, Number.NaN, 50];
			return tick().then(() => {
				expect(
					grows()
						.map(Number)
						.reduce((a, b) => a + b, 0)
				).toBeCloseTo(100);
				props.sizes = [50, 50];
			});
		});
	});

	it('raises a panel below its minimum and takes the difference from the others', () => {
		render(Resizable, { panels: [{ id: 'a', min: 40 }, { id: 'b' }], panel, sizes: [10, 90] });
		expect(grows()).toEqual(['40', '60']);
	});

	it('cuts a panel above its maximum and gives the difference to the others', () => {
		render(Resizable, { panels: [{ id: 'a', max: 30 }, { id: 'b' }], panel, sizes: [50, 50] });
		expect(grows()).toEqual(['30', '70']);
	});

	it('gives up spreading when no panel can take the rest (impossible mins) and handles no panels', () => {
		render(Resizable, {
			panels: [
				{ id: 'a', min: 80 },
				{ id: 'b', min: 80 }
			],
			panel,
			sizes: [50, 50]
		});
		expect(grows()).toEqual(['80', '80']);
		const [handle] = handles();
		expect(handle?.getAttribute('aria-valuemin')).toBe(handle?.getAttribute('aria-valuemax'));
		const { container } = render(Resizable, { panels: [], panel });
		expect(container.querySelectorAll('.panel')).toHaveLength(0);
	});

	it('arrows resize the panel before the handle, Shift by the large step, and report the sizes', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn<(sizes: number[]) => void>();
		const props = reactive<Props>({ panels: two, panel, sizes: undefined, step: 5, largeStep: 20, onchange });
		render(Resizable, { props });
		handles()[0]?.focus();
		await user.keyboard('{ArrowRight}');
		expect(props.sizes).toEqual([55, 45]);
		expect(onchange).toHaveBeenLastCalledWith([55, 45]);
		await user.keyboard('{ArrowLeft}');
		expect(props.sizes).toEqual([50, 50]);
		await user.keyboard('{Shift>}{ArrowRight}{/Shift}');
		expect(props.sizes).toEqual([70, 30]);
		await user.keyboard('{ArrowUp}{ArrowDown}x');
		expect(props.sizes).toEqual([70, 30]);
		await user.keyboard('{End}');
		expect(props.sizes).toEqual([90, 10]);
		await user.keyboard('{End}');
		expect(onchange).toHaveBeenCalledTimes(4);
		await user.keyboard('{Home}');
		expect(props.sizes).toEqual([10, 90]);
	});

	it('uses the default steps of 2 and 10', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ panels: two, panel, sizes: undefined });
		render(Resizable, { props });
		handles()[0]?.focus();
		await user.keyboard('{ArrowRight}');
		expect(props.sizes).toEqual([52, 48]);
		await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
		expect(props.sizes).toEqual([42, 58]);
	});

	it('flips left and right in RTL', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ panels: two, panel, sizes: undefined });
		render(Resizable, { props });
		(document.querySelector('.group') as HTMLElement).style.direction = 'rtl';
		handles()[0]?.focus();
		await user.keyboard('{ArrowRight}');
		expect(props.sizes).toEqual([48, 52]);
	});

	it('a stacked group uses up and down and ignores left and right', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ panels: two, panel, sizes: undefined, direction: 'vertical' });
		render(Resizable, { props });
		handles()[0]?.focus();
		await user.keyboard('{ArrowLeft}{ArrowRight}');
		expect(props.sizes).toBeUndefined();
		await user.keyboard('{ArrowDown}');
		expect(props.sizes).toEqual([52, 48]);
		await user.keyboard('{ArrowUp}{ArrowUp}');
		expect(props.sizes).toEqual([48, 52]);
	});

	it('Enter collapses the panel to its minimum and restores the size before', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ panels: two, panel, sizes: [70, 30] });
		render(Resizable, { props });
		handles()[0]?.focus();
		await user.keyboard('{Enter}');
		expect(props.sizes).toEqual([10, 90]);
		await user.keyboard('{Enter}');
		expect(props.sizes).toEqual([70, 30]);
	});

	it('Enter on a panel that was already at its minimum opens it to the middle of its range', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ panels: two, panel, sizes: [10, 90] });
		render(Resizable, { props });
		handles()[0]?.focus();
		await user.keyboard('{Enter}');
		expect(props.sizes).toEqual([50, 50]);
	});

	it('a drag resizes from the sizes at pointer-down and reports once on release', async () => {
		const onchange = vi.fn<(sizes: number[]) => void>();
		const props = reactive<Props>({ panels: two, panel, sizes: undefined, onchange });
		render(Resizable, { props });
		const handle = handles()[0] as HTMLElement;
		handle.dispatchEvent(pointer('pointerdown', { x: 100 }));
		expect(document.activeElement).toBe(handle);
		await tick();
		expect(handle.classList.contains('active')).toBe(true);
		expect(document.querySelector('.group')?.classList.contains('dragging')).toBe(true);
		// 400 px in all: 40 px are 10 %.
		handle.dispatchEvent(pointer('pointermove', { x: 140 }));
		expect(props.sizes).toEqual([60, 40]);
		handle.dispatchEvent(pointer('pointermove', { x: 120 }));
		expect(props.sizes).toEqual([55, 45]);
		handle.dispatchEvent(pointer('pointermove', { x: 160, id: 2 }));
		expect(props.sizes).toEqual([55, 45]);
		handle.dispatchEvent(pointer('pointerup', { id: 2 }));
		expect(onchange).not.toHaveBeenCalled();
		handle.dispatchEvent(pointer('pointerup', { x: 120 }));
		expect(onchange).toHaveBeenCalledWith([55, 45]);
		await tick();
		expect(handle.classList.contains('active')).toBe(false);
		handle.dispatchEvent(pointer('pointermove', { x: 300 }));
		handle.dispatchEvent(pointer('lostpointercapture'));
		expect(props.sizes).toEqual([55, 45]);
		expect(onchange).toHaveBeenCalledTimes(1);
	});

	it('a drag without movement reports nothing; a cancel ends it', () => {
		const onchange = vi.fn<(sizes: number[]) => void>();
		render(Resizable, { panels: two, panel, onchange });
		const handle = handles()[0] as HTMLElement;
		handle.dispatchEvent(pointer('pointerdown', { x: 100, pointerType: 'touch', button: 0 }));
		handle.dispatchEvent(pointer('pointermove', { x: 100, pointerType: 'touch' }));
		handle.dispatchEvent(pointer('pointercancel', { pointerType: 'touch' }));
		expect(onchange).not.toHaveBeenCalled();
	});

	it('drags in the vertical axis and mirrored in RTL', () => {
		const props = reactive<Props>({ panels: two, panel, sizes: undefined, direction: 'vertical' });
		const { unmount } = render(Resizable, { props });
		let handle = handles()[0] as HTMLElement;
		handle.dispatchEvent(pointer('pointerdown', { y: 0 }));
		handle.dispatchEvent(pointer('pointermove', { y: 40 }));
		expect(props.sizes).toEqual([60, 40]);
		unmount();
		const rtl = reactive<Props>({ panels: two, panel, sizes: undefined });
		render(Resizable, { props: rtl });
		(document.querySelector('.group') as HTMLElement).style.direction = 'rtl';
		handle = handles()[0] as HTMLElement;
		handle.dispatchEvent(pointer('pointerdown', { x: 100 }));
		handle.dispatchEvent(pointer('pointermove', { x: 140 }));
		expect(rtl.sizes).toEqual([40, 60]);
	});

	it('ignores other mouse buttons and a group without size', () => {
		const props = reactive<Props>({ panels: two, panel, sizes: undefined });
		render(Resizable, { props });
		const handle = handles()[0] as HTMLElement;
		handle.dispatchEvent(pointer('pointerdown', { x: 100, button: 2 }));
		handle.dispatchEvent(pointer('pointermove', { x: 200 }));
		expect(props.sizes).toBeUndefined();
		panelPx = 0;
		handle.dispatchEvent(pointer('pointerdown', { x: 100 }));
		handle.dispatchEvent(pointer('pointermove', { x: 200 }));
		expect(props.sizes).toBeUndefined();
		expect(document.activeElement).not.toBe(handle);
	});
});
