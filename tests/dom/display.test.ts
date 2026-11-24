/**
 * Small display components: Divider, Alert, Avatar, Label, EmptyState, GridBackground, Spinner, Badge, Caret,
 * LiveAnnouncer, Collapsible, Accordion and AccordionItem. Covers their props and defaults, the roles and names
 * they expose, optional snippets, callbacks and the `bind:open` of the disclosure components.
 */
import { fireEvent, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Accordion from '../../src/lib/components/Accordion.svelte';
import AccordionItem from '../../src/lib/components/AccordionItem.svelte';
import Alert from '../../src/lib/components/Alert.svelte';
import { createAnnouncer } from '../../src/lib/components/announcer.js';
import Avatar from '../../src/lib/components/Avatar.svelte';
import Badge from '../../src/lib/components/Badge.svelte';
import Caret from '../../src/lib/components/Caret.svelte';
import Collapsible from '../../src/lib/components/Collapsible.svelte';
import Divider from '../../src/lib/components/Divider.svelte';
import EmptyState from '../../src/lib/components/EmptyState.svelte';
import GridBackground from '../../src/lib/components/GridBackground.svelte';
import Label from '../../src/lib/components/Label.svelte';
import LiveAnnouncer from '../../src/lib/components/LiveAnnouncer.svelte';
import Spinner from '../../src/lib/components/Spinner.svelte';
import { mapSnippet, textSnippet } from './helpers.js';
import { reactive } from './reactive.svelte.js';

describe('Divider', () => {
	it('is a plain rule by default', () => {
		const { container } = render(Divider);
		const hr = container.querySelector('hr');
		expect(hr?.className).toContain('k-divider');
		expect(screen.getByRole('separator')).toBe(hr);
	});

	it('shows a label as a horizontal separator', () => {
		const { container } = render(Divider, { label: 'or', class: 'extra' });
		const sep = screen.getByRole('separator');
		expect(sep.tagName).toBe('DIV');
		expect(sep.textContent).toBe('or');
		expect(sep.classList.contains('extra')).toBe(true);
		expect(container.querySelector('hr')).toBeNull();
	});

	it('vertical wins over the label and names its orientation', () => {
		render(Divider, { vertical: true, label: 'ignored', class: 'v' });
		const sep = screen.getByRole('separator');
		expect(sep.getAttribute('aria-orientation')).toBe('vertical');
		expect(sep.classList.contains('v')).toBe(true);
		expect(sep.textContent).toBe('');
	});

	it('vertical=false with an empty label stays a rule', () => {
		const { container } = render(Divider, { vertical: false, label: '' });
		expect(container.querySelector('hr')).not.toBeNull();
	});
});

describe('Alert', () => {
	it('is a polite status with the info tone by default and no close button', () => {
		render(Alert, { children: textSnippet('Body') });
		const status = screen.getByRole('status');
		expect(status.dataset['tone']).toBe('info');
		expect(status.querySelector('.title')).toBeNull();
		expect(status.querySelector('.actions')).toBeNull();
		expect(screen.queryByRole('button')).toBeNull();
	});

	it.each(['danger', 'warn'] as const)('tone %s is an alert', (tone) => {
		render(Alert, { tone, title: 'Careful', class: 'x' });
		const alert = screen.getByRole('alert');
		expect(alert.dataset['tone']).toBe(tone);
		expect(alert.classList.contains('x')).toBe(true);
		expect(alert.querySelector('.title')?.textContent).toBe('Careful');
		expect(alert.querySelector('.text')).toBeNull();
	});

	it('tone ok stays a status', () => {
		render(Alert, { tone: 'ok', actions: textSnippet('Undo') });
		const status = screen.getByRole('status');
		expect(status.querySelector('.actions')?.textContent).toBe('Undo');
	});

	it('ondismiss shows a named close button that calls it', async () => {
		const user = userEvent.setup();
		const ondismiss = vi.fn();
		render(Alert, { ondismiss, children: textSnippet('Body') });
		await user.click(screen.getByRole('button', { name: 'Dismiss' }));
		expect(ondismiss).toHaveBeenCalledTimes(1);
	});

	it('dismissLabel overrides the default name', () => {
		render(Alert, { ondismiss: () => {}, dismissLabel: 'Close note' });
		expect(screen.getByRole('button', { name: 'Close note' })).toBeTruthy();
	});
});

describe('Avatar', () => {
	it('shows up to two initials and is named by the name', () => {
		render(Avatar, { name: '  ada  king lovelace ' });
		const img = screen.getByRole('img');
		expect(img.getAttribute('aria-label')).toBe('  ada  king lovelace ');
		expect(img.textContent).toBe('AK');
		expect(img.style.getPropertyValue('--size')).toBe('40px');
	});

	it('shows the picture and falls back to the initials when it fails', async () => {
		const { container } = render(Avatar, { name: 'Ada Lovelace', src: '/ada.png', size: 64, class: 'me' });
		const root = screen.getByRole('img', { name: 'Ada Lovelace' });
		expect(root.classList.contains('me')).toBe(true);
		expect(root.style.getPropertyValue('--size')).toBe('64px');
		const picture = container.querySelector('img');
		expect(picture?.getAttribute('src')).toBe('/ada.png');
		expect(picture?.getAttribute('alt')).toBe('');
		await fireEvent.error(picture as HTMLImageElement);
		expect(container.querySelector('img')).toBeNull();
		expect(root.textContent).toBe('AL');
	});

	it('an empty src shows the initials', () => {
		const { container } = render(Avatar, { name: 'Bo', src: '' });
		expect(container.querySelector('img')).toBeNull();
		expect(screen.getByRole('img').textContent).toBe('B');
	});
});

describe('Label', () => {
	it('is a label for a control with the text', () => {
		const { container } = render(Label, { for: 'ctl', text: 'Name', class: 'mine', id: 'lbl' });
		const label = container.querySelector('label');
		expect(label?.getAttribute('for')).toBe('ctl');
		expect(label?.id).toBe('lbl');
		expect(label?.classList.contains('mine')).toBe(true);
		expect(label?.textContent).toBe('Name');
		expect(label?.querySelector('.req')).toBeNull();
	});

	it('renders children instead of text and marks required', () => {
		const { container } = render(Label, { children: textSnippet('Rich'), required: true });
		const label = container.querySelector('label');
		expect(label?.textContent).toBe('Rich*');
		expect(label?.querySelector('.req')?.getAttribute('aria-hidden')).toBe('true');
	});

	it('as="span" names a group with the text, children or nothing', () => {
		const { container, unmount } = render(Label, { as: 'span', text: 'Size', required: true, id: 'g', class: 'c' });
		const span = container.querySelector('span.k-label');
		expect(container.querySelector('label')).toBeNull();
		expect(span?.id).toBe('g');
		expect(span?.classList.contains('c')).toBe(true);
		expect(span?.textContent).toBe('Size*');
		unmount();
		const second = render(Label, { as: 'span', children: textSnippet('Kids'), required: false });
		expect(second.container.querySelector('span.k-label')?.textContent).toBe('Kids');
		second.unmount();
		const third = render(Label, { as: 'span' });
		expect(third.container.querySelector('span.k-label')?.textContent).toBe('');
	});

	it('a label without text or children is empty', () => {
		const { container } = render(Label, {});
		expect(container.querySelector('label')?.textContent).toBe('');
	});
});

describe('EmptyState', () => {
	it('shows the title as a level 3 heading by default, nothing else', () => {
		const { container } = render(EmptyState, { title: 'Nothing here' });
		expect(screen.getByRole('heading', { level: 3, name: 'Nothing here' })).toBeTruthy();
		expect(container.querySelector('.icon')).toBeNull();
		expect(container.querySelector('.desc')).toBeNull();
		expect(container.querySelector('.actions')).toBeNull();
	});

	it('shows the icon hidden, the description and the actions at the chosen level', () => {
		const { container } = render(EmptyState, {
			title: 'No files',
			description: 'Upload one',
			level: 2,
			icon: textSnippet('*'),
			actions: textSnippet('Upload'),
			class: 'e'
		});
		expect(screen.getByRole('heading', { level: 2, name: 'No files' })).toBeTruthy();
		expect(container.querySelector('.k-empty')?.classList.contains('e')).toBe(true);
		expect(container.querySelector('.icon')?.getAttribute('aria-hidden')).toBe('true');
		expect(container.querySelector('.desc')?.textContent).toBe('Upload one');
		expect(container.querySelector('.actions')?.textContent).toBe('Upload');
	});
});

describe('GridBackground', () => {
	it('draws a hidden grid pattern of 32 px under its content', () => {
		const { container } = render(GridBackground, { children: textSnippet('On top') });
		const root = container.querySelector<HTMLElement>('.k-grid-bg');
		const pattern = container.querySelector<HTMLElement>('.pattern');
		expect(root?.style.getPropertyValue('--k-grid-size')).toBe('32px');
		expect(pattern?.dataset['variant']).toBe('grid');
		expect(pattern?.getAttribute('aria-hidden')).toBe('true');
		expect(pattern?.classList.contains('fade')).toBe(false);
		expect(root?.textContent.trim()).toBe('On top');
	});

	it('takes variant, fade and a size of at least 4 px', () => {
		const { container } = render(GridBackground, { variant: 'dots', size: 1, fade: true, class: 'g' });
		const root = container.querySelector<HTMLElement>('.k-grid-bg');
		const pattern = container.querySelector<HTMLElement>('.pattern');
		expect(root?.classList.contains('g')).toBe(true);
		expect(root?.style.getPropertyValue('--k-grid-size')).toBe('4px');
		expect(pattern?.dataset['variant']).toBe('dots');
		expect(pattern?.classList.contains('fade')).toBe(true);
	});
});

describe('Spinner', () => {
	it('is a status named "Loading" by default', () => {
		render(Spinner);
		const status = screen.getByRole('status');
		expect(status.textContent.trim()).toBe('Loading');
		expect(status.style.getPropertyValue('--size')).toBe('20px');
	});

	it('takes label, size and class', () => {
		render(Spinner, { label: 'Saving', size: 32, class: 's' });
		const status = screen.getByRole('status');
		expect(status.textContent.trim()).toBe('Saving');
		expect(status.style.getPropertyValue('--size')).toBe('32px');
		expect(status.classList.contains('s')).toBe(true);
	});
});

describe('Badge', () => {
	it('is neutral and soft by default', () => {
		const { container } = render(Badge, { children: textSnippet('New') });
		const badge = container.querySelector<HTMLElement>('.k-badge');
		expect(badge?.dataset['tone']).toBe('neutral');
		expect(badge?.dataset['look']).toBe('soft');
		expect(badge?.textContent).toBe('New');
	});

	it('takes tone, look and class; renders without children', () => {
		const { container } = render(Badge, { tone: 'danger', look: 'solid', class: 'b' });
		const badge = container.querySelector<HTMLElement>('.k-badge');
		expect(badge?.dataset['tone']).toBe('danger');
		expect(badge?.dataset['look']).toBe('solid');
		expect(badge?.classList.contains('b')).toBe(true);
		expect(badge?.textContent).toBe('');
	});
});

describe('Caret', () => {
	it('is a hidden blinking block for four cycles by default', () => {
		const { container } = render(Caret);
		const caret = container.querySelector<HTMLElement>('.k-caret');
		expect(caret?.getAttribute('aria-hidden')).toBe('true');
		expect(caret?.dataset['shape']).toBe('block');
		expect(caret?.classList.contains('blink')).toBe(true);
		expect(caret?.style.getPropertyValue('--k-caret-cycles')).toBe('4');
	});

	it('cycles 0 blinks forever, fractions are floored, blink can be off', () => {
		const forever = render(Caret, { cycles: 0, shape: 'bar', class: 'c' });
		const caret = forever.container.querySelector<HTMLElement>('.k-caret');
		expect(caret?.style.getPropertyValue('--k-caret-cycles')).toBe('infinite');
		expect(caret?.dataset['shape']).toBe('bar');
		expect(caret?.classList.contains('c')).toBe(true);
		forever.unmount();
		const still = render(Caret, { cycles: 2.7, blink: false, shape: 'underline' });
		const second = still.container.querySelector<HTMLElement>('.k-caret');
		expect(second?.style.getPropertyValue('--k-caret-cycles')).toBe('2');
		expect(second?.classList.contains('blink')).toBe(false);
	});
});

describe('LiveAnnouncer', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('shows the messages of its announcer in a polite and an assertive region', async () => {
		const announcer = createAnnouncer();
		const { container, unmount } = render(LiveAnnouncer, { announcer, class: 'live' });
		expect(container.querySelector('.k-live-announcer')?.classList.contains('live')).toBe(true);
		const polite = screen.getByRole('status');
		const assertive = screen.getByRole('alert');
		expect(polite.getAttribute('aria-live')).toBe('polite');
		expect(assertive.getAttribute('aria-live')).toBe('assertive');
		announcer.announce('Saved');
		announcer.announce('Failed', 'assertive');
		await vi.waitFor(() => expect(polite.textContent).toBe('Saved'));
		expect(assertive.textContent).toBe('Failed');
		expect(announcer.hosts).toBe(1);
		unmount();
		expect(announcer.hosts).toBe(0);
	});

	it('only the first mounted one fills its regions', async () => {
		const announcer = createAnnouncer();
		const first = render(LiveAnnouncer, { announcer });
		const second = render(LiveAnnouncer, { announcer });
		announcer.announce('Once');
		announcer.announce('Loud', 'assertive');
		const [firstPolite, secondPolite] = screen.getAllByRole('status');
		const [, secondAlert] = screen.getAllByRole('alert');
		await vi.waitFor(() => expect(firstPolite?.textContent).toBe('Once'));
		expect(secondPolite?.textContent).toBe('');
		expect(secondAlert?.textContent).toBe('');
		first.unmount();
		second.unmount();
	});

	it('uses the shared announcer without a prop', () => {
		render(LiveAnnouncer);
		expect(screen.getByRole('status').textContent).toBe('');
	});
});

