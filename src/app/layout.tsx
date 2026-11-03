import type { Metadata } from "next";
import { THEME_INIT_SCRIPT } from "@/features/theme/domain/theme";
import "./globals.css";

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
    <html lang="es" className="antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen px-4 pb-12">{children}</body>
    </html>
  );
}
