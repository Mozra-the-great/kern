/**
 * OnlineStatus: the bound `online` value after mount and on the `online`/`offline` events, the offline
 * notice (title, optional text, defaults and overrides), `onchange` only for changes, the announcements
 * through an announcer with a mounted host (offline at start, loss, return, `onlineText: ''`, politeness)
 * and the notice as its own live region when nothing announces.
 */
import { render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { createAnnouncer, type Announcer, type AnnouncerHost } from '../../src/lib/components/announcer.js';
import OnlineStatus from '../../src/lib/components/OnlineStatus.svelte';
import { reactive } from './reactive.svelte.js';

let onLine: MockInstance<() => boolean>;
let connected = true;

function go(online: boolean): void {
	connected = online;
	window.dispatchEvent(new Event(online ? 'online' : 'offline'));
}

beforeEach(() => {
	connected = true;
	onLine = vi.spyOn(window.navigator, 'onLine', 'get').mockImplementation(() => connected);
});
afterEach(() => {
	onLine.mockRestore();
});

function withHost(): { announcer: Announcer; host: AnnouncerHost; said: Array<[string, string | undefined]> } {
	const announcer = createAnnouncer();
	const host = announcer.attach();
	const said: Array<[string, string | undefined]> = [];
	const original = announcer.announce.bind(announcer);
	announcer.announce = (message, politeness): void => {
		said.push([message, politeness]);
		original(message, politeness);
	};
	return { announcer, host, said };
}

describe('OnlineStatus', () => {
	it('binds online after mount and shows nothing while online', () => {
		const props = reactive<{ online: boolean | undefined; class: string }>({ online: undefined, class: 'extra' });
		const { container } = render(OnlineStatus, { props });
		expect(props.online).toBe(true);
		const root = container.querySelector('.k-online-status');
		expect(root?.classList.contains('extra')).toBe(true);
		expect(root?.querySelector('.notice')).toBeNull();
	});

	it('shows the default notice when the connection drops and hides it when it returns', async () => {
		const onchange = vi.fn();
		const props = reactive<{ online: boolean | undefined; onchange: (online: boolean) => void }>({ online: undefined, onchange });
		render(OnlineStatus, { props });
		go(false);
		await vi.waitFor(() => expect(screen.getByText('You are offline')).toBeTruthy());
		expect(document.querySelector('.text')?.textContent).toBeTruthy();
		expect(props.online).toBe(false);
		expect(onchange).toHaveBeenCalledWith(false);
		go(true);
		await vi.waitFor(() => expect(screen.queryByText('You are offline')).toBeNull());
		expect(onchange).toHaveBeenLastCalledWith(true);
		expect(onchange).toHaveBeenCalledTimes(2);
	});

	it('does not call onchange for an event that changes nothing', () => {
		const onchange = vi.fn();
		render(OnlineStatus, { onchange });
		go(true);
		expect(onchange).not.toHaveBeenCalled();
	});

	it('takes custom texts; an empty offlineText leaves the second line out', async () => {
		connected = false;
		const props = reactive<{ offlineTitle: string; offlineText: string | undefined }>({
			offlineTitle: 'No network',
			offlineText: 'Retrying'
		});
		render(OnlineStatus, { props });
		await vi.waitFor(() => expect(screen.getByText('No network')).toBeTruthy());
		expect(screen.getByText('Retrying')).toBeTruthy();
		props.offlineText = '';
		await vi.waitFor(() => expect(document.querySelector('.text')).toBeNull());
	});

	it('is its own live region without a mounted announcer host', () => {
		const { container } = render(OnlineStatus, { announcer: createAnnouncer() });
		expect(container.querySelector('.k-online-status')?.getAttribute('role')).toBe('status');
	});

	it('is its own live region with announce=false, and then announces nothing', () => {
		const { announcer, said } = withHost();
		connected = false;
		const { container } = render(OnlineStatus, { announcer, announce: false });
		expect(container.querySelector('.k-online-status')?.getAttribute('role')).toBe('status');
		expect(said).toEqual([]);
	});

	it('with a host announces a page that starts offline, the loss and the return', () => {
		const { announcer, host, said } = withHost();
		connected = false;
		const { container } = render(OnlineStatus, { announcer, politeness: 'assertive', offlineTitle: 'Offline', onlineText: 'Online again' });
		expect(container.querySelector('.k-online-status')?.hasAttribute('role')).toBe(false);
		expect(said).toEqual([['Offline', 'assertive']]);
		go(true);
		go(false);
		expect(said).toEqual([
			['Offline', 'assertive'],
			['Online again', 'assertive'],
			['Offline', 'assertive']
		]);
		host.release();
	});

	it('announces the default texts politely and never a return at mount', () => {
		const { announcer, host, said } = withHost();
		render(OnlineStatus, { announcer });
		expect(said).toEqual([]);
		go(false);
		go(true);
		expect(said).toEqual([
			['You are offline', 'polite'],
			['Back online', 'polite']
		]);
		host.release();
	});

	it("onlineText '' announces nothing on return", () => {
		const { announcer, host, said } = withHost();
		render(OnlineStatus, { announcer, onlineText: '' });
		go(false);
		go(true);
		expect(said.map(([m]) => m)).toEqual(['You are offline']);
		host.release();
	});

	it('becomes its own live region again when the host goes away', async () => {
		const { announcer, host } = withHost();
		const { container } = render(OnlineStatus, { announcer });
		const root = container.querySelector('.k-online-status');
		expect(root?.hasAttribute('role')).toBe(false);
		host.release();
		await vi.waitFor(() => expect(root?.getAttribute('role')).toBe('status'));
	});

	it('stops listening after unmount', () => {
		const onchange = vi.fn();
		const { unmount } = render(OnlineStatus, { onchange });
		unmount();
		go(false);
		expect(onchange).not.toHaveBeenCalled();
	});
});
