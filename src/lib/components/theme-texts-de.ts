import type { ThemeTextsBundle } from './theme-texts.js';

/*
 * German theme texts (#185). Typed as a complete bundle: a text added to the English catalogue does not
 * compile until it is translated here. Use it with `setThemeTexts(deThemeTexts)`; a consumer that does
 * not import it does not ship it.
 */
export const deThemeTexts: ThemeTextsBundle = {
	lang: 'de',
	winter: {
		first: 'Ab dem 21. Dezember werden die Tage wieder länger.',
		second: 'Igel halten in den kalten Monaten Winterschlaf.'
	},
	newYear: {
		first: 'Frohes neues Jahr! Ein guter Moment zum Aufräumen.',
		second: 'Weltweit wird es mit ganz unterschiedlichen Bräuchen gefeiert.'
	},
	valentine: {
		first: 'Ein Tag, um den Menschen zu sagen, dass sie dir wichtig sind. Freunde und Familie zählen auch.',
		second: 'Pixelherzen gibt es für alle umsonst.'
	},
	carnival: {
		first: 'Eine Zeit für Kostüme, Musik und gemeinsames Lachen.',
		second: 'Sie dauert von Weiberfastnacht bis Fastnachtsdienstag, kurz vor der Fastenzeit.'
	},
	womensDay: {
		first: 'Der Internationale Frauentag am 8. März würdigt die Leistungen von Frauen auf der ganzen Welt.',
		second: 'Er wird seit Anfang des 20. Jahrhunderts begangen.'
	},
	earthDay: {
		first: 'Der Tag der Erde am 22. April begann 1970 und wird weltweit gefeiert.',
		second: 'Kleine Dinge summieren sich: Jede eingesparte Energie zählt.'
	},
	easter: {
		first: 'Eier sind ein altes Symbol für neues Leben und den Frühling.',
		second: 'In vielen Ländern ist es Brauch, Eier zu verzieren.'
	},
	europeDay: {
		first: 'Der 9. Mai erinnert an die Schuman-Erklärung von 1950, den Beginn der europäischen Zusammenarbeit.',
		second: 'Die zwölf Sterne der Flagge stehen für Einigkeit, nicht für eine Anzahl von Ländern.'
	},
	pride: {
		first: 'Pride feiert das Recht aller, zu sein, wer sie sind, und zu lieben, wen sie lieben.',
		second: 'Alle sind willkommen.'
	},
	autumn: {
		first: 'Blätter werden rot und orange, wenn das grüne Pigment verschwindet und die anderen Farben zum Vorschein kommen.',
		second: 'Eine gute Jahreszeit für gemütliche Projekte.'
	},
	unityDay: {
		first: 'Der 3. Oktober erinnert an die deutsche Wiedervereinigung 1990.',
		second: 'Ein Tag, um zu feiern, was Menschen verbindet.'
	},
	harvest: {
		first: 'Ein Tag, um Danke zu sagen für die Ernte und für das, was wir haben.',
		second: 'Äpfel, Weizen und Kürbisse sind typische Erntesymbole.'
	},
	halloween: {
		first: 'Eine Zeit für Kostüme und geschnitzte Kürbisse.',
		second: 'Hier gibt es keine Tricks, nur Dekoration.'
	},
	stNicholas: {
		first: 'Am 6. Dezember stellen Kinder einen Stiefel vor die Tür und finden kleine Leckereien wie Nüsse und Mandarinen darin.',
		second: 'Nikolaus von Myra ist als Helfer der Menschen in Not in Erinnerung geblieben.'
	},
	humanRightsDay: {
		first: 'Der 10. Dezember erinnert an den Tag im Jahr 1948, an dem die Allgemeine Erklärung der Menschenrechte angenommen wurde.',
		second: 'Artikel 1: Alle Menschen sind frei und gleich an Würde und Rechten geboren.'
	},
	advent: {
		first: 'Der Advent zählt die Zeit bis Weihnachten herunter: An jedem Sonntag wird eine weitere Kerze angezündet.',
		second: 'Heute: {lit} von {total} Kerzen.'
	},
	christmas: {
		first: 'Eine Zeit, um bei den Menschen zu sein, die dir wichtig sind.',
		second: 'Der Schnee ist nur Dekoration.'
	}
};
