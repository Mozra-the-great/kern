<script lang="ts">
	import { themeTexts, themeTextsLang } from '../../../src/lib/components/theme-texts.svelte.js';
	import { fillThemeText } from '../../../src/lib/components/theme-texts.js';

	// Reads the catalogue inside $derived, the way a theme button would.
	const facts = $derived(themeTexts().advent);
	const lang = $derived(themeTextsLang());
</script>

<p data-testid="first">{facts.first}</p>
<p data-testid="second">{fillThemeText(facts.second, { lit: 3, total: 4 })}</p>
<p data-testid="lang">{lang ?? 'none'}</p>
