// The non-component exports under the same strict flags.
import {
	createThemeScript,
	createToastQueue,
	dismissToast,
	isDarkTheme,
	sharedToastQueue,
	themePair,
	themeScript,
	toast,
	TOAST_DURATIONS,
	TOAST_MAX,
	toasts
} from '@mozra-the-great/kern';
import type { ThemeOption, ToastCloseReason, ToastInput, ToastItem, ToastQueue } from '@mozra-the-great/kern';

export function notify(message: string, title: string | undefined, duration: number | undefined): number {
	const input: ToastInput = { message, title, duration, tone: undefined, action: undefined };
	const id = toast(input);
	toast.ok(message, { title, duration });
	toast.danger(message, { title });
	dismissToast(id);
	return id;
}

/** nagellacke's undo snackbar on the toast API (#44), with values that may be undefined. */
export function undoable(message: string, restore: () => void, commit: (() => void) | undefined, key: string | undefined): number {
	const reasons: ToastCloseReason[] = [];
	const id = toast({ message, key, onundo: restore, oncommit: commit, onclose: (reason) => reasons.push(reason), action: undefined });
	toast.warn(message, { onclose: undefined, oncommit: undefined, onundo: undefined, key: undefined });
	toast.clear();
	return id;
}

export function isolated(max: number | undefined): ToastQueue {
	const queue = createToastQueue({ max });
	const id = queue.add({ message: 'x', duration: TOAST_DURATIONS.info });
	queue.pause(id);
	queue.resume(id);
	queue.undo(id);
	queue.runAction(id);
	queue.dismiss(id);
	queue.max = TOAST_MAX;
	const off = queue.subscribe((items: readonly ToastItem[]) => items.length);
	off();
	queue.clear();
	return sharedToastQueue().items.length > 0 ? sharedToastQueue() : queue;
}

export function latest(): ToastItem | undefined {
	return toasts[toasts.length - 1];
}

export function scripts(followSystem: boolean | undefined): string[] {
	return [themeScript, createThemeScript('theme', { followSystem })];
}

export function pair(current: string | undefined): [ThemeOption, ThemeOption] {
	return themePair(current, {});
}

export const dark: boolean = isDarkTheme('stuffcloud');
