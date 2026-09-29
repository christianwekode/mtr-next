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
  playFrom: (track: PlaybackTrack, seconds: number) => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (seconds: number) => void;
  toggle: (track: PlaybackTrack) => Promise<void>;
};

const PlaybackContext = createContext<PlaybackContextValue | null>(null);

function clearAudio(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.pause();
  audio.removeAttribute("src");
  audio.currentTime = 0;
}

function waitForMetadata(audio: HTMLAudioElement) {
  if (audio.readyState >= 1) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", onReady);
      audio.removeEventListener("error", onError);
    };
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("No se pudo cargar la grabación"));
    };
    audio.addEventListener("loadedmetadata", onReady);
    audio.addEventListener("error", onError);
  });
}

function seekAudio(audio: HTMLAudioElement, seconds: number) {
  if (Math.abs(audio.currentTime - seconds) < 0.05) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const onSeeked = () => {
      audio.removeEventListener("seeked", onSeeked);
      resolve();
    };
    audio.addEventListener("seeked", onSeeked);
    try {
      audio.currentTime = seconds;
    } catch {
      audio.removeEventListener("seeked", onSeeked);
      resolve();
    }
  });
}

export function PlaybackProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackIdRef = useRef<string | null>(null);
  const loadedIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingStartRef = useRef<number | null>(null);
  const [track, setTrack] = useState<PlaybackTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    trackIdRef.current = null;
    loadedIdRef.current = null;
    clearAudio(audioRef.current);
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

  const play = useCallback(
    async (next: PlaybackTrack) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (trackIdRef.current !== next.id) {
        abortRef.current?.abort();
        clearAudio(audio);
        trackIdRef.current = next.id;
        loadedIdRef.current = null;
        setCurrentTime(0);
        setDuration(next.durationSeconds ?? 0);
      }

      setTrack(next);

      let refreshedSrc = false;
      try {
        if (loadedIdRef.current !== next.id) {
          const controller = new AbortController();
          abortRef.current = controller;
          setLoading(true);
          const response = await fetch(`/api/audio/${next.id}`, { signal: controller.signal });
          const payload = (await response.json()) as { url?: string; error?: string };
          if (trackIdRef.current !== next.id) return;
          if (!response.ok || !payload.url) {
            throw new Error(payload.error ?? "No se pudo cargar la grabación");
          }
          audio.src = payload.url;
          loadedIdRef.current = next.id;
          refreshedSrc = true;
        }

        if (trackIdRef.current !== next.id) return;
        const startAt = pendingStartRef.current;
        if (startAt != null) {
          if (refreshedSrc || audio.readyState < 1) await waitForMetadata(audio);
          if (trackIdRef.current !== next.id) return;
          await seekAudio(audio, startAt);
          if (trackIdRef.current !== next.id) return;
          setCurrentTime(audio.currentTime);
        }
        if (trackIdRef.current !== next.id) return;
        try {
          await audio.play();
        } catch (error) {
          if (!(error instanceof DOMException) || error.name !== "AbortError") throw error;
          await audio.play();
        }
        setPlaying(true);
      } catch (error) {
        if (trackIdRef.current !== next.id) return;
        if (error instanceof DOMException && error.name === "AbortError") return;
        stop();
        throw error;
      } finally {
        if (trackIdRef.current === next.id) setLoading(false);
      }
    },
    [stop],
  );

  const playFrom = useCallback(
    async (next: PlaybackTrack, seconds: number) => {
      pendingStartRef.current = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
      try {
        await play(next);
      } finally {
        pendingStartRef.current = null;
      }
    },
    [play],
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
    const audio = audioRef.current;
    return () => {
      abortRef.current?.abort();
      audio?.pause();
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
      playFrom,
      pause,
      stop,
      seek,
      toggle,
    }),
    [currentTime, duration, loading, pause, play, playFrom, playing, seek, stop, toggle, track],
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
