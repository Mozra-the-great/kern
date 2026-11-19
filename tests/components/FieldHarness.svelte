<script lang="ts">
	// Field around a plain input, so the test sees what Field hands to its control.
	import Field from '../../src/lib/components/Field.svelte';

	interface Props {
		label?: string | undefined;
		hint?: string | undefined;
		error?: string | undefined;
		keepHint?: boolean | undefined;
		announce?: boolean | undefined;
		required?: boolean | undefined;
		labelId?: string | undefined;
	}
	let props: Props = $props();
</script>

<Field {...props} for="ctl">
	{#snippet children({ describedby, invalid, required })}
		<input id="ctl" aria-describedby={describedby} aria-invalid={invalid || undefined} aria-required={required || undefined} />
	{/snippet}
</Field>
