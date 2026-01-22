/**
 * Echte BPM-Analyse aus Audio-Daten
 * Verwendet ffmpeg für Audio-Dekodierung und music-tempo für Beat-Detection
 */

import { spawn } from "child_process";
import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MusicTempo = require("music-tempo");

export interface AudioAnalysisResult {
  bpm: number | null;
  confidence: number;
  beats: number[];
}

/**
 * Konvertiert MP3 zu RAW PCM mit ffmpeg
 */
async function mp3ToRawPCM(
  inputBuffer: Buffer,
): Promise<{ samples: Float32Array; sampleRate: number } | null> {
  const tempInput = join(tmpdir(), `audio_${Date.now()}_input.mp3`);
  const tempOutput = join(tmpdir(), `audio_${Date.now()}_output.raw`);

  try {
    // Schreibe Input-Datei
    await writeFile(tempInput, inputBuffer);

    // Konvertiere mit ffmpeg zu mono 16-bit PCM
    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i",
        tempInput,
        "-vn", // Kein Video
        "-ac",
        "1", // Mono
        "-ar",
        "22050", // 22050 Hz Sample Rate (schneller)
        "-f",
        "s16le", // 16-bit signed little-endian
        "-ss",
        "10", // Starte bei 10 Sekunden (überspringe Intro)
        "-t",
        "45", // Analysiere 45 Sekunden
        "-y", // Überschreibe
        tempOutput,
      ]);

      ffmpeg.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`ffmpeg exited with code ${code}`));
        }
      });

      ffmpeg.on("error", (err) => {
        reject(err);
      });
    });

    // Lese RAW PCM Daten
    const rawData = await readFile(tempOutput);

    // Konvertiere zu Float32Array
    const int16Array = new Int16Array(
      rawData.buffer,
      rawData.byteOffset,
      rawData.length / 2,
    );
    const floatArray = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      floatArray[i] = int16Array[i] / 32768.0; // Normalisiere zu -1.0 bis 1.0
    }

    // Aufräumen
    await unlink(tempInput).catch(() => {});
    await unlink(tempOutput).catch(() => {});

    return { samples: floatArray, sampleRate: 22050 };
  } catch (error) {
    // Aufräumen bei Fehler
    await unlink(tempInput).catch(() => {});
    await unlink(tempOutput).catch(() => {});
    console.error("[FFmpeg] Error:", error);
    return null;
  }
}

/**
 * Analysiert einen Audio-Buffer und erkennt das BPM
 * @param audioBuffer - Der Audio-Buffer (MP3, WAV, etc.)
 * @returns Das erkannte BPM und Konfidenz
 */
export async function analyzeAudioBPM(
  audioBuffer: Buffer,
): Promise<AudioAnalysisResult> {
  try {
    // Dekodiere Audio zu PCM mit ffmpeg
    const pcmData = await mp3ToRawPCM(audioBuffer);

    if (!pcmData || pcmData.samples.length < 10000) {
      console.log("[Audio Analysis] Nicht genug Audio-Daten");
      return { bpm: null, confidence: 0, beats: [] };
    }

    // BPM-Erkennung mit music-tempo
    const mt = new MusicTempo(pcmData.samples);

    const bpm = Math.round(mt.tempo);
    const beats = mt.beats || [];

    // Konfidenz basierend auf Konsistenz der Beats
    let confidence = 0.8; // Basis-Konfidenz
    if (beats.length > 10) {
      // Prüfe Konsistenz der Beat-Intervalle
      const intervals: number[] = [];
      for (let i = 1; i < Math.min(beats.length, 20); i++) {
        intervals.push(beats[i] - beats[i - 1]);
      }
      const avgInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance =
        intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) /
        intervals.length;
      const stdDev = Math.sqrt(variance);

      // Niedrigere Varianz = höhere Konfidenz
      if (stdDev < avgInterval * 0.1) {
        confidence = 0.95;
      } else if (stdDev < avgInterval * 0.2) {
        confidence = 0.85;
      } else {
        confidence = 0.7;
      }
    }

    console.log(
      `[Audio Analysis] BPM: ${bpm}, Confidence: ${(confidence * 100).toFixed(0)}%, Beats: ${beats.length}`,
    );

    return {
      bpm: bpm > 0 ? bpm : null,
      confidence,
      beats: beats.slice(0, 10), // Nur erste 10 Beats zurückgeben
    };
  } catch (error) {
    console.error("[Audio Analysis] Error:", error);
    return {
      bpm: null,
      confidence: 0,
      beats: [],
    };
  }
}

