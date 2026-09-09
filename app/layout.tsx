import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MTR",
  description: "Reuniones transcritas y chat con RAG",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-white font-sans text-[#141414]">{children}</body>
    </html>
  );
}
