<script lang="ts">
	// DownloadButton (#92) under stuffcloud's strict flags: every prop fed with values that may be undefined.
	import { DownloadButton } from '@mozra-the-great/kern';
	import type { DownloadContent, DownloadError, DownloadOk, DownloadStatus } from '@mozra-the-great/kern';

	interface Props {
		maybeString?: string | undefined;
		maybeBoolean?: boolean | undefined;
		maybeNumber?: number | undefined;
		maybeBlob?: Blob | undefined;
	}
	let { maybeString, maybeBoolean, maybeNumber, maybeBlob }: Props = $props();

	let last: string | undefined = $state();
	let status: DownloadStatus = $state('idle');
	const produce = (): DownloadContent => maybeString ?? new Blob(['x']);
	const produceLater = async (): Promise<DownloadContent> => (await Promise.resolve(maybeBlob)) ?? 'text';
	const done = (result: DownloadOk): void => {
		last = `${result.name} ${String(result.size)} ${result.type}`;
		status = 'started';
	};
	const failed = (error: DownloadError): void => {
		last = `${error.code}: ${error.message}`;
		status = 'error';
	};
</script>

<DownloadButton text={maybeString} />
<DownloadButton
	text={maybeString}
	blob={maybeBlob}
	getContent={produce}
	name={maybeString}
	type={maybeString}
	label={maybeString}
	showLabel={maybeBoolean}
	startedLabel={maybeString}
	errorLabel={maybeString}
	showStatus={maybeBoolean}
	variant={undefined}
	size={undefined}
	resetAfter={maybeNumber}
	disabled={maybeBoolean}
	ondownload={done}
	onerror={failed}
	class={maybeString}
/>
<DownloadButton getContent={produceLater} name="report.csv" type="text/csv" label="Download report" showLabel variant="primary" size="lg" />
<DownloadButton getContent={undefined} blob={undefined} ondownload={undefined} onerror={undefined} variant="danger" size="sm" />
<p>{last} {status}</p>
