import { useState } from 'react';
import type { FormEvent } from 'react';
import type { KInputElement, KCheckboxElement, KSelectElement } from '@mozra-the-great/kern/elements';
import { handled, harness, track, useCommits } from '../harness';

/** Every value of the form, owned by React. */
interface Values {
	user: string;
	live: string;
	bio: string;
	size: string;
	terms: boolean;
	news: boolean;
	plan: string;
	city: string;
	day: string;
	qty: number | null;
	view: string;
	tags: string[];
}
const INITIAL: Values = {
	user: '',
	live: '',
	bio: '',
	size: '',
	terms: false,
	news: true,
	plan: '',
	city: '',
	day: '',
	qty: null,
	view: 'grid',
	tags: []
};
/** What the "Fill from React" button writes. */
const FILLED: Values = {
	user: 'alice',
	live: 'live',
	bio: 'short bio',
	size: 'l',
	terms: true,
	news: false,
	plan: 'pro',
	city: 'ham',
	day: '2026-03-04',
	qty: 3,
	view: 'list',
	tags: ['red', 'blue']
};

/** A form of kern elements, every field controlled by React state. */
export function Forms() {
	const [values, setValues] = useState<Values>(INITIAL);
	const [ticks, setTicks] = useState(0);
	useCommits('forms');

	/** `onchange` handler of a field: records what React received and writes it back into the state. */
	const change =
		<K extends keyof Values>(key: K, source: string) =>
		(e: CustomEvent<Values[K]>): void => {
			handled(source, e.type, e.detail);
			setValues((v) => ({ ...v, [key]: e.detail }));
		};

	function onSubmit(e: FormEvent<HTMLFormElement>): void {
		e.preventDefault();
		harness.submissions.push([...new FormData(e.currentTarget).entries()].map(([k, v]) => [k, typeof v === 'string' ? v : v.name]));
	}

	return (
		<>
			<form id="signup" onSubmit={onSubmit} onReset={() => setValues(INITIAL)}>
				<k-input
					id="user"
					ref={track<KInputElement>('user')}
					name="user"
					label="User"
					value={values.user}
					required
					minlength="3"
					maxlength={12}
					pattern="[a-z]+"
					autocomplete="username"
					aria-label="User name"
					class="wide"
					data-testid="user"
					onchange={change('user', 'user')}
				/>
				<k-input
					id="live"
					name="live"
					label="Live"
					value={values.live}
					oninput={(e) => {
						const value = (e.currentTarget as KInputElement).value;
						handled('live', 'input', value);
						setValues((v) => ({ ...v, live: value }));
					}}
					onchange={change('live', 'live')}
				/>
				<k-textarea id="bio" name="bio" label="Bio" maxlength={20} value={values.bio} onchange={change('bio', 'bio')} />
				<k-select
					id="size"
					ref={track<KSelectElement>('size')}
					name="size"
					label="Size"
					required
					placeholder="Pick"
					options={[
						{ value: 's', label: 'Small' },
						{ value: 'l', label: 'Large' }
					]}
					value={values.size}
					onchange={change('size', 'size')}
				/>
				<k-checkbox
					id="terms"
					ref={track<KCheckboxElement>('terms')}
					name="terms"
					label="Terms"
					required
					checked={values.terms}
					onchange={change('terms', 'terms')}
				/>
				<k-switch id="news" name="news" label="News" value="yes" checked={values.news} onchange={change('news', 'news')} />
				<k-radio-group
					id="plan"
					name="plan"
					label="Plan"
					required
					options={[
						{ value: 'free', label: 'Free' },
						{ value: 'pro', label: 'Pro' }
					]}
					value={values.plan}
					onchange={change('plan', 'plan')}
				/>
				<k-combobox
					id="city"
					name="city"
					label="City"
					required
					options={[
						{ value: 'ber', label: 'Berlin' },
						{ value: 'ham', label: 'Hamburg' }
					]}
					value={values.city}
					onchange={change('city', 'city')}
				/>
				<k-date-picker id="day" name="day" label="Day" min="2026-01-01" locale="en" value={values.day} onchange={change('day', 'day')} />
				<k-number-input id="qty" name="qty" label="Qty" min={1} max={10} value={values.qty} onchange={change('qty', 'qty')} />
				<k-segmented-control
					id="view"
					name="view"
					label="View"
					options={[
						{ value: 'grid', label: 'Grid' },
						{ value: 'list', label: 'List' }
					]}
					value={values.view}
					onchange={change('view', 'view')}
				/>
				<k-tag-input id="tags" name="tag" label="Tags" value={values.tags} onchange={change('tags', 'tags')} />
				<k-button id="submit" type="submit">
					Send
				</k-button>
				<k-button id="reset" type="reset" variant="ghost">
					Reset
				</k-button>
				<button id="fill" type="button" onClick={() => setValues(FILLED)}>
					Fill from React
				</button>
				<button id="rerender" type="button" onClick={() => setTicks((n) => n + 1)}>
					Re-render {ticks}
				</button>
				<button
					id="taken"
					type="button"
					onClick={() => harness.refs.user instanceof HTMLElement && (harness.refs.user as KInputElement).setCustomValidity('Taken')}
				>
					Mark user as taken
				</button>
				<output id="state">{JSON.stringify(values)}</output>
				<k-input id="off" name="off" label="Disabled" required disabled value="never sent" />
			</form>
			{/* Associated through the `form` attribute from outside the <form>. */}
			<k-input id="outside" name="outside" label="Outside" form="signup" value="far" />
		</>
	);
}
