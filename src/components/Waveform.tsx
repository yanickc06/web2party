"use client";

import { useEffect, useRef, useState } from "react";

interface WaveformProps {
  src: string;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barColor?: string;
  progressColor?: string;
  backgroundColor?: string;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
}

export default function Waveform({
  src,
  height = 80,
  barWidth = 3,
  barGap = 1,
  barColor = "#6b7280",
  progressColor = "#a855f7",
  backgroundColor = "transparent",
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lade und analysiere Audio
  useEffect(() => {
    const loadAudio = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch audio file
        const response = await fetch(src);
        if (!response.ok) throw new Error("Audio konnte nicht geladen werden");

        const arrayBuffer = await response.arrayBuffer();

        // Decode audio data
        const audioContext = new (
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        )();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Get channel data (mono or first channel)
        const channelData = audioBuffer.getChannelData(0);

        // Calculate number of bars based on container width
        const containerWidth = containerRef.current?.clientWidth || 800;
        const numBars = Math.floor(containerWidth / (barWidth + barGap));

        // Sample the audio data
        const samplesPerBar = Math.floor(channelData.length / numBars);
        const bars: number[] = [];

        for (let i = 0; i < numBars; i++) {
          let sum = 0;
          const start = i * samplesPerBar;

          // Get RMS value for this segment
          for (let j = 0; j < samplesPerBar; j++) {
            const sample = channelData[start + j] || 0;
            sum += sample * sample;
          }

          const rms = Math.sqrt(sum / samplesPerBar);
          bars.push(rms);
        }

        // Normalize to 0-1 range
        const maxVal = Math.max(...bars, 0.01);
        const normalizedBars = bars.map((b) => b / maxVal);

        setWaveformData(normalizedBars);
        setDuration(audioBuffer.duration);

        audioContext.close();
      } catch (err) {
        console.error("Waveform error:", err);
        setError(err instanceof Error ? err.message : "Fehler beim Laden");
      } finally {
        setLoading(false);
      }
    };

    if (src) {
      loadAudio();
    }
  }, [src, barWidth, barGap]);

  // Zeichne Waveform
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

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, rect.width, rect.height);

    const centerY = rect.height / 2;
    const progressRatio = duration > 0 ? currentTime / duration : 0;
    const progressX = rect.width * progressRatio;

    // Draw bars
    waveformData.forEach((value, index) => {
      const x = index * (barWidth + barGap);
      const barHeight = Math.max(2, value * (rect.height - 4));
      const y = centerY - barHeight / 2;

      // Color based on progress
      ctx.fillStyle = x < progressX ? progressColor : barColor;

      // Draw rounded bar
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
      ctx.fill();
    });
  }, [
    waveformData,
    currentTime,
    duration,
    barWidth,
    barGap,
    barColor,
    progressColor,
    backgroundColor,
  ]);

  // Audio event handlers
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

  // Click to seek
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    audio.currentTime = ratio * duration;
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-20 bg-gray-800/50 rounded-lg text-red-400 text-sm">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div className="space-y-2">
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
            style={{ height }}
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

      {/* Hidden audio element */}
      <audio ref={audioRef} src={src} preload="metadata" />
    </div>
  );
}