describe('Collapsible', () => {
	it('starts closed, toggles on click, reports and binds the state', async () => {
		const user = userEvent.setup();
		const ontoggle = vi.fn();
		const props = reactive<{
			label: string;
			open: boolean | undefined;
			ontoggle: (open: boolean) => void;
			children: ReturnType<typeof textSnippet>;
		}>({
			label: 'More',
			open: undefined,
			ontoggle,
			children: textSnippet('Hidden part')
		});
		const { container } = render(Collapsible, { props });
		const button = screen.getByRole('button', { name: 'More' });
		const clip = container.querySelector<HTMLElement>('.clip');
		expect(button.getAttribute('aria-expanded')).toBe('false');
		expect(container.querySelector('.k-collapsible')?.getAttribute('data-look')).toBe('boxed');
		expect(clip?.inert).toBe(true);
		const panel = screen.getByRole('group', { name: 'More' });
		expect(button.getAttribute('aria-controls')).toBe(panel.id);
		await user.click(button);
		expect(button.getAttribute('aria-expanded')).toBe('true');
		expect(clip?.inert).toBe(false);
		expect(props.open).toBe(true);
		expect(ontoggle).toHaveBeenLastCalledWith(true);
		await user.click(button);
		expect(props.open).toBe(false);
		expect(ontoggle).toHaveBeenLastCalledWith(false);
		props.open = true;
		await vi.waitFor(() => expect(button.getAttribute('aria-expanded')).toBe('true'));
	});

	it('takes a trigger snippet, look and class; disabled does not toggle', async () => {
		const user = userEvent.setup();
		const { container } = render(Collapsible, {
			trigger: textSnippet('Custom'),
			look: 'plain',
			disabled: true,
			open: false,
			class: 'k'
		});
		const button = screen.getByRole('button', { name: 'Custom' });
		const root = container.querySelector('.k-collapsible');
		expect(root?.getAttribute('data-look')).toBe('plain');
		expect(root?.classList.contains('k')).toBe(true);
		expect(button.hasAttribute('disabled')).toBe(true);
		await user.click(button);
		expect(button.getAttribute('aria-expanded')).toBe('false');
	});

	it('toggles without an ontoggle callback', async () => {
		const user = userEvent.setup();
		render(Collapsible, { label: 'Plain', open: true });
		const button = screen.getByRole('button', { name: 'Plain' });
		expect(button.getAttribute('aria-expanded')).toBe('true');
		await user.click(button);
		expect(button.getAttribute('aria-expanded')).toBe('false');
	});
});

