/**
 * Props a test can read and write after mounting. A component mounted with this object as its props
 * sees every assignment (`props.value = 'b'` re-renders it) and every `bind:` write of the component
 * lands on the object, so a test can check bindable values without a host component.
 */
export function reactive<T extends object>(initial: T): T {
	const state = $state(initial);
	return state;
}
