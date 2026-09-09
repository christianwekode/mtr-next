import { AppShell } from "@/components/app-shell";
import { PlaybackProvider } from "@/components/playback-context";

export default function Home() {
  return (
    <PlaybackProvider>
      <AppShell />
    </PlaybackProvider>
  );
}
