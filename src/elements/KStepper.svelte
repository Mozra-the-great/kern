<svelte:options customElement={{ tag: 'k-stepper', props: { steps: { type: 'Array' }, current: { type: 'Number', reflect: true }, orientation: { type: 'String' }, label: { type: 'String' }, clickable: { type: 'Boolean' }, completeLabel: { type: 'String', attribute: 'complete-label' }, compactLabel: { type: 'String', attribute: 'compact-label' }, doneLabel: { type: 'String', attribute: 'done-label' }, backLabel: { type: 'String', attribute: 'back-label' } } }} />
<script lang="ts">
	import Stepper from '../lib/components/Stepper.svelte';
	import { emit } from './form.js';
	/* clickable: completed steps become buttons; a click moves `current` there and fires "step" (detail = index). */
	let { steps = [], current = 0, orientation = 'horizontal', label, clickable = false, completeLabel, compactLabel, doneLabel, backLabel } = $props();
	const host = $host();
	const onstep = $derived(clickable ? (i: number) => { current = i; emit(host, 'step', i); } : undefined);
</script>
<Stepper {steps} {current} {orientation} {label} {onstep} {completeLabel} {compactLabel} {doneLabel} {backLabel} />
