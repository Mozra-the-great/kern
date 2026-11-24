/**
 * ColorPicker: a hex text field with a swatch button that opens a non-modal panel (saturation and
 * brightness area, hue slider, optional opacity slider, presets). Covers typing and committing
 * (all hex forms, invalid text with the error, empty), the panel (open/close by button, Escape,
 * focus leaving, outside pointer), the area with pointer drag and keys, the sliders, swatches with
 * their pressed state and ink, alpha handling, hue/saturation kept for greys and black, labels and
 * value texts, the bound value both ways, onchange, the hidden input and disabled/invalid states.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ColorPicker, { type ColorSwatch } from '../../src/lib/components/ColorPicker.svelte';
import type { Hsv } from '../../src/lib/components/color.js';
import { flush } from './helpers.js';
import { reactive } from './reactive.svelte.js';

type Props = {
	label: string;
	value?: string | undefined;
	alpha?: boolean | undefined;
	swatches?: (string | ColorSwatch)[] | undefined;
	onchange?: ((value: string) => void) | undefined;
	disabled?: boolean | undefined;
	describe?: ((hsv: Hsv) => string) | undefined;
	alphaLabel?: string | undefined;
	hueLabel?: string | undefined;
	swatchesLabel?: string | undefined;
};

function input(): HTMLInputElement {
	return screen.getByRole('textbox') as HTMLInputElement;
}
function trigger(): HTMLButtonElement {
	return document.querySelector<HTMLButtonElement>('button.swatch-btn') as HTMLButtonElement;
}
function panel(): HTMLElement | null {
	return screen.queryByRole('dialog');
}
function area(): HTMLElement {
	return screen.getByRole('slider', { name: 'Saturation and brightness' });
}
function hue(): HTMLInputElement {
	return screen.getByRole('slider', { name: 'Hue' }) as HTMLInputElement;
}
async function open(user: ReturnType<typeof userEvent.setup>): Promise<void> {
	await user.click(trigger());
	await vi.waitFor(() => expect(document.activeElement).toBe(area()));
}
function setRange(el: HTMLInputElement, value: string): void {
	el.value = value;
	el.dispatchEvent(new Event('input', { bubbles: true }));
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe('ColorPicker field', () => {
	it('renders a labelled field and a closed swatch button without a colour', () => {
		render(ColorPicker, { label: 'Colour' });
		const field = screen.getByRole('textbox', { name: 'Colour' }) as HTMLInputElement;
		expect(field.placeholder).toBe('#rrggbb');
		expect(field.maxLength).toBe(9);
		expect(field.getAttribute('aria-invalid')).toBeNull();
		const btn = screen.getByRole('button', { name: 'Choose color' });
		expect(btn.getAttribute('aria-expanded')).toBe('false');
		expect(btn.getAttribute('aria-haspopup')).toBe('dialog');
		expect(document.querySelector('.chip.empty svg')).not.toBeNull();
		expect(panel()).toBeNull();
		expect(document.querySelector('input[type="hidden"]')).toBeNull();
	});

	it('shows the normalised value and names it on the button; follows the value from outside', async () => {
		const props = reactive<Props>({ label: 'Colour', value: '#ABC' });
		render(ColorPicker, { props });
		expect(input().value).toBe('#aabbcc');
		expect(screen.getByRole('button', { name: 'Choose color, #aabbcc' })).toBeTruthy();
		expect(document.querySelector('.chip.empty')).toBeNull();
		props.value = '#112233';
		await vi.waitFor(() => expect(input().value).toBe('#112233'));
		// Text that is not a colour is shown as it is.
		props.value = 'teal';
		await vi.waitFor(() => expect(input().value).toBe('teal'));
		expect(screen.getByRole('button', { name: 'Choose color' })).toBeTruthy();
		props.value = undefined;
		await vi.waitFor(() => expect(input().value).toBe(''));
	});

	it('commits typed hex on change and Enter, normalised, and calls onchange once per colour', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<Props>({ label: 'Colour', value: undefined, onchange });
		render(ColorPicker, { props });
		await user.type(input(), 'F80');
		await user.tab();
		expect(props.value).toBe('#ff8800');
		expect(input().value).toBe('#ff8800');
		expect(onchange).toHaveBeenCalledWith('#ff8800');
		await user.clear(input());
		await user.type(input(), '#00ff00{Enter}');
		expect(props.value).toBe('#00ff00');
		await user.type(input(), '{Enter}');
		expect(onchange).toHaveBeenCalledTimes(2);
		// Other keys do nothing.
		await user.keyboard('{ArrowDown}');
		expect(props.value).toBe('#00ff00');
	});

	it('invalid text clears the value and shows the error; empty text commits ""', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<Props>({ label: 'Colour', value: '#123456', onchange });
		render(ColorPicker, { props });
		await user.clear(input());
		await user.type(input(), 'nope{Enter}');
		expect(props.value).toBe('');
		expect(onchange).toHaveBeenCalledWith('');
		expect(screen.getByRole('alert').textContent).toContain('Enter a color as #rgb, #rrggbb or #rrggbbaa.');
		expect(input().getAttribute('aria-invalid')).toBe('true');
		expect(input().value).toBe('nope');
		expect(document.querySelector('.k-color.invalid')).not.toBeNull();
		await user.clear(input());
		await user.keyboard('{Enter}');
		expect(props.value).toBe('');
		expect(screen.queryByRole('alert')).toBeNull();
		expect(onchange).toHaveBeenCalledTimes(1);
	});

	it('without alpha the value drops the alpha part; with alpha it keeps it when not opaque', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ label: 'Colour', value: '#11223380', alpha: false });
		render(ColorPicker, { props });
		expect(input().value).toBe('#112233');
		props.alpha = true;
		await vi.waitFor(() => expect(input().value).toBe('#11223380'));
		await user.clear(input());
		await user.type(input(), '#abcd{Enter}');
		expect(props.value).toBe('#aabbccdd');
		await user.clear(input());
		await user.type(input(), '#abcf{Enter}');
		expect(props.value).toBe('#aabbcc');
	});

	it('a custom invalid text, an error prop and the field props', async () => {
		const user = userEvent.setup();
		const { unmount } = render(ColorPicker, { label: 'Colour', invalidText: 'Bad colour' });
		await user.type(input(), 'zz{Enter}');
		expect(screen.getByRole('alert').textContent).toContain('Bad colour');
		unmount();
		render(ColorPicker, {
			label: 'Colour',
			value: '#123456',
			error: 'Pick another',
			name: 'tint',
			id: 'tint-input',
			placeholder: 'Hex',
			required: true,
			hint: 'Brand colour',
			class: 'mine',
			pickerLabel: 'Pick'
		});
		expect(screen.getByRole('alert').textContent).toContain('Pick another');
		const hidden = document.querySelector<HTMLInputElement>('input[type="hidden"]');
		expect(hidden?.name).toBe('tint');
		expect(hidden?.value).toBe('#123456');
		expect(input().id).toBe('tint-input');
		expect(input().placeholder).toBe('Hex');
		expect(input().required).toBe(true);
		expect(document.querySelector('.mine')).not.toBeNull();
		expect(screen.getByRole('button', { name: 'Pick, #123456' })).toBeTruthy();
	});

	it('the hidden input is empty without a colour', () => {
		render(ColorPicker, { label: 'Colour', name: 'tint', value: 'nope' });
		expect(document.querySelector<HTMLInputElement>('input[type="hidden"]')?.value).toBe('');
	});

	it('disabled disables the field and the button', async () => {
		render(ColorPicker, { label: 'Colour', disabled: true });
		expect(input().disabled).toBe(true);
		expect(trigger().disabled).toBe(true);
		expect(document.querySelector('.k-color.disabled')).not.toBeNull();
		// Even a synthetic click on the disabled button does not open the panel.
		trigger().dispatchEvent(new MouseEvent('click', { bubbles: true }));
		await flush();
		expect(panel()).toBeNull();
	});
});

describe('ColorPicker panel', () => {
	it('opens a labelled panel with the focus on the area and closes on Escape with focus back', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		render(ColorPicker, { label: 'Colour', value: '#0000ff', onchange });
		await open(user);
		const dlg = screen.getByRole('dialog', { name: 'Choose color' });
		expect(trigger().getAttribute('aria-expanded')).toBe('true');
		expect(trigger().getAttribute('aria-controls')).toBe(dlg.id);
		expect(area().getAttribute('aria-valuenow')).toBe('100');
		expect(area().getAttribute('aria-valuetext')).toBe('blue, saturation 100%, brightness 100%');
		expect(hue().value).toBe('240');
		expect(hue().getAttribute('aria-valuetext')).toBe('240°');
		expect(screen.queryByRole('slider', { name: 'Opacity' })).toBeNull();
		expect(screen.queryByRole('group', { name: 'Presets' })).toBeNull();
		// Other keys in the panel do nothing.
		await user.keyboard('x');
		expect(panel()).not.toBeNull();
		await user.keyboard('{Escape}');
		expect(panel()).toBeNull();
		expect(document.activeElement).toBe(trigger());
		expect(onchange).not.toHaveBeenCalled();
	});

	it('the button toggles the panel', async () => {
		const user = userEvent.setup();
		render(ColorPicker, { label: 'Colour' });
		await open(user);
		await user.click(trigger());
		expect(panel()).toBeNull();
		expect(document.activeElement).toBe(trigger());
	});

	it('closes quietly when the focus leaves panel and button, not when it moves inside', async () => {
		const user = userEvent.setup();
		render(ColorPicker, { label: 'Colour', value: '#ff0000' });
		await open(user);
		await user.tab();
		expect(document.activeElement).toBe(hue());
		expect(panel()).not.toBeNull();
		// Focus to the trigger keeps it open.
		trigger().focus();
		expect(panel()).not.toBeNull();
		// Focus to nothing (relatedTarget null) keeps it open.
		await fireEvent.focusOut(area(), { relatedTarget: null });
		expect(panel()).not.toBeNull();
		hue().focus();
		input().focus();
		await vi.waitFor(() => expect(panel()).toBeNull());
		expect(document.activeElement).toBe(input());
	});

	it('a pointer outside closes; inside keeps it open', async () => {
		const user = userEvent.setup();
		render(ColorPicker, { label: 'Colour' });
		const outside = document.createElement('div');
		document.body.append(outside);
		try {
			await open(user);
			await fireEvent.pointerDown(screen.getByText('Hue'));
			expect(panel()).not.toBeNull();
			await fireEvent.pointerDown(outside);
			expect(panel()).toBeNull();
			await fireEvent.pointerDown(outside);
			expect(panel()).toBeNull();
		} finally {
			outside.remove();
		}
	});

	it('the area keys change saturation and brightness in small and large steps and commit', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<Props>({ label: 'Colour', value: '#ff0000', onchange });
		render(ColorPicker, { props });
		await open(user);
		await user.keyboard('{ArrowLeft}');
		expect(area().getAttribute('aria-valuenow')).toBe('99');
		expect(props.value).toBe('#ff0303');
		expect(onchange).toHaveBeenLastCalledWith('#ff0303');
		await user.keyboard('{Shift>}{ArrowLeft}{/Shift}');
		expect(area().getAttribute('aria-valuenow')).toBe('89');
		await user.keyboard('{ArrowRight}');
		expect(area().getAttribute('aria-valuenow')).toBe('90');
		await user.keyboard('{ArrowDown}');
		expect(area().getAttribute('aria-valuetext')).toContain('brightness 99%');
		await user.keyboard('{ArrowUp}');
		expect(area().getAttribute('aria-valuetext')).toContain('brightness 100%');
		await user.keyboard('{PageDown}');
		expect(area().getAttribute('aria-valuetext')).toContain('brightness 90%');
		await user.keyboard('{PageUp}{PageUp}');
		expect(area().getAttribute('aria-valuetext')).toContain('brightness 100%');
		await user.keyboard('{Home}');
		expect(area().getAttribute('aria-valuenow')).toBe('0');
		expect(props.value).toBe('#ffffff');
		await user.keyboard('{End}');
		expect(area().getAttribute('aria-valuenow')).toBe('100');
		expect(props.value).toBe('#ff0000');
		const calls = onchange.mock.calls.length;
		await user.keyboard('a');
		expect(onchange).toHaveBeenCalledTimes(calls);
	});

	it('dragging on the area sets saturation and brightness from the pointer and commits on release', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<Props>({ label: 'Colour', value: '#ff0000', onchange });
		render(ColorPicker, { props });
		await open(user);
		const el = area();
		vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(new DOMRect(10, 20, 200, 100));
		const capture = vi.spyOn(el, 'setPointerCapture');
		await fireEvent.pointerDown(el, { button: 0, pointerId: 1, clientX: 110, clientY: 70 });
		expect(capture).toHaveBeenCalledWith(1);
		expect(el.getAttribute('aria-valuenow')).toBe('50');
		expect(el.getAttribute('aria-valuetext')).toContain('brightness 50%');
		expect(onchange).not.toHaveBeenCalled();
		// Beyond the edges it clamps.
		await fireEvent.pointerMove(el, { pointerId: 1, clientX: 500, clientY: -50 });
		expect(el.getAttribute('aria-valuenow')).toBe('100');
		expect(props.value).toBe('#ff0000');
		vi.spyOn(el, 'hasPointerCapture').mockReturnValue(true);
		const release = vi.spyOn(el, 'releasePointerCapture');
		await fireEvent.pointerUp(el, { pointerId: 1 });
		expect(release).toHaveBeenCalledWith(1);
		expect(onchange).not.toHaveBeenCalled();
		// Not dragging: move and up do nothing.
		await fireEvent.pointerMove(el, { pointerId: 1, clientX: 10, clientY: 120 });
		expect(el.getAttribute('aria-valuenow')).toBe('100');
		await fireEvent.pointerUp(el, { pointerId: 1 });
		await fireEvent.pointerDown(el, { button: 0, pointerId: 2, clientX: 10, clientY: 120 });
		await fireEvent.pointerCancel(el, { pointerId: 2 });
		expect(props.value).toBe('#000000');
		expect(onchange).toHaveBeenCalledWith('#000000');
	});

	it('ignores other mouse buttons; an area without size gives 0', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ label: 'Colour', value: '#ff0000' });
		render(ColorPicker, { props });
		await open(user);
		await fireEvent.pointerDown(area(), { button: 2, pointerId: 1, clientX: 5, clientY: 5 });
		expect(props.value).toBe('#ff0000');
		await fireEvent.pointerDown(area(), { button: 0, pointerId: 1, clientX: 5, clientY: 5 });
		expect(props.value).toBe('#000000');
		await fireEvent.pointerUp(area(), { pointerId: 1 });
	});

	it('the hue slider changes the hue and commits on change', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<Props>({ label: 'Colour', value: '#ff0000', onchange });
		render(ColorPicker, { props });
		await open(user);
		setRange(hue(), '120');
		expect(props.value).toBe('#00ff00');
		expect(onchange).not.toHaveBeenCalled();
		await fireEvent.change(hue());
		expect(onchange).toHaveBeenCalledWith('#00ff00');
		expect(area().getAttribute('aria-valuetext')).toBe('green, saturation 100%, brightness 100%');
	});

	it('the opacity slider sets the alpha part; closing the panel commits', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<Props>({ label: 'Colour', value: '#ff000080', alpha: true, onchange, alphaLabel: 'Alpha', hueLabel: 'Tint' });
		render(ColorPicker, { props });
		await user.click(trigger());
		const opacity = await screen.findByRole('slider', { name: 'Alpha' });
		expect((opacity as HTMLInputElement).value).toBe('50');
		expect(opacity.getAttribute('aria-valuetext')).toBe('50%');
		expect(screen.getByRole('slider', { name: 'Tint' })).toBeTruthy();
		setRange(opacity as HTMLInputElement, '100');
		expect(props.value).toBe('#ff0000');
		setRange(opacity as HTMLInputElement, '25');
		expect(props.value).toBe('#ff000040');
		await fireEvent.change(opacity);
		expect(onchange).toHaveBeenCalledWith('#ff000040');
		setRange(opacity as HTMLInputElement, '75');
		await user.keyboard('{Escape}');
		expect(onchange).toHaveBeenLastCalledWith('#ff0000bf');
	});

	it('keeps hue and saturation when the colour turns grey or black', async () => {
		const user = userEvent.setup();
		const props = reactive<Props>({ label: 'Colour', value: '#00ff00' });
		render(ColorPicker, { props });
		props.value = '#000000';
		await vi.waitFor(() => expect(input().value).toBe('#000000'));
		await open(user);
		expect(hue().value).toBe('120');
		expect(area().getAttribute('aria-valuenow')).toBe('100');
		await user.keyboard('{Escape}');
		props.value = '#808080';
		await vi.waitFor(() => expect(input().value).toBe('#808080'));
		await open(user);
		expect(hue().value).toBe('120');
		expect(area().getAttribute('aria-valuenow')).toBe('0');
	});

	it('shows presets, marks the current one, picks one and commits', async () => {
		const user = userEvent.setup();
		const onchange = vi.fn();
		const props = reactive<Props>({
			label: 'Colour',
			value: '#ff0000',
			onchange,
			swatchesLabel: 'Brand',
			swatches: ['#f00', { value: '#ffff00', label: 'Sun' }, '#000080', 'nope']
		});
		render(ColorPicker, { props });
		await open(user);
		const group = screen.getByRole('group', { name: 'Brand' });
		const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>('button'));
		expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['#ff0000', 'Sun', '#000080']);
		expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
		expect(buttons[0].querySelector('svg')).not.toBeNull();
		expect(buttons[1].getAttribute('aria-pressed')).toBe('false');
		// Ink: white on dark navy, black on yellow.
		expect(buttons[2].style.getPropertyValue('--ink')).toBe('#ffffff');
		expect(buttons[1].style.getPropertyValue('--ink')).toBe('#000000');
		await user.click(screen.getByRole('button', { name: 'Sun' }));
		expect(props.value).toBe('#ffff00');
		expect(onchange).toHaveBeenCalledWith('#ffff00');
		expect(screen.getByRole('button', { name: 'Sun' }).getAttribute('aria-pressed')).toBe('true');
	});

	it('a transparent preset gets black ink', async () => {
		const user = userEvent.setup();
		render(ColorPicker, { label: 'Colour', alpha: true, swatches: ['#00008010'] });
		await open(user);
		expect(screen.getByRole('button', { name: '#00008010' }).style.getPropertyValue('--ink')).toBe('#000000');
	});

	it('uses the given labels, value text and colour names', async () => {
		const user = userEvent.setup();
		const describeFn = vi.fn((hsv: Hsv) => `hue ${Math.round(hsv.h)}`);
		render(ColorPicker, {
			label: 'Colour',
			value: '#0000ff',
			areaLabel: 'Field',
			areaText: '{color} / {saturation} / {brightness}',
			describe: describeFn
		});
		await user.click(trigger());
		const el = await screen.findByRole('slider', { name: 'Field' });
		expect(el.getAttribute('aria-valuetext')).toBe('hue 240 / 100 / 100');
	});

	it('Escape on the area does not reach handlers outside the panel', async () => {
		const user = userEvent.setup();
		const outer = vi.fn();
		document.addEventListener('keydown', outer);
		try {
			render(ColorPicker, { label: 'Colour' });
			await open(user);
			await user.keyboard('{Escape}');
			expect(outer).not.toHaveBeenCalledWith(expect.objectContaining({ key: 'Escape' }));
			await flush();
		} finally {
			document.removeEventListener('keydown', outer);
		}
	});
});