describe('AccordionItem', () => {
	it('is a closed disclosure with the title as summary by default', () => {
		const { container } = render(AccordionItem, { title: 'One', children: textSnippet('Body') });
		const details = container.querySelector('details');
		expect(details?.open).toBe(false);
		expect(details?.querySelector('summary')?.textContent?.trim()).toBe('One');
		expect(details?.querySelector('.content')?.textContent).toBe('Body');
	});

	it('binds open both ways and takes name and class', async () => {
		const props = reactive<{ title: string; open: boolean | undefined; name: string; class: string }>({
			title: 'Two',
			open: true,
			name: 'grp',
			class: 'it'
		});
		const { container } = render(AccordionItem, { props });
		const details = container.querySelector('details') as HTMLDetailsElement;
		expect(details.open).toBe(true);
		expect(details.getAttribute('name')).toBe('grp');
		expect(details.classList.contains('it')).toBe(true);
		details.open = false;
		await fireEvent(details, new Event('toggle'));
		expect(props.open).toBe(false);
		props.open = true;
		await vi.waitFor(() => expect(details.open).toBe(true));
	});
});

describe('Accordion', () => {
	it('renders data-driven items with their content, independent by default', () => {
		const { container } = render(Accordion, {
			items: [
				{ id: 'a', title: 'Alpha', open: true },
				{ id: 'b', title: 'Beta' }
			],
			content: mapSnippet<string>((id) => `body ${id}`),
			class: 'acc'
		});
		const details = container.querySelectorAll('details');
		expect(container.querySelector('.k-accordion')?.classList.contains('acc')).toBe(true);
		expect(details).toHaveLength(2);
		expect(details[0]?.open).toBe(true);
		expect(details[1]?.open).toBe(false);
		expect(details[0]?.hasAttribute('name')).toBe(false);
		expect(details[1]?.textContent).toContain('body b');
	});

	it('single gives the items one shared name; works without content', () => {
		const { container } = render(Accordion, {
			items: [
				{ id: 'a', title: 'Alpha' },
				{ id: 'b', title: 'Beta' }
			],
			single: true
		});
		const [first, second] = Array.from(container.querySelectorAll('details'));
		expect(first?.getAttribute('name')).toBeTruthy();
		expect(first?.getAttribute('name')).toBe(second?.getAttribute('name'));
	});

	it('renders children without items', () => {
		const { container } = render(Accordion, { children: textSnippet('Own items'), single: false });
		expect(container.querySelector('details')).toBeNull();
		expect(container.querySelector('.k-accordion')?.textContent.trim()).toBe('Own items');
	});
});

