/*
 * Framework-free announcer store (#64): the text of one polite and one assertive live region and
 * `announce(message, politeness)` to change it. Like the toast queue it lives on a well-known global
 * (`sharedAnnouncer`), so a message from the Svelte package reaches the <LiveAnnouncer> or
 * <k-live-announcer> of the other build on the same page. The components subscribe to it.
 *
 * A screen reader speaks a live region when its text changes, so an equal message is first cleared
 * and set again a moment later, and a message is removed after a while: stale text is not left
 * behind for browse mode.
 */

export type Politeness = 'polite' | 'assertive';

/** How long a message stays in its region, in milliseconds. */
export const ANNOUNCE_CLEAR_MS = 10_000;
/** Pause between clearing an equal message and setting it again, in milliseconds. */
export const ANNOUNCE_REPEAT_MS = 60;

/** One mounted live-region component. Only the first one fills its regions, so a page with two (one per build) does not speak twice. */
export interface AnnouncerHost {
	/** True while this host is the one that shows the messages. */
	readonly primary: boolean;
	/** Call when the component goes away. */
	release(): void;
}

export interface Announcer {
	/** Shape version of the shared announcer (see `sharedAnnouncer`). */
	readonly version: 1;
	/** Text of the polite region. */
	readonly polite: string;
	/** Text of the assertive region. */
	readonly assertive: string;
	/** Number of live-region components that are mounted; messages go nowhere while it is 0. */
	readonly hosts: number;
	/** Says `message` through the polite (default) or the assertive region. Empty messages are ignored. */
	announce(message: string, politeness?: Politeness): void;
	/** Empties both regions. */
	clear(): void;
	/** Registers a live-region component. */
	attach(): AnnouncerHost;
	/** Calls `fn` now and after every change. Returns the unsubscribe function. */
	subscribe(fn: () => void): () => void;
}

interface Channel {
	text: string;
	/** Bumped by every announcement; a pending timer of an older one is dropped. */
	generation: number;
	timer: ReturnType<typeof setTimeout> | undefined;
}

/** A new, independent announcer, e.g. for an isolated <LiveAnnouncer announcer={…}> or for tests. */
export function createAnnouncer(): Announcer {
	const channels: Record<Politeness, Channel> = {
		polite: { text: '', generation: 0, timer: undefined },
		assertive: { text: '', generation: 0, timer: undefined }
	};
	const listeners = new Set<() => void>();
	const hosts: object[] = [];

	function notify(): void {
		for (const fn of [...listeners]) {
			try {
				fn();
			} catch (error) {
				if (typeof reportError === 'function') reportError(error);
				else console.error(error);
			}
		}
	}

	function show(channel: Channel, message: string): void {
		const generation = channel.generation;
		channel.text = message;
		notify();
		channel.timer = setTimeout(() => {
			channel.timer = undefined;
			if (channel.generation !== generation) return;
			channel.text = '';
			notify();
		}, ANNOUNCE_CLEAR_MS);
	}

	const announcer: Announcer = {
		version: 1,
		get polite() {
			return channels.polite.text;
		},
		get assertive() {
			return channels.assertive.text;
		},
		get hosts() {
			return hosts.length;
		},
		announce(message, politeness = 'polite') {
			if (typeof message !== 'string' || message.trim() === '') return;
			const channel = channels[politeness === 'assertive' ? 'assertive' : 'polite'];
			const generation = ++channel.generation;
			if (channel.timer !== undefined) clearTimeout(channel.timer);
			channel.timer = undefined;
			if (channel.text !== message) {
				show(channel, message);
				return;
			}
			channel.text = '';
			notify();
			channel.timer = setTimeout(() => {
				channel.timer = undefined;
				if (channel.generation === generation) show(channel, message);
			}, ANNOUNCE_REPEAT_MS);
		},
		clear() {
			for (const channel of Object.values(channels)) {
				channel.generation++;
				if (channel.timer !== undefined) clearTimeout(channel.timer);
				channel.timer = undefined;
				channel.text = '';
			}
			notify();
		},
		attach() {
			const token = {};
			hosts.push(token);
			notify();
			return {
				get primary() {
					return hosts[0] === token;
				},
				release() {
					const at = hosts.indexOf(token);
					if (at === -1) return;
					hosts.splice(at, 1);
					notify();
				}
			};
		},
		subscribe(fn) {
			listeners.add(fn);
			try {
				fn();
			} catch (error) {
				if (typeof reportError === 'function') reportError(error);
				else console.error(error);
			}
			return () => listeners.delete(fn);
		}
	};
	return announcer;
}

const KEY = Symbol.for('kern.announcer');
let own: Announcer | undefined;

function isAnnouncer(value: unknown): value is Announcer {
	if (typeof value !== 'object' || value === null) return false;
	const v = value as Record<string, unknown>;
	return v.version === 1 && typeof v.announce === 'function' && typeof v.attach === 'function' && typeof v.subscribe === 'function';
}

/**
 * The page-wide announcer. The first kern copy to load puts it on `globalThis[Symbol.for('kern.announcer')]`
 * and every copy uses the same one. An announcer of another shape (an older kern copy) stays
 * untouched; this copy then keeps its own.
 */
export function sharedAnnouncer(): Announcer {
	if (own) return own;
	const g = globalThis as typeof globalThis & { [KEY]?: unknown };
	const existing = g[KEY];
	if (isAnnouncer(existing)) return (own = existing);
	own = createAnnouncer();
	if (existing === undefined) g[KEY] = own;
	return own;
}

/**
 * Says `message` in the page's live region (a mounted `<LiveAnnouncer />` or `<k-live-announcer>`):
 * `polite` (default) waits for the screen reader to finish, `assertive` interrupts it. Use it for
 * what happens without focus moving: a page change in a single-page app, a result, a state change.
 * On the server it does nothing.
 */
export function announce(message: string, politeness: Politeness = 'polite'): void {
	if (typeof document === 'undefined') return;
	sharedAnnouncer().announce(message, politeness);
}
