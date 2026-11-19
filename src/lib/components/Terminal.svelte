<script lang="ts" module>
	export interface TerminalLine {
		/** Prompt in front of the command. Defaults to the `prompt` prop. */
		prompt?: string | undefined;
		/** The command that is typed. */
		text: string;
		/** What the command prints. One string = one line. */
		output?: string | string[] | undefined;
	}
</script>

<script lang="ts">
	import Caret from './Caret.svelte';
	import { graphemes, observeInView, useReducedMotion } from './motion.svelte.js';

	interface Props {
		lines: TerminalLine[];
		/** Text in the title bar. */
		title?: string | undefined;
		/** Default prompt of every line. */
		prompt?: string | undefined;
		/** Type the commands one after another. The complete text is always available to assistive technology. */
		typewriter?: boolean | undefined;
		/** Milliseconds per typed character. */
		speed?: number | undefined;
		/** Milliseconds before typing starts. */
		delay?: number | undefined;
		/** Milliseconds between a typed command and its output. */
		linePause?: number | undefined;
		/** Wait until the terminal is scrolled into view before typing. */
		startInView?: boolean | undefined;
		/** Show a button that copies the commands. */
		copy?: boolean | undefined;
		copyLabel?: string | undefined;
		copiedLabel?: string | undefined;
		/** Accessible name of the terminal. Defaults to the title, then "Terminal". */
		label?: string | undefined;
		/** Fires when the last command is typed. */
		oncomplete?: (() => void) | undefined;
		class?: string | undefined;
	}
	let {
		lines,
		title,
		prompt = '$',
		typewriter = false,
		speed = 35,
		delay = 300,
		linePause = 450,
		startInView = true,
		copy = false,
		copyLabel = 'Copy',
		copiedLabel = 'Copied',
		label,
		oncomplete,
		class: cls = ''
	}: Props = $props();

	interface Row {
		kind: 'cmd' | 'out';
		prompt: string;
		text: string;
		/** Caret after the text. */
		caret: boolean;
		/** The caret blinks (the command is not being typed). */
		idle: boolean;
	}

	const reduced = useReducedMotion();
	/* Typing starts only after mount, so the full text exists without JS and in SSR. */
	let armed = $state(false);
	let go = $state(false);
	let host: HTMLElement | undefined = $state();
	const animated = $derived(typewriter && armed && !reduced.current);
	let done = $state(0);
	let typed = $state(0);

	const outputLines = (line: TerminalLine): string[] => (line.output === undefined ? [] : Array.isArray(line.output) ? line.output : [line.output]);
	const commandOf = (line: TerminalLine): Row => ({ kind: 'cmd', prompt: line.prompt ?? prompt, text: line.text, caret: false, idle: true });
	const outputOf = (line: TerminalLine): Row[] => outputLines(line).map((text): Row => ({ kind: 'out', prompt: '', text, caret: false, idle: true }));

	/* Everything, finished. */
	const fullRows = $derived(lines.flatMap((line) => [commandOf(line), ...outputOf(line)]));
	/* Everything plus the empty prompt that waits at the end: sizes the box while typing. */
	const sizeRows = $derived([...fullRows, { kind: 'cmd', prompt, text: '', caret: true, idle: true } satisfies Row]);
	const liveRows = $derived.by((): Row[] => {
		const rows: Row[] = [];
		for (let i = 0; i < lines.length && i <= done; i++) {
			const line = lines[i];
			if (i < done) {
				rows.push(commandOf(line), ...outputOf(line));
			} else {
				rows.push({ ...commandOf(line), text: graphemes(line.text).slice(0, typed).join(''), caret: true, idle: false });
			}
		}
		if (done >= lines.length) rows.push({ kind: 'cmd', prompt, text: '', caret: true, idle: true });
		return rows;
	});
	const name = $derived(label ?? title ?? 'Terminal');

	$effect(() => {
		armed = true;
		return () => (armed = false);
	});

	$effect(() => {
		if (!animated) return;
		if (!startInView) {
			go = true;
			return;
		}
		const el = host;
		if (!el) return;
		return observeInView(
			el,
			(visible) => {
				if (visible) go = true;
			},
			{ threshold: 0.2 }
		);
	});

	$effect(() => {
		const script = lines.map((line) => graphemes(line.text));
		const typeMs = Math.max(0, speed);
		const startMs = Math.max(0, delay);
		const pauseMs = Math.max(0, linePause);
		done = 0;
		typed = 0;
		if (!animated || !go) return;

		let stopped = false;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const sleep = (ms: number): Promise<void> =>
			new Promise((resolve) => {
				timer = setTimeout(resolve, ms);
			});
		async function run(): Promise<void> {
			await sleep(startMs);
			for (let i = 0; i < script.length; i++) {
				if (stopped) return;
				for (let n = 1; n <= script[i].length; n++) {
					typed = n;
					await sleep(typeMs);
					if (stopped) return;
				}
				await sleep(pauseMs);
				if (stopped) return;
				done = i + 1;
				typed = 0;
				await sleep(pauseMs / 2);
			}
			if (!stopped) oncomplete?.();
		}
		void run();
		return () => {
			stopped = true;
			clearTimeout(timer);
		};
	});

	/* Copy button */
	let copied = $state(false);
	let copyTimer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => () => clearTimeout(copyTimer));

	async function copyCommands(): Promise<void> {
		const text = lines.map((line) => line.text).join('\n');
		let ok = false;
		try {
			await navigator.clipboard.writeText(text);
			ok = true;
		} catch {
			/* Clipboard API blocked or missing (insecure context): fall back to a temporary textarea. */
			const area = document.createElement('textarea');
			area.value = text;
			area.setAttribute('readonly', '');
			area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
			document.body.append(area);
			area.select();
			try {
				ok = document.execCommand('copy');
			} catch {
				ok = false;
			}
			area.remove();
		}
		if (!ok) return;
		copied = true;
		clearTimeout(copyTimer);
		copyTimer = setTimeout(() => (copied = false), 2000);
	}
