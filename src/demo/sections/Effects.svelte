<script lang="ts">
	import Typewriter from '../../lib/components/Typewriter.svelte';
	import Caret from '../../lib/components/Caret.svelte';
	import Scramble from '../../lib/components/Scramble.svelte';
	import CountUp from '../../lib/components/CountUp.svelte';
	import Odometer from '../../lib/components/Odometer.svelte';
	import Marquee from '../../lib/components/Marquee.svelte';
	import Reveal from '../../lib/components/Reveal.svelte';
	import Highlight from '../../lib/components/Highlight.svelte';
	import GridBackground from '../../lib/components/GridBackground.svelte';
	import Terminal from '../../lib/components/Terminal.svelte';
	import type { TerminalLine } from '../../lib/components/Terminal.svelte';
	import Card from '../../lib/components/Card.svelte';
	import Button from '../../lib/components/Button.svelte';

	/* Bumping a counter re-creates the component, which plays its effect again. */
	let typeRun = $state(0);
	let scrambleRun = $state(0);
	let countRun = $state(0);
	let termRun = $state(0);
	let revealRun = $state(0);
	let markerRun = $state(0);
	let odometer = $state(2026);
	let scrambleText = $state('Mintgrün Nr. 14');

	const phrases = ['Lack sammeln.', 'Farben tauschen.', 'Nie wieder doppelt kaufen.'];
	const scrambleOptions = ['Mintgrün Nr. 14', 'Beerenrot, cremig', 'Nachtblau mit Schimmer'];
	const colours = ['Mintgrün', 'Beerenrot', 'Nachtblau', 'Sandgold', 'Altrosa', 'Petrol', 'Pflaume', 'Salbei'];
	const features = [
		{ title: 'Sammlung', text: 'Alle Lacke an einem Ort, mit Foto und Marke.' },
		{ title: 'Wunschliste', text: 'Merke dir, was noch fehlt. Doppelkäufe fallen auf.' },
		{ title: 'Tauschbörse', text: 'Biete Lacke an und finde neue Farben.' }
	];
	const script: TerminalLine[] = [
		{ text: 'npm install @mozra-the-great/kern', output: ['added 1 package in 2s'] },
		{ text: 'npm run dev', output: ['VITE ready in 312 ms', 'Local: http://localhost:5173/'] }
	];
	const plain: TerminalLine[] = [
		{ text: 'git status', output: 'On branch feat/effects' },
		{ prompt: '>', text: 'echo "Hallo Welt"', output: 'Hallo Welt' }
	];
</script>

