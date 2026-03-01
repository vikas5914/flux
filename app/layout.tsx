import type { Metadata } from "next";
import { Providers } from "./lib/query-client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stream - Watch Movies & Series",
  description: "Search for movies and series to start watching instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
