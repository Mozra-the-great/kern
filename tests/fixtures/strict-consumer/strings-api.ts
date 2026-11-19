// The strings catalogue, the announcer and parseProse under the same strict flags (#58, #59, #64).
import {
	ANNOUNCE_CLEAR_MS,
	ANNOUNCE_REPEAT_MS,
	announce,
	createAnnouncer,
	createStringsStore,
	de,
	en,
	followLang,
	getLang,
	getStrings,
	parseProse,
	registerStrings,
	resetStrings,
	setLocale,
	setStrings,
	sharedAnnouncer,
	sharedStringsStore
} from '@mozra-the-great/kern';
import type {
	Announcer,
	AnnouncerHost,
	KernBundle,
	KernStrings,
	KernStringsInput,
	Politeness,
	ProseParagraph,
	ProseSegment,
	StringsStore
} from '@mozra-the-great/kern';

/** Props still win: a partial catalogue with values that may be undefined. */
export function configure(close: string | undefined, lang: string | undefined): KernStrings {
	const own: KernStringsInput = { lang, modal: { closeLabel: close }, toaster: { dismissLabel: undefined, undoLabel: close } };
	setStrings(de, own);
	setStrings();
	registerStrings('fr', { lang: 'fr', modal: { closeLabel: 'Fermer' } });
	registerStrings('de', de);
	const found: boolean = setLocale(lang);
	const stop: () => void = followLang();
	stop();
	resetStrings();
	return found ? getStrings() : { ...en };
}

export function language(): string | undefined {
	const bundle: KernBundle = de;
	return getLang() ?? bundle.lang;
}

export function isolatedStore(): StringsStore {
	const store = createStringsStore();
	store.set([de, { lang: undefined }]);
	store.register('en', en);
	const off = store.subscribe(() => undefined);
	off();
	store.reset();
	return store.revision > 0 ? sharedStringsStore() : store;
}

export function say(message: string, politeness: Politeness | undefined): Announcer {
	announce(message);
	announce(message, politeness);
	const local = createAnnouncer();
	local.announce(message, 'assertive');
	const host: AnnouncerHost = local.attach();
	const primary: boolean = host.primary;
	host.release();
	local.clear();
	return primary || ANNOUNCE_CLEAR_MS > ANNOUNCE_REPEAT_MS ? sharedAnnouncer() : local;
}

export function paragraphs(text: string | null | undefined): ProseSegment[] {
	const parsed: ProseParagraph[] = parseProse(text);
	return parsed.flatMap((lines) => lines.flat());
}