/** Props as an untyped caller (plain JavaScript, a custom-element attribute bridge) may pass them: `null` for a string. */
function loose<P>(props: Record<string, unknown>): P {
	return props as P;
}

describe('nullish class and style values from untyped callers', () => {
	const cases: [string, () => ReturnType<typeof render>, string][] = [
		['Divider', () => render(Divider, loose({ class: null })), '.k-divider'],
		['Divider labelled', () => render(Divider, loose({ class: null, label: 'or' })), '.k-divider'],
		['Divider vertical', () => render(Divider, loose({ class: null, vertical: true })), '.k-divider-v'],
		['Alert', () => render(Alert, loose({ class: null })), '.k-alert'],
		['Avatar', () => render(Avatar, loose({ name: 'A', class: null, size: null })), '.k-avatar'],
		['Label', () => render(Label, loose({ class: null })), '.k-label'],
		['Label span', () => render(Label, loose({ class: null, as: 'span' })), '.k-label'],
		['EmptyState', () => render(EmptyState, loose({ title: 'T', class: null })), '.k-empty'],
		['GridBackground', () => render(GridBackground, loose({ class: null })), '.k-grid-bg'],
		['Spinner', () => render(Spinner, loose({ class: null, size: null })), '.k-spinner'],
		['Badge', () => render(Badge, loose({ class: null })), '.k-badge'],
		['Caret', () => render(Caret, loose({ class: null })), '.k-caret'],
		['LiveAnnouncer', () => render(LiveAnnouncer, loose({ announcer: createAnnouncer(), class: null })), '.k-live-announcer'],
		['Collapsible', () => render(Collapsible, loose({ label: 'L', class: null })), '.k-collapsible'],
		['Accordion', () => render(Accordion, loose({ class: null })), '.k-accordion'],
		['AccordionItem', () => render(AccordionItem, loose({ title: 'T', class: null })), '.k-accordion-item']
	];

	it.each(cases)('%s renders no "null" text into class or style', (_name, mount, selector) => {
		const { container } = mount();
		const root = container.querySelector(selector);
		expect(root).not.toBeNull();
		expect(root?.getAttribute('class')).not.toMatch(/null|undefined/);
		expect(root?.getAttribute('style') ?? '').not.toMatch(/null|undefined/);
	});
});
