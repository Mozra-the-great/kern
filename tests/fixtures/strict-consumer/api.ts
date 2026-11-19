// The non-component exports under the same strict flags.
import { createThemeScript, dismissToast, isDarkTheme, themePair, themeScript, toast, toasts } from '@mozra-the-great/kern';
import type { ThemeOption, ToastInput, ToastItem } from '@mozra-the-great/kern';

export function notify(message: string, title: string | undefined, duration: number | undefined): number {
	const input: ToastInput = { message, title, duration, tone: undefined, action: undefined };
	const id = toast(input);
	toast.ok(message, { title, duration });
	toast.danger(message, { title });
	dismissToast(id);
	return id;
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
