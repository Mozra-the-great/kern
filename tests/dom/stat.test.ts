/**
 * Stat: label, text and formatted number values with unit, the change (direction, sign, tone against
 * `positiveIsGood`, unit, spoken text from the default and own labels, no change for a missing or non-finite
 * delta), the delta context, description, spark snippet, look and locale.
 */
import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Stat from '../../src/lib/components/Stat.svelte';
import { textSnippet } from './helpers.js';

function part(selector: string): string | undefined {
	return document.querySelector(selector)?.textContent.trim();
}

describe('Stat', () => {
	it('shows a text value as it is, without change, unit, description or spark', () => {
		render(Stat, { label: 'Status', value: 'Healthy' });
		expect(part('.label')).toBe('Status');
		expect(part('.num')).toBe('Healthy');
		expect(document.querySelector('.unit')).toBeNull();
		expect(document.querySelector('.change')).toBeNull();
		expect(document.querySelector('.desc')).toBeNull();
		expect(document.querySelector('.spark')).toBeNull();
		expect(document.querySelector('.k-stat')?.getAttribute('data-look')).toBe('raised');
	});

	it('formats a number with the locale and shows unit, description, spark, look and class', () => {
		render(Stat, {
			label: 'Revenue',
			value: 12345.5,
			unit: '€',
			locale: 'de-DE',
			description: 'This month',
			look: 'outline',
			class: 'mine',
			spark: textSnippet('chart')
		});
		expect(part('.num')).toBe('12.345,5');
		expect(part('.unit')).toBe('€');
		expect(part('.desc')).toBe('This month');
		expect(part('.spark')).toBe('chart');
		const root = document.querySelector('.k-stat');
		expect(root?.getAttribute('data-look')).toBe('outline');
		expect(root?.classList.contains('mine')).toBe(true);
	});

	it('a rise is good by default, with a plus sign, the default unit and spoken text', () => {
		render(Stat, { label: 'Users', value: 10, delta: 4.25, deltaLabel: 'vs. last week', locale: 'en-US' });
		const delta = document.querySelector<HTMLElement>('.delta');
		expect(delta?.dataset['dir']).toBe('up');
		expect(delta?.dataset['tone']).toBe('good');
		// The amount and its unit are joined by a no-break space.
		expect(delta?.querySelector('span[aria-hidden="true"]')?.textContent).toBe('+4.3 %');
		expect(part('.delta .sr')).toBe('up 4.3 %');
		expect(part('.ctx')).toBe('vs. last week');
		expect(delta?.querySelector('path')?.getAttribute('d')).toBe('M8 13V3.5M3.5 7.5L8 3l4.5 4.5');
	});

	it('a fall is bad by default, with a minus sign', () => {
		render(Stat, { label: 'Users', value: 10, delta: -2, deltaUnit: 'pts', locale: 'en-US' });
		const delta = document.querySelector<HTMLElement>('.delta');
		expect(delta?.dataset['dir']).toBe('down');
		expect(delta?.dataset['tone']).toBe('bad');
		expect(delta?.querySelector('span[aria-hidden="true"]')?.textContent).toBe('−2 pts');
		expect(part('.delta .sr')).toBe('down 2 pts');
		expect(document.querySelector('.ctx')).toBeNull();
		expect(delta?.querySelector('path')?.getAttribute('d')).toBe('M8 3v9.5M3.5 8.5L8 13l4.5-4.5');
	});

	it('positiveIsGood=false swaps the tones', () => {
		const { unmount } = render(Stat, { label: 'Errors', value: 3, delta: 1, positiveIsGood: false });
		expect(document.querySelector<HTMLElement>('.delta')?.dataset['tone']).toBe('bad');
		unmount();
		render(Stat, { label: 'Errors', value: 3, delta: -1, positiveIsGood: false });
		expect(document.querySelector<HTMLElement>('.delta')?.dataset['tone']).toBe('good');
	});

	it('no change is flat and neutral; an empty delta unit shows the bare number', () => {
		render(Stat, { label: 'Users', value: 10, delta: 0, deltaUnit: '' });
		const delta = document.querySelector<HTMLElement>('.delta');
		expect(delta?.dataset['dir']).toBe('flat');
		expect(delta?.dataset['tone']).toBe('neutral');
		expect(delta?.querySelector('span[aria-hidden="true"]')?.textContent).toBe('0');
		expect(part('.delta .sr')).toBe('unchanged');
		expect(delta?.querySelector('path')?.getAttribute('d')).toBe('M3 8h10');
	});

	it('uses its own spoken labels', () => {
		const { unmount } = render(Stat, { label: 'A', value: 1, delta: 5, deltaUnit: '', upLabel: 'rose by {value}' });
		expect(part('.delta .sr')).toBe('rose by 5');
		unmount();
		const second = render(Stat, { label: 'A', value: 1, delta: -5, deltaUnit: '', downLabel: 'fell by {value}' });
		expect(part('.delta .sr')).toBe('fell by 5');
		second.unmount();
		render(Stat, { label: 'A', value: 1, delta: 0, flatLabel: 'steady' });
		expect(part('.delta .sr')).toBe('steady');
	});

	it('shows no change for a non-finite delta', () => {
		render(Stat, { label: 'A', value: 1, delta: Number.NaN });
		expect(document.querySelector('.change')).toBeNull();
	});
});
