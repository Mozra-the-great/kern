<script lang="ts">
	// The reproduction from #22: values that may be undefined, passed to optional props.
	import { Alert, Button, Card, Checkbox, Input, Modal, Progress, Select, Tabs, Toaster } from '@mozra-the-great/kern';
	import type { TabItem } from '@mozra-the-great/kern';

	interface Props {
		maybeString?: string | undefined;
		maybeNumber?: number | undefined;
	}
	let { maybeString, maybeNumber }: Props = $props();

	let value = $state('');
	let selected: string | undefined = $state();
	const tabs: TabItem[] = [
		{ id: 'a', label: 'A' },
		{ id: 'b', label: 'B' }
	];
</script>

<Input label="Name" bind:value hint={maybeString} error={maybeString} />
<Select label="S" options={[]} error={maybeString} />
<Progress label="p" value={maybeNumber} />
<Tabs {tabs} bind:value={selected}>
	{#snippet panel(id)}{id}{/snippet}
</Tabs>
<Card title={maybeString} />
<Button href={maybeString}>Go</Button>
<Modal title="M" description={maybeString}>Body</Modal>
<Alert title={maybeString}>Text</Alert>
<Checkbox label={maybeString} />
<Toaster label={maybeString} />
