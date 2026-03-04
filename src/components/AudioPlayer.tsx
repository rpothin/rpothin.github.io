import { useRef, useState } from "react";

interface AudioPlayerProps {
  src: string;
  title?: string;
}

export function AudioPlayer({ src, title }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  function formatTime(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function togglePlayPause() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    setProgress(
      audio.duration ? (audio.currentTime / audio.duration) * 100 : 0,
    );
  }

  function handleLoadedMetadata() {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = (Number(e.target.value) / 100) * audio.duration;
    audio.currentTime = newTime;
    setProgress(Number(e.target.value));
  }

  return (
    <div
      className="flex items-center gap-3 rounded px-4 py-3 mb-6"
      style={{
        background: "var(--vscode-editor-inactiveSelectionBackground)",
        border: "1px solid var(--vscode-panel-border)",
        color: "var(--vscode-editor-foreground)",
      }}
      aria-label={title ? `Audio deep dive: ${title}` : "Audio deep dive"}
      role="region"
    >
      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Play / Pause button */}
      <button
        onClick={togglePlayPause}
        aria-label={playing ? "Pause audio" : "Play audio"}
        className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full focus:outline-none focus-visible:ring-2"
        style={{
          background: "var(--vscode-button-background)",
          color: "var(--vscode-button-foreground)",
        }}
      >
        {playing ? (
          /* Pause icon */
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="2" y="1" width="4" height="12" rx="1" />
            <rect x="8" y="1" width="4" height="12" rx="1" />
          </svg>
        ) : (
          /* Play icon */
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="currentColor"
            aria-hidden="true"
          >
            <polygon points="2,1 13,7 2,13" />
          </svg>
        )}
      </button>

      {/* Label */}
      <span
        className="shrink-0 text-xs font-medium"
        style={{ color: "var(--vscode-descriptionForeground)" }}
      >
        {title ?? "Audio deep dive"}
      </span>

      {/* Seek bar */}
      <input
        type="range"
        min={0}
        max={100}
        step={0.1}
        value={progress}
        onChange={handleSeek}
        aria-label="Seek"
        className="flex-1 h-1 cursor-pointer accent-(--vscode-button-background)"
        style={{ accentColor: "var(--vscode-button-background)" }}
      />

      {/* Time display */}
      <span
        className="shrink-0 text-xs tabular-nums"
        style={{ color: "var(--vscode-descriptionForeground)" }}
        aria-live="off"
      >
        {formatTime(currentTime)}&nbsp;/&nbsp;{formatTime(duration)}
      </span>
    </div>
  );
}