/**
 * Schnelle BPM-Analyse
 */
export async function quickBPMAnalysis(
  audioBuffer: Buffer,
): Promise<number | null> {
  try {
    const result = await analyzeAudioBPM(audioBuffer);
    return result.bpm;
  } catch (error) {
    console.error("[Quick BPM] Error:", error);
    return null;
  }
}

// Noten-Frequenzen für Key-Detection (A4 = 440Hz)
const NOTE_FREQUENCIES = [
  { note: "C", freq: 261.63 },
  { note: "C#", freq: 277.18 },
  { note: "D", freq: 293.66 },
  { note: "D#", freq: 311.13 },
  { note: "E", freq: 329.63 },
  { note: "F", freq: 349.23 },
  { note: "F#", freq: 369.99 },
  { note: "G", freq: 392.0 },
  { note: "G#", freq: 415.3 },
  { note: "A", freq: 440.0 },
  { note: "A#", freq: 466.16 },
  { note: "B", freq: 493.88 },
];

// Camelot-Wheel Mapping für DJ-freundliche Key-Anzeige
const CAMELOT_WHEEL: Record<string, { major: string; minor: string }> = {
  C: { major: "8B", minor: "5A" },
  "C#": { major: "3B", minor: "12A" },
  D: { major: "10B", minor: "7A" },
  "D#": { major: "5B", minor: "2A" },
  E: { major: "12B", minor: "9A" },
  F: { major: "7B", minor: "4A" },
  "F#": { major: "2B", minor: "11A" },
  G: { major: "9B", minor: "6A" },
  "G#": { major: "4B", minor: "1A" },
  A: { major: "11B", minor: "8A" },
  "A#": { major: "6B", minor: "3A" },
  B: { major: "1B", minor: "10A" },
};

// Einfache DFT (Discrete Fourier Transform) für Frequenz-Analyse
function computeDFT(
  samples: Float32Array,
  sampleRate: number,
  targetFreq: number,
): number {
  const N = samples.length;
  const k = Math.round((targetFreq * N) / sampleRate);

  let real = 0;
  let imag = 0;

  for (let n = 0; n < N; n++) {
    const angle = (2 * Math.PI * k * n) / N;
    real += samples[n] * Math.cos(angle);
    imag -= samples[n] * Math.sin(angle);
  }

  return Math.sqrt(real * real + imag * imag);
}

// Berechne Chroma-Features (Stärke jeder Note)
function computeChroma(samples: Float32Array, sampleRate: number): number[] {
  const chroma = new Array(12).fill(0);

  // Analysiere mehrere Oktaven (C3 bis C6)
  for (let octave = 3; octave <= 6; octave++) {
    NOTE_FREQUENCIES.forEach((noteInfo, noteIndex) => {
      const freq = noteInfo.freq * Math.pow(2, octave - 4);
      if (freq < sampleRate / 2) {
        // Unter Nyquist
        const magnitude = computeDFT(samples, sampleRate, freq);
        chroma[noteIndex] += magnitude;
      }
    });
  }

  // Normalisiere
  const maxChroma = Math.max(...chroma);
  if (maxChroma > 0) {
    for (let i = 0; i < 12; i++) {
      chroma[i] /= maxChroma;
    }
  }

  return chroma;
}

// Dur/Moll Profile für Korrelation
const MAJOR_PROFILE = [1, 0, 0.5, 0, 0.7, 0.5, 0, 0.8, 0, 0.5, 0, 0.3];
const MINOR_PROFILE = [1, 0, 0.5, 0.7, 0, 0.5, 0, 0.8, 0.5, 0, 0.3, 0];

