import type { KernBundle } from './strings.js';

/*
 * German texts for every default string (#58). Typed as a complete bundle: a text added to the
 * English catalogue does not compile until it is translated here. Use it with `setStrings(de)`;
 * a consumer that does not import it does not ship it.
 */
export const de: KernBundle = {
	lang: 'de',
	alert: { dismissLabel: 'Schließen' },
	breadcrumb: { label: 'Brotkrumennavigation', expandLabel: 'Verborgene Einträge anzeigen' },
	card: { openLabel: 'Öffnen' },
	carousel: {
		label: 'Karussell',
		prevLabel: 'Vorherige Folie',
		nextLabel: 'Nächste Folie',
		dotsLabel: 'Folien',
		slideLabel: 'Zu Folie',
		ofLabel: 'von',
		roleDescription: 'Karussell',
		slideRoleDescription: 'Folie'
	},
	code: {
		copyLabel: 'Kopieren',
		copiedLabel: 'Kopiert',
		copyErrorLabel: 'Kopieren fehlgeschlagen',
		label: 'Code',
		languageLabel: '{language}-Code'
	},
	colorPicker: {
		pickerLabel: 'Farbe wählen',
		areaLabel: 'Sättigung und Helligkeit',
		areaText: '{color}, Sättigung {saturation} %, Helligkeit {brightness} %',
		hueLabel: 'Farbton',
		alphaLabel: 'Deckkraft',
		swatchesLabel: 'Vorgaben',
		invalidText: 'Farbe als #rgb, #rrggbb oder #rrggbbaa eingeben.'
	},
	combobox: { noResults: 'Keine Treffer', toggleLabel: 'Optionen anzeigen' },
	commandPalette: {
		label: 'Befehlspalette',
		placeholder: 'Befehl eingeben oder suchen…',
		empty: 'Keine passenden Befehle',
		closeLabel: 'Schließen'
	},
	contextMenu: { label: 'Kontextmenü' },
	copyButton: { label: 'Kopieren', copiedLabel: 'Kopiert', errorLabel: 'Kopieren fehlgeschlagen' },
	dataTable: {
		searchLabel: 'Filtern',
		empty: 'Keine Einträge',
		emptyFiltered: 'Keine Einträge für „{query}“',
		resultsLabel: '{count} Einträge',
		filteredLabel: '{count} von {total} Einträgen',
		selectedLabel: '{count} ausgewählt',
		sortedLabel: 'Sortiert nach {column}, {direction}',
		ascendingLabel: 'aufsteigend',
		descendingLabel: 'absteigend',
		loadingLabel: 'Lädt…',
		selectAllLabel: 'Alle Zeilen dieser Seite auswählen',
		selectRowLabel: '{row} auswählen',
		paginationLabel: 'Tabellenseiten'
	},
	datePicker: {
		calendarLabel: 'Datum wählen',
		prevMonthLabel: 'Vorheriger Monat',
		nextMonthLabel: 'Nächster Monat',
		invalidText: 'Gültiges Datum eingeben.',
		pattern: { day: 'TT', month: 'MM', year: 'JJJJ' }
	},
	drawer: { closeLabel: 'Schließen' },
	fileDrop: {
		removeLabel: 'Entfernen',
		listLabel: 'Ausgewählte Dateien',
		sizeError: '{name} ist größer als {max}.',
		typeError: '{name} hat kein erlaubtes Dateiformat.',
		countError: 'Es kann nur eine Datei ausgewählt werden.',
		statusLabel: 'Ausgewählte Dateien: {count}',
		dropOne: 'Datei hier ablegen',
		dropMany: 'Dateien hier ablegen',
		dropOneOrChoose: 'Datei hier ablegen oder zum Auswählen klicken',
		dropManyOrChoose: 'Dateien hier ablegen oder zum Auswählen klicken'
	},
	heatmap: { cellLabel: '{date}: {value}', lessLabel: 'Weniger', moreLabel: 'Mehr', emptyLabel: 'Keine Daten' },
	historyBar: {
		summaryLabel: '{percent} % ok',
		noDataLabel: 'Keine Daten',
		statuses: { ok: 'In Ordnung', warn: 'Beeinträchtigt', down: 'Ausgefallen', none: 'Keine Daten' }
	},
	kbd: {
		command: 'Befehlstaste',
		control: 'Steuerungstaste',
		windows: 'Windows-Taste',
		option: 'Wahltaste',
		alt: 'Alt-Taste',
		shift: 'Umschalttaste',
		enter: 'Eingabetaste',
		escape: 'Escape-Taste',
		backspace: 'Rücktaste',
		delete: 'Entfernen-Taste',
		up: 'Pfeil nach oben',
		down: 'Pfeil nach unten',
		left: 'Pfeil nach links',
		right: 'Pfeil nach rechts'
	},
	link: { externalLabel: '(öffnet in einem neuen Tab)' },
	marquee: { pauseLabel: 'Anhalten', playLabel: 'Fortsetzen' },
	modal: { closeLabel: 'Schließen' },
	navbar: { label: 'Hauptnavigation', menuLabel: 'Menü' },
	numberInput: { decrementLabel: 'Verringern', incrementLabel: 'Erhöhen' },
	onlineStatus: {
		offlineTitle: 'Keine Verbindung',
		offlineText: 'Einige Funktionen sind erst mit Verbindung wieder verfügbar.',
		onlineText: 'Wieder online'
	},
	pagination: { label: 'Seitennavigation', prevLabel: 'Zurück', nextLabel: 'Weiter', pageLabel: 'Seite', ofLabel: 'von' },
	pinInput: { digitLabel: 'Ziffer {index} von {length}' },
	progressRing: { loadingText: 'Lädt' },
	rating: { starLabel: '{value} von {max} Sternen' },
	resizable: { handleLabel: 'Größe von {panel} ändern' },
	scrollArea: { label: 'Scrollbarer Inhalt' },
	skipLink: { label: 'Zum Hauptinhalt springen' },
	sparkline: { label: 'Verlauf: erster Wert {first}, letzter {last}, Minimum {min}, Maximum {max}', emptyLabel: 'Keine Daten' },
	spinner: { label: 'Lädt' },
	stat: { upLabel: 'gestiegen um {value}', downLabel: 'gesunken um {value}', flatLabel: 'unverändert' },
	statusDot: { statuses: { ok: 'In Ordnung', warn: 'Beeinträchtigt', down: 'Ausgefallen', idle: 'Inaktiv', busy: 'In Arbeit' } },
	stepper: {
		label: 'Fortschritt',
		completeLabel: 'abgeschlossen',
		compactLabel: 'Schritt {current} von {total}: {label}',
		doneLabel: 'Alle {total} Schritte abgeschlossen',
		backLabel: 'Zurück zu {label}'
	},
	table: { empty: 'Keine Einträge' },
	tag: { removeLabel: 'Entfernen' },
	tagInput: {
		removeLabel: '{tag} entfernen',
		instructions: 'Zum Hinzufügen eines Tags Eingabetaste oder Komma drücken. Die Rücktaste im leeren Feld entfernt das letzte Tag.',
		addedText: '{tag} hinzugefügt',
		removedText: '{tag} entfernt',
		duplicateText: '{tag} ist bereits vorhanden',
		maxText: 'Höchstens {max} Tags'
	},
	terminal: { label: 'Terminal', copyLabel: 'Kopieren', copiedLabel: 'Kopiert' },
	themeToggle: { toggleLabel: 'Dunkelmodus', menuLabel: 'Design' },
	timeline: { statuses: { done: 'Erledigt', current: 'Aktuell', upcoming: 'Anstehend', error: 'Fehlgeschlagen' } },
	toaster: { dismissLabel: 'Schließen', undoLabel: 'Rückgängig', label: 'Benachrichtigungen' }
};
