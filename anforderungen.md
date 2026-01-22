# Web2Party - Anforderungen

## Kundenverwaltung

- Name, Adresse, Telefon, E-Mail, Bankdaten, Partylocations, Alter, Musikgeschmack, Rechnungen etc.

## Partnerverwaltung

- Partnername, Vorteile beim Partner, Website, Kontakt etc.

## Technikverwaltung

- Standort, Technische Daten etc, Mietpreis (falls vorhanden), Partner für miete (falls nicht eigentum) etc.

## Musikverwaltung

- Titel, Künstler, BPM, Stimmung etc. (mit mp3 uploads etc.)

## Dateimanager

- Ordner etc.

## Partymanager

- Playlistmanager (download of all mp3 files in the playlist if demanded and available), Lieder auch ohne MP3 hinzufügbar
- Locationmanager
- Kunden mit Party verknüpfbar
- etc.

## Datenschutz

- Nur registrierte und bestätigte Nutzer haben zugriff

## Offene To-dos

### Hohe Priorität

- [x] Key-Analyse hinzufügen bei Song-Analyse (Tonart erkennen für harmonisches Mixen) ✅
- [x] MP3-Dateien nicht mit hochgeladenen Liedern verknüpft (filePath → mp3Path korrigiert) ✅
- [x] Playlist als PDF drucken (Tabelle mit Titel, Künstler, BPM, Dauer, Key, Genre) ✅
- [x] Playlist herunterladen (MP3s als ZIP-Archiv mit archiverjs) ✅

### Mittlere Priorität

- [x] Tags/Labels für Songs (z.B. "Opener", "Peak Time", "Closing") ✅
- [x] Duplikat-Erkennung beim Upload (Song bereits vorhanden?) ✅
- [x] Harmonic Mixing Vorschläge (zeige kompatible Songs basierend auf Key) ✅
- [x] Smart-Playlists (automatische Playlist basierend auf BPM-Range, Genre, Stimmung) ✅
- [x] Waveform-Anzeige für Songs (visuelle Darstellung der Audiodatei mit WebAudio) ✅
- [x] Cue-Points in Songs markieren (Intro, Drop, Outro - Rechtsklick auf Waveform) ✅

### Party-Features

- [x] Party-Timeline (Zeitplan für DJ-Set mit Uhrzeit und Song) ✅
- [x] Party-Notizen (besondere Wünsche, Verbote, Highlights) ✅
- [x] Party-Checkliste (Equipment, Songs, Verträge) ✅
- [x] Party-Statistiken (gespielte Songs, Uhrzeit, Reaktionen) ✅
- [x] Kundenwunsch-System (Gäste können Songs wünschen via QR-Code) ✅

### Equipment-Features

- [ ] Wartungshistorie für Equipment
- [ ] Equipment-Bundles (Standard-Setup als Vorlage)
- [ ] QR-Codes für Equipment (schnelle Info beim Scannen)
- [ ] Inventur-Modus (alle Geräte durchgehen und Status prüfen)

### Kunden-Features

- [ ] Kundenbewertung (intern für DJ-Notizen)
- [ ] Wiederkehrende Kunden markieren
- [ ] Kundenhistorie (vergangene Partys, Lieblingssongs)
- [ ] Geburtstags-Erinnerungen

### Allgemein

- [ ] Dark Mode / Light Mode Toggle
- [ ] Dashboard mit Statistiken (Songs, Partys, Umsatz)
- [ ] Kalender-Integration (Google Calendar, iCal)
- [ ] Backup & Export (Datenbank-Export als JSON)
- [ ] Mobile App Optimierung (PWA)
- [ ] Titel Cover anzeigen in der Übersicht vor "Titel/Künstler"

### Errors

- [ ] Cue Points werden nicht angezeigt wenn gesetzt
- [ ] Error updating song: Error [PrismaClientValidationError]:
      Invalid `__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].song.update()` invocation in
      /Users/consoirya/Library/Mobile Documents/com~apple~CloudDocs/DJ Yanick/web2party/.next/dev/server/chunks/[root-of-the-server]\__097f9f7f._.js:242:163

        239 const { id } = await params;
        240 try {
        241     const body = await request.json();
        → 242     const song = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].song.update({
                    where: {
                    id: "cmkp9qyn200036fg05e418nw8"
                    },
                    data: {
                    title: "All Summer Long",
                    artist: "Kid Rock",
                    album: "Rock n Roll Jesus",
                    bpm: 103,
                    key: null,
                    genre: null,
                    mood: null,
                    duration: null,
                    year: 2007,
                    tags: "Warm-Up,Crowd Favorite,Klassiker,Lounge",
                    ~~~~
                    notes: null,
                ?   id?: String | StringFieldUpdateOperationsInput,
                ?   mp3Path?: String | NullableStringFieldUpdateOperationsInput | Null,
                ?   hasMp3?: Boolean | BoolFieldUpdateOperationsInput,
                ?   createdAt?: DateTime | DateTimeFieldUpdateOperationsInput,
                ?   updatedAt?: DateTime | DateTimeFieldUpdateOperationsInput,
                ?   playlistSongs?: PlaylistSongUpdateManyWithoutSongNestedInput
                    }
                })

        Unknown argument `tags`. Available options are marked with ?.
            at <unknown> (src/app/api/music/[id]/route.ts:63:36)
            at async PUT (src/app/api/music/[id]/route.ts:63:18)
        61 |     const body = await request.json();
        62 |
        > 63 |     const song = await prisma.song.update({
            |                                    ^
        64 |       where: { id },
        65 |       data: {
        66 |         title: body.title, {
        clientVersion: '6.19.2'
        }
        PUT /api/music/cmkp9qyn200036fg05e418nw8 500 in 164ms (compile: 4ms, render: 160ms)

### Erledigt ✅

- [x] Bilder in der Technikverwaltung anzeigen (Übersichtsseite)
- [x] BPM-Analyse aus Audio-Daten (echte Wellenform-Analyse)
- [x] Bulk-Upload für Songs
- [x] DJ-Profil bearbeiten
- [x] Equipment-Bilder bearbeiten
- [x] Musik Multi-Select mit Bulk-Aktionen
