// The example of the README ("React 19"), word for word apart from the imports and the output element: the
// spec "the README example works" runs it, so the README cannot drift from what the elements do.
import { useState } from 'react';
import type { FormEvent } from 'react';

const SIZES = [
	{ value: 's', label: 'Klein' },
	{ value: 'l', label: 'Groß' }
];

export function Example() {
	const [name, setName] = useState('');
	const [size, setSize] = useState('');
	const [agree, setAgree] = useState(false);
	const [saved, setSaved] = useState('');

	function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault(); // nur aufgerufen, wenn alle Pflichtfelder gültig sind
		setSaved(JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))));
		window.kern?.toast.ok('Gespeichert');
	}

	return (
		<>
			<form
				onSubmit={onSubmit}
				onReset={() => {
					setName('');
					setSize('');
					setAgree(false);
				}}
			>
				<k-input name="name" label="Name" value={name} required minlength="3" onchange={(e) => setName(e.detail)} />
				<k-select name="size" label="Größe" value={size} options={SIZES} required onchange={(e) => setSize(e.detail)} />
				<k-checkbox name="agree" label="Einverstanden" checked={agree} required onchange={(e) => setAgree(e.detail)} />
				<k-button type="submit">Speichern</k-button>
				<k-button type="reset" variant="ghost">
					Zurücksetzen
				</k-button>
			</form>
			<k-toaster />
			<output id="saved">{saved}</output>
		</>
	);
}
