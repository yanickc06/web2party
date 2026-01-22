"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface CuePoint {
  id: string;
  name: string;
  time: number;
  color: string | null;
}

interface WaveformWithCuePointsProps {
  src: string;
  songId: string;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barColor?: string;
  progressColor?: string;
}

// Vordefinierte Cue-Point Typen mit Farben
const CUE_POINT_TYPES = [
  { name: "Intro", color: "#22c55e" }, // Grün
  { name: "Drop", color: "#ef4444" }, // Rot
  { name: "Breakdown", color: "#3b82f6" }, // Blau
  { name: "Build-Up", color: "#f59e0b" }, // Orange
  { name: "Outro", color: "#8b5cf6" }, // Lila
  { name: "Vocals", color: "#ec4899" }, // Pink
];

export default function WaveformWithCuePoints({
  src,
  songId,
  height = 100,
  barWidth = 3,
  barGap = 1,
  barColor = "#4b5563",
  progressColor = "#a855f7",
}: WaveformWithCuePointsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cuePoints, setCuePoints] = useState<CuePoint[]>([]);
  const [showCueMenu, setShowCueMenu] = useState(false);
  const [pendingCueTime, setPendingCueTime] = useState<number | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // Lade Cue-Points
  const loadCuePoints = useCallback(async () => {
    try {
      const response = await fetch(`/api/music/${songId}/cue-points`);
      if (response.ok) {
        const data = await response.json();
        setCuePoints(data);
      }
    } catch (err) {
      console.error("Error loading cue points:", err);
    }
  }, [songId]);

  useEffect(() => {
    loadCuePoints();
  }, [loadCuePoints]);

  // Lade und analysiere Audio
  useEffect(() => {
    const loadAudio = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error("Audio konnte nicht geladen werden");

        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        )();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const channelData = audioBuffer.getChannelData(0);
        const containerWidth = containerRef.current?.clientWidth || 800;
        const numBars = Math.floor(containerWidth / (barWidth + barGap));
        const samplesPerBar = Math.floor(channelData.length / numBars);
        const bars: number[] = [];

        for (let i = 0; i < numBars; i++) {
          let sum = 0;
          const start = i * samplesPerBar;
          for (let j = 0; j < samplesPerBar; j++) {
            const sample = channelData[start + j] || 0;
            sum += sample * sample;
          }
          bars.push(Math.sqrt(sum / samplesPerBar));
        }

        const maxVal = Math.max(...bars, 0.01);
        setWaveformData(bars.map((b) => b / maxVal));
        setDuration(audioBuffer.duration);
        audioContext.close();
      } catch (err) {
        console.error("Waveform error:", err);
        setError(err instanceof Error ? err.message : "Fehler beim Laden");
      } finally {
        setLoading(false);
      }
    };

    if (src) loadAudio();
  }, [src, barWidth, barGap]);

  // Zeichne Waveform mit Cue-Points
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height);

    const centerY = rect.height / 2;
    const progressRatio = duration > 0 ? currentTime / duration : 0;
    const progressX = rect.width * progressRatio;

    // Draw bars
    waveformData.forEach((value, index) => {
      const x = index * (barWidth + barGap);
      const barHeight = Math.max(2, value * (rect.height - 20));
      const y = centerY - barHeight / 2;
      ctx.fillStyle = x < progressX ? progressColor : barColor;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
      ctx.fill();
    });

    // Draw cue points
    cuePoints.forEach((cue) => {
      const x = (cue.time / duration) * rect.width;

      // Vertical line
      ctx.strokeStyle = cue.color || "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, rect.height);
      ctx.stroke();

      // Label background
      ctx.fillStyle = cue.color || "#ffffff";
      const labelWidth = ctx.measureText(cue.name).width + 8;
      ctx.fillRect(x - 1, 0, labelWidth, 16);

      // Label text
      ctx.fillStyle = "#000000";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText(cue.name, x + 3, 11);
    });

    // Draw playhead
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(progressX, 0);
    ctx.lineTo(progressX, rect.height);
    ctx.stroke();
  }, [
    waveformData,
    currentTime,
    duration,
    barWidth,
    barGap,
    barColor,
    progressColor,
    cuePoints,
  ]);

  // Audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Click handlers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    audio.currentTime = ratio * duration;
  };

  const handleCanvasRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / rect.width) * duration;

    setPendingCueTime(time);
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowCueMenu(true);
  };

  const addCuePoint = async (name: string, color: string) => {
    if (pendingCueTime === null) return;

    try {
      const response = await fetch(`/api/music/${songId}/cue-points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, time: pendingCueTime, color }),
      });

      if (response.ok) {
        loadCuePoints();
      }
    } catch (err) {
      console.error("Error adding cue point:", err);
    }

    setShowCueMenu(false);
    setPendingCueTime(null);
  };

  const deleteCuePoint = async (cuePointId: string) => {
    try {
      const response = await fetch(
        `/api/music/${songId}/cue-points?cuePointId=${cuePointId}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        loadCuePoints();
      }
    } catch (err) {
      console.error("Error deleting cue point:", err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    isPlaying ? audio.pause() : audio.play();
  };

  const jumpToCue = (time: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = time;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-20 bg-gray-800/50 rounded-lg text-red-400 text-sm">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Waveform Canvas */}
      <div
        ref={containerRef}
        className="relative bg-gray-900/50 rounded-lg overflow-hidden"
        style={{ height }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Waveform laden...</span>
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-pointer"
            onClick={handleCanvasClick}
            onContextMenu={handleCanvasRightClick}
            style={{ height }}
            title="Linksklick: Abspielen ab Position | Rechtsklick: Cue-Point setzen"
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          disabled={loading}
          className="w-10 h-10 flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-full text-white transition">
          {isPlaying ? "⏸" : "▶"}
        </button>

        <div className="flex-1 flex items-center gap-2 text-sm text-gray-400">
          <span>{formatTime(currentTime)}</span>
          <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{
                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Cue Points List */}
      {cuePoints.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {cuePoints.map((cue) => (
            <div
              key={cue.id}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs"
              style={{
                backgroundColor: `${cue.color}30`,
                borderLeft: `3px solid ${cue.color}`,
              }}>
              <button
                onClick={() => jumpToCue(cue.time)}
                className="hover:underline text-white">
                {cue.name} ({formatTime(cue.time)})
              </button>
              <button
                onClick={() => deleteCuePoint(cue.id)}
                className="text-gray-400 hover:text-red-400 ml-1">
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Hint */}
      <p className="text-gray-500 text-xs">
        💡 Rechtsklick auf Waveform zum Setzen von Cue-Points (Intro, Drop,
        Outro...)
      </p>

      {/* Cue Point Menu */}
      {showCueMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowCueMenu(false)}
          />
          <div
            className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-2 min-w-[150px]"
            style={{ left: menuPosition.x, top: menuPosition.y }}>
            <p className="text-gray-400 text-xs px-2 py-1">
              Cue-Point bei {formatTime(pendingCueTime || 0)}
            </p>
            <div className="border-t border-gray-700 my-1" />
            {CUE_POINT_TYPES.map((type) => (
              <button
                key={type.name}
                onClick={() => addCuePoint(type.name, type.color)}
                className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-700 rounded text-sm text-left">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: type.color }}
                />
                <span className="text-white">{type.name}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Hidden audio */}
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
