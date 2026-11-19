import type { ComponentType } from 'react';
import { Data } from './Data';
import { Example } from './Example';
import { Forms } from './Forms';
import { Keyed } from './Keyed';
import { Lists } from './Lists';
import { Nav } from './Nav';
import { Overlays } from './Overlays';
import { Toasts } from './Toasts';

/** The scenarios a spec can mount (`?s=forms,nav` or `harness.mount('toasts', 'second')`). */
export const scenarios: Record<string, ComponentType<{ rid: string }>> = {
	forms: Forms,
	overlays: Overlays,
	toasts: Toasts,
	nav: Nav,
	data: Data,
	lists: Lists,
	keyed: Keyed,
	example: Example
};
