import type { Metadata } from "next";
import { Providers } from "./lib/query-client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Flux - Watch Movies & Series",
  description: "Search for movies and series to start watching instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="preconnect" href="https://api.themoviedb.org" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