<section>
	<h2>Typewriter</h2>
	<div class="row">
		<p class="big m0"><Typewriter text={phrases} loop /></p>
	</div>
	<div class="row">
		{#key typeRun}<p class="m0"><Typewriter text="Aeterna ist bereit." speed={45} caretShape="block" /></p>{/key}
		<Button size="sm" variant="secondary" onclick={() => (typeRun += 1)}>Nochmal</Button>
	</div>
</section>

<section>
	<h2>Caret</h2>
	<div class="row mono">
		<span>$ <Caret /></span>
		<span>Eingabe<Caret shape="bar" cycles={0} /></span>
		<span>C:\> <Caret shape="underline" /></span>
		<span>Ruhig<Caret blink={false} /></span>
	</div>
	<p class="m0 muted">Das Blinken endet nach vier Zyklen (WCAG 2.2.2), außer mit <code>cycles=&#123;0&#125;</code>.</p>
</section>

<section>
	<h2>Scramble</h2>
	<div class="row">
		{#key scrambleRun + scrambleText}
			<p class="big m0"><Scramble text={scrambleText} hover /></p>
		{/key}
	</div>
	<div class="row">
		{#each scrambleOptions as option (option)}
			<Button size="sm" variant={scrambleText === option ? 'primary' : 'secondary'} onclick={() => (scrambleText = option)}>{option}</Button>
		{/each}
		<Button size="sm" variant="ghost" onclick={() => (scrambleRun += 1)}>Nochmal</Button>
	</div>
	<p class="m0 muted">Mit dem Mauszeiger über den Text fährt er erneut ein. Vorlesegeräte lesen immer den echten Text.</p>
</section>

<section>
	<h2>CountUp</h2>
	<div class="grid3">
		{#key countRun}
			<Card title="Lacke">
				<p class="stat m0"><CountUp value={1248} /></p>
			</Card>
			<Card title="Umsatz">
				<p class="stat m0"><CountUp value={9876.5} locale="de-DE" format={{ style: 'currency', currency: 'EUR' }} /></p>
			</Card>
			<Card title="Zufriedenheit">
				<p class="stat m0"><CountUp value={0.964} from={0.5} format={{ style: 'percent', maximumFractionDigits: 1 }} locale="de-DE" /></p>
			</Card>
		{/key}
	</div>
	<div><Button size="sm" variant="secondary" onclick={() => (countRun += 1)}>Nochmal</Button></div>
</section>

<section>
	<h2>Odometer</h2>
	<p class="stat m0"><Odometer value={odometer} format={{ useGrouping: false }} /></p>
	<div class="row">
		<Button size="sm" variant="secondary" onclick={() => (odometer += 1)}>+1</Button>
		<Button size="sm" variant="secondary" onclick={() => (odometer -= 1)}>-1</Button>
		<Button size="sm" variant="secondary" onclick={() => (odometer += 250)}>+250</Button>
		<Button size="sm" variant="secondary" onclick={() => (odometer = Math.max(0, odometer - 1000))}>-1000</Button>
		<Button size="sm" variant="secondary" onclick={() => (odometer = odometer * 10)}>×10</Button>
		<Button size="sm" variant="ghost" onclick={() => (odometer = 2026)}>Zurücksetzen</Button>
	</div>
	<p class="m0 muted"><Odometer value={odometer * 1.5} locale="de-DE" format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} /> mit Tausendertrennzeichen und Dezimalstelle.</p>
</section>

<section>
	<h2>Marquee</h2>
	<Marquee label="Farben der Sammlung" speed={60} fade>
		{#each colours as colour (colour)}<span class="chip">{colour}</span>{/each}
	</Marquee>
	<Marquee label="Neu im Sortiment" direction="right" speed={40}>
		{#each features as f (f.title)}<a class="chip link" href="#main">{f.title}</a>{/each}
	</Marquee>
	<div class="grid2">
		<Marquee label="Aktuelle Meldungen, vertikal" direction="up" height={120} speed={30} gap={12}>
			{#each features as f (f.title)}<p class="m0"><strong>{f.title}</strong> {f.text}</p>{/each}
		</Marquee>
		<p class="m0 muted">Der Lauftext pausiert beim Überfahren, bei Fokus im Inhalt und mit dem Knopf. Bei reduzierter Bewegung steht der Inhalt still und umbrochen da.</p>
	</div>
</section>

<section>
	<h2>Reveal</h2>
	<div class="row">
		<Button size="sm" variant="secondary" onclick={() => (revealRun += 1)}>Nochmal</Button>
	</div>
	{#key revealRun}
		<div class="grid3">
			{#each features as f, i (f.title)}
				<Reveal direction={i === 1 ? 'down' : 'up'} delay={i * 120}>
					<Card title={f.title} description={f.text} />
				</Reveal>
			{/each}
		</div>
		<div class="grid2">
			<Reveal direction="left"><Card title="Von rechts" description="Gleitet nach links an seinen Platz." /></Reveal>
			<Reveal direction="right" delay={120}><Card title="Von links" description="Gleitet nach rechts an seinen Platz." /></Reveal>
		</div>
	{/key}
	<p class="m0 muted">Ohne JavaScript oder bei reduzierter Bewegung ist der Inhalt sofort sichtbar.</p>
</section>

<section>
	<h2>Highlight</h2>
	<p class="m0 big">Sammle <Highlight>jede Farbe</Highlight> und verliere <Highlight delay={250}>keinen Lack</Highlight> mehr aus den Augen, auch wenn ein Satz über mehrere Zeilen läuft und der Marker mitbricht.</p>
	<div class="row">
		{#key markerRun}<span><Highlight inView={false}>Sofort beim Laden</Highlight></span>{/key}
		<Button size="sm" variant="secondary" onclick={() => (markerRun += 1)}>Nochmal</Button>
	</div>
</section>

<section>
	<h2>GridBackground</h2>
	<div class="grid2">
		<GridBackground class="stage" fade>
			<p class="stage-in"><span><strong>Raster</strong> mit weichem Rand</span></p>
		</GridBackground>
		<GridBackground class="stage" variant="dots" size={20}>
			<p class="stage-in"><span><strong>Punkte</strong> im 20-px-Abstand</span></p>
		</GridBackground>
	</div>
</section>

<section>
	<h2>Terminal</h2>
	<div class="grid2">
		<div class="stack">
			<div><Button size="sm" variant="secondary" onclick={() => (termRun += 1)}>Nochmal tippen</Button></div>
			{#key termRun}
				<Terminal lines={script} title="bash" typewriter copy label="Installation und Start" />
			{/key}
		</div>
		<Terminal lines={plain} title="Git" prompt="$" />
	</div>
</section>

<style>
	section { display: grid; gap: var(--k-space-5); padding: var(--k-space-8) 0; border-bottom: var(--k-border-w) solid var(--k-line); }
	section:last-child { border-bottom: 0; }
	h2 { margin: 0; font-family: var(--k-label-font); font-size: var(--k-label-size); font-weight: var(--k-weight-label); text-transform: var(--k-label-transform); letter-spacing: var(--k-label-tracking); color: var(--k-fg-muted); }
	.row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--k-space-3); }
	.stack { display: grid; gap: var(--k-space-3); align-content: start; }
	.grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--k-space-5); align-items: start; }
	.grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--k-space-5); align-items: start; }
	.m0 { margin: 0; }
	.muted { color: var(--k-fg-muted); }
	.mono { font-family: var(--k-font-mono); font-size: var(--k-text-lg); }
	.big { font-family: var(--k-font-display); font-size: var(--k-text-xl); font-weight: var(--k-weight-display); line-height: 1.3; }
	.stat { font-size: var(--k-text-xl); font-weight: var(--k-weight-display); font-family: var(--k-font-display); }
	.chip { display: inline-block; padding: var(--k-space-2) var(--k-space-4); border: var(--k-border-w) solid var(--k-line); border-radius: var(--k-radius-badge); background: var(--k-bg-raised); color: var(--k-fg); white-space: nowrap; text-decoration: none; }
	.link { color: var(--k-link); }
	.link:focus-visible { outline: var(--k-focus-w) solid var(--k-focus); outline-offset: var(--k-focus-offset); }
	:global(.stage) { border: var(--k-border-w) solid var(--k-line); border-radius: var(--k-radius-card); }
	.stage-in { margin: 0; display: grid; place-items: center; min-height: 160px; padding: var(--k-space-6); text-align: center; }
	@media (max-width: 760px) {
		.grid2, .grid3 { grid-template-columns: 1fr; }
	}
</style>
