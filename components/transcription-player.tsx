"use client";

import { AudioWave02Icon, Loading03Icon, PauseIcon, PlayIcon, StopIcon } from "@hugeicons/core-free-icons";
import type { CSSProperties } from "react";
import { Icon } from "@/components/icon";
import { usePlayback } from "@/components/playback-context";
import { formatPlaybackClock } from "@/lib/format";

type TranscriptionPlayButtonProps = {
  transcriptionId: string;
  title: string;
  durationSeconds: number | null;
};

export function TranscriptionPlayButton({
  transcriptionId,
  title,
  durationSeconds,
}: TranscriptionPlayButtonProps) {
  const { track, playing, loading, toggle } = usePlayback();
  const isThis = track?.id === transcriptionId;
  const isLoading = loading && isThis;
  const isPlaying = playing && isThis;

  return (
    <button
      type="button"
      aria-label={isLoading ? "Cargando grabación" : isPlaying ? "Pausar grabación" : "Reproducir grabación"}
      disabled={isLoading}
      onClick={() => {
        void toggle({ id: transcriptionId, title, durationSeconds }).catch(() => {});
      }}
      className={`flex size-7 shrink-0 items-center justify-center rounded-md ${isPlaying && !isLoading ? "animate-pulse" : ""}`}
    >
      {isLoading ? (
        <Icon icon={Loading03Icon} size={20} className="animate-spin" color="#6bd668" />
      ) : (
        <Icon icon={AudioWave02Icon} size={20} color={isPlaying ? "#E11D48" : "#141414"} />
      )}
    </button>
  );
}

export function NowPlayingBar() {
  const { track, playing, currentTime, duration, pause, play, stop, seek } = usePlayback();
  if (!track) return null;

  const total = duration > 0 ? duration : (track.durationSeconds ?? 0);
  const progress = total > 0 ? Math.min(100, (currentTime / total) * 100) : 0;

  return (
    <div
      role="region"
      aria-label="Reproductor de audio"
      className="flex w-full shrink-0 flex-col gap-2 border-t border-[#14141414] px-4 pb-4 pt-3"
    >
      <div className="w-full truncate text-xs leading-4 text-[#14141499]">{track.title}</div>
      <div className="flex w-full flex-col gap-2 bg-white">
        <label className="flex h-4 w-full shrink-0 items-center">
          <span className="sr-only">Posición de la grabación</span>
          <input
            type="range"
            min={0}
            max={total || 0}
            step={0.1}
            value={Math.min(currentTime, total || 0)}
            disabled={total <= 0}
            onChange={(event) => {
              seek(Number(event.target.value));
            }}
            style={{ "--audio-progress": `${progress}%` } as CSSProperties}
            className="audio-scrubber h-4 w-full cursor-pointer appearance-none bg-transparent"
          />
        </label>
        <div className="flex w-full items-center gap-2">
          <span className="shrink-0 text-xs leading-4 text-[#141414BD] tabular-nums">
            {formatPlaybackClock(currentTime, total)}
          </span>
          <span className="min-w-0 grow" />
          <span className="shrink-0 text-xs leading-4 text-[#141414BD] tabular-nums">
            {formatPlaybackClock(total, total)}
          </span>
          <button
            type="button"
            aria-label={playing ? "Pausar" : "Reproducir"}
            onClick={() => {
              if (playing) pause();
              else void play(track);
            }}
            className="flex size-5 shrink-0 items-center justify-center"
          >
            <Icon icon={playing ? PauseIcon : PlayIcon} size={18} color="#141414" />
          </button>
          <button
            type="button"
            aria-label="Detener"
            onClick={stop}
            className="flex size-5 shrink-0 items-center justify-center"
          >
            <Icon icon={StopIcon} size={18} color="#141414" />
          </button>
        </div>
      </div>
    </div>
  );
}
