<script lang="ts">
	// Strings, Prose and the accessibility primitives (#58, #59, #64): every new component and prop,
	// fed with values that may be undefined, and bindable props bound to `T | undefined` state.
	import { Link, LiveAnnouncer, OnlineStatus, Prose, SkipLink, createAnnouncer } from '@mozra-the-great/kern';
	import type { Announcer, Politeness } from '@mozra-the-great/kern';

	interface Props {
		maybeString?: string | undefined;
		maybeBoolean?: boolean | undefined;
		maybePoliteness?: Politeness | undefined;
	}
	let { maybeString, maybeBoolean, maybePoliteness }: Props = $props();

	let online: boolean | undefined = $state();
	const announcer: Announcer = createAnnouncer();
	let changes = $state(0);
</script>

<SkipLink target="main" />
<SkipLink target="main" label={maybeString} class={maybeString} onclick={undefined} id={maybeString} />
<LiveAnnouncer />
<LiveAnnouncer announcer={undefined} class={maybeString} />
<LiveAnnouncer {announcer} />
<OnlineStatus />
<OnlineStatus
	bind:online
	offlineTitle={maybeString}
	offlineText={maybeString}
	onlineText={maybeString}
	announce={maybeBoolean}
	politeness={maybePoliteness}
	announcer={undefined}
	onchange={undefined}
	class={maybeString}
/>
<OnlineStatus {announcer} announce={false} politeness="assertive" onchange={(now: boolean) => (changes += now ? 1 : 0)} />
<Prose text="Plain text" />
<Prose text={maybeString} externalLabel={maybeString} class={maybeString} />
<Prose text={null} externalLabel={undefined}><p>Markup</p></Prose>
<Prose>Children only</Prose>
<Link href="https://example.com" external externalLabel={maybeString}>Link</Link>
<p>{online} {changes}</p>
