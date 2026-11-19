// Type-level fixture (never run): <k-download-button> (#92) as a strict React 19 app sees it.
// Checked by `npm run test:types`. `@ts-expect-error` lines prove the typings reject misuse.
import { useRef, useState } from 'react';
import '@mozra-the-great/kern/elements';
import type {} from '@mozra-the-great/kern/elements/react';
import type { DownloadDetail, DownloadErrorDetail, KDownloadButtonElement, KDownloadButtonEvents } from '@mozra-the-great/kern/elements';

export function Download() {
	const [last, setLast] = useState('');
	const button = useRef<KDownloadButtonElement>(null);

	const onDownload = (e: KDownloadButtonEvents['download']) => {
		const detail: DownloadDetail = e.detail;
		setLast(`${detail.name} ${detail.size.toFixed(0)} ${detail.type}`);
	};
	const onError = (e: KDownloadButtonEvents['download-error']) => {
		const detail: DownloadErrorDetail = e.detail;
		setLast(detail.code === 'content' ? detail.message : detail.code);
	};

	const attach = () => {
		const el = button.current;
		if (!el) return;
		el.blob = new Blob(['bytes']);
		el.getContent = async () => (await Promise.resolve('text')) + '!';
		el.getContent = () => new Blob(['more']);
		el.addEventListener('download', (e) => e.detail.name.toUpperCase());
		el.addEventListener('download-error', (e) => e.detail.message.toUpperCase());
	};

	return (
		<div>
			<k-download-button text="a,b" name="table.csv" type="text/csv" label="Download table" show-label ondownload={onDownload} />
			<k-download-button
				ref={button}
				name="report.pdf"
				label="Download report"
				started-label="Started"
				error-label="Failed"
				show-status
				variant="primary"
				size="lg"
				reset-after={1000}
				disabled={false}
				blob={new Blob(['x'])}
				getContent={() => 'text'}
				ondownload={onDownload}
				ondownload-error={onError}
			/>
			<button type="button" onClick={attach}>
				{last}
			</button>
			{/* @ts-expect-error the detail of `download` has no `code` */}
			<k-download-button ondownload={(e) => e.detail.code} />
			{/* @ts-expect-error `code` is one of four strings */}
			<k-download-button ondownload-error={(e) => e.detail.code === 'nope'} />
			{/* @ts-expect-error unknown prop */}
			<k-download-button nope="1" />
		</div>
	);
}
