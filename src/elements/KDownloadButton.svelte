<svelte:options
	customElement={{
		props: {
			text: { type: 'String' },
			blob: { type: 'Object' },
			getContent: { type: 'Object' },
			name: { type: 'String' },
			type: { type: 'String' },
			label: { type: 'String' },
			showLabel: { type: 'Boolean', attribute: 'show-label' },
			accessibleLabel: { type: 'String', attribute: 'accessible-label' },
			startedLabel: { type: 'String', attribute: 'started-label' },
			errorLabel: { type: 'String', attribute: 'error-label' },
			showStatus: { type: 'Boolean', attribute: 'show-status' },
			variant: { type: 'String' },
			size: { type: 'String' },
			resetAfter: { type: 'Number', attribute: 'reset-after' },
			disabled: { type: 'Boolean' }
		}
	}}
/>

<script lang="ts">
	/**
	 * Saves text or bytes as a file download and announces the result in a polite live region, once per click; the
	 * message stays until the next click. The content is the `text` attribute, or the JS property `blob` (a `Blob` or
	 * `File`) or `getContent` (a function that returns a string or a Blob, also as a promise, called at click time);
	 * `getContent` wins over `blob`, `blob` over `text`. `name` is the file name (cleaned), `type` the MIME type.
	 * `show-label` shows `label` as visible text; `accessible-label` is the longer accessible name (it must contain the
	 * visible `label`, WCAG 2.5.3) and wins over `label` as the name; an error is always shown as text under the button. Nothing is sent
	 * anywhere.
	 * @prop blob {Blob} A `Blob` or `File` to save. Set as a property; not an attribute.
	 * @prop getContent {(() => string | Blob | Promise<string | Blob>)} Makes the content at click time. Set as a property; not an attribute.
	 * @event download {DownloadDetail} The download was handed to the browser: the file name used, its size and type.
	 * @event download-error {DownloadErrorDetail} Nothing was saved: `code` is `content` (no content, or `getContent` failed), `failed` (the browser refused), `invalid` or `no-dom`.
	 */
	import DownloadButton from '../lib/components/DownloadButton.svelte';
	import type { DownloadContent } from '../lib/components/DownloadButton.svelte';
	import { isBlob } from '../lib/components/download.js';
	import { emit } from './form.js';
	let {
		text,
		blob,
		getContent,
		name,
		type,
		label,
		showLabel = false,
		accessibleLabel,
		startedLabel,
		errorLabel,
		showStatus = false,
		variant,
		size,
		resetAfter,
		disabled = false
	} = $props();
	const host = $host();
	/** Only a real Blob or function counts: a JSON attribute would parse to a plain object. */
	const content = $derived<(() => DownloadContent | Promise<DownloadContent>) | undefined>(
		typeof getContent === 'function' ? getContent : undefined
	);
	const bytes = $derived<Blob | undefined>(isBlob(blob) ? blob : undefined);
</script>

<DownloadButton
	{text}
	blob={bytes}
	getContent={content}
	{name}
	{type}
	{label}
	{showLabel}
	{accessibleLabel}
	{startedLabel}
	{errorLabel}
	{showStatus}
	{variant}
	{size}
	{resetAfter}
	{disabled}
	ondownload={(result) => emit(host, 'download', { name: result.name, size: result.size, type: result.type })}
	onerror={(error) => emit(host, 'download-error', { code: error.code, message: error.message })}
/>

<style>
	:host {
		display: inline-flex;
	}
</style>
