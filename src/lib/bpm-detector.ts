/**
 * Einfache BPM-Erkennung basierend auf Audio-Energie-Analyse
 * Funktioniert direkt in Node.js ohne externe Abhängigkeiten
 */

// Konvertiere MP3 Buffer zu PCM-ähnlichen Samples (vereinfacht)
// Dies ist eine Näherung - für echte BPM-Erkennung würde man FFmpeg nutzen
export function detectBPMFromBuffer(buffer: Buffer): number | null {
  try {
    // Suche nach dem Audio-Daten-Frame im MP3
    // MP3s haben typischerweise regelmäßige Frame-Muster

    // Für eine echte Analyse würden wir:
    // 1. MP3 zu PCM decodieren
    // 2. Energie-Peaks finden
    // 3. Intervalle zwischen Peaks analysieren

    // Da Node.js keine native Audio-Dekodierung hat,
    // geben wir hier null zurück und verlassen uns auf ID3-Tags
    // oder Genre-basierte Schätzungen

    return null;
  } catch (error) {
    console.error("BPM detection error:", error);
    return null;
  }
}

// Typische BPM-Bereiche für verschiedene Genres
const GENRE_BPM_RANGES: Record<
  string,
  { min: number; max: number; typical: number }
> = {
  // Elektronische Musik
  house: { min: 120, max: 130, typical: 125 },
  techno: { min: 130, max: 150, typical: 140 },
  trance: { min: 130, max: 150, typical: 138 },
  dubstep: { min: 138, max: 142, typical: 140 },
  "drum and bass": { min: 160, max: 180, typical: 174 },
  dnb: { min: 160, max: 180, typical: 174 },
  edm: { min: 120, max: 140, typical: 128 },
  electro: { min: 120, max: 140, typical: 128 },
  dance: { min: 120, max: 135, typical: 128 },

  // Pop/Rock
  pop: { min: 100, max: 130, typical: 120 },
  rock: { min: 100, max: 140, typical: 120 },
  indie: { min: 100, max: 130, typical: 115 },
  alternative: { min: 100, max: 140, typical: 120 },

  // Hip-Hop/R&B
  "hip-hop": { min: 80, max: 115, typical: 95 },
  "hip hop": { min: 80, max: 115, typical: 95 },
  rap: { min: 80, max: 115, typical: 90 },
  "r&b": { min: 70, max: 100, typical: 85 },
  soul: { min: 70, max: 100, typical: 80 },

  // Ruhige Musik
  ballad: { min: 60, max: 90, typical: 75 },
  jazz: { min: 80, max: 150, typical: 120 },
  blues: { min: 70, max: 100, typical: 85 },
  classical: { min: 50, max: 150, typical: 100 },
  acoustic: { min: 70, max: 120, typical: 95 },
  folk: { min: 80, max: 120, typical: 100 },
  chill: { min: 80, max: 110, typical: 95 },
  lounge: { min: 90, max: 120, typical: 105 },

  // Lateinamerikanisch
  latin: { min: 90, max: 130, typical: 110 },
  reggaeton: { min: 90, max: 100, typical: 95 },
  salsa: { min: 160, max: 220, typical: 180 },

  // Andere
  reggae: { min: 70, max: 90, typical: 80 },
  metal: { min: 130, max: 200, typical: 160 },
  punk: { min: 140, max: 180, typical: 160 },
  disco: { min: 110, max: 130, typical: 120 },
  funk: { min: 100, max: 130, typical: 115 },
  country: { min: 90, max: 130, typical: 110 },
};

/**
 * Schätze BPM basierend auf dem Genre
 */
export function estimateBPMFromGenre(genre: string | null): number | null {
  if (!genre) return null;

  const genreLower = genre.toLowerCase();

  // Suche nach passendem Genre
  for (const [key, range] of Object.entries(GENRE_BPM_RANGES)) {
    if (genreLower.includes(key)) {
      // Gebe typischen Wert mit kleiner Variation zurück
      const variation = Math.floor(Math.random() * 10) - 5;
      return Math.max(
        range.min,
        Math.min(range.max, range.typical + variation),
      );
    }
  }

  // Fallback: mittlerer BPM-Bereich
  return null;
}

/**
 * Mood/Stimmung Mapping
 */
export type MoodType =
  | "Ruhig"
  | "Entspannt"
  | "Moderat"
  | "Fröhlich"
  | "Energetisch"
  | "Intensiv"
  | "Party"
  | "Melancholisch"
  | "Urban"
  | "Gefühlvoll"
  | "Akustisch";

