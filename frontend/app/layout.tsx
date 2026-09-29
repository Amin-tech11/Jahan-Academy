import type { Metadata } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";

import "@fontsource-variable/vazirmatn";
import "./globals.css";
import "./foundation.css";
import "./consultation.css";
import "./home.css";

export const metadata: Metadata = {
  title: "Jahan Academy",
  description: "Trusted guidance for educational migration.",
};

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const locale = (await headers()).get("x-jahan-locale") === "en" ? "en" : "fa";
  return (
    <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"}>
      <body>{children}</body>
    </html>
  );
}
