/**
 * Harmonic Mixing Utilities basierend auf dem Camelot Wheel
 *
 * Das Camelot Wheel ist ein Kreisdiagramm, das kompatible Tonarten zeigt.
 * Songs mit ähnlichen Camelot-Codes mischen sich harmonisch.
 */

// Mapping von musikalischen Tonarten zu Camelot-Codes
export const KEY_TO_CAMELOT: Record<string, string> = {
  // Dur (Major) - B suffix
  C: "8B",
  "C Major": "8B",
  "C Dur": "8B",
  "C#": "3B",
  Db: "3B",
  "C# Major": "3B",
  "Db Major": "3B",
  D: "10B",
  "D Major": "10B",
  "D Dur": "10B",
  "D#": "5B",
  Eb: "5B",
  "D# Major": "5B",
  "Eb Major": "5B",
  E: "12B",
  "E Major": "12B",
  "E Dur": "12B",
  F: "7B",
  "F Major": "7B",
  "F Dur": "7B",
  "F#": "2B",
  Gb: "2B",
  "F# Major": "2B",
  "Gb Major": "2B",
  G: "9B",
  "G Major": "9B",
  "G Dur": "9B",
  "G#": "4B",
  Ab: "4B",
  "G# Major": "4B",
  "Ab Major": "4B",
  A: "11B",
  "A Major": "11B",
  "A Dur": "11B",
  "A#": "6B",
  Bb: "6B",
  "A# Major": "6B",
  "Bb Major": "6B",
  B: "1B",
  "B Major": "1B",
  "B Dur": "1B",

  // Moll (Minor) - A suffix
  Am: "8A",
  "A Minor": "8A",
  "A Moll": "8A",
  "A#m": "3A",
  Bbm: "3A",
  "A# Minor": "3A",
  "Bb Minor": "3A",
  Bm: "10A",
  "B Minor": "10A",
  "B Moll": "10A",
  Cm: "5A",
  "C Minor": "5A",
  "C Moll": "5A",
  "C#m": "12A",
  Dbm: "12A",
  "C# Minor": "12A",
  "Db Minor": "12A",
  Dm: "7A",
  "D Minor": "7A",
  "D Moll": "7A",
  "D#m": "2A",
  Ebm: "2A",
  "D# Minor": "2A",
  "Eb Minor": "2A",
  Em: "9A",
  "E Minor": "9A",
  "E Moll": "9A",
  Fm: "4A",
  "F Minor": "4A",
  "F Moll": "4A",
  "F#m": "11A",
  Gbm: "11A",
  "F# Minor": "11A",
  "Gb Minor": "11A",
  Gm: "6A",
  "G Minor": "6A",
  "G Moll": "6A",
  "G#m": "1A",
  Abm: "1A",
  "G# Minor": "1A",
  "Ab Minor": "1A",
};

// Camelot Wheel Struktur für schnelle Nachbarsuche
const CAMELOT_WHEEL: Record<string, { neighbors: string[]; parallel: string }> =
  {
    "1A": { neighbors: ["12A", "2A"], parallel: "1B" },
    "2A": { neighbors: ["1A", "3A"], parallel: "2B" },
    "3A": { neighbors: ["2A", "4A"], parallel: "3B" },
    "4A": { neighbors: ["3A", "5A"], parallel: "4B" },
    "5A": { neighbors: ["4A", "6A"], parallel: "5B" },
    "6A": { neighbors: ["5A", "7A"], parallel: "6B" },
    "7A": { neighbors: ["6A", "8A"], parallel: "7B" },
    "8A": { neighbors: ["7A", "9A"], parallel: "8B" },
    "9A": { neighbors: ["8A", "10A"], parallel: "9B" },
    "10A": { neighbors: ["9A", "11A"], parallel: "10B" },
    "11A": { neighbors: ["10A", "12A"], parallel: "11B" },
    "12A": { neighbors: ["11A", "1A"], parallel: "12B" },
    "1B": { neighbors: ["12B", "2B"], parallel: "1A" },
    "2B": { neighbors: ["1B", "3B"], parallel: "2A" },
    "3B": { neighbors: ["2B", "4B"], parallel: "3A" },
    "4B": { neighbors: ["3B", "5B"], parallel: "4A" },
    "5B": { neighbors: ["4B", "6B"], parallel: "5A" },
    "6B": { neighbors: ["5B", "7B"], parallel: "6A" },
    "7B": { neighbors: ["6B", "8B"], parallel: "7A" },
    "8B": { neighbors: ["7B", "9B"], parallel: "8A" },
    "9B": { neighbors: ["8B", "10B"], parallel: "9A" },
    "10B": { neighbors: ["9B", "11B"], parallel: "10A" },
    "11B": { neighbors: ["10B", "12B"], parallel: "11A" },
    "12B": { neighbors: ["11B", "1B"], parallel: "12A" },
  };

