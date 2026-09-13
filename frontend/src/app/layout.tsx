import type { Metadata } from "next";
import "./globals.css";

import { LocaleProvider } from "../lib/i18n/LocaleProvider";

export const metadata: Metadata = {
  title: "Warehouse Inventory",
  description: "Warehouse inventory management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}