// Type-level fixture (never run): the strings API, the announcer and the new tags (#58, #59, #64)
// as a strict React 19 app sees them. Checked by `npm run test:types`.
import '@mozra-the-great/kern/elements';
import { announce } from '@mozra-the-great/kern/elements/live-announcer';
import { setStrings, de, followLang } from '@mozra-the-great/kern/elements/strings';
import type {} from '@mozra-the-great/kern/elements/react';
import type { KernBundle, KernStrings, KernStringsInput, OnlineChangeDetail } from '@mozra-the-great/kern/elements';

const own: KernStringsInput = { lang: 'fr', modal: { closeLabel: 'Fermer' }, historyBar: { statuses: { ok: 'OK' } } };
setStrings(de, own);
const stop: () => void = followLang();
stop();

const bundle: KernBundle = de;
const closeLabel: string = bundle.modal.closeLabel;
const texts: KernStrings | undefined = window.kern?.strings.get();
window.kern?.strings.setLocale('de-AT');
window.kern?.strings.register('fr', own);
announce('Saved', 'assertive');
window.kern?.announce('Saved');

// @ts-expect-error an unknown component section is rejected
const typo: KernStringsInput = { modall: { closeLabel: 'x' } };
// @ts-expect-error texts are strings
const wrong: KernStringsInput = { modal: { closeLabel: 1 } };
// @ts-expect-error politeness is 'polite' | 'assertive'
announce('x', 'loud');

export function Page() {
	const onChange = (e: CustomEvent<OnlineChangeDetail>) => console.log(e.detail.online);
	return (
		<div>
			<k-skip-link target="main" label="Skip" />
			<k-live-announcer />
			<k-online-status
				offline-title="Offline"
				offline-text="Back soon"
				online-text="Online"
				announce="false"
				politeness="assertive"
				onchange={onChange}
			/>
			<k-prose text={'One\n\nTwo'} external-label="(new tab)" />
			<k-prose>
				<p>Markup</p>
			</k-prose>
			<k-link href="https://example.com" external external-label="(new tab)">
				Link
			</k-link>
			{/* @ts-expect-error unknown prop */}
			<k-skip-link nope="1" />
			{closeLabel}
			{String(texts)}
			{String(typo)}
			{String(wrong)}
		</div>
	);
}
