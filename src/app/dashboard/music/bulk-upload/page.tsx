"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UploadResult {
  filename: string;
  success: boolean;
  song?: {
    id: string;
    title: string;
    artist: string | null;
  };
  error?: string;
}

type UploadPhase = "idle" | "uploading" | "analyzing" | "complete";

export default function BulkUploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState("");
  const [results, setResults] = useState<UploadResult[]>([]);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("audio/"),
    );
    setFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setPhase("uploading");
    setError("");
    setResults([]);
    setProgress(0);

    const uploadResults: UploadResult[] = [];
    const uploadedSongIds: string[] = [];

    // Upload files one by one for progress tracking
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFile(file.name);
      // Progress: i+1 weil wir den aktuellen Song gerade hochladen
      setProgress(Math.round(((i + 1) / files.length) * 100));

      const formData = new FormData();
      formData.append("files", file);

      try {
        const response = await fetch("/api/music/bulk-upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          uploadResults.push({
            filename: file.name,
            success: false,
            error: "Upload fehlgeschlagen",
          });
        } else {
          const data = await response.json();
          if (data.results && data.results[0]) {
            uploadResults.push(data.results[0]);
            if (data.results[0].success && data.results[0].song?.id) {
              uploadedSongIds.push(data.results[0].song.id);
            }
          } else {
            // Fallback wenn results nicht im erwarteten Format
            uploadResults.push({
              filename: file.name,
              success: true,
              song: data.song || { id: "", title: file.name, artist: null },
            });
            if (data.song?.id) {
              uploadedSongIds.push(data.song.id);
            }
          }
        }
      } catch {
        uploadResults.push({
          filename: file.name,
          success: false,
          error: "Netzwerkfehler",
        });
      }

      // Update results in real-time
      setResults([...uploadResults]);
    }

    setProgress(100);
    setCurrentFile("");
    setResults(uploadResults);

    // Starte automatische Analyse im Hintergrund
    if (uploadedSongIds.length > 0) {
      setPhase("analyzing");
      setAnalyzeProgress(0);

      try {
        // Analysiere alle Songs auf einmal
        const analyzeResponse = await fetch("/api/music/bulk-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ songIds: uploadedSongIds }),
        });

        if (analyzeResponse.ok) {
          const analyzeData = await analyzeResponse.json();
          console.log("[Bulk Upload] Analyse abgeschlossen:", analyzeData);
        }

        setAnalyzeProgress(100);
      } catch (analyzeError) {
        console.error("Analyse-Fehler:", analyzeError);
      }
    }

    setPhase("complete");

    // Nach kurzer Zeit zur Musik-Liste
    setTimeout(() => {
      router.push("/dashboard/music");
    }, 3000);
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/music"
          className="p-2 hover:bg-gray-800 rounded-lg transition">
          ← Zurück
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">📦 Bulk MP3 Upload</h1>
          <p className="text-gray-400">
            Mehrere Songs auf einmal hochladen - Metadaten werden automatisch
            erkannt
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {phase === "idle" || phase === "uploading" || phase === "analyzing" ? (
        <>
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition ${
              dragActive
                ? "border-purple-500 bg-purple-500/10"
                : "border-gray-600 hover:border-gray-500"
            }`}>
            <div className="text-5xl mb-4">🎵</div>
            <p className="text-white text-lg mb-2">
              MP3-Dateien hierher ziehen
            </p>
            <p className="text-gray-400 mb-4">oder</p>
            <label className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition inline-block">
              Dateien auswählen
              <input
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-gray-500 text-sm mt-4">
              Titel, Künstler, Album, BPM, Genre werden automatisch aus den
              ID3-Tags gelesen
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-white font-semibold">
                  {files.length} Dateien ausgewählt
                </h2>
                <button
                  onClick={() => setFiles([])}
                  className="text-gray-400 hover:text-red-400 text-sm">
                  Alle entfernen
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-700">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎵</span>
                      <div>
                        <p className="text-white">{file.name}</p>
                        <p className="text-gray-500 text-sm">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-400">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          {files.length > 0 && phase === "idle" && (
            <button
              onClick={handleUpload}
              disabled={phase !== "idle"}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-lg transition disabled:opacity-50">
              🚀 {files.length} Songs hochladen
            </button>
          )}

          {/* Upload Progress */}
          {(phase === "uploading" || phase === "analyzing") && (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              {phase === "uploading" ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">
                      📤 Uploading...
                    </span>
                    <span className="text-purple-400">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
                    <div
                      className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {currentFile && (
                    <p className="text-gray-400 text-sm truncate">
                      📤 {currentFile}
                    </p>
                  )}
                  <p className="text-gray-500 text-sm mt-2">
                    {results.length} von {files.length} verarbeitet
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">
                      🔍 Analysiere BPM & Stimmung...
                    </span>
                    <span className="text-green-400">{analyzeProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-500 animate-pulse"
                      style={{ width: analyzeProgress > 0 ? "100%" : "50%" }}
                    />
                  </div>
                  <p className="text-gray-400 text-sm">
                    🎵 Erkennung von Genre, BPM und Stimmung läuft...
                  </p>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        /* Results */
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">
                {failCount === 0 ? "🎉" : "⚠️"}
              </div>
              <h2 className="text-xl font-bold text-white">
                {successCount} von {results.length} Songs erfolgreich importiert
              </h2>
              {failCount > 0 && (
                <p className="text-red-400">
                  {failCount}{" "}
                  {results.filter(
                    (r) => !r.success && r.error?.includes("Duplikat"),
                  ).length > 0
                    ? `(${results.filter((r) => !r.success && r.error?.includes("Duplikat")).length} Duplikate übersprungen)`
                    : "Fehler"}
                </p>
              )}
              <p className="text-green-400 text-sm mt-2">
                ✅ BPM & Stimmung automatisch analysiert
              </p>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${(successCount / results.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
            <div className="max-h-96 overflow-y-auto divide-y divide-gray-700">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`px-4 py-3 flex items-center justify-between ${
                    result.success
                      ? ""
                      : result.error?.includes("Duplikat")
                        ? "bg-yellow-900/10"
                        : "bg-red-900/10"
                  }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {result.success
                        ? "✅"
                        : result.error?.includes("Duplikat")
                          ? "📋"
                          : "❌"}
                    </span>
                    <div>
                      <p className="text-white">
                        {result.song?.title || result.filename}
                      </p>
                      {result.song?.artist && (
                        <p className="text-gray-400 text-sm">
                          {result.song.artist}
                        </p>
                      )}
                      {result.error && (
                        <p
                          className={`text-sm ${result.error?.includes("Duplikat") ? "text-yellow-400" : "text-red-400"}`}>
                          {result.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-gray-400">
            Weiterleitung zur Musik-Übersicht in 3 Sekunden...
          </div>
        </div>
      )}
    </div>
  );
}