/**
 * Konvertiert einen Key-String zu einem Camelot-Code
 */
export function keyToCamelot(key: string | null | undefined): string | null {
  if (!key) return null;

  // Normalisiere den Key
  const normalizedKey = key.trim();

  // Direkter Lookup
  if (KEY_TO_CAMELOT[normalizedKey]) {
    return KEY_TO_CAMELOT[normalizedKey];
  }

  // Prüfe ob es bereits ein Camelot-Code ist
  if (/^\d{1,2}[AB]$/.test(normalizedKey.toUpperCase())) {
    return normalizedKey.toUpperCase();
  }

  // Versuche verschiedene Varianten
  const variants = [
    normalizedKey,
    normalizedKey.replace(/\s+/g, ""),
    normalizedKey.split(" ")[0],
    normalizedKey.split("/")[0],
  ];

  for (const variant of variants) {
    if (KEY_TO_CAMELOT[variant]) {
      return KEY_TO_CAMELOT[variant];
    }
  }

  return null;
}

/**
 * Findet alle kompatiblen Camelot-Codes für einen gegebenen Code
 * Kompatible Codes sind:
 * - Gleicher Code (gleiche Tonart)
 * - Nachbarn im Wheel (+1 oder -1)
 * - Parallele Tonart (A <-> B wechsel, gleiche Zahl)
 */
export function getCompatibleCamelotCodes(camelotCode: string): string[] {
  const code = camelotCode.toUpperCase();
  const wheelEntry = CAMELOT_WHEEL[code];

  if (!wheelEntry) return [code];

  return [
    code, // Gleiche Tonart
    ...wheelEntry.neighbors, // +1 und -1 im Wheel
    wheelEntry.parallel, // Dur/Moll Wechsel
  ];
}

/**
 * Prüft ob zwei Songs harmonisch kompatibel sind basierend auf ihren Keys
 */
export function areKeysCompatible(
  key1: string | null,
  key2: string | null,
): boolean {
  if (!key1 || !key2) return false;

  const camelot1 = keyToCamelot(key1);
  const camelot2 = keyToCamelot(key2);

  if (!camelot1 || !camelot2) return false;

  const compatibleCodes = getCompatibleCamelotCodes(camelot1);
  return compatibleCodes.includes(camelot2);
}

/**
 * Berechnet wie gut zwei Keys zusammenpassen
 * @returns 0 = nicht kompatibel, 1 = parallel, 2 = Nachbar, 3 = gleich
 */
export function getKeyCompatibilityScore(
  key1: string | null,
  key2: string | null,
): number {
  if (!key1 || !key2) return 0;

  const camelot1 = keyToCamelot(key1);
  const camelot2 = keyToCamelot(key2);

  if (!camelot1 || !camelot2) return 0;

  // Gleicher Code
  if (camelot1 === camelot2) return 3;

  const wheelEntry = CAMELOT_WHEEL[camelot1];
  if (!wheelEntry) return 0;

  // Nachbarn im Wheel
  if (wheelEntry.neighbors.includes(camelot2)) return 2;

  // Parallele Tonart (Dur/Moll Wechsel)
  if (wheelEntry.parallel === camelot2) return 1;

  return 0;
}

/**
 * Filtert eine Liste von Songs nach harmonischer Kompatibilität
 */
export function filterCompatibleSongs<T extends { key?: string | null }>(
  referenceSong: T,
  songs: T[],
): T[] {
  const referenceKey = referenceSong.key;
  if (!referenceKey) return [];

  const referenceCamelot = keyToCamelot(referenceKey);
  if (!referenceCamelot) return [];

  const compatibleCodes = getCompatibleCamelotCodes(referenceCamelot);

  return songs.filter((song) => {
    if (!song.key) return false;
    const songCamelot = keyToCamelot(song.key);
    return songCamelot && compatibleCodes.includes(songCamelot);
  });
}

/**
 * Gibt eine lesbare Beschreibung der Kompatibilität zurück
 */
export function getCompatibilityDescription(score: number): string {
  switch (score) {
    case 3:
      return "Perfekt (gleiche Tonart)";
    case 2:
      return "Sehr gut (Nachbar im Camelot Wheel)";
    case 1:
      return "Gut (Dur/Moll Wechsel)";
    default:
      return "Nicht harmonisch";
  }
}

/**
 * Camelot-Code Farbe für UI
 */
export function getCamelotColor(camelotCode: string | null): string {
  if (!camelotCode) return "bg-gray-600";

  const number = parseInt(camelotCode.replace(/[AB]/, ""));
  const isMinor = camelotCode.endsWith("A");

  // Farben basierend auf Position im Wheel
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-violet-500",
  ];

  const baseColor = colors[(number - 1) % 12] || "bg-purple-500";

  // Moll-Tonarten etwas dunkler
  return isMinor ? baseColor.replace("500", "600") : baseColor;
}
