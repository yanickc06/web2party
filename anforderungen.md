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

- [ ] Waveform-Anzeige für Songs (visuelle Darstellung der Audiodatei)
- [ ] Cue-Points in Songs markieren (Intro, Drop, Outro)
- [ ] Tags/Labels für Songs (z.B. "Opener", "Peak Time", "Closing")
- [ ] Smart-Playlists (automatische Playlist basierend auf BPM-Range, Genre, Stimmung)
- [ ] Harmonic Mixing Vorschläge (zeige kompatible Songs basierend auf Key)
- [ ] Duplikat-Erkennung beim Upload (Song bereits vorhanden?)

### Party-Features

- [ ] Party-Timeline (Zeitplan für DJ-Set mit Uhrzeit und Song)
- [ ] Party-Notizen (besondere Wünsche, Verbote, Highlights)
- [ ] Party-Checkliste (Equipment, Songs, Verträge)
- [ ] Party-Statistiken (gespielte Songs, Uhrzeit, Reaktionen)
- [ ] Kundenwunsch-System (Gäste können Songs wünschen via QR-Code)

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

### Erledigt ✅

- [x] Bilder in der Technikverwaltung anzeigen (Übersichtsseite)
- [x] BPM-Analyse aus Audio-Daten (echte Wellenform-Analyse)
- [x] Bulk-Upload für Songs
- [x] DJ-Profil bearbeiten
- [x] Equipment-Bilder bearbeiten
- [x] Musik Multi-Select mit Bulk-Aktionen
