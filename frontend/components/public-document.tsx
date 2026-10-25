import type { ReactNode } from "react";
import { headers } from "next/headers";
import { yektanetBootstrap } from "@/lib/yektanet";
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

export async function PublicDocument({ children, locale, advertising = false }: { children: ReactNode; locale: Locale; advertising?: boolean }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return <html lang={locale} dir={locale === "fa" ? "rtl" : "ltr"}><head>{advertising && <script id="jahan-yektanet" nonce={nonce} dangerouslySetInnerHTML={{ __html: yektanetBootstrap }} />}</head><body><CspNonceProvider nonce={nonce}>{children}</CspNonceProvider></body></html>;
}
