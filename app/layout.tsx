import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Эйфория",
  description: "Handmade email-code auth for Эйфория",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
