<script lang="ts">
	// Forms and content parity (#50–#54, #72): the new props fed with values that may be undefined.
	import { Button, Card, CopyButton, Field, FileDrop, Input, Select, StatusMessage, Textarea, matchesAccept } from '@mozra-the-great/kern';
	import type { FieldControlProps, SelectOption } from '@mozra-the-great/kern';

	interface Props {
		maybeString?: string | undefined;
		maybeBoolean?: boolean | undefined;
	}
	let { maybeString, maybeBoolean }: Props = $props();

	let text: string | undefined = $state();
	let files: File[] | undefined = $state();
	let drop: ReturnType<typeof FileDrop> | undefined = $state();
	let result: string | undefined = $state();
	const options: SelectOption[] = [{ value: 'a', label: 'A' }];
	const onfiles = (picked: File[]): void => {
		result = picked.filter((f) => matchesAccept(f, maybeString)).length.toString();
		drop?.reset();
	};
	const control = (props: FieldControlProps): string => `${props.describedby ?? ''} ${String(props.invalid)} ${String(props.required)}`;
</script>

<Button size="icon" aria-label="Add" wide={maybeBoolean}>+</Button>
<Button
	href="/x"
	target="_blank"
	rel={maybeString}
	download={maybeBoolean}
	hreflang={maybeString}
	referrerpolicy={undefined}
	disabled={maybeBoolean}
>
	Link
</Button>
<Card
	as="li"
	id="card"
	aria-label={maybeString}
	data-test=""
	onclick={(e: MouseEvent) => (result = e.type)}
	actionLabel={maybeString}
	actionHaspopup="dialog"
	muted={maybeBoolean}
>
	{#snippet badges()}<span>2×</span>{/snippet}
	Body
</Card>
<Card as={undefined} actionHaspopup={undefined} onclick={undefined} badges={undefined} />
<Field label="F" keepHint={maybeBoolean} announce={maybeBoolean} labelId={maybeString}>
	{#snippet children(props)}<input aria-describedby={props.describedby} required={props.required} title={control(props)} />{/snippet}
</Field>
<FileDrop
	bind:this={drop}
	bind:files
	mode="dispatch"
	buttonLabel={maybeString}
	rejectMessages={maybeBoolean}
	{onfiles}
	onreject={(refused: File[]) => (result = refused.map((f) => f.name).join())}
/>
<FileDrop mode={undefined} onreject={undefined} />
<Input bind:value={text} keepHint={maybeBoolean} announce={false} aria-describedby={maybeString} />
<Textarea bind:value={text} keepHint={maybeBoolean} announce={false} aria-describedby={maybeString} />
<Select {options} keepHint={maybeBoolean} announce={false} aria-describedby={maybeString} />
<CopyButton text={maybeString} showLabel={maybeBoolean} label="Copy HEX" />
<StatusMessage message={result} kind={undefined} reserve={maybeBoolean} />
<StatusMessage message={null} kind="alert" class="x" id={maybeString} />
