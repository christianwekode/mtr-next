"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type PlaybackTrack = {
  id: string;
  title: string;
  durationSeconds: number | null;
};

type PlaybackContextValue = {
  track: PlaybackTrack | null;
  playing: boolean;
  loading: boolean;
  currentTime: number;
  duration: number;
  play: (track: PlaybackTrack) => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (seconds: number) => void;
  toggle: (track: PlaybackTrack) => Promise<void>;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const srcRef = useRef<string | null>(null);
  const trackIdRef = useRef<string | null>(null);
  const loadGenRef = useRef(0);
  const [track, setTrack] = useState<PlaybackTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const stop = useCallback(() => {
    loadGenRef.current += 1;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    srcRef.current = null;
    trackIdRef.current = null;
    setTrack(null);
    setPlaying(false);
    setLoading(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const ensureSrc = useCallback(async (id: string) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (srcRef.current && trackIdRef.current === id) return;

    const gen = loadGenRef.current;
    srcRef.current = null;
    audio.removeAttribute("src");
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      if (gen !== loadGenRef.current) return;

      const response = await fetch(`/api/audio/${id}`);
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "No se pudo cargar la grabación");
      }
      if (gen !== loadGenRef.current) return;
      srcRef.current = payload.url;
      audio.src = payload.url;
    } finally {
      if (gen === loadGenRef.current) setLoading(false);
    }
  }, []);

  const play = useCallback(
    async (next: PlaybackTrack) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (trackIdRef.current !== next.id) {
        loadGenRef.current += 1;
        srcRef.current = null;
        audio.pause();
        audio.removeAttribute("src");
        audio.currentTime = 0;
        setCurrentTime(0);
        setDuration(next.durationSeconds ?? 0);
      }

      trackIdRef.current = next.id;
      setTrack(next);
      try {
        await ensureSrc(next.id);
        if (trackIdRef.current !== next.id || !srcRef.current) return;
        await audio.play();
        setPlaying(true);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        stop();
        throw error;
      }
    },
    [ensureSrc, stop],
  );

  const toggle = useCallback(
    async (next: PlaybackTrack) => {
      if (trackIdRef.current === next.id && playing) {
        pause();
        return;
      }
      await play(next);
    },
    [pause, play, playing],
  );

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const value = useMemo<PlaybackContextValue>(
    () => ({
      track,
      playing,
      loading,
      currentTime,
      duration,
      play,
      pause,
      stop,
      seek,
      toggle,
    }),
    [currentTime, duration, loading, pause, play, playing, seek, stop, toggle, track],
  );

  return (
    <PlaybackContext.Provider value={value}>
      {children}
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
        onEnded={stop}
      />
    </PlaybackContext.Provider>
  );
}

export function usePlayback() {
  const value = useContext(PlaybackContext);
  if (!value) {
    throw new Error("usePlayback must be used within PlaybackProvider");
  }
  return value;
}
