"use client";

import { AudioWave02Icon, Loading03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/icon";
import { usePlayback } from "@/components/playback-context";

export type TranscriptionPlayButtonProps = {
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
      className={`flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md outline-none hover:bg-[#1414140F] disabled:pointer-events-none ${isPlaying && !isLoading ? "animate-pulse" : ""}`}
    >
      {isLoading ? (
        <Icon icon={Loading03Icon} size={20} className="animate-spin" color="#6bd668" />
      ) : (
        <Icon icon={AudioWave02Icon} size={20} color={isPlaying ? "#E11D48" : "#141414"} />
      )}
    </button>
  );
}
