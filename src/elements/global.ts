// window.kern: the toast API for pages without a bundler. Installed by the all-in-one bundle and
// by the toaster entry point (`@mozra-the-great/kern/elements/toaster`). An explicit call, not a
// module side effect: package.json "sideEffects" lets the bundler drop side-effect-only code.
import { toast, dismissToast } from '../lib/components/toast.svelte.js';
import type { KernGlobal } from './types.js';

declare global {
	interface Window { kern?: KernGlobal }
}

export function installGlobal(): void {
	if (typeof window !== 'undefined' && !window.kern) window.kern = { toast, dismissToast };
}

export { toast, dismissToast };