const GENRE_MOOD_MAPPING: Record<string, MoodType> = {
  // Ruhige Stimmungen
  ballad: "Ruhig",
  classical: "Ruhig",
  ambient: "Ruhig",
  meditation: "Ruhig",

  // Entspannte Stimmungen
  chill: "Entspannt",
  lounge: "Entspannt",
  "easy listening": "Entspannt",
  "bossa nova": "Entspannt",
  acoustic: "Akustisch",
  folk: "Akustisch",

  // Moderate Stimmungen
  pop: "Fröhlich",
  indie: "Moderat",
  alternative: "Moderat",
  "soft rock": "Moderat",

  // Energetische Stimmungen
  dance: "Energetisch",
  house: "Energetisch",
  edm: "Energetisch",
  electro: "Energetisch",
  disco: "Party",
  party: "Party",
  club: "Party",

  // Intensive Stimmungen
  techno: "Intensiv",
  trance: "Intensiv",
  rock: "Intensiv",
  metal: "Intensiv",
  punk: "Intensiv",
  "drum and bass": "Intensiv",
  dubstep: "Intensiv",

  // Gefühlvolle Stimmungen
  soul: "Gefühlvoll",
  "r&b": "Gefühlvoll",
  blues: "Melancholisch",
  jazz: "Melancholisch",

  // Urbane Stimmungen
  "hip-hop": "Urban",
  "hip hop": "Urban",
  rap: "Urban",
  reggaeton: "Urban",
};

/**
 * Stimmung basierend auf Genre und BPM schätzen
 */
export function estimateMood(
  genre: string | null,
  bpm: number | null,
): MoodType | null {
  // Zuerst nach Genre suchen
  if (genre) {
    const genreLower = genre.toLowerCase();
    for (const [key, mood] of Object.entries(GENRE_MOOD_MAPPING)) {
      if (genreLower.includes(key)) {
        return mood;
      }
    }
  }

  // BPM-basierte Fallback-Stimmung
  if (bpm) {
    if (bpm < 80) return "Ruhig";
    if (bpm < 100) return "Entspannt";
    if (bpm < 120) return "Moderat";
    if (bpm < 140) return "Energetisch";
    return "Intensiv";
  }

  return null;
}

// Bekannte Künstler und ihre typischen Genres
const ARTIST_GENRE_MAP: Record<string, string> = {
  // Pop
  "billie eilish": "Pop",
  "tom odell": "Pop",
  "ed sheeran": "Pop",
  "taylor swift": "Pop",
  adele: "Pop",
  "dua lipa": "Pop",
  "the weeknd": "Pop",
  "bruno mars": "Pop",
  "ariana grande": "Pop",
  max: "Pop",

  // Indie/Alternative
  seafret: "Indie",
  "novo amor": "Indie Folk",
  "ry x": "Indie",
  "bon iver": "Indie Folk",
  hozier: "Indie",
  "vance joy": "Indie Pop",
  wallners: "Indie",
  aqyila: "Indie Pop",

  // R&B/Soul
  "jorja smith": "R&B",
  "lianne la havas": "Soul",
  sza: "R&B",
  "frank ocean": "R&B",
  "daniel caesar": "R&B",
  "qing madi": "Afrobeats",

  // Deutsch
  "dominik hartz": "German Pop",
  "mark forster": "German Pop",
  "johannes oerding": "German Pop",

  // Electronic
  clockclock: "Electronic Pop",
  kygo: "Tropical House",
  disclosure: "House",
  "calvin harris": "EDM",

  // Hip-Hop
  "kendrick lamar": "Hip-Hop",
  drake: "Hip-Hop",
  "j. cole": "Hip-Hop",
  "post malone": "Hip-Hop",
};

/**
 * Versuche Genre aus Künstlername zu erraten
 */
export function guessGenreFromArtist(artist: string | null): string | null {
  if (!artist) return null;

  const artistLower = artist.toLowerCase();

  // Exakte Übereinstimmung
  if (ARTIST_GENRE_MAP[artistLower]) {
    return ARTIST_GENRE_MAP[artistLower];
  }

  // Teilweise Übereinstimmung
  for (const [key, genre] of Object.entries(ARTIST_GENRE_MAP)) {
    if (artistLower.includes(key) || key.includes(artistLower)) {
      return genre;
    }
  }

  return null;
}

/**
 * Analysiere Song und gebe alle geschätzten Werte zurück
 */
export interface SongAnalysis {
  bpm: number | null;
  mood: MoodType | null;
  estimatedFromGenre: boolean;
}

export function analyzeSongMetadata(
  existingBpm: number | null,
  genre: string | null,
): SongAnalysis {
  // Wenn BPM bereits vorhanden, nur Mood berechnen
  if (existingBpm) {
    return {
      bpm: existingBpm,
      mood: estimateMood(genre, existingBpm),
      estimatedFromGenre: false,
    };
  }

  // BPM aus Genre schätzen
  const estimatedBpm = estimateBPMFromGenre(genre);

  return {
    bpm: estimatedBpm,
    mood: estimateMood(genre, estimatedBpm),
    estimatedFromGenre: !!estimatedBpm,
  };
}
