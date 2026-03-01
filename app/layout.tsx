import type { Metadata } from "next";
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
      <body>{children}</body>
    </html>
  );
}