// Korreliere Chroma mit Profil
function correlateProfile(chroma: number[], profile: number[]): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += chroma[i] * profile[i];
  }
  return sum;
}

export interface KeyAnalysisResult {
  key: string | null; // z.B. "Am" oder "C"
  camelot: string | null; // z.B. "8A" oder "8B"
  confidence: number;
}

/**
 * Analysiert die Tonart eines Audio-Buffers
 */
export async function analyzeAudioKey(
  audioBuffer: Buffer,
): Promise<KeyAnalysisResult> {
  try {
    // Dekodiere Audio zu PCM
    const pcmData = await mp3ToRawPCM(audioBuffer);

    if (!pcmData || pcmData.samples.length < 10000) {
      console.log("[Key Analysis] Nicht genug Audio-Daten");
      return { key: null, camelot: null, confidence: 0 };
    }

    // Berechne Chroma-Features
    const chroma = computeChroma(pcmData.samples, pcmData.sampleRate);

    // Finde beste Übereinstimmung für alle 24 Tonarten
    let bestKey = "";
    let bestMode: "major" | "minor" = "major";
    let bestCorrelation = -1;

    for (let rootNote = 0; rootNote < 12; rootNote++) {
      // Rotiere Chroma um rootNote
      const rotatedChroma = [
        ...chroma.slice(rootNote),
        ...chroma.slice(0, rootNote),
      ];

      const majorCorr = correlateProfile(rotatedChroma, MAJOR_PROFILE);
      const minorCorr = correlateProfile(rotatedChroma, MINOR_PROFILE);

      if (majorCorr > bestCorrelation) {
        bestCorrelation = majorCorr;
        bestKey = NOTE_FREQUENCIES[rootNote].note;
        bestMode = "major";
      }
      if (minorCorr > bestCorrelation) {
        bestCorrelation = minorCorr;
        bestKey = NOTE_FREQUENCIES[rootNote].note;
        bestMode = "minor";
      }
    }

    // Formatiere Key-String
    const keyString = bestMode === "minor" ? `${bestKey}m` : bestKey;
    const camelotCode = CAMELOT_WHEEL[bestKey]?.[bestMode] || null;

    // Berechne Konfidenz (0.5-1.0 basierend auf Korrelation)
    const confidence = Math.min(1.0, 0.5 + bestCorrelation * 0.5);

    console.log(
      `[Key Analysis] Key: ${keyString}, Camelot: ${camelotCode}, Confidence: ${(confidence * 100).toFixed(0)}%`,
    );

    return {
      key: keyString,
      camelot: camelotCode,
      confidence,
    };
  } catch (error) {
    console.error("[Key Analysis] Error:", error);
    return { key: null, camelot: null, confidence: 0 };
  }
}

/**
 * Schnelle Key-Analyse
 */
export async function quickKeyAnalysis(
  audioBuffer: Buffer,
): Promise<string | null> {
  try {
    const result = await analyzeAudioKey(audioBuffer);
    return result.key;
  } catch (error) {
    console.error("[Quick Key] Error:", error);
    return null;
  }
}

/**
 * Vollständige Audio-Analyse (BPM + Key)
 */
export interface FullAudioAnalysis {
  bpm: number | null;
  bpmConfidence: number;
  key: string | null;
  camelot: string | null;
  keyConfidence: number;
}

export async function analyzeAudioFull(
  audioBuffer: Buffer,
): Promise<FullAudioAnalysis> {
  const [bpmResult, keyResult] = await Promise.all([
    analyzeAudioBPM(audioBuffer),
    analyzeAudioKey(audioBuffer),
  ]);

  return {
    bpm: bpmResult.bpm,
    bpmConfidence: bpmResult.confidence,
    key: keyResult.key,
    camelot: keyResult.camelot,
    keyConfidence: keyResult.confidence,
  };
}
