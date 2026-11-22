import type { Metadata } from "next";
import { Exo_2, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import { THEME_INIT_SCRIPT } from "@/features/theme/domain/theme";
import "./globals.css";

// Brand fonts, self-hosted by next/font and wired to the --f-* tokens in globals.css.
const display = Exo_2({ subsets: ["latin"], variable: "--font-exo", display: "swap" });
const body = Source_Sans_3({ subsets: ["latin"], variable: "--font-source", display: "swap" });
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Deploy your Career",
  description: "Organizá tu búsqueda laboral en un solo lugar.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: the init script sets data-theme before React hydrates.
    <html
      lang="es"
      className={`${display.variable} ${body.variable} ${mono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
