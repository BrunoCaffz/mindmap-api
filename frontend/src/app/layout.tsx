import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { PixelCursor } from "@/components/PixelCursor";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Notion Mindmap",
  description: "Transforma uma página do Notion em mapa mental. Cada título vira um galho.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <PixelCursor />
      </body>
    </html>
  );
}
