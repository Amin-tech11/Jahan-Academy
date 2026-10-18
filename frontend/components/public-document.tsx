import type { ReactNode } from "react";
import { headers } from "next/headers";
import { CspNonceProvider } from "./csp-nonce";
import type { Locale } from "@/lib/site-content";
import "@fontsource-variable/vazirmatn";
import "@/app/globals.css";
import "@/app/foundation.css";
import "@/app/accessibility.css";
import "@/app/dropdowns.css";
import "@/app/consultation-heading.css";
import "@/app/shared-consultation.css";
import "@/app/public-responsive.css";
import "@/app/public-hero-brand.css";

export async function PublicDocument({ children, locale }: { children: ReactNode; locale: Locale }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"}><body><CspNonceProvider nonce={nonce}>{children}</CspNonceProvider></body></html>;
}
