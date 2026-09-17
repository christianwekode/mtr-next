import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { PlaybackProvider } from "@/components/playback-context";

export default function Home() {
  return (
    <PlaybackProvider>
      <Suspense fallback={<div className="h-dvh bg-white" />}>
        <AppShell />
      </Suspense>
    </PlaybackProvider>
  );
}
