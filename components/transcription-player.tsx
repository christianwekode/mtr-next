"use client";

import { AudioWave02Icon, Loading03Icon, PauseIcon, PlayIcon, StopIcon } from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@/components/icon";
import { formatPlaybackClock } from "@/lib/format";

type TranscriptionPlayerProps = {
  transcriptionId: string;
  durationSeconds: number | null;
};

export function TranscriptionPlayer({ transcriptionId, durationSeconds }: TranscriptionPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const srcRef = useRef<string | null>(null);
  const menuId = useId();
  const [playing, setPlaying] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);
    setMenuOpen(false);
    setCurrentTime(0);
  }, []);

  const ensureSrc = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (srcRef.current) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const response = await fetch(`/api/audio/${transcriptionId}`);
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "No se pudo cargar la grabación");
      }
      srcRef.current = payload.url;
      audio.src = payload.url;
    } finally {
      setLoading(false);
    }
  }, [transcriptionId]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;
    await ensureSrc();
    await audio.play();
    setPlaying(true);
  }, [ensureSrc]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const handleIconClick = useCallback(async () => {
    if (loading) return;
    if (!playing && !menuOpen) {
      await play();
      setMenuOpen(true);
      return;
    }
    if (playing && !menuOpen) {
      setMenuOpen(true);
      return;
    }
    if (!playing && menuOpen) {
      await play();
      return;
    }
    setMenuOpen(false);
  }, [loading, menuOpen, play, playing]);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const total = duration > 0 ? duration : (durationSeconds ?? 0);
  const progress = total > 0 ? Math.min(100, (currentTime / total) * 100) : 0;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={loading ? "Cargando grabación" : playing ? "Controles de la grabación" : "Reproducir grabación"}
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined}
        disabled={loading}
        onClick={() => {
          void handleIconClick().catch(() => {
            setPlaying(false);
          });
        }}
        className={`flex size-7 shrink-0 items-center justify-center rounded-md ${playing && !loading ? "animate-pulse" : ""}`}
      >
        {loading ? (
          <Icon icon={Loading03Icon} size={20} className="animate-spin" color="#6bd668" />
        ) : (
          <Icon icon={AudioWave02Icon} size={20} color={playing ? "#E11D48" : "#141414"} />
        )}
      </button>
      {menuOpen ? (
        <div
          id={menuId}
          role="dialog"
          aria-label="Reproductor de audio"
          className="absolute left-0 top-full z-20 mt-1 flex w-[380px] max-w-[calc(100vw-3rem)] items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-[0_0_0_1px_#14141414,0_8px_24px_#1414140A]"
        >
          <span className="shrink-0 text-xs leading-4 text-[#141414BD] tabular-nums">
            {formatPlaybackClock(currentTime, total)}
          </span>
          <label className="flex h-4 min-w-0 grow items-center">
            <span className="sr-only">Posición de la grabación</span>
            <input
              type="range"
              min={0}
              max={total || 0}
              step={0.1}
              value={Math.min(currentTime, total || 0)}
              disabled={total <= 0}
              onChange={(event) => {
                const next = Number(event.target.value);
                const audio = audioRef.current;
                if (audio) audio.currentTime = next;
                setCurrentTime(next);
              }}
              style={{ "--audio-progress": `${progress}%` } as CSSProperties}
              className="audio-scrubber h-4 w-full cursor-pointer appearance-none bg-transparent"
            />
          </label>
          <span className="shrink-0 text-xs leading-4 text-[#141414BD] tabular-nums">
            {formatPlaybackClock(total, total)}
          </span>
          <button
            type="button"
            aria-label={playing ? "Pausar" : "Reproducir"}
            onClick={() => {
              if (playing) pause();
              else void play();
            }}
            className="flex size-5 shrink-0 items-center justify-center"
          >
            <Icon icon={playing ? PauseIcon : PlayIcon} size={18} color="#141414" />
          </button>
          <button
            type="button"
            aria-label="Detener"
            onClick={stopPlayback}
            className="flex size-5 shrink-0 items-center justify-center"
          >
            <Icon icon={StopIcon} size={18} color="#141414" />
          </button>
        </div>
      ) : null}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(event) => {
          setCurrentTime(event.currentTarget.currentTime);
        }}
        onLoadedMetadata={(event) => {
          const next = event.currentTarget.duration;
          if (Number.isFinite(next) && next > 0) setDuration(next);
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={stopPlayback}
      />
    </div>
  );
}