</script>

{#snippet rowsView(rows: Row[])}
	{#each rows as row, i (i)}
		{#if row.kind === 'cmd'}
			<div class="row cmd"><span class="prompt">{row.prompt}</span><span class="text">{row.text}{#if row.caret}<Caret blink={row.idle} />{/if}</span></div>
		{:else}
			<div class="row out">{row.text}</div>
		{/if}
	{/each}
{/snippet}

<div class="k-terminal {cls}" role="group" aria-label={name} bind:this={host}>
	<div class="bar">
		<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>
		{#if title}<span class="title">{title}</span>{/if}
		{#if copy}
			<button type="button" class="copy" onclick={copyCommands}>{copied ? copiedLabel : copyLabel}</button>
			<span class="sr" role="status">{copied ? copiedLabel : ''}</span>
		{/if}
	</div>
	<div class="body">
		{#if animated}
			<div class="sr">{@render rowsView(fullRows)}</div>
			<div class="stack" aria-hidden="true">
				<div class="size">{@render rowsView(sizeRows)}</div>
				<div class="live">{@render rowsView(liveRows)}</div>
			</div>
		{:else}
			{@render rowsView(fullRows)}
		{/if}
	</div>
</div>

<style>
	/* Inverted like Tooltip: --k-fg is the surface, --k-bg the ink. Every theme keeps its own contrast. */
	.k-terminal {
		--t-bg: var(--k-fg);
		--t-ink: var(--k-bg);
		--t-dim: color-mix(in srgb, var(--t-ink) 78%, var(--t-bg));
		--t-rule: color-mix(in srgb, var(--t-ink) 22%, var(--t-bg));
		--t-edge: color-mix(in srgb, var(--t-ink) 60%, var(--t-bg));
		min-width: 0;
		max-width: 100%;
		overflow: hidden;
		border-radius: min(var(--k-radius-card), 20px);
		background: var(--t-bg);
		color: var(--t-ink);
		box-shadow: var(--k-shadow-raised);
		font-family: var(--k-font-mono);
		font-size: var(--k-text-sm);
		line-height: 1.6;
	}
	.bar {
		display: flex;
		align-items: center;
		gap: var(--k-space-3);
		min-height: var(--k-control-h-sm);
		padding: var(--k-space-1) var(--k-space-4);
		border-bottom: 1px solid var(--t-rule);
	}
	.dots { display: inline-flex; flex: none; gap: 6px; }
	.dots i { width: 10px; height: 10px; border-radius: 50%; background: var(--t-rule); }
	.title {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--t-dim);
		font-family: var(--k-label-font);
		font-size: var(--k-text-xs);
		letter-spacing: var(--k-label-tracking);
		text-transform: var(--k-label-transform);
	}
	.copy {
		margin-inline-start: auto;
		flex: none;
		min-height: max(28px, var(--k-tap-target));
		padding: 0 var(--k-space-3);
		border: 1px solid var(--t-edge);
		border-radius: min(var(--k-radius-control), 14px);
		background: transparent;
		color: var(--t-ink);
		font: inherit;
		font-size: var(--k-text-xs);
		cursor: pointer;
		transition: background-color var(--k-dur) var(--k-ease);
	}
	.copy:hover { background: var(--t-rule); }
	/* The page's focus colour can equal the terminal surface; the ink always contrasts. */
	.copy:focus-visible { outline: var(--k-focus-w) solid var(--t-ink); outline-offset: calc(var(--k-focus-offset) * -1); }
	.body { padding: var(--k-space-4); }
	.stack { display: grid; }
	.size, .live { grid-area: 1 / 1; min-width: 0; }
	.size { visibility: hidden; }
	.row { white-space: pre-wrap; overflow-wrap: anywhere; }
	.cmd { display: flex; gap: 1ch; }
	.prompt { flex: none; color: var(--t-dim); }
	.text { min-width: 0; }
	.out { color: var(--t-dim); }
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
